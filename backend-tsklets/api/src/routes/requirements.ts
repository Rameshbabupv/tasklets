import { Router } from 'express'
import { db } from '../db/index.js'
import { requirements, requirementAmendments } from '../db/schema.js'
import { eq, desc, and, sql } from 'drizzle-orm'
import { authenticate, requireInternal } from '../middleware/auth.js'
import { generateIssueKey } from '../utils/issue-key.js'

export const requirementRoutes = Router()

// All requirement routes require authentication
requirementRoutes.use(authenticate)

// Create requirement (owner only)
requirementRoutes.post('/', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!
    const {
      productId, title, description, priority,
      ownerId, targetDate, labels, color, metadata,
      originalDraft
    } = req.body

    if (!productId || !title) {
      return res.status(400).json({ error: 'productId and title are required' })
    }

    const issueKey = await generateIssueKey(productId, 'R')

    const [requirement] = await db.insert(requirements).values({
      tenantId,
      productId,
      issueKey,
      title,
      description,
      priority: priority || 3,
      status: 'draft',
      originalDraft: originalDraft || description, // Preserve original
      createdBy: userId,
      ownerId: ownerId || null,
      targetDate: targetDate ? new Date(targetDate) : null,
      labels: labels || null,
      color: color || null,
      metadata: metadata || null,
    }).returning()

    res.status(201).json({ requirement })
  } catch (error) {
    console.error('Create requirement error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get requirements by product with filters (owner only)
requirementRoutes.get('/', requireInternal, async (req, res) => {
  try {
    const { productId, status } = req.query

    if (!productId) {
      return res.status(400).json({ error: 'productId query parameter is required' })
    }

    let query = db.select().from(requirements)
      .where(eq(requirements.productId, parseInt(productId as string)))

    // Filter by status if provided
    if (status) {
      query = db.select().from(requirements)
        .where(and(
          eq(requirements.productId, parseInt(productId as string)),
          eq(requirements.status, status as any)
        ))
    }

    const results = await query.orderBy(desc(requirements.createdAt))

    res.json({ requirements: results })
  } catch (error) {
    console.error('Get requirements error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single requirement by ID (owner only)
requirementRoutes.get('/:id', requireInternal, async (req, res) => {
  try {
    const { id } = req.params

    const [requirement] = await db.select().from(requirements)
      .where(eq(requirements.id, parseInt(id)))
      .limit(1)

    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' })
    }

    res.json({ requirement })
  } catch (error) {
    console.error('Get requirement error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update requirement (owner only)
requirementRoutes.patch('/:id', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const {
      title, description, priority,
      ownerId, targetDate, labels, color, metadata,
      claudeRewrite, beadsEpicId, beadsId
    } = req.body

    const [requirement] = await db.select().from(requirements)
      .where(eq(requirements.id, parseInt(id)))
      .limit(1)

    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' })
    }

    const updateData: any = { updatedAt: new Date() }
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority
    if (ownerId !== undefined) updateData.ownerId = ownerId
    if (targetDate !== undefined) updateData.targetDate = targetDate ? new Date(targetDate) : null
    if (labels !== undefined) updateData.labels = labels
    if (color !== undefined) updateData.color = color
    if (claudeRewrite !== undefined) updateData.claudeRewrite = claudeRewrite
    if (beadsEpicId !== undefined) updateData.beadsEpicId = beadsEpicId
    if (beadsId !== undefined) updateData.beadsId = beadsId

    // Merge metadata
    if (metadata !== undefined) {
      updateData.metadata = metadata === null ? null : {
        ...(requirement.metadata as object || {}),
        ...metadata
      }
    }

    const [updated] = await db.update(requirements)
      .set(updateData)
      .where(eq(requirements.id, parseInt(id)))
      .returning()

    res.json({ requirement: updated })
  } catch (error) {
    console.error('Update requirement error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete requirement (owner only)
requirementRoutes.delete('/:id', requireInternal, async (req, res) => {
  try {
    const { id } = req.params

    const [requirement] = await db.select().from(requirements)
      .where(eq(requirements.id, parseInt(id)))
      .limit(1)

    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' })
    }

    await db.delete(requirements).where(eq(requirements.id, parseInt(id)))

    res.json({ success: true, message: `Requirement ${id} deleted` })
  } catch (error) {
    console.error('Delete requirement error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Status transition endpoint (owner only)
requirementRoutes.patch('/:id/status', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { status, participants, approvers } = req.body

    const validStatuses = ['draft', 'brainstorm', 'solidified', 'approved', 'in_development', 'implemented', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Valid status required',
        validStatuses
      })
    }

    const [requirement] = await db.select().from(requirements)
      .where(eq(requirements.id, parseInt(id)))
      .limit(1)

    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' })
    }

    // Validate status transitions
    const currentStatus = requirement.status || 'draft'
    const validTransitions: Record<string, string[]> = {
      'draft': ['brainstorm', 'cancelled'],
      'brainstorm': ['draft', 'solidified', 'cancelled'],
      'solidified': ['brainstorm', 'approved', 'cancelled'],
      'approved': ['in_development', 'cancelled'],
      'in_development': ['implemented', 'cancelled'],
      'implemented': [], // Terminal state
      'cancelled': [] // Terminal state
    }

    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status transition',
        currentStatus,
        requestedStatus: status,
        validTransitions: validTransitions[currentStatus] || []
      })
    }

    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    // Set timestamps based on status
    if (status === 'brainstorm' && !requirement.brainstormStartedAt) {
      updateData.brainstormStartedAt = new Date()
    }
    if (status === 'solidified' && !requirement.solidifiedAt) {
      updateData.solidifiedAt = new Date()
    }
    if (status === 'in_development' && !requirement.implementationStartedAt) {
      updateData.implementationStartedAt = new Date()
    }
    if (status === 'implemented' && !requirement.completedAt) {
      updateData.completedAt = new Date()
    }

    // Update participants/approvers if provided
    if (participants !== undefined) {
      updateData.brainstormParticipants = participants
    }
    if (approvers !== undefined) {
      updateData.approvedBy = approvers
    }

    const [updated] = await db.update(requirements)
      .set(updateData)
      .where(eq(requirements.id, parseInt(id)))
      .returning()

    res.json({ requirement: updated })
  } catch (error) {
    console.error('Update requirement status error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get amendments for a requirement (owner only)
requirementRoutes.get('/:id/amendments', requireInternal, async (req, res) => {
  try {
    const { id } = req.params

    const amendments = await db.select().from(requirementAmendments)
      .where(eq(requirementAmendments.requirementId, parseInt(id)))
      .orderBy(requirementAmendments.amendmentNumber)

    res.json({ amendments })
  } catch (error) {
    console.error('Get amendments error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create amendment for a requirement (owner only)
requirementRoutes.post('/:id/amendments', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!
    const { id } = req.params
    const {
      title, description, businessJustification, urgency
    } = req.body

    if (!title) {
      return res.status(400).json({ error: 'title is required' })
    }

    // Get current max amendment number
    const [maxAmendment] = await db.select({
      maxNum: sql<number>`COALESCE(MAX(${requirementAmendments.amendmentNumber}), 0)`
    })
      .from(requirementAmendments)
      .where(eq(requirementAmendments.requirementId, parseInt(id)))

    const nextAmendmentNumber = (maxAmendment?.maxNum || 0) + 1

    const [amendment] = await db.insert(requirementAmendments).values({
      tenantId,
      requirementId: parseInt(id),
      amendmentNumber: nextAmendmentNumber,
      title,
      description,
      businessJustification: businessJustification || null,
      urgency: urgency || 'medium',
      status: 'amendment_draft',
      requestedBy: userId,
    }).returning()

    res.status(201).json({ amendment })
  } catch (error) {
    console.error('Create amendment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update amendment (owner only)
requirementRoutes.patch('/:id/amendments/:amendmentId', requireInternal, async (req, res) => {
  try {
    const { amendmentId } = req.params
    const {
      title, description, businessJustification, urgency,
      status, beadsFeatureId, approvedBy
    } = req.body

    const [amendment] = await db.select().from(requirementAmendments)
      .where(eq(requirementAmendments.id, parseInt(amendmentId)))
      .limit(1)

    if (!amendment) {
      return res.status(404).json({ error: 'Amendment not found' })
    }

    const updateData: any = { updatedAt: new Date() }
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (businessJustification !== undefined) updateData.businessJustification = businessJustification
    if (urgency !== undefined) updateData.urgency = urgency
    if (status !== undefined) updateData.status = status
    if (beadsFeatureId !== undefined) updateData.beadsFeatureId = beadsFeatureId
    if (approvedBy !== undefined) {
      updateData.approvedBy = approvedBy
      updateData.approvedAt = new Date()
    }

    const [updated] = await db.update(requirementAmendments)
      .set(updateData)
      .where(eq(requirementAmendments.id, parseInt(amendmentId)))
      .returning()

    res.json({ amendment: updated })
  } catch (error) {
    console.error('Update amendment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
