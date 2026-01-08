import { Router } from 'express'
import { db } from '../db/index.js'
import { ideas, ideaComments, ideaReactions, users } from '../db/schema.js'
import { eq, and, desc, or, inArray } from 'drizzle-orm'
import { authenticate } from '../middleware/auth.js'
import { canViewIdea, canEditIdea, canChangeVisibility, canDeleteIdea } from '../utils/idea-permissions.js'

export const ideaRoutes = Router()

// All idea routes require authentication
ideaRoutes.use(authenticate)

// Create idea
ideaRoutes.post('/', async (req, res) => {
  try {
    const { title, description, visibility = 'private', teamId } = req.body
    const { userId, tenantId } = req.user!

    // Validate required fields
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' })
    }

    // Validate visibility
    if (!['private', 'team', 'public'].includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility value' })
    }

    // If visibility is 'team', teamId is required
    if (visibility === 'team' && !teamId) {
      return res.status(400).json({ error: 'Team ID is required for team visibility' })
    }

    const [idea] = await db.insert(ideas).values({
      tenantId,
      title: title.trim(),
      description: description?.trim() || null,
      visibility,
      teamId: visibility === 'team' ? teamId : null,
      createdBy: userId,
      status: 'inbox',
      publishedAt: visibility !== 'private' ? new Date().toISOString() : null,
    }).returning()

    // Fetch creator info
    const ideaWithCreator = await db.query.ideas.findFirst({
      where: eq(ideas.id, idea.id),
      with: {
        creator: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        },
        team: true,
      }
    })

    res.status(201).json({ idea: ideaWithCreator })
  } catch (error) {
    console.error('Create idea error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// List ideas (with visibility filtering)
ideaRoutes.get('/', async (req, res) => {
  try {
    const { userId, tenantId, isInternal, role } = req.user!
    const { status, visibility, teamId } = req.query

    // Admin/Owner can see all ideas
    const isAdmin = role === 'admin' || isInternal || tenantId === 1

    let results

    if (isAdmin) {
      // Admin sees everything
      results = await db.query.ideas.findMany({
        orderBy: [desc(ideas.createdAt)],
        with: {
          creator: {
            columns: {
              id: true,
              name: true,
              email: true,
            }
          },
          team: true,
        }
      })
    } else {
      // Get user's team memberships
      const userTeams = await db.query.teamMembers.findMany({
        where: eq(ideas.createdBy, userId),
        columns: { teamId: true }
      })
      const userTeamIds = userTeams.map(tm => tm.teamId)

      // Build conditions: own private ideas OR public ideas OR team ideas where user is member
      const conditions = []

      // Own private ideas
      conditions.push(and(eq(ideas.createdBy, userId), eq(ideas.visibility, 'private')))

      // Public ideas in same tenant
      conditions.push(and(eq(ideas.tenantId, tenantId), eq(ideas.visibility, 'public')))

      // Team ideas where user is member
      if (userTeamIds.length > 0) {
        conditions.push(and(
          eq(ideas.visibility, 'team'),
          inArray(ideas.teamId!, userTeamIds)
        ))
      }

      results = await db.query.ideas.findMany({
        where: or(...conditions),
        orderBy: [desc(ideas.createdAt)],
        with: {
          creator: {
            columns: {
              id: true,
              name: true,
              email: true,
            }
          },
          team: true,
        }
      })
    }

    // Filter by query params if provided
    let filtered = results
    if (status) {
      filtered = filtered.filter(i => i.status === status)
    }
    if (visibility) {
      filtered = filtered.filter(i => i.visibility === visibility)
    }
    if (teamId) {
      filtered = filtered.filter(i => i.teamId === parseInt(teamId as string))
    }

    res.json({ ideas: filtered })
  } catch (error) {
    console.error('List ideas error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single idea
ideaRoutes.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const user = req.user!

    const idea = await db.query.ideas.findFirst({
      where: eq(ideas.id, parseInt(id)),
      with: {
        creator: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        },
        team: true,
        comments: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              }
            }
          },
          orderBy: [desc(ideaComments.createdAt)]
        },
        reactions: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    })

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' })
    }

    // Check visibility permissions
    const canView = await canViewIdea(idea as any, user)
    if (!canView) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    res.json({ idea })
  } catch (error) {
    console.error('Get idea error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update idea
ideaRoutes.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, status, visibility, teamId } = req.body
    const user = req.user!

    const [existingIdea] = await db.select()
      .from(ideas)
      .where(eq(ideas.id, parseInt(id)))
      .limit(1)

    if (!existingIdea) {
      return res.status(404).json({ error: 'Idea not found' })
    }

    // Check edit permissions
    if (!canEditIdea(existingIdea as any, user)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const updateData: any = { updatedAt: new Date().toISOString() }

    // Update basic fields
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (status !== undefined) updateData.status = status

    // Visibility change requires special permission
    if (visibility !== undefined && visibility !== existingIdea.visibility) {
      const canChangeVis = await canChangeVisibility(existingIdea as any, user)
      if (!canChangeVis) {
        return res.status(403).json({ error: 'Forbidden: Cannot change visibility' })
      }

      updateData.visibility = visibility

      // Set publishedAt when first shared
      if (existingIdea.visibility === 'private' && visibility !== 'private' && !existingIdea.publishedAt) {
        updateData.publishedAt = new Date().toISOString()
      }
    }

    // Update teamId if visibility is team
    if (visibility === 'team' && teamId !== undefined) {
      updateData.teamId = teamId
    } else if (visibility !== 'team') {
      updateData.teamId = null
    }

    const [updated] = await db.update(ideas)
      .set(updateData)
      .where(eq(ideas.id, parseInt(id)))
      .returning()

    // Fetch with relations
    const ideaWithRelations = await db.query.ideas.findFirst({
      where: eq(ideas.id, updated.id),
      with: {
        creator: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        },
        team: true,
      }
    })

    res.json({ idea: ideaWithRelations })
  } catch (error) {
    console.error('Update idea error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete idea (soft delete by default, hard delete with ?permanent=true)
ideaRoutes.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { permanent } = req.query
    const user = req.user!

    const [idea] = await db.select()
      .from(ideas)
      .where(eq(ideas.id, parseInt(id)))
      .limit(1)

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' })
    }

    // Check delete permissions
    if (!canDeleteIdea(idea as any, user)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (permanent === 'true') {
      // Hard delete - remove comments and reactions first
      await db.delete(ideaComments).where(eq(ideaComments.ideaId, parseInt(id)))
      await db.delete(ideaReactions).where(eq(ideaReactions.ideaId, parseInt(id)))
      await db.delete(ideas).where(eq(ideas.id, parseInt(id)))
      res.json({ message: `Idea ${id} permanently deleted` })
    } else {
      // Soft delete by setting status to 'archived'
      await db.update(ideas)
        .set({
          status: 'archived',
          updatedAt: new Date().toISOString()
        })
        .where(eq(ideas.id, parseInt(id)))
      res.json({ message: 'Idea archived successfully' })
    }
  } catch (error) {
    console.error('Delete idea error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add comment to idea
ideaRoutes.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params
    const { comment } = req.body
    const { userId } = req.user!

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'Comment is required' })
    }

    // Check if idea exists and user can view it
    const idea = await db.query.ideas.findFirst({
      where: eq(ideas.id, parseInt(id))
    })

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' })
    }

    const canView = await canViewIdea(idea as any, req.user!)
    if (!canView) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Add comment
    const [newComment] = await db.insert(ideaComments).values({
      ideaId: parseInt(id),
      userId,
      comment: comment.trim(),
    }).returning()

    // Increment comment count
    await db.update(ideas)
      .set({
        commentCount: (idea.commentCount || 0) + 1,
        updatedAt: new Date().toISOString()
      })
      .where(eq(ideas.id, parseInt(id)))

    // Fetch comment with user info
    const commentWithUser = await db.query.ideaComments.findFirst({
      where: eq(ideaComments.id, newComment.id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    res.status(201).json({ comment: commentWithUser })
  } catch (error) {
    console.error('Add comment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Toggle reaction on idea
ideaRoutes.post('/:id/reactions', async (req, res) => {
  try {
    const { id } = req.params
    const { reaction } = req.body
    const { userId } = req.user!

    if (!['thumbs_up', 'heart', 'fire'].includes(reaction)) {
      return res.status(400).json({ error: 'Invalid reaction type' })
    }

    // Check if idea exists and user can view it
    const idea = await db.query.ideas.findFirst({
      where: eq(ideas.id, parseInt(id))
    })

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' })
    }

    const canView = await canViewIdea(idea as any, req.user!)
    if (!canView) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Check if reaction already exists
    const [existing] = await db.select()
      .from(ideaReactions)
      .where(and(
        eq(ideaReactions.ideaId, parseInt(id)),
        eq(ideaReactions.userId, userId),
        eq(ideaReactions.reaction, reaction)
      ))
      .limit(1)

    if (existing) {
      // Remove reaction
      await db.delete(ideaReactions)
        .where(and(
          eq(ideaReactions.ideaId, parseInt(id)),
          eq(ideaReactions.userId, userId),
          eq(ideaReactions.reaction, reaction)
        ))

      // Decrement vote count
      await db.update(ideas)
        .set({
          voteCount: Math.max(0, (idea.voteCount || 0) - 1),
          updatedAt: new Date().toISOString()
        })
        .where(eq(ideas.id, parseInt(id)))

      res.json({ message: 'Reaction removed', action: 'removed' })
    } else {
      // Add reaction
      await db.insert(ideaReactions).values({
        ideaId: parseInt(id),
        userId,
        reaction,
      })

      // Increment vote count
      await db.update(ideas)
        .set({
          voteCount: (idea.voteCount || 0) + 1,
          updatedAt: new Date().toISOString()
        })
        .where(eq(ideas.id, parseInt(id)))

      res.status(201).json({ message: 'Reaction added', action: 'added' })
    }
  } catch (error) {
    console.error('Toggle reaction error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
