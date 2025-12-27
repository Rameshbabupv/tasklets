import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db/index.js'
import { users, userProducts } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'
import { authenticate, requireInternal } from '../middleware/auth.js'

export const userRoutes = Router()

const STANDARD_PASSWORD = 'systech@123'

// All routes require authentication
userRoutes.use(authenticate)

// List users for a client (internal only)
userRoutes.get('/client/:clientId', requireInternal, async (req, res) => {
  try {
    const { clientId } = req.params
    const { tenantId } = req.user!

    const clientUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users)
      .where(and(
        eq(users.clientId, parseInt(clientId)),
        eq(users.tenantId, tenantId)
      ))

    res.json(clientUsers)
  } catch (error) {
    console.error('List users error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// List all internal users (internal only)
userRoutes.get('/internal', requireInternal, async (req, res) => {
  try {
    const { tenantId } = req.user!

    const internalUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users)
      .where(and(
        eq(users.tenantId, tenantId),
        eq(users.clientId, null as any) // Internal users have no client
      ))

    res.json(internalUsers)
  } catch (error) {
    console.error('List internal users error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create user with specific role (internal only)
userRoutes.post('/', requireInternal, async (req, res) => {
  try {
    const { email, name, role, clientId } = req.body
    const { tenantId } = req.user!

    if (!email || !name) {
      return res.status(400).json({ error: 'email and name are required' })
    }

    // Check if email exists in this tenant
    const existing = await db.select().from(users)
      .where(and(
        eq(users.email, email),
        eq(users.tenantId, tenantId)
      ))
      .limit(1)

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' })
    }

    const passwordHash = await bcrypt.hash(STANDARD_PASSWORD, 10)

    const [user] = await db.insert(users).values({
      email,
      name,
      role: role || 'user',
      tenantId,
      clientId: clientId || null, // null = internal user
      passwordHash,
    }).returning()

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      clientId: user.clientId,
    })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user (internal only)
userRoutes.patch('/:id', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { name, role } = req.body
    const { tenantId } = req.user!

    // Verify user belongs to tenant
    const [existing] = await db.select().from(users)
      .where(and(
        eq(users.id, parseInt(id)),
        eq(users.tenantId, tenantId)
      ))
      .limit(1)

    if (!existing) {
      return res.status(404).json({ error: 'User not found' })
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (role) updateData.role = role

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' })
    }

    const [user] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, parseInt(id)))
      .returning()

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Toggle user active status (internal only)
userRoutes.patch('/:id/toggle', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user!
    const uid = parseInt(id)

    // Get current status (verify tenant)
    const [current] = await db.select().from(users)
      .where(and(eq(users.id, uid), eq(users.tenantId, tenantId)))
      .limit(1)

    if (!current) {
      return res.status(404).json({ error: 'User not found' })
    }

    const newStatus = !current.isActive

    const [user] = await db.update(users)
      .set({ isActive: newStatus })
      .where(eq(users.id, uid))
      .returning()

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    })
  } catch (error) {
    console.error('Toggle user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's assigned products
userRoutes.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user!
    const userId = parseInt(id)

    // Verify user belongs to tenant
    const [user] = await db.select().from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .limit(1)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const assigned = await db.query.userProducts.findMany({
      where: eq(userProducts.userId, userId),
      with: {
        product: true,
      },
    })

    const productList = assigned.map((up: any) => up.product)
    res.json(productList)
  } catch (error) {
    console.error('Get user products error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user's assigned products (internal only)
userRoutes.put('/:id/products', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { productIds } = req.body
    const { tenantId } = req.user!
    const userId = parseInt(id)

    // Verify user belongs to tenant
    const [user] = await db.select().from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .limit(1)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (!Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds must be an array' })
    }

    // Delete existing assignments
    await db.delete(userProducts).where(eq(userProducts.userId, userId))

    // Create new assignments
    if (productIds.length > 0) {
      const values = productIds.map((productId: number) => ({
        userId,
        productId,
      }))
      await db.insert(userProducts).values(values)
    }

    // Return updated list
    const assigned = await db.query.userProducts.findMany({
      where: eq(userProducts.userId, userId),
      with: {
        product: true,
      },
    })

    const productList = assigned.map((up: any) => up.product)
    res.json(productList)
  } catch (error) {
    console.error('Update user products error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
