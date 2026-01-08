import { Router } from 'express'
import { db } from '../db/index.js'
import { features, epics } from '../db/schema.js'
import { eq, desc } from 'drizzle-orm'
import { authenticate, requireInternal } from '../middleware/auth.js'
import { generateIssueKey } from '../utils/issue-key.js'

export const featureRoutes = Router()

// All feature routes require authentication
featureRoutes.use(authenticate)

// Create feature (owner only)
featureRoutes.post('/', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!
    const {
      epicId, title, description, priority,
      // New fields
      ownerId, targetDate, startDate, acceptanceCriteria, labels, estimate, metadata
    } = req.body

    if (!epicId || !title) {
      return res.status(400).json({ error: 'epicId and title are required' })
    }

    // Get productId from epic for issueKey generation
    const [epic] = await db.select({ productId: epics.productId })
      .from(epics).where(eq(epics.id, epicId)).limit(1)
    if (!epic) {
      return res.status(404).json({ error: 'Epic not found' })
    }

    const issueKey = await generateIssueKey(epic.productId, 'F')

    const [feature] = await db.insert(features).values({
      tenantId,
      epicId,
      issueKey,
      title,
      description,
      priority: priority || 3,
      status: 'backlog',
      // New fields
      createdBy: userId,
      ownerId: ownerId || null,
      targetDate: targetDate ? new Date(targetDate) : null,
      startDate: startDate ? new Date(startDate) : null,
      acceptanceCriteria: acceptanceCriteria || null,
      labels: labels || null,
      estimate: estimate || null,
      metadata: metadata || null,
    }).returning()

    res.status(201).json({ feature })
  } catch (error) {
    console.error('Create feature error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get features by epic (owner only)
featureRoutes.get('/', requireInternal, async (req, res) => {
  try {
    const { epicId } = req.query

    if (!epicId) {
      return res.status(400).json({ error: 'epicId query parameter is required' })
    }

    const results = await db.select().from(features)
      .where(eq(features.epicId, parseInt(epicId as string)))
      .orderBy(desc(features.createdAt))

    res.json({ features: results })
  } catch (error) {
    console.error('Get features error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update feature (owner only)
featureRoutes.patch('/:id', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const {
      title, description, status, priority,
      // New fields
      ownerId, targetDate, startDate, acceptanceCriteria, labels, estimate, metadata
    } = req.body

    const [feature] = await db.select().from(features)
      .where(eq(features.id, parseInt(id)))
      .limit(1)

    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' })
    }

    const updateData: any = { updatedAt: new Date() }
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status) updateData.status = status
    if (priority !== undefined) updateData.priority = priority

    // New fields
    if (ownerId !== undefined) updateData.ownerId = ownerId
    if (targetDate !== undefined) updateData.targetDate = targetDate ? new Date(targetDate) : null
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (acceptanceCriteria !== undefined) updateData.acceptanceCriteria = acceptanceCriteria
    if (labels !== undefined) updateData.labels = labels
    if (estimate !== undefined) updateData.estimate = estimate

    // Merge metadata
    if (metadata !== undefined) {
      updateData.metadata = metadata === null ? null : {
        ...(feature.metadata as object || {}),
        ...metadata
      }
    }

    const [updated] = await db.update(features)
      .set(updateData)
      .where(eq(features.id, parseInt(id)))
      .returning()

    res.json({ feature: updated })
  } catch (error) {
    console.error('Update feature error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete feature (owner only)
featureRoutes.delete('/:id', requireInternal, async (req, res) => {
  try {
    const { id } = req.params

    const [feature] = await db.select().from(features)
      .where(eq(features.id, parseInt(id)))
      .limit(1)

    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' })
    }

    await db.delete(features).where(eq(features.id, parseInt(id)))

    res.json({ success: true, message: `Feature ${id} deleted` })
  } catch (error) {
    console.error('Delete feature error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Close feature with resolution (owner only)
featureRoutes.patch('/:id/close', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { resolution, resolutionNote } = req.body

    const validResolutions = ['completed', 'duplicate', 'wont_do', 'moved', 'invalid', 'obsolete']
    if (!resolution || !validResolutions.includes(resolution)) {
      return res.status(400).json({
        error: 'Valid resolution required',
        validResolutions
      })
    }

    const [feature] = await db.select().from(features)
      .where(eq(features.id, parseInt(id)))
      .limit(1)

    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' })
    }

    const [updated] = await db.update(features)
      .set({
        status: 'cancelled',
        resolution,
        resolutionNote: resolutionNote || null,
        closedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(features.id, parseInt(id)))
      .returning()

    res.json({ feature: updated })
  } catch (error) {
    console.error('Close feature error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
