import { Router } from 'express'
import { nanoid } from 'nanoid'
import { db } from '../db/index.js'
import { clients, users, clientProducts } from '../db/schema.js'
import { eq, and, count } from 'drizzle-orm'
import { authenticate, requireInternal } from '../middleware/auth.js'

export const clientRoutes = Router()

// All client routes require authentication
clientRoutes.use(authenticate)

// List all clients for current tenant (internal only)
// Returns clients sorted: owner first, then partners, then customers
clientRoutes.get('/', requireInternal, async (req, res) => {
  try {
    const { tenantId } = req.user!

    // Fetch clients with their products
    const results = await db.query.clients.findMany({
      where: eq(clients.tenantId, tenantId),
      with: {
        clientProducts: {
          with: {
            product: true,
          },
        },
      },
    })

    // Transform to include products array
    const clientsWithProducts = results.map((client: any) => ({
      ...client,
      products: client.clientProducts?.map((cp: any) => cp.product) || [],
      clientProducts: undefined, // Remove the join table data
    }))

    // Sort: owner first, then partner, then customer
    const typeOrder: Record<string, number> = { owner: 0, partner: 1, customer: 2 }
    clientsWithProducts.sort((a: any, b: any) => {
      const aOrder = typeOrder[a.type] ?? 2
      const bOrder = typeOrder[b.type] ?? 2
      if (aOrder !== bOrder) return aOrder - bOrder
      return a.name.localeCompare(b.name)
    })

    res.json({ clients: clientsWithProducts })
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
    const { name, tier, domain, type } = req.body
    const { tenantId } = req.user!

    const [client] = await db.insert(clients).values({
      name,
      tenantId,
      tier,
      domain: domain || null,
      type: type || 'customer',
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
    const { name, tier, gatekeeperEnabled, domain, type } = req.body
    const { tenantId } = req.user!

    // Build update object with only provided fields
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (tier !== undefined) updateData.tier = tier
    if (gatekeeperEnabled !== undefined) updateData.gatekeeperEnabled = gatekeeperEnabled
    if (domain !== undefined) updateData.domain = domain
    if (type !== undefined) updateData.type = type

    const [client] = await db.update(clients)
      .set(updateData)
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
