import { Router } from 'express'
import { db } from '../db/index.js'
import { products, clientProducts, clients, epics, features, devTasks, modules, components, addons } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'
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
    const { name, description, code } = req.body
    const { tenantId } = req.user!

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' })
    }

    if (!code) {
      return res.status(400).json({ error: 'Product code is required' })
    }

    const [product] = await db.insert(products).values({
      tenantId,
      name,
      code,
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
    const { name, description, defaultImplementorId, defaultDeveloperId, defaultTesterId } = req.body

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (defaultImplementorId !== undefined) updateData.defaultImplementorId = defaultImplementorId
    if (defaultDeveloperId !== undefined) updateData.defaultDeveloperId = defaultDeveloperId
    if (defaultTesterId !== undefined) updateData.defaultTesterId = defaultTesterId

    const [product] = await db.update(products)
      .set(updateData)
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
    const { tenantId, clientId, productIds } = req.body

    if (!tenantId || !clientId || !productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ error: 'tenantId, clientId, and productIds array required' })
    }

    // Insert all assignments
    const assignments = productIds.map((productId: number) => ({
      tenantId,
      clientId,
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

// Get products for a client
productRoutes.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params
    const cid = parseInt(clientId)

    const assigned = await db.query.clientProducts.findMany({
      where: eq(clientProducts.clientId, cid),
      with: {
        product: true,
      },
    })

    const productList = assigned.map((tp: any) => tp.product)
    res.json(productList)
  } catch (error) {
    console.error('Get client products error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update products for a client (replace all assignments)
productRoutes.put('/client/:clientId', requireInternal, async (req, res) => {
  try {
    const { clientId } = req.params
    const { productIds } = req.body
    const { tenantId } = req.user!
    const cid = parseInt(clientId)

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds array required' })
    }

    // Delete existing assignments for this client
    await db.delete(clientProducts).where(eq(clientProducts.clientId, cid))

    // Insert new assignments
    if (productIds.length > 0) {
      const assignments = productIds.map((productId: number) => ({
        tenantId,
        clientId: cid,
        productId,
      }))
      await db.insert(clientProducts).values(assignments)
    }

    res.json({ message: 'Products updated', count: productIds.length })
  } catch (error) {
    console.error('Update client products error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update products for a tenant (replace all assignments)
productRoutes.put('/tenant/:tenantId', requireInternal, async (req, res) => {
  try {
    const { tenantId } = req.params
    const { clientId, productIds } = req.body

    if (!clientId || !productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ error: 'clientId and productIds array required' })
    }

    const tid = parseInt(tenantId)

    // Delete existing assignments
    await db.delete(clientProducts).where(and(
      eq(clientProducts.tenantId, tid),
      eq(clientProducts.clientId, clientId)
    ))

    // Insert new assignments
    if (productIds.length > 0) {
      const assignments = productIds.map((productId: number) => ({
        tenantId: tid,
        clientId,
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

// ========================================
// MODULES (Product → Modules)
// ========================================

// List modules for a product
productRoutes.get('/:id/modules', async (req, res) => {
  try {
    const { id } = req.params
    const productId = parseInt(id)

    const moduleList = await db.select().from(modules)
      .where(eq(modules.productId, productId))
      .orderBy(modules.name)

    res.json(moduleList)
  } catch (error) {
    console.error('List modules error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create module for a product
productRoutes.post('/:id/modules', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description } = req.body
    const { tenantId } = req.user!
    const productId = parseInt(id)

    if (!name) {
      return res.status(400).json({ error: 'Module name is required' })
    }

    const [module] = await db.insert(modules).values({
      tenantId,
      productId,
      name,
      description,
    }).returning()

    res.status(201).json(module)
  } catch (error) {
    console.error('Create module error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update module
productRoutes.patch('/modules/:moduleId', requireInternal, async (req, res) => {
  try {
    const { moduleId } = req.params
    const { name, description } = req.body

    const [module] = await db.update(modules)
      .set({ name, description })
      .where(eq(modules.id, parseInt(moduleId)))
      .returning()

    if (!module) {
      return res.status(404).json({ error: 'Module not found' })
    }

    res.json(module)
  } catch (error) {
    console.error('Update module error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete module
productRoutes.delete('/modules/:moduleId', requireInternal, async (req, res) => {
  try {
    const { moduleId } = req.params
    const mid = parseInt(moduleId)

    // Delete components first
    await db.delete(components).where(eq(components.moduleId, mid))

    // Delete module
    const [deleted] = await db.delete(modules)
      .where(eq(modules.id, mid))
      .returning()

    if (!deleted) {
      return res.status(404).json({ error: 'Module not found' })
    }

    res.json({ message: 'Module deleted' })
  } catch (error) {
    console.error('Delete module error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ========================================
// COMPONENTS (Module → Components)
// ========================================

// List components for a module
productRoutes.get('/modules/:moduleId/components', async (req, res) => {
  try {
    const { moduleId } = req.params

    const componentList = await db.select().from(components)
      .where(eq(components.moduleId, parseInt(moduleId)))
      .orderBy(components.name)

    res.json(componentList)
  } catch (error) {
    console.error('List components error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create component for a module
productRoutes.post('/modules/:moduleId/components', requireInternal, async (req, res) => {
  try {
    const { moduleId } = req.params
    const { name, description } = req.body
    const { tenantId } = req.user!

    if (!name) {
      return res.status(400).json({ error: 'Component name is required' })
    }

    const [component] = await db.insert(components).values({
      tenantId,
      moduleId: parseInt(moduleId),
      name,
      description,
    }).returning()

    res.status(201).json(component)
  } catch (error) {
    console.error('Create component error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update component
productRoutes.patch('/components/:componentId', requireInternal, async (req, res) => {
  try {
    const { componentId } = req.params
    const { name, description } = req.body

    const [component] = await db.update(components)
      .set({ name, description })
      .where(eq(components.id, parseInt(componentId)))
      .returning()

    if (!component) {
      return res.status(404).json({ error: 'Component not found' })
    }

    res.json(component)
  } catch (error) {
    console.error('Update component error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete component
productRoutes.delete('/components/:componentId', requireInternal, async (req, res) => {
  try {
    const { componentId } = req.params

    const [deleted] = await db.delete(components)
      .where(eq(components.id, parseInt(componentId)))
      .returning()

    if (!deleted) {
      return res.status(404).json({ error: 'Component not found' })
    }

    res.json({ message: 'Component deleted' })
  } catch (error) {
    console.error('Delete component error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ========================================
// ADDONS (Product → Addons)
// ========================================

// List addons for a product
productRoutes.get('/:id/addons', async (req, res) => {
  try {
    const { id } = req.params
    const productId = parseInt(id)

    const addonList = await db.select().from(addons)
      .where(eq(addons.productId, productId))
      .orderBy(addons.name)

    res.json(addonList)
  } catch (error) {
    console.error('List addons error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create addon for a product
productRoutes.post('/:id/addons', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description } = req.body
    const { tenantId } = req.user!
    const productId = parseInt(id)

    if (!name) {
      return res.status(400).json({ error: 'Addon name is required' })
    }

    const [addon] = await db.insert(addons).values({
      tenantId,
      productId,
      name,
      description,
    }).returning()

    res.status(201).json(addon)
  } catch (error) {
    console.error('Create addon error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update addon
productRoutes.patch('/addons/:addonId', requireInternal, async (req, res) => {
  try {
    const { addonId } = req.params
    const { name, description } = req.body

    const [addon] = await db.update(addons)
      .set({ name, description })
      .where(eq(addons.id, parseInt(addonId)))
      .returning()

    if (!addon) {
      return res.status(404).json({ error: 'Addon not found' })
    }

    res.json(addon)
  } catch (error) {
    console.error('Update addon error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete addon
productRoutes.delete('/addons/:addonId', requireInternal, async (req, res) => {
  try {
    const { addonId } = req.params

    const [deleted] = await db.delete(addons)
      .where(eq(addons.id, parseInt(addonId)))
      .returning()

    if (!deleted) {
      return res.status(404).json({ error: 'Addon not found' })
    }

    res.json({ message: 'Addon deleted' })
  } catch (error) {
    console.error('Delete addon error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
