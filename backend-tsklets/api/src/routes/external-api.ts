import { Router, type Request, type Response } from 'express'
import { db } from '../db/index.js'
import { aiConfigs, aiConfigVersions, aiConfigUsage, users } from '../db/schema.js'
import { eq, and, or } from 'drizzle-orm'
import { authenticateApiKey, requireScope } from '../middleware/api-key-auth.js'

export const externalApiRoutes = Router()

// All routes require API key authentication
externalApiRoutes.use(authenticateApiKey)

// Get config by slug
externalApiRoutes.get('/configs/:slug', requireScope('read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.apiKeyUser!.tenantId
    const userId = req.apiKeyUser!.userId
    const { slug } = req.params

    // Find config by slug
    const [config] = await db.select({
      id: aiConfigs.id,
      name: aiConfigs.name,
      slug: aiConfigs.slug,
      description: aiConfigs.description,
      content: aiConfigs.content,
      contentType: aiConfigs.contentType,
      variables: aiConfigs.variables,
      visibility: aiConfigs.visibility,
      createdBy: aiConfigs.createdBy,
      activeVersionId: aiConfigs.activeVersionId,
      createdAt: aiConfigs.createdAt,
      updatedAt: aiConfigs.updatedAt,
    })
      .from(aiConfigs)
      .where(and(
        eq(aiConfigs.tenantId, tenantId),
        eq(aiConfigs.slug, slug),
        // Only return configs the user can access
        or(
          eq(aiConfigs.visibility, 'public'),
          eq(aiConfigs.createdBy, userId)
        )
      ))
      .limit(1)

    if (!config) {
      return res.status(404).json({ error: 'Config not found' })
    }

    // Record usage
    db.insert(aiConfigUsage)
      .values({
        tenantId,
        configId: config.id,
        userId,
        action: 'execute',
      })
      .catch(err => console.error('Failed to record usage:', err))

    // Increment usage count
    db.update(aiConfigs)
      .set({ usageCount: config.id }) // Will be replaced with SQL increment
      .where(eq(aiConfigs.id, config.id))
      .catch(() => {})

    res.json({ config })
  } catch (error) {
    console.error('Get config by slug error:', error)
    res.status(500).json({ error: 'Failed to get config' })
  }
})

// Get raw content only (for direct use in prompts)
externalApiRoutes.get('/configs/:slug/raw', requireScope('read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.apiKeyUser!.tenantId
    const userId = req.apiKeyUser!.userId
    const { slug } = req.params

    // Find config by slug
    const [config] = await db.select({
      id: aiConfigs.id,
      content: aiConfigs.content,
      contentType: aiConfigs.contentType,
    })
      .from(aiConfigs)
      .where(and(
        eq(aiConfigs.tenantId, tenantId),
        eq(aiConfigs.slug, slug),
        or(
          eq(aiConfigs.visibility, 'public'),
          eq(aiConfigs.createdBy, userId)
        )
      ))
      .limit(1)

    if (!config) {
      return res.status(404).json({ error: 'Config not found' })
    }

    // Record usage
    db.insert(aiConfigUsage)
      .values({
        tenantId,
        configId: config.id,
        userId,
        action: 'view',
      })
      .catch(err => console.error('Failed to record usage:', err))

    // Return raw content with appropriate content type
    const contentTypes: Record<string, string> = {
      json: 'application/json',
      yaml: 'application/x-yaml',
      markdown: 'text/markdown',
      text: 'text/plain',
    }

    res.setHeader('Content-Type', (config.contentType && contentTypes[config.contentType]) || 'text/plain')
    res.send(config.content)
  } catch (error) {
    console.error('Get raw content error:', error)
    res.status(500).json({ error: 'Failed to get content' })
  }
})

// Get config with variables resolved
externalApiRoutes.post('/configs/:slug/render', requireScope('read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.apiKeyUser!.tenantId
    const userId = req.apiKeyUser!.userId
    const { slug } = req.params
    const variables = req.body.variables || {}

    // Find config by slug
    const [config] = await db.select({
      id: aiConfigs.id,
      content: aiConfigs.content,
      contentType: aiConfigs.contentType,
      variables: aiConfigs.variables,
    })
      .from(aiConfigs)
      .where(and(
        eq(aiConfigs.tenantId, tenantId),
        eq(aiConfigs.slug, slug),
        or(
          eq(aiConfigs.visibility, 'public'),
          eq(aiConfigs.createdBy, userId)
        )
      ))
      .limit(1)

    if (!config) {
      return res.status(404).json({ error: 'Config not found' })
    }

    // Replace {{variable}} patterns with provided values
    let renderedContent = config.content
    const configVariables = (config.variables as Array<{ name: string }>) || []

    for (const v of configVariables) {
      const value = variables[v.name]
      if (value !== undefined) {
        const regex = new RegExp(`\\{\\{${v.name}\\}\\}`, 'g')
        renderedContent = renderedContent.replace(regex, String(value))
      }
    }

    // Check for unresolved variables
    const unresolvedMatch = renderedContent.match(/\{\{(\w+)\}\}/g)
    const unresolved = unresolvedMatch?.map(m => m.slice(2, -2)) || []

    // Record usage
    db.insert(aiConfigUsage)
      .values({
        tenantId,
        configId: config.id,
        userId,
        action: 'execute',
      })
      .catch(err => console.error('Failed to record usage:', err))

    res.json({
      content: renderedContent,
      contentType: config.contentType,
      unresolved: unresolved.length > 0 ? unresolved : undefined,
    })
  } catch (error) {
    console.error('Render config error:', error)
    res.status(500).json({ error: 'Failed to render config' })
  }
})

// List available configs (names and slugs only)
externalApiRoutes.get('/configs', requireScope('read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.apiKeyUser!.tenantId
    const userId = req.apiKeyUser!.userId

    const configs = await db.select({
      id: aiConfigs.id,
      name: aiConfigs.name,
      slug: aiConfigs.slug,
      description: aiConfigs.description,
      contentType: aiConfigs.contentType,
      visibility: aiConfigs.visibility,
      variables: aiConfigs.variables,
    })
      .from(aiConfigs)
      .where(and(
        eq(aiConfigs.tenantId, tenantId),
        or(
          eq(aiConfigs.visibility, 'public'),
          eq(aiConfigs.createdBy, userId)
        )
      ))
      .orderBy(aiConfigs.name)

    res.json({
      configs,
      count: configs.length,
    })
  } catch (error) {
    console.error('List configs error:', error)
    res.status(500).json({ error: 'Failed to list configs' })
  }
})

// Health check for external API
externalApiRoutes.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1',
    tenantId: req.apiKeyUser?.tenantId,
    rateLimit: {
      limit: req.apiKeyUser?.rateLimit,
      remaining: res.getHeader('X-RateLimit-Remaining'),
    },
  })
})
