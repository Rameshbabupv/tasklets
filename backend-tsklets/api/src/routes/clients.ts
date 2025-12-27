import { Router } from 'express'
import { nanoid } from 'nanoid'
import { db } from '../db/index.js'
import { clients, users } from '../db/schema.js'
import { eq, and, count } from 'drizzle-orm'
import { authenticate, requireInternal } from '../middleware/auth.js'

export const clientRoutes = Router()

// All client routes require authentication
clientRoutes.use(authenticate)

// List all clients for current tenant (internal only)
clientRoutes.get('/', requireInternal, async (req, res) => {
  try {
    const { tenantId } = req.user!

    const results = await db.select().from(clients)
      .where(eq(clients.tenantId, tenantId))

    res.json({ clients: results })
  } catch (error) {
    console.error('List clients error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single client
clientRoutes.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId, clientId, isInternal } = req.user!

    const [client] = await db.select().from(clients)
      .where(and(
        eq(clients.id, parseInt(id)),
        eq(clients.tenantId, tenantId)
      ))
      .limit(1)

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    // Client users can only see their own client
    if (!isInternal && clientId !== client.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Get user count for this client
    const [userCount] = await db.select({ count: count() }).from(users)
      .where(eq(users.clientId, client.id))

    res.json({ client, userCount: userCount.count })
  } catch (error) {
    console.error('Get client error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create client (internal only)
clientRoutes.post('/', requireInternal, async (req, res) => {
  try {
    const { name, tier } = req.body
    const { tenantId } = req.user!

    const [client] = await db.insert(clients).values({
      name,
      tenantId,
      tier,
    }).returning()

    res.status(201).json({ client })
  } catch (error) {
    console.error('Create client error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update client (internal only)
clientRoutes.patch('/:id', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { name, tier, gatekeeperEnabled } = req.body
    const { tenantId } = req.user!

    const [client] = await db.update(clients)
      .set({ name, tier, gatekeeperEnabled })
      .where(and(
        eq(clients.id, parseInt(id)),
        eq(clients.tenantId, tenantId)
      ))
      .returning()

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    res.json({ client })
  } catch (error) {
    console.error('Update client error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Toggle client active status (internal only)
clientRoutes.patch('/:id/toggle', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user!
    const cid = parseInt(id)

    // Get current status
    const [current] = await db.select().from(clients)
      .where(and(eq(clients.id, cid), eq(clients.tenantId, tenantId)))
      .limit(1)

    if (!current) {
      return res.status(404).json({ error: 'Client not found' })
    }

    const newStatus = !current.isActive

    const [client] = await db.update(clients)
      .set({ isActive: newStatus })
      .where(eq(clients.id, cid))
      .returning()

    res.json({ client })
  } catch (error) {
    console.error('Toggle client error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
