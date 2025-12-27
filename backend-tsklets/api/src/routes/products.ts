import { Router } from 'express'
import { db } from '../db/index.js'
import { products, clientProducts, epics, features, devTasks } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { authenticate, requireInternal } from '../middleware/auth.js'

export const productRoutes = Router()

// All routes require authentication
productRoutes.use(authenticate)

// List all products (for dropdown)
productRoutes.get('/', async (req, res) => {
  try {
    const allProducts = await db.select().from(products).orderBy(products.name)
    res.json(allProducts)
  } catch (error) {
    console.error('List products error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new product (owner only)
productRoutes.post('/', requireInternal, async (req, res) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' })
    }

    const [product] = await db.insert(products).values({
      name,
      description,
    }).returning()

    res.status(201).json(product)
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Product already exists' })
    }
    console.error('Create product error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update product (owner only)
productRoutes.patch('/:id', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description } = req.body

    const [product] = await db.update(products)
      .set({ name, description })
      .where(eq(products.id, parseInt(id)))
      .returning()

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(product)
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Product name already exists' })
    }
    console.error('Update product error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Assign products to tenant (owner only)
productRoutes.post('/assign', requireInternal, async (req, res) => {
  try {
    const { tenantId, productIds } = req.body

    if (!tenantId || !productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ error: 'tenantId and productIds array required' })
    }

    // Insert all assignments
    const assignments = productIds.map((productId: number) => ({
      tenantId,
      productId,
    }))

    await db.insert(clientProducts).values(assignments)

    res.status(201).json({ message: 'Products assigned', count: productIds.length })
  } catch (error) {
    console.error('Assign products error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get products for a tenant
productRoutes.get('/tenant/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params

    const assigned = await db.query.clientProducts.findMany({
      where: eq(clientProducts.tenantId, parseInt(tenantId)),
      with: {
        product: true,
      },
    })

    const productList = assigned.map((tp: any) => tp.product)
    res.json(productList)
  } catch (error) {
    console.error('Get tenant products error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update products for a tenant (replace all assignments)
productRoutes.put('/tenant/:tenantId', requireInternal, async (req, res) => {
  try {
    const { tenantId } = req.params
    const { productIds } = req.body

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds array required' })
    }

    const tid = parseInt(tenantId)

    // Delete existing assignments
    await db.delete(clientProducts).where(eq(clientProducts.tenantId, tid))

    // Insert new assignments
    if (productIds.length > 0) {
      const assignments = productIds.map((productId: number) => ({
        tenantId: tid,
        productId,
      }))
      await db.insert(clientProducts).values(assignments)
    }

    res.json({ message: 'Products updated', count: productIds.length })
  } catch (error) {
    console.error('Update tenant products error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get product dashboard metrics (owner only)
productRoutes.get('/:id/dashboard', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const productId = parseInt(id)

    // Get all epics for this product
    const productEpics = await db.select().from(epics)
      .where(eq(epics.productId, productId))

    if (productEpics.length === 0) {
      return res.json({
        epics: [],
        features: [],
        tasks: [],
        epicProgress: [],
        taskStatusDistribution: { todo: 0, in_progress: 0, review: 0, done: 0 },
        totalTasks: 0,
      })
    }

    const epicIds = productEpics.map(e => e.id)

    // Get all features for all epics
    const allFeatures: any[] = []
    for (const epicId of epicIds) {
      const feat = await db.select().from(features)
        .where(eq(features.epicId, epicId))
      allFeatures.push(...feat)
    }

    const featureIds = allFeatures.map(f => f.id)

    // Get all tasks for these features
    const allTasks: any[] = []
    for (const featureId of featureIds) {
      const tasks = await db.select().from(devTasks)
        .where(eq(devTasks.featureId, featureId))
      allTasks.push(...tasks)
    }

    // Calculate epic progress
    const epicProgress = productEpics.map(epic => {
      const epicFeats = allFeatures.filter(f => f.epicId === epic.id)
      const epicFeatIds = epicFeats.map(f => f.id)
      const epicTasks = allTasks.filter(t => epicFeatIds.includes(t.featureId))
      const completedTasks = epicTasks.filter(t => t.status === 'done').length
      const totalTasks = epicTasks.length

      return {
        epicId: epic.id,
        epicTitle: epic.title,
        totalTasks,
        completedTasks,
        percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      }
    })

    // Calculate task status distribution
    const taskStatusDistribution = {
      todo: allTasks.filter(t => t.status === 'todo').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      review: allTasks.filter(t => t.status === 'review').length,
      done: allTasks.filter(t => t.status === 'done').length,
    }

    res.json({
      epics: productEpics,
      features: allFeatures,
      tasks: allTasks,
      epicProgress,
      taskStatusDistribution,
      totalTasks: allTasks.length,
    })
  } catch (error) {
    console.error('Get product dashboard error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
