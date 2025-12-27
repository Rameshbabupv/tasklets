import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db/index.js'
import { users, tenants, clients } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'
import { generateToken } from '../middleware/auth.js'

export const authRoutes = Router()

// Sign up (for client users - internal users created via admin)
authRoutes.post('/signup', async (req, res) => {
  try {
    const { email, password, name, clientId } = req.body

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID required for signup' })
    }

    // Get client and its tenant
    const [client] = await db.select().from(clients)
      .where(eq(clients.id, clientId))
      .limit(1)

    if (!client) {
      return res.status(400).json({ error: 'Invalid client' })
    }

    const tenantId = client.tenantId

    // Check if user exists
    const existing = await db.select().from(users)
      .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
      .limit(1)

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10)
    const [user] = await db.insert(users).values({
      email,
      passwordHash,
      name,
      tenantId,
      clientId,
      role: 'user',
    }).returning()

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      clientId: user.clientId,
      isInternal: user.clientId === null,
      role: user.role!,
    })

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        clientId: user.clientId,
        isInternal: user.clientId === null,
      },
      token,
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Sign in
authRoutes.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const [user] = await db.select().from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account disabled' })
    }

    const isInternal = user.clientId === null

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      clientId: user.clientId,
      isInternal,
      role: user.role!,
    })

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        clientId: user.clientId,
        isInternal,
      },
      token,
    })
  } catch (error) {
    console.error('Signin error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current user
authRoutes.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' })
  }

  try {
    const jwt = await import('jsonwebtoken')
    const token = authHeader.split(' ')[1]
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return res.status(500).json({ error: 'Server configuration error' })
    }
    const payload = jwt.default.verify(token, jwtSecret) as any

    const [user] = await db.select().from(users)
      .where(eq(users.id, payload.userId))
      .limit(1)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isInternal = user.clientId === null

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        clientId: user.clientId,
        isInternal,
      },
    })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})
