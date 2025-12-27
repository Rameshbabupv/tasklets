import { Router } from 'express'
import { db } from '../db/index.js'
import { teams, teamMembers } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { authenticate, requireRole } from '../middleware/auth.js'

export const teamRoutes = Router()

// All team routes require authentication
teamRoutes.use(authenticate)

// Get user's teams
teamRoutes.get('/', async (req, res) => {
  try {
    const { userId, tenantId, isInternal, role } = req.user!

    // Admin/Owner can see all teams in their tenant
    if (isInternal || role === 'admin') {
      const results = await db.query.teams.findMany({
        where: eq(teams.tenantId, tenantId),
        orderBy: [desc(teams.createdAt)],
        with: {
          product: true,
          members: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          }
        }
      })

      res.json({ teams: results })
    } else {
      // Regular users see only teams they're a member of
      const memberships = await db.query.teamMembers.findMany({
        where: eq(teamMembers.userId, userId),
        with: {
          team: {
            with: {
              product: true,
              members: {
                with: {
                  user: {
                    columns: {
                      id: true,
                      name: true,
                      email: true,
                    }
                  }
                }
              }
            }
          }
        }
      })

      const userTeams = memberships.map(m => m.team)
      res.json({ teams: userTeams })
    }
  } catch (error) {
    console.error('List teams error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single team
teamRoutes.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { userId, tenantId, isInternal, role } = req.user!

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, parseInt(id)),
      with: {
        product: true,
        members: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            }
          }
        }
      }
    })

    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }

    // Check access: must be same tenant
    if (!isInternal && team.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Regular users can only see teams they're members of
    if (!isInternal && role !== 'admin') {
      const isMember = team.members.some(m => m.userId === userId)
      if (!isMember) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    }

    res.json({ team })
  } catch (error) {
    console.error('Get team error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create team (admin or product owner only)
teamRoutes.post('/', async (req, res) => {
  try {
    const { name, productId } = req.body
    const { tenantId, isInternal, role } = req.user!

    // Only admin/owner can create teams
    if (!isInternal && role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Team name is required' })
    }

    const [team] = await db.insert(teams).values({
      tenantId,
      name: name.trim(),
      productId: productId || null,
    }).returning()

    // Fetch with relations
    const teamWithRelations = await db.query.teams.findFirst({
      where: eq(teams.id, team.id),
      with: {
        product: true,
      }
    })

    res.status(201).json({ team: teamWithRelations })
  } catch (error) {
    console.error('Create team error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update team
teamRoutes.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, productId } = req.body
    const { userId, tenantId, isInternal, role } = req.user!

    const [team] = await db.select()
      .from(teams)
      .where(eq(teams.id, parseInt(id)))
      .limit(1)

    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }

    // Check access
    if (!isInternal && team.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Only admin/owner/team lead can update
    const [membership] = await db.select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, parseInt(id)),
        eq(teamMembers.userId, userId)
      ))
      .limit(1)

    const isTeamLead = membership?.role === 'lead'
    if (!isInternal && role !== 'admin' && !isTeamLead) {
      return res.status(403).json({ error: 'Forbidden: Team lead access required' })
    }

    const updateData: any = { updatedAt: new Date().toISOString() }
    if (name !== undefined) updateData.name = name.trim()
    if (productId !== undefined) updateData.productId = productId || null

    const [updated] = await db.update(teams)
      .set(updateData)
      .where(eq(teams.id, parseInt(id)))
      .returning()

    // Fetch with relations
    const teamWithRelations = await db.query.teams.findFirst({
      where: eq(teams.id, updated.id),
      with: {
        product: true,
        members: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    })

    res.json({ team: teamWithRelations })
  } catch (error) {
    console.error('Update team error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add team member
teamRoutes.post('/:id/members', async (req, res) => {
  try {
    const { id } = req.params
    const { userId: newMemberId, role: memberRole = 'member' } = req.body
    const { userId, tenantId, isInternal, role } = req.user!

    if (!newMemberId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const [team] = await db.select()
      .from(teams)
      .where(eq(teams.id, parseInt(id)))
      .limit(1)

    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }

    // Check access
    if (!isInternal && team.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Only admin/owner/team lead can add members
    const [membership] = await db.select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, parseInt(id)),
        eq(teamMembers.userId, userId)
      ))
      .limit(1)

    const isTeamLead = membership?.role === 'lead'
    if (!isInternal && role !== 'admin' && !isTeamLead) {
      return res.status(403).json({ error: 'Forbidden: Team lead access required' })
    }

    // Check if member already exists
    const [existing] = await db.select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, parseInt(id)),
        eq(teamMembers.userId, newMemberId)
      ))
      .limit(1)

    if (existing) {
      return res.status(400).json({ error: 'User is already a team member' })
    }

    // Add member
    const [newMember] = await db.insert(teamMembers).values({
      teamId: parseInt(id),
      userId: newMemberId,
      role: memberRole,
    }).returning()

    // Fetch with user info
    const memberWithUser = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.id, newMember.id),
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

    res.status(201).json({ member: memberWithUser })
  } catch (error) {
    console.error('Add team member error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Remove team member
teamRoutes.delete('/:id/members/:userId', async (req, res) => {
  try {
    const { id, userId: memberUserId } = req.params
    const { userId, tenantId, isInternal, role } = req.user!

    const [team] = await db.select()
      .from(teams)
      .where(eq(teams.id, parseInt(id)))
      .limit(1)

    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }

    // Check access
    if (!isInternal && team.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Users can remove themselves, or admin/owner/team lead can remove others
    const removingSelf = userId === parseInt(memberUserId)

    if (!removingSelf) {
      const [membership] = await db.select()
        .from(teamMembers)
        .where(and(
          eq(teamMembers.teamId, parseInt(id)),
          eq(teamMembers.userId, userId)
        ))
        .limit(1)

      const isTeamLead = membership?.role === 'lead'
      if (!isInternal && role !== 'admin' && !isTeamLead) {
        return res.status(403).json({ error: 'Forbidden: Team lead access required' })
      }
    }

    // Remove member
    await db.delete(teamMembers)
      .where(and(
        eq(teamMembers.teamId, parseInt(id)),
        eq(teamMembers.userId, parseInt(memberUserId))
      ))

    res.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Remove team member error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
