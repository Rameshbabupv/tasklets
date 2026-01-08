import { Router, type Request, type Response } from 'express'
import { db } from '../db/index.js'
import { apiKeys } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { authenticate } from '../middleware/auth.js'
import crypto from 'crypto'

export const apiKeyRoutes = Router()

// All routes require authentication
apiKeyRoutes.use(authenticate)

// Generate a new API key
apiKeyRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { name, scopes = ['read'] } = req.body
    const userId = req.user!.id
    const tenantId = req.user!.tenantId

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required' })
    }

    // Generate a unique API key with prefix
    const keyValue = `tk_${crypto.randomBytes(32).toString('hex')}`
    const keyHash = crypto.createHash('sha256').update(keyValue).digest('hex')
    const keyPrefix = keyValue.substring(0, 10) // Store prefix for identification

    const [apiKey] = await db.insert(apiKeys)
      .values({
        tenantId,
        userId,
        name: name.trim(),
        keyHash,
        keyPrefix,
        scopes,
        lastUsedAt: null,
        expiresAt: null, // No expiration by default
        rateLimit: 100, // 100 requests per minute default
      })
      .returning()

    // Return the full key only once (on creation)
    res.status(201).json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        scopes: apiKey.scopes,
        rateLimit: apiKey.rateLimit,
        createdAt: apiKey.createdAt,
      },
      // This is the only time the full key is returned
      key: keyValue,
      message: 'Save this key securely. It will not be shown again.',
    })
  } catch (error) {
    console.error('Create API key error:', error)
    res.status(500).json({ error: 'Failed to create API key' })
  }
})

// List API keys (without exposing actual keys)
apiKeyRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const tenantId = req.user!.tenantId

    const keys = await db.select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      scopes: apiKeys.scopes,
      rateLimit: apiKeys.rateLimit,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    })
      .from(apiKeys)
      .where(and(
        eq(apiKeys.tenantId, tenantId),
        eq(apiKeys.userId, userId)
      ))
      .orderBy(desc(apiKeys.createdAt))

    res.json({ apiKeys: keys })
  } catch (error) {
    console.error('List API keys error:', error)
    res.status(500).json({ error: 'Failed to list API keys' })
  }
})

// Update API key (name, scopes, rate limit)
apiKeyRoutes.patch('/:id', async (req: Request, res: Response) => {
  try {
    const keyId = parseInt(req.params.id)
    const userId = req.user!.id
    const tenantId = req.user!.tenantId
    const { name, scopes, rateLimit } = req.body

    // Verify ownership
    const [existing] = await db.select()
      .from(apiKeys)
      .where(and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.tenantId, tenantId),
        eq(apiKeys.userId, userId)
      ))
      .limit(1)

    if (!existing) {
      return res.status(404).json({ error: 'API key not found' })
    }

    const updates: Record<string, any> = {
      updatedAt: new Date(),
    }

    if (name?.trim()) updates.name = name.trim()
    if (scopes) updates.scopes = scopes
    if (rateLimit !== undefined) updates.rateLimit = Math.max(1, Math.min(1000, rateLimit))

    const [updated] = await db.update(apiKeys)
      .set(updates)
      .where(eq(apiKeys.id, keyId))
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        rateLimit: apiKeys.rateLimit,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      })

    res.json({ apiKey: updated })
  } catch (error) {
    console.error('Update API key error:', error)
    res.status(500).json({ error: 'Failed to update API key' })
  }
})

// Revoke (delete) API key
apiKeyRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    const keyId = parseInt(req.params.id)
    const userId = req.user!.id
    const tenantId = req.user!.tenantId

    // Verify ownership
    const [existing] = await db.select()
      .from(apiKeys)
      .where(and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.tenantId, tenantId),
        eq(apiKeys.userId, userId)
      ))
      .limit(1)

    if (!existing) {
      return res.status(404).json({ error: 'API key not found' })
    }

    await db.delete(apiKeys)
      .where(eq(apiKeys.id, keyId))

    res.json({ success: true, message: 'API key revoked' })
  } catch (error) {
    console.error('Delete API key error:', error)
    res.status(500).json({ error: 'Failed to revoke API key' })
  }
})
