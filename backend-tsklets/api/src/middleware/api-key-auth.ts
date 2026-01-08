import { Request, Response, NextFunction } from 'express'
import { db } from '../db/index.js'
import { apiKeys, users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

export interface ApiKeyUser {
  apiKeyId: number
  userId: number
  tenantId: number
  scopes: string[]
  rateLimit: number
}

declare global {
  namespace Express {
    interface Request {
      apiKeyUser?: ApiKeyUser
    }
  }
}

// Rate limiting store (in-memory, consider Redis for production)
const rateLimitStore = new Map<number, { count: number; resetAt: number }>()

export async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  // Check for API key in header
  const apiKey = req.headers['x-api-key'] as string

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required. Include X-API-Key header.' })
  }

  // Validate key format
  if (!apiKey.startsWith('tk_') || apiKey.length !== 67) {
    return res.status(401).json({ error: 'Invalid API key format' })
  }

  try {
    // Hash the key to find it in the database
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

    // Find the API key
    const [keyRecord] = await db.select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1)

    if (!keyRecord) {
      return res.status(401).json({ error: 'Invalid API key' })
    }

    // Check if expired
    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      return res.status(401).json({ error: 'API key has expired' })
    }

    // Rate limiting
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 minute window
    const rateData = rateLimitStore.get(keyRecord.id)

    if (rateData && now < rateData.resetAt) {
      if (rateData.count >= keyRecord.rateLimit) {
        const retryAfter = Math.ceil((rateData.resetAt - now) / 1000)
        res.setHeader('X-RateLimit-Limit', keyRecord.rateLimit.toString())
        res.setHeader('X-RateLimit-Remaining', '0')
        res.setHeader('X-RateLimit-Reset', rateData.resetAt.toString())
        res.setHeader('Retry-After', retryAfter.toString())
        return res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter,
        })
      }
      rateData.count++
    } else {
      rateLimitStore.set(keyRecord.id, { count: 1, resetAt: now + windowMs })
    }

    // Update last used timestamp (fire and forget)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, keyRecord.id))
      .catch(err => console.error('Failed to update lastUsedAt:', err))

    // Attach API key user info to request
    req.apiKeyUser = {
      apiKeyId: keyRecord.id,
      userId: keyRecord.userId,
      tenantId: keyRecord.tenantId,
      scopes: keyRecord.scopes as string[],
      rateLimit: keyRecord.rateLimit,
    }

    // Set rate limit headers
    const remaining = keyRecord.rateLimit - (rateLimitStore.get(keyRecord.id)?.count || 1)
    res.setHeader('X-RateLimit-Limit', keyRecord.rateLimit.toString())
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining).toString())

    next()
  } catch (error) {
    console.error('API key auth error:', error)
    return res.status(500).json({ error: 'Authentication failed' })
  }
}

// Middleware to check for specific scopes
export function requireScope(...requiredScopes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKeyUser) {
      return res.status(401).json({ error: 'API key authentication required' })
    }

    const hasScope = requiredScopes.some(scope => req.apiKeyUser!.scopes.includes(scope))
    if (!hasScope) {
      return res.status(403).json({
        error: 'Insufficient scope',
        required: requiredScopes,
        actual: req.apiKeyUser.scopes,
      })
    }

    next()
  }
}
