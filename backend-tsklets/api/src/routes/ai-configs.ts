import { Router } from 'express'
import { db } from '../db/index.js'
import {
  aiConfigs,
  aiConfigVersions,
  aiConfigTags,
  aiConfigFavorites,
  tags,
  users,
  teams
} from '../db/schema.js'
import { eq, desc, and, or, like, sql, inArray } from 'drizzle-orm'
import { authenticate, requireInternal } from '../middleware/auth.js'
import { extractVariables, generateSlug, isValidSlug } from '../utils/variable-extractor.js'

export const aiConfigRoutes = Router()

// All AI config routes require authentication
aiConfigRoutes.use(authenticate)

// ========================================
// CRUD Operations
// ========================================

// Create new AI config (internal users only)
aiConfigRoutes.post('/', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!
    const {
      name,
      slug: providedSlug,
      description,
      content,
      contentType,
      visibility,
      teamId,
      metadata
    } = req.body

    if (!name || !content) {
      return res.status(400).json({ error: 'name and content are required' })
    }

    // Generate or validate slug
    const slug = providedSlug || generateSlug(name)
    if (!isValidSlug(slug)) {
      return res.status(400).json({ error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' })
    }

    // Check slug uniqueness within tenant
    const [existing] = await db.select({ id: aiConfigs.id })
      .from(aiConfigs)
      .where(and(
        eq(aiConfigs.tenantId, tenantId),
        eq(aiConfigs.slug, slug)
      ))
      .limit(1)

    if (existing) {
      return res.status(409).json({ error: 'A config with this slug already exists' })
    }

    // Validate team visibility
    if (visibility === 'team' && !teamId) {
      return res.status(400).json({ error: 'teamId is required when visibility is "team"' })
    }

    // Extract variables from content
    const variables = extractVariables(content)

    // Create the config
    const [config] = await db.insert(aiConfigs).values({
      tenantId,
      name,
      slug,
      description: description || null,
      content,
      contentType: contentType || 'text',
      variables: variables.length > 0 ? variables : null,
      visibility: visibility || 'private',
      teamId: teamId || null,
      createdBy: userId,
      metadata: metadata || null,
    }).returning()

    // Create first version
    const [version] = await db.insert(aiConfigVersions).values({
      tenantId,
      configId: config.id,
      version: 1,
      content,
      contentType: contentType || 'text',
      variables: variables.length > 0 ? variables : null,
      changeNote: 'Initial version',
      createdBy: userId,
    }).returning()

    // Update config with active version
    await db.update(aiConfigs)
      .set({ activeVersionId: version.id })
      .where(eq(aiConfigs.id, config.id))

    res.status(201).json({
      config: { ...config, activeVersionId: version.id },
      version
    })
  } catch (error) {
    console.error('Create AI config error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// List AI configs with filters (internal users only)
aiConfigRoutes.get('/', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!
    const { search, visibility, tagIds, favorites, limit = '50', offset = '0' } = req.query

    // Build base query conditions
    const conditions = [eq(aiConfigs.tenantId, tenantId)]

    // Visibility filter - users can see:
    // - Their own private configs
    // - Team configs they belong to
    // - Public configs
    if (visibility) {
      conditions.push(eq(aiConfigs.visibility, visibility as any))
    }

    // Search in name, description, content
    if (search) {
      const searchTerm = `%${search}%`
      conditions.push(
        or(
          like(aiConfigs.name, searchTerm),
          like(aiConfigs.description, searchTerm),
          like(aiConfigs.content, searchTerm)
        )!
      )
    }

    // Get configs
    let configs = await db.select({
      id: aiConfigs.id,
      tenantId: aiConfigs.tenantId,
      name: aiConfigs.name,
      slug: aiConfigs.slug,
      description: aiConfigs.description,
      content: aiConfigs.content,
      contentType: aiConfigs.contentType,
      variables: aiConfigs.variables,
      visibility: aiConfigs.visibility,
      teamId: aiConfigs.teamId,
      createdBy: aiConfigs.createdBy,
      activeVersionId: aiConfigs.activeVersionId,
      forkCount: aiConfigs.forkCount,
      usageCount: aiConfigs.usageCount,
      favoriteCount: aiConfigs.favoriteCount,
      forkedFromId: aiConfigs.forkedFromId,
      metadata: aiConfigs.metadata,
      createdAt: aiConfigs.createdAt,
      updatedAt: aiConfigs.updatedAt,
    })
      .from(aiConfigs)
      .where(and(...conditions))
      .orderBy(desc(aiConfigs.updatedAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))

    // Filter by visibility access
    configs = configs.filter(config => {
      if (config.visibility === 'public') return true
      if (config.visibility === 'private' && config.createdBy === userId) return true
      // TODO: Check team membership for 'team' visibility
      if (config.visibility === 'team') return true // Simplified for now
      return false
    })

    // Get tags for each config
    const configIds = configs.map(c => c.id)
    let configTagsMap: Record<number, any[]> = {}

    if (configIds.length > 0) {
      const tagResults = await db.select({
        configId: aiConfigTags.configId,
        tagId: tags.id,
        tagName: tags.name,
        tagSlug: tags.slug,
        tagColor: tags.color,
      })
        .from(aiConfigTags)
        .innerJoin(tags, eq(aiConfigTags.tagId, tags.id))
        .where(inArray(aiConfigTags.configId, configIds))

      tagResults.forEach(tr => {
        if (!configTagsMap[tr.configId]) {
          configTagsMap[tr.configId] = []
        }
        configTagsMap[tr.configId].push({
          id: tr.tagId,
          name: tr.tagName,
          slug: tr.tagSlug,
          color: tr.tagColor,
        })
      })
    }

    // Get favorites for current user
    let favoritesSet = new Set<number>()
    if (configIds.length > 0) {
      const userFavorites = await db.select({ configId: aiConfigFavorites.configId })
        .from(aiConfigFavorites)
        .where(and(
          inArray(aiConfigFavorites.configId, configIds),
          eq(aiConfigFavorites.userId, userId)
        ))
      userFavorites.forEach(f => favoritesSet.add(f.configId))
    }

    // Filter by favorites if requested
    if (favorites === 'true') {
      configs = configs.filter(c => favoritesSet.has(c.id))
    }

    // Filter by tags if requested
    if (tagIds) {
      const tagIdArray = (tagIds as string).split(',').map(Number)
      configs = configs.filter(c => {
        const configTags = configTagsMap[c.id] || []
        return tagIdArray.some(tid => configTags.some((t: any) => t.id === tid))
      })
    }

    // Enrich with tags and favorites
    const enrichedConfigs = configs.map(c => ({
      ...c,
      tags: configTagsMap[c.id] || [],
      isFavorited: favoritesSet.has(c.id),
    }))

    res.json({ configs: enrichedConfigs })
  } catch (error) {
    console.error('List AI configs error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single AI config by ID (internal users only)
aiConfigRoutes.get('/:id', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!
    const { id } = req.params

    const [config] = await db.select()
      .from(aiConfigs)
      .where(and(
        eq(aiConfigs.id, parseInt(id)),
        eq(aiConfigs.tenantId, tenantId)
      ))
      .limit(1)

    if (!config) {
      return res.status(404).json({ error: 'Config not found' })
    }

    // Check visibility access
    if (config.visibility === 'private' && config.createdBy !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get creator info
    const [creator] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
      .from(users)
      .where(eq(users.id, config.createdBy))
      .limit(1)

    // Get team info if applicable
    let team = null
    if (config.teamId) {
      const [teamResult] = await db.select({
        id: teams.id,
        name: teams.name,
      })
        .from(teams)
        .where(eq(teams.id, config.teamId))
        .limit(1)
      team = teamResult || null
    }

    // Get tags
    const configTags = await db.select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      color: tags.color,
    })
      .from(aiConfigTags)
      .innerJoin(tags, eq(aiConfigTags.tagId, tags.id))
      .where(eq(aiConfigTags.configId, config.id))

    // Check if favorited
    const [favorite] = await db.select({ id: aiConfigFavorites.id })
      .from(aiConfigFavorites)
      .where(and(
        eq(aiConfigFavorites.configId, config.id),
        eq(aiConfigFavorites.userId, userId)
      ))
      .limit(1)

    res.json({
      config: {
        ...config,
        creator,
        team,
        tags: configTags,
        isFavorited: !!favorite,
      }
    })
  } catch (error) {
    console.error('Get AI config error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update AI config (creates new version)
aiConfigRoutes.patch('/:id', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!
    const { id } = req.params
    const {
      name,
      description,
      content,
      contentType,
      visibility,
      teamId,
      metadata,
      changeNote
    } = req.body

    const [config] = await db.select()
      .from(aiConfigs)
      .where(and(
        eq(aiConfigs.id, parseInt(id)),
        eq(aiConfigs.tenantId, tenantId)
      ))
      .limit(1)

    if (!config) {
      return res.status(404).json({ error: 'Config not found' })
    }

    // Only creator can edit
    if (config.createdBy !== userId) {
      return res.status(403).json({ error: 'Only the creator can edit this config' })
    }

    const updateData: any = { updatedAt: new Date() }
    let newVersion = null

    // If content changed, create new version
    if (content !== undefined && content !== config.content) {
      // Get current max version
      const [maxVersion] = await db.select({
        maxVer: sql<number>`COALESCE(MAX(${aiConfigVersions.version}), 0)`
      })
        .from(aiConfigVersions)
        .where(eq(aiConfigVersions.configId, config.id))

      const nextVersion = (maxVersion?.maxVer || 0) + 1

      // Extract variables from new content
      const variables = extractVariables(content)

      // Create new version
      const [version] = await db.insert(aiConfigVersions).values({
        tenantId,
        configId: config.id,
        version: nextVersion,
        content,
        contentType: contentType || config.contentType,
        variables: variables.length > 0 ? variables : null,
        changeNote: changeNote || null,
        createdBy: userId,
      }).returning()

      newVersion = version
      updateData.content = content
      updateData.variables = variables.length > 0 ? variables : null
      updateData.activeVersionId = version.id
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (contentType !== undefined) updateData.contentType = contentType
    if (visibility !== undefined) updateData.visibility = visibility
    if (teamId !== undefined) updateData.teamId = teamId
    if (metadata !== undefined) {
      updateData.metadata = metadata === null ? null : {
        ...(config.metadata as object || {}),
        ...metadata
      }
    }

    const [updated] = await db.update(aiConfigs)
      .set(updateData)
      .where(eq(aiConfigs.id, config.id))
      .returning()

    res.json({ config: updated, version: newVersion })
  } catch (error) {
    console.error('Update AI config error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete AI config
aiConfigRoutes.delete('/:id', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!
    const { id } = req.params

    const [config] = await db.select()
      .from(aiConfigs)
      .where(and(
        eq(aiConfigs.id, parseInt(id)),
        eq(aiConfigs.tenantId, tenantId)
      ))
      .limit(1)

    if (!config) {
      return res.status(404).json({ error: 'Config not found' })
    }

    // Only creator can delete
    if (config.createdBy !== userId) {
      return res.status(403).json({ error: 'Only the creator can delete this config' })
    }

    // Delete related records first
    await db.delete(aiConfigTags).where(eq(aiConfigTags.configId, config.id))
    await db.delete(aiConfigFavorites).where(eq(aiConfigFavorites.configId, config.id))
    await db.delete(aiConfigVersions).where(eq(aiConfigVersions.configId, config.id))
    await db.delete(aiConfigs).where(eq(aiConfigs.id, config.id))

    res.json({ success: true, message: `Config ${id} deleted` })
  } catch (error) {
    console.error('Delete AI config error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ========================================
// Version Management
// ========================================

// List versions for a config
aiConfigRoutes.get('/:id/versions', requireInternal, async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { id } = req.params

    // Verify config exists and user has access
    const [config] = await db.select({ id: aiConfigs.id, activeVersionId: aiConfigs.activeVersionId })
      .from(aiConfigs)
      .where(and(
        eq(aiConfigs.id, parseInt(id)),
        eq(aiConfigs.tenantId, tenantId)
      ))
      .limit(1)

    if (!config) {
      return res.status(404).json({ error: 'Config not found' })
    }

    const versions = await db.select({
      id: aiConfigVersions.id,
      configId: aiConfigVersions.configId,
      version: aiConfigVersions.version,
      content: aiConfigVersions.content,
      contentType: aiConfigVersions.contentType,
      variables: aiConfigVersions.variables,
      changeNote: aiConfigVersions.changeNote,
      createdBy: aiConfigVersions.createdBy,
      createdAt: aiConfigVersions.createdAt,
    })
      .from(aiConfigVersions)
      .where(eq(aiConfigVersions.configId, config.id))
      .orderBy(desc(aiConfigVersions.version))

    // Mark active version
    const enrichedVersions = versions.map(v => ({
      ...v,
      isActive: v.id === config.activeVersionId,
    }))

    res.json({ versions: enrichedVersions })
  } catch (error) {
    console.error('List versions error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get specific version
aiConfigRoutes.get('/:id/versions/:version', requireInternal, async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { id, version } = req.params

    const [versionResult] = await db.select()
      .from(aiConfigVersions)
      .where(and(
        eq(aiConfigVersions.configId, parseInt(id)),
        eq(aiConfigVersions.version, parseInt(version)),
        eq(aiConfigVersions.tenantId, tenantId)
      ))
      .limit(1)

    if (!versionResult) {
      return res.status(404).json({ error: 'Version not found' })
    }

    res.json({ version: versionResult })
  } catch (error) {
    console.error('Get version error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Activate a specific version (rollback)
aiConfigRoutes.post('/:id/versions/:version/activate', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!
    const { id, version } = req.params

    const [config] = await db.select()
      .from(aiConfigs)
      .where(and(
        eq(aiConfigs.id, parseInt(id)),
        eq(aiConfigs.tenantId, tenantId)
      ))
      .limit(1)

    if (!config) {
      return res.status(404).json({ error: 'Config not found' })
    }

    // Only creator can rollback
    if (config.createdBy !== userId) {
      return res.status(403).json({ error: 'Only the creator can change versions' })
    }

    const [versionResult] = await db.select()
      .from(aiConfigVersions)
      .where(and(
        eq(aiConfigVersions.configId, config.id),
        eq(aiConfigVersions.version, parseInt(version))
      ))
      .limit(1)

    if (!versionResult) {
      return res.status(404).json({ error: 'Version not found' })
    }

    // Update config with version's content
    const [updated] = await db.update(aiConfigs)
      .set({
        content: versionResult.content,
        contentType: versionResult.contentType,
        variables: versionResult.variables,
        activeVersionId: versionResult.id,
        updatedAt: new Date(),
      })
      .where(eq(aiConfigs.id, config.id))
      .returning()

    res.json({ config: updated, activatedVersion: versionResult })
  } catch (error) {
    console.error('Activate version error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ========================================
// Favorites
// ========================================

// Toggle favorite
aiConfigRoutes.post('/:id/favorite', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!
    const { id } = req.params

    const [config] = await db.select({ id: aiConfigs.id, favoriteCount: aiConfigs.favoriteCount })
      .from(aiConfigs)
      .where(and(
        eq(aiConfigs.id, parseInt(id)),
        eq(aiConfigs.tenantId, tenantId)
      ))
      .limit(1)

    if (!config) {
      return res.status(404).json({ error: 'Config not found' })
    }

    // Check if already favorited
    const [existing] = await db.select({ id: aiConfigFavorites.id })
      .from(aiConfigFavorites)
      .where(and(
        eq(aiConfigFavorites.configId, config.id),
        eq(aiConfigFavorites.userId, userId)
      ))
      .limit(1)

    if (existing) {
      // Remove favorite
      await db.delete(aiConfigFavorites).where(eq(aiConfigFavorites.id, existing.id))
      await db.update(aiConfigs)
        .set({ favoriteCount: sql`${aiConfigs.favoriteCount} - 1` })
        .where(eq(aiConfigs.id, config.id))

      res.json({ isFavorited: false })
    } else {
      // Add favorite
      await db.insert(aiConfigFavorites).values({
        tenantId,
        configId: config.id,
        userId,
      })
      await db.update(aiConfigs)
        .set({ favoriteCount: sql`${aiConfigs.favoriteCount} + 1` })
        .where(eq(aiConfigs.id, config.id))

      res.json({ isFavorited: true })
    }
  } catch (error) {
    console.error('Toggle favorite error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ========================================
// Fork
// ========================================

// Fork a public config
aiConfigRoutes.post('/:id/fork', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!
    const { id } = req.params
    const { name: newName } = req.body

    const [original] = await db.select()
      .from(aiConfigs)
      .where(and(
        eq(aiConfigs.id, parseInt(id)),
        eq(aiConfigs.tenantId, tenantId)
      ))
      .limit(1)

    if (!original) {
      return res.status(404).json({ error: 'Config not found' })
    }

    // Can only fork public configs (or your own)
    if (original.visibility !== 'public' && original.createdBy !== userId) {
      return res.status(403).json({ error: 'Can only fork public configs' })
    }

    const forkName = newName || `${original.name} (fork)`
    const forkSlug = generateSlug(forkName) + '-' + Date.now().toString(36)

    // Create forked config
    const [forked] = await db.insert(aiConfigs).values({
      tenantId,
      name: forkName,
      slug: forkSlug,
      description: original.description,
      content: original.content,
      contentType: original.contentType,
      variables: original.variables,
      visibility: 'private', // Forks start as private
      createdBy: userId,
      forkedFromId: original.id,
      metadata: original.metadata,
    }).returning()

    // Create first version for fork
    const [version] = await db.insert(aiConfigVersions).values({
      tenantId,
      configId: forked.id,
      version: 1,
      content: original.content,
      contentType: original.contentType,
      variables: original.variables,
      changeNote: `Forked from ${original.name}`,
      createdBy: userId,
    }).returning()

    // Update fork with active version
    await db.update(aiConfigs)
      .set({ activeVersionId: version.id })
      .where(eq(aiConfigs.id, forked.id))

    // Increment fork count on original
    await db.update(aiConfigs)
      .set({ forkCount: sql`${aiConfigs.forkCount} + 1` })
      .where(eq(aiConfigs.id, original.id))

    res.status(201).json({
      config: { ...forked, activeVersionId: version.id },
      version
    })
  } catch (error) {
    console.error('Fork config error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ========================================
// Tags
// ========================================

// Add tags to config
aiConfigRoutes.post('/:id/tags', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!
    const { id } = req.params
    const { tagIds } = req.body

    if (!tagIds || !Array.isArray(tagIds)) {
      return res.status(400).json({ error: 'tagIds array is required' })
    }

    const [config] = await db.select({ id: aiConfigs.id, createdBy: aiConfigs.createdBy })
      .from(aiConfigs)
      .where(and(
        eq(aiConfigs.id, parseInt(id)),
        eq(aiConfigs.tenantId, tenantId)
      ))
      .limit(1)

    if (!config) {
      return res.status(404).json({ error: 'Config not found' })
    }

    if (config.createdBy !== userId) {
      return res.status(403).json({ error: 'Only the creator can modify tags' })
    }

    // Add tags (ignore duplicates)
    for (const tagId of tagIds) {
      try {
        await db.insert(aiConfigTags).values({
          tenantId,
          configId: config.id,
          tagId,
        })
      } catch {
        // Ignore duplicate errors
      }
    }

    // Get updated tags
    const configTags = await db.select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      color: tags.color,
    })
      .from(aiConfigTags)
      .innerJoin(tags, eq(aiConfigTags.tagId, tags.id))
      .where(eq(aiConfigTags.configId, config.id))

    res.json({ tags: configTags })
  } catch (error) {
    console.error('Add tags error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Remove tag from config
aiConfigRoutes.delete('/:id/tags/:tagId', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!
    const { id, tagId } = req.params

    const [config] = await db.select({ id: aiConfigs.id, createdBy: aiConfigs.createdBy })
      .from(aiConfigs)
      .where(and(
        eq(aiConfigs.id, parseInt(id)),
        eq(aiConfigs.tenantId, tenantId)
      ))
      .limit(1)

    if (!config) {
      return res.status(404).json({ error: 'Config not found' })
    }

    if (config.createdBy !== userId) {
      return res.status(403).json({ error: 'Only the creator can modify tags' })
    }

    await db.delete(aiConfigTags)
      .where(and(
        eq(aiConfigTags.configId, config.id),
        eq(aiConfigTags.tagId, parseInt(tagId))
      ))

    res.json({ success: true })
  } catch (error) {
    console.error('Remove tag error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
