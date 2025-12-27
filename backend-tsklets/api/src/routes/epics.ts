import { Router } from 'express'
import { db } from '../db/index.js'
import { epics } from '../db/schema.js'
import { eq, desc } from 'drizzle-orm'
import { authenticate, requireInternal } from '../middleware/auth.js'
import { generateIssueKey } from '../utils/issue-key.js'

export const epicRoutes = Router()

// All epic routes require authentication
epicRoutes.use(authenticate)

// Create epic (owner only)
epicRoutes.post('/', requireInternal, async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { productId, title, description, priority } = req.body

    if (!productId || !title) {
      return res.status(400).json({ error: 'productId and title are required' })
    }

    const issueKey = await generateIssueKey(productId, 'E')

    const [epic] = await db.insert(epics).values({
      tenantId,
      productId,
      issueKey,
      title,
      description,
      priority: priority || 3,
      status: 'backlog',
    }).returning()

    res.status(201).json({ epic })
  } catch (error) {
    console.error('Create epic error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get epics by product (owner only)
epicRoutes.get('/', requireInternal, async (req, res) => {
  try {
    const { productId } = req.query

    if (!productId) {
      return res.status(400).json({ error: 'productId query parameter is required' })
    }

    const results = await db.select().from(epics)
      .where(eq(epics.productId, parseInt(productId as string)))
      .orderBy(desc(epics.createdAt))

    res.json({ epics: results })
  } catch (error) {
    console.error('Get epics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update epic (owner only)
epicRoutes.patch('/:id', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, status, priority } = req.body

    const [epic] = await db.select().from(epics)
      .where(eq(epics.id, parseInt(id)))
      .limit(1)

    if (!epic) {
      return res.status(404).json({ error: 'Epic not found' })
    }

    const updateData: any = { updatedAt: new Date().toISOString() }
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status) updateData.status = status
    if (priority !== undefined) updateData.priority = priority

    const [updated] = await db.update(epics)
      .set(updateData)
      .where(eq(epics.id, parseInt(id)))
      .returning()

    res.json({ epic: updated })
  } catch (error) {
    console.error('Update epic error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete epic (owner only)
epicRoutes.delete('/:id', requireInternal, async (req, res) => {
  try {
    const { id } = req.params

    const [epic] = await db.select().from(epics)
      .where(eq(epics.id, parseInt(id)))
      .limit(1)

    if (!epic) {
      return res.status(404).json({ error: 'Epic not found' })
    }

    await db.delete(epics).where(eq(epics.id, parseInt(id)))

    res.json({ success: true, message: `Epic ${id} deleted` })
  } catch (error) {
    console.error('Delete epic error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Close epic with resolution (owner only)
epicRoutes.patch('/:id/close', requireInternal, async (req, res) => {
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

    const [epic] = await db.select().from(epics)
      .where(eq(epics.id, parseInt(id)))
      .limit(1)

    if (!epic) {
      return res.status(404).json({ error: 'Epic not found' })
    }

    const [updated] = await db.update(epics)
      .set({
        status: 'cancelled',
        resolution,
        resolutionNote: resolutionNote || null,
        closedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(epics.id, parseInt(id)))
      .returning()

    res.json({ epic: updated })
  } catch (error) {
    console.error('Close epic error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
