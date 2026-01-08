import { Router, type Request, type Response } from 'express'
import { db } from '../db/index.js'
import { tags } from '../db/schema.js'
import { eq, and, ilike } from 'drizzle-orm'
import { authenticate } from '../middleware/auth.js'
import { generateSlug, isValidSlug } from '../utils/variable-extractor.js'

export const tagRoutes = Router()

// All routes require authentication
tagRoutes.use(authenticate)

// Create tag
tagRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, color } = req.body
    const tenantId = req.user!.tenantId

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required' })
    }

    // Generate slug from name
    let slug = generateSlug(name)

    // Check for existing slug
    const existing = await db.select()
      .from(tags)
      .where(and(
        eq(tags.tenantId, tenantId),
        eq(tags.slug, slug)
      ))
      .limit(1)

    if (existing.length > 0) {
      // Append number to make unique
      const count = await db.select()
        .from(tags)
        .where(and(
          eq(tags.tenantId, tenantId),
          ilike(tags.slug, `${slug}%`)
        ))
      slug = `${slug}-${count.length + 1}`
    }

    const [tag] = await db.insert(tags)
      .values({
        tenantId,
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        color: color || '#6366f1', // Default indigo
      })
      .returning()

    res.status(201).json({ tag })
  } catch (error) {
    console.error('Create tag error:', error)
    res.status(500).json({ error: 'Failed to create tag' })
  }
})

// List tags
tagRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const { search } = req.query

    let query = db.select()
      .from(tags)
      .where(eq(tags.tenantId, tenantId))
      .orderBy(tags.name)

    const result = await query

    // Filter by search if provided
    let filteredTags = result
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase()
      filteredTags = result.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.slug.includes(searchLower)
      )
    }

    res.json({ tags: filteredTags })
  } catch (error) {
    console.error('List tags error:', error)
    res.status(500).json({ error: 'Failed to list tags' })
  }
})

// Get single tag
tagRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const tagId = parseInt(req.params.id)

    const [tag] = await db.select()
      .from(tags)
      .where(and(
        eq(tags.id, tagId),
        eq(tags.tenantId, tenantId)
      ))
      .limit(1)

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' })
    }

    res.json({ tag })
  } catch (error) {
    console.error('Get tag error:', error)
    res.status(500).json({ error: 'Failed to get tag' })
  }
})

// Update tag
tagRoutes.patch('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const tagId = parseInt(req.params.id)
    const { name, description, color } = req.body

    // Verify ownership
    const [existing] = await db.select()
      .from(tags)
      .where(and(
        eq(tags.id, tagId),
        eq(tags.tenantId, tenantId)
      ))
      .limit(1)

    if (!existing) {
      return res.status(404).json({ error: 'Tag not found' })
    }

    const updates: Partial<typeof existing> = {
      updatedAt: new Date(),
    }

    if (name?.trim()) {
      updates.name = name.trim()
      // Regenerate slug if name changed
      const newSlug = generateSlug(name)
      if (newSlug !== existing.slug) {
        // Check for conflicts
        const conflict = await db.select()
          .from(tags)
          .where(and(
            eq(tags.tenantId, tenantId),
            eq(tags.slug, newSlug)
          ))
          .limit(1)

        if (conflict.length === 0) {
          updates.slug = newSlug
        }
      }
    }
    if (description !== undefined) updates.description = description?.trim() || null
    if (color) updates.color = color

    const [tag] = await db.update(tags)
      .set(updates)
      .where(eq(tags.id, tagId))
      .returning()

    res.json({ tag })
  } catch (error) {
    console.error('Update tag error:', error)
    res.status(500).json({ error: 'Failed to update tag' })
  }
})

// Delete tag
tagRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId
    const tagId = parseInt(req.params.id)

    // Verify ownership
    const [existing] = await db.select()
      .from(tags)
      .where(and(
        eq(tags.id, tagId),
        eq(tags.tenantId, tenantId)
      ))
      .limit(1)

    if (!existing) {
      return res.status(404).json({ error: 'Tag not found' })
    }

    await db.delete(tags)
      .where(eq(tags.id, tagId))

    res.json({ success: true })
  } catch (error) {
    console.error('Delete tag error:', error)
    res.status(500).json({ error: 'Failed to delete tag' })
  }
})
