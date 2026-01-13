import { Router } from 'express'
import { db } from '../db/index.js'
import { devTasks, taskAssignments, supportTicketTasks, tickets, features, epics, products, users, modules, components, addons } from '../db/schema.js'
import { eq, desc, inArray, or, sql } from 'drizzle-orm'
import { authenticate, requireInternal } from '../middleware/auth.js'
import { generateIssueKey } from '../utils/issueKey.js'

export const taskRoutes = Router()

// All task routes require authentication
taskRoutes.use(authenticate)

// Create task (owner only)
taskRoutes.post('/', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!
    const {
      featureId, title, description, type, priority, assignees,
      // New fields
      estimate, dueDate, labels, storyPoints,
      // Bug-specific
      severity, environment, reporterId,
      // Flexible metadata
      metadata
    } = req.body

    if (!featureId || !title) {
      return res.status(400).json({ error: 'featureId and title are required' })
    }

    // Get productId via feature -> epic for issueKey generation
    const [feature] = await db.select({ epicId: features.epicId })
      .from(features).where(eq(features.id, featureId)).limit(1)
    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' })
    }
    const [epic] = await db.select({ productId: epics.productId })
      .from(epics).where(eq(epics.id, feature.epicId)).limit(1)
    if (!epic) {
      return res.status(404).json({ error: 'Epic not found' })
    }

    const taskType = type || 'task'
    const { key: issueKey } = await generateIssueKey(epic.productId, taskType === 'bug' ? 'bug' : 'task')

    const [task] = await db.insert(devTasks).values({
      tenantId,
      productId: epic.productId,
      featureId,
      issueKey,
      title,
      description,
      type: taskType,
      priority: priority || 3,
      status: 'todo',
      // New fields
      createdBy: userId,
      reporterId: reporterId || (taskType === 'bug' ? userId : null),
      estimate,
      dueDate: dueDate ? new Date(dueDate) : null,
      labels: labels || null,
      storyPoints,
      // Bug-specific
      severity: taskType === 'bug' ? (severity || 'major') : null,
      environment: taskType === 'bug' ? environment : null,
      // Flexible metadata
      metadata: metadata || null,
    }).returning()

    // Assign developers if provided
    if (assignees && Array.isArray(assignees) && assignees.length > 0) {
      for (const devUserId of assignees) {
        await db.insert(taskAssignments).values({
          tenantId,
          taskId: task.id,
          userId: devUserId,
        })
      }
    }

    res.status(201).json({ task })
  } catch (error) {
    console.error('Create task error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get my tasks (for developers)
taskRoutes.get('/my-tasks', async (req, res) => {
  try {
    const { userId, role } = req.user!

    // Get task IDs assigned to this user
    const assignments = await db.select().from(taskAssignments)
      .where(eq(taskAssignments.userId, userId))

    if (assignments.length === 0) {
      return res.json({ tasks: [] })
    }

    const taskIds = assignments.map(a => a.taskId)
    const tasks = await db.select().from(devTasks)
      .where(inArray(devTasks.id, taskIds))
      .orderBy(desc(devTasks.createdAt))

    res.json({ tasks })
  } catch (error) {
    console.error('Get my tasks error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get tasks by product (for dashboard - owner only)
taskRoutes.get('/by-product/:productId', requireInternal, async (req, res) => {
  try {
    const { productId } = req.params

    // This requires a join through epics → features → tasks
    // For simplicity, we'll query all tasks and filter
    // In production, use a proper join query
    const allTasks = await db.select().from(devTasks)

    res.json({ tasks: allTasks })
  } catch (error) {
    console.error('Get tasks by product error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update task (owner or assigned developer)
taskRoutes.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      title, description, status, priority, type,
      // New fields
      estimate, actualTime, dueDate, labels, blockedReason,
      // Bug-specific
      severity, environment, reporterId,
      // Flexible metadata
      metadata
    } = req.body
    const { userId, isInternal } = req.user!

    const [task] = await db.select().from(devTasks)
      .where(eq(devTasks.id, parseInt(id)))
      .limit(1)

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Check access: owner or assigned developer
    if (!isInternal) {
      const assignments = await db.select().from(taskAssignments)
        .where(eq(taskAssignments.taskId, parseInt(id)))

      const userAssignment = assignments.find(a => a.userId === userId)
      if (!userAssignment) {
        return res.status(403).json({ error: 'Forbidden: Not assigned to this task' })
      }
    }

    const updateData: any = { updatedAt: new Date() }
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status) {
      updateData.status = status
      // Auto-clear blockedReason if moving out of blocked status
      if (status !== 'blocked' && task.status === 'blocked') {
        updateData.blockedReason = null
      }
    }
    if (priority !== undefined) updateData.priority = priority
    if (type) updateData.type = type
    if (req.body.storyPoints !== undefined) updateData.storyPoints = req.body.storyPoints
    if (req.body.sprintId !== undefined) updateData.sprintId = req.body.sprintId

    // New fields
    if (estimate !== undefined) updateData.estimate = estimate
    if (actualTime !== undefined) updateData.actualTime = actualTime
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (labels !== undefined) updateData.labels = labels
    if (blockedReason !== undefined) updateData.blockedReason = blockedReason
    if (reporterId !== undefined) updateData.reporterId = reporterId

    // Bug-specific
    if (severity !== undefined) updateData.severity = severity
    if (environment !== undefined) updateData.environment = environment

    // Flexible metadata (merge with existing)
    if (metadata !== undefined) {
      updateData.metadata = metadata === null ? null : {
        ...(task.metadata as object || {}),
        ...metadata
      }
    }

    const [updated] = await db.update(devTasks)
      .set(updateData)
      .where(eq(devTasks.id, parseInt(id)))
      .returning()

    res.json({ task: updated })
  } catch (error) {
    console.error('Update task error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Assign developers to task (owner only)
taskRoutes.post('/:id/assign', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { userIds } = req.body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' })
    }

    const [task] = await db.select().from(devTasks)
      .where(eq(devTasks.id, parseInt(id)))
      .limit(1)

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Remove existing assignments
    await db.delete(taskAssignments)
      .where(eq(taskAssignments.taskId, parseInt(id)))

    // Add new assignments
    for (const userId of userIds) {
      await db.insert(taskAssignments).values({
        tenantId: task.tenantId,
        taskId: parseInt(id),
        userId,
      })
    }

    res.json({ success: true, message: 'Developers assigned successfully' })
  } catch (error) {
    console.error('Assign task error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create dev task from support ticket (owner only)
// This creates a dev task with role assignments (implementor, developer, tester)
// and automatically assigns the implementor to the support ticket, moving it to in_progress
taskRoutes.post('/from-support-ticket/:ticketId', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!
    const { ticketId } = req.params
    const {
      title, description, type,
      // Role assignments
      implementorId, developerId, testerId,
      // Product structure (optional)
      moduleId, componentId, addonId,
      // Optional feature link
      featureId,
      // Bug-specific
      severity, environment,
    } = req.body

    // Validate required fields
    if (!implementorId || !developerId || !testerId) {
      return res.status(400).json({ error: 'implementorId, developerId, and testerId are required' })
    }

    // Verify ticket exists (ticketId is a nanoUUID string)
    const [ticket] = await db.select().from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Get productId from ticket
    const productId = ticket.productId

    const taskType = type || 'bug'
    const { key: issueKey } = await generateIssueKey(productId, taskType === 'bug' ? 'bug' : 'task')

    // Create dev task with role assignments
    const [task] = await db.insert(devTasks).values({
      tenantId,
      productId,
      featureId: featureId || null,
      issueKey,
      title: title || `Fix: ${ticket.title}`,
      description: description || ticket.description || '',
      type: taskType,
      status: 'todo',
      priority: ticket.internalPriority || ticket.clientPriority || 3,
      createdBy: userId,
      reporterId: ticket.reporterId || ticket.createdBy,
      // Role assignments
      implementorId,
      developerId,
      testerId,
      // Product structure
      moduleId: moduleId || null,
      componentId: componentId || null,
      addonId: addonId || null,
      // Direct link to support ticket
      supportTicketId: ticketId,
      // Bug-specific
      severity: taskType === 'bug' ? (severity || 'major') : null,
      environment: taskType === 'bug' ? (environment || 'production') : null,
    }).returning()

    // Link ticket to task via join table
    await db.insert(supportTicketTasks).values({
      tenantId,
      ticketId,
      taskId: task.id,
    })

    // Auto-assign implementor to support ticket and move to in_progress
    await db.update(tickets)
      .set({
        assignedTo: implementorId,
        status: 'in_progress',
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId))

    res.status(201).json({ task, message: 'Dev task created and ticket assigned to implementor' })
  } catch (error) {
    console.error('Create dev task from ticket error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Legacy: Spawn task from support ticket (kept for backwards compatibility)
taskRoutes.post('/spawn-from-ticket/:ticketId', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!
    const { ticketId } = req.params
    const { featureId, title, description, type, severity, environment } = req.body

    if (!featureId) {
      return res.status(400).json({ error: 'featureId is required' })
    }

    // Verify ticket exists (ticketId is a nanoUUID string)
    const [ticket] = await db.select().from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1)

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Get productId via feature -> epic for issueKey generation
    const [feature] = await db.select({ epicId: features.epicId })
      .from(features).where(eq(features.id, featureId)).limit(1)
    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' })
    }
    const [epic] = await db.select({ productId: epics.productId })
      .from(epics).where(eq(epics.id, feature.epicId)).limit(1)
    if (!epic) {
      return res.status(404).json({ error: 'Epic not found' })
    }

    const taskType = type || 'bug'
    const { key: issueKey } = await generateIssueKey(epic.productId, taskType === 'bug' ? 'bug' : 'task')

    // Create dev task
    const [task] = await db.insert(devTasks).values({
      tenantId,
      productId: epic.productId,
      featureId,
      issueKey,
      title: title || `Bug from ticket: ${ticket.title}`,
      description: description || ticket.description || '',
      type: taskType,
      status: 'todo',
      priority: ticket.internalPriority || ticket.clientPriority || 3,
      createdBy: userId,
      reporterId: ticket.reporterId || ticket.createdBy,
      supportTicketId: ticketId,
      severity: taskType === 'bug' ? (severity || 'major') : null,
      environment: taskType === 'bug' ? (environment || 'production') : null,
    }).returning()

    // Link ticket to task
    await db.insert(supportTicketTasks).values({
      tenantId,
      ticketId,
      taskId: task.id,
    })

    res.status(201).json({ task })
  } catch (error) {
    console.error('Spawn task from ticket error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Assign task to sprint (owner only)
taskRoutes.patch('/:id/sprint', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { sprintId } = req.body // null to move to backlog

    const [task] = await db.select().from(devTasks)
      .where(eq(devTasks.id, parseInt(id)))
      .limit(1)

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const [updated] = await db.update(devTasks)
      .set({ sprintId: sprintId ?? null, updatedAt: new Date() })
      .where(eq(devTasks.id, parseInt(id)))
      .returning()

    res.json({ task: updated })
  } catch (error) {
    console.error('Assign sprint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Set story points (owner only)
taskRoutes.patch('/:id/points', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { storyPoints } = req.body

    // Validate Fibonacci
    const validPoints = [1, 2, 3, 5, 8, 13]
    if (storyPoints !== null && !validPoints.includes(storyPoints)) {
      return res.status(400).json({ error: 'Story points must be Fibonacci: 1, 2, 3, 5, 8, or 13' })
    }

    const [task] = await db.select().from(devTasks)
      .where(eq(devTasks.id, parseInt(id)))
      .limit(1)

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const [updated] = await db.update(devTasks)
      .set({ storyPoints, updatedAt: new Date() })
      .where(eq(devTasks.id, parseInt(id)))
      .returning()

    res.json({ task: updated })
  } catch (error) {
    console.error('Set points error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete task (owner only)
taskRoutes.delete('/:id', requireInternal, async (req, res) => {
  try {
    const { id } = req.params

    const [task] = await db.select().from(devTasks)
      .where(eq(devTasks.id, parseInt(id)))
      .limit(1)

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Delete task assignments first
    await db.delete(taskAssignments).where(eq(taskAssignments.taskId, parseInt(id)))
    // Delete the task
    await db.delete(devTasks).where(eq(devTasks.id, parseInt(id)))

    res.json({ success: true, message: `Task ${id} deleted` })
  } catch (error) {
    console.error('Delete task error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Close task with resolution
taskRoutes.patch('/:id/close', async (req, res) => {
  try {
    const { id } = req.params
    const { resolution, resolutionNote, metadata } = req.body
    const { userId, isInternal } = req.user!

    const validResolutions = ['completed', 'duplicate', 'wont_do', 'moved', 'invalid', 'obsolete', 'cannot_reproduce']
    if (!resolution || !validResolutions.includes(resolution)) {
      return res.status(400).json({
        error: 'Valid resolution required',
        validResolutions
      })
    }

    const [task] = await db.select().from(devTasks)
      .where(eq(devTasks.id, parseInt(id)))
      .limit(1)

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Check access: owner or assigned developer
    if (!isInternal) {
      const assignments = await db.select().from(taskAssignments)
        .where(eq(taskAssignments.taskId, parseInt(id)))

      const userAssignment = assignments.find(a => a.userId === userId)
      if (!userAssignment) {
        return res.status(403).json({ error: 'Forbidden: Not assigned to this task' })
      }
    }

    // Merge metadata if provided (for code stats like linesAdded, linesDeleted)
    const updatedMetadata = metadata ? {
      ...(task.metadata as object || {}),
      ...metadata
    } : task.metadata

    const [updated] = await db.update(devTasks)
      .set({
        status: 'done',
        resolution,
        resolutionNote: resolutionNote || null,
        metadata: updatedMetadata,
        closedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(devTasks.id, parseInt(id)))
      .returning()

    res.json({ task: updated })
  } catch (error) {
    console.error('Close task error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// List all dev tasks with full details (for DevTasks page)
taskRoutes.get('/all', requireInternal, async (req, res) => {
  try {
    const { tenantId, userId } = req.user!

    // Raw query to get all tasks with joined data
    const tasksWithDetails = await db
      .select({
        id: devTasks.id,
        tenantId: devTasks.tenantId,
        productId: devTasks.productId,
        featureId: devTasks.featureId,
        issueKey: devTasks.issueKey,
        title: devTasks.title,
        description: devTasks.description,
        type: devTasks.type,
        status: devTasks.status,
        priority: devTasks.priority,
        storyPoints: devTasks.storyPoints,
        implementorId: devTasks.implementorId,
        developerId: devTasks.developerId,
        testerId: devTasks.testerId,
        moduleId: devTasks.moduleId,
        componentId: devTasks.componentId,
        addonId: devTasks.addonId,
        supportTicketId: devTasks.supportTicketId,
        severity: devTasks.severity,
        environment: devTasks.environment,
        labels: devTasks.labels,
        dueDate: devTasks.dueDate,
        createdAt: devTasks.createdAt,
        updatedAt: devTasks.updatedAt,
        // Product info
        productName: products.name,
        productCode: products.code,
        // Module info
        moduleName: modules.name,
        // Component info
        componentName: components.name,
        // Addon info
        addonName: addons.name,
      })
      .from(devTasks)
      .leftJoin(products, eq(devTasks.productId, products.id))
      .leftJoin(modules, eq(devTasks.moduleId, modules.id))
      .leftJoin(components, eq(devTasks.componentId, components.id))
      .leftJoin(addons, eq(devTasks.addonId, addons.id))
      .where(eq(devTasks.tenantId, tenantId))
      .orderBy(desc(devTasks.createdAt))

    // Get user details for implementor, developer, tester
    const userIds = new Set<number>()
    tasksWithDetails.forEach(t => {
      if (t.implementorId) userIds.add(t.implementorId)
      if (t.developerId) userIds.add(t.developerId)
      if (t.testerId) userIds.add(t.testerId)
    })

    const userMap: Record<number, { name: string; email: string }> = {}
    if (userIds.size > 0) {
      const usersList = await db.select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(inArray(users.id, Array.from(userIds)))
      usersList.forEach(u => {
        userMap[u.id] = { name: u.name, email: u.email }
      })
    }

    // Get support ticket details
    const ticketIds = tasksWithDetails.filter(t => t.supportTicketId).map(t => t.supportTicketId!)
    const ticketMap: Record<string, { issueKey: string; title: string; status: string }> = {}
    if (ticketIds.length > 0) {
      const ticketsList = await db.select({
        id: tickets.id,
        issueKey: tickets.issueKey,
        title: tickets.title,
        status: tickets.status
      })
        .from(tickets)
        .where(inArray(tickets.id, ticketIds))
      ticketsList.forEach(t => {
        if (t.id !== null) {
          ticketMap[t.id] = { issueKey: t.issueKey ?? '', title: t.title ?? '', status: t.status ?? 'open' }
        }
      })
    }

    // Combine all data
    const enrichedTasks = tasksWithDetails.map(task => ({
      ...task,
      implementorName: task.implementorId ? userMap[task.implementorId]?.name : null,
      developerName: task.developerId ? userMap[task.developerId]?.name : null,
      testerName: task.testerId ? userMap[task.testerId]?.name : null,
      supportTicket: task.supportTicketId ? ticketMap[task.supportTicketId] : null,
    }))

    res.json({ tasks: enrichedTasks, currentUserId: userId })
  } catch (error) {
    console.error('List all tasks error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single task by ID (must be after /all, /my-tasks, etc. to avoid matching those as :id)
taskRoutes.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [task] = await db.select({
      id: devTasks.id,
      issueKey: devTasks.issueKey,
      title: devTasks.title,
      description: devTasks.description,
      type: devTasks.type,
      status: devTasks.status,
      priority: devTasks.priority,
      storyPoints: devTasks.storyPoints,
      estimate: devTasks.estimate,
      actualTime: devTasks.actualTime,
      dueDate: devTasks.dueDate,
      labels: devTasks.labels,
      blockedReason: devTasks.blockedReason,
      severity: devTasks.severity,
      environment: devTasks.environment,
      supportTicketId: devTasks.supportTicketId,
      productId: devTasks.productId,
      moduleId: devTasks.moduleId,
      componentId: devTasks.componentId,
      addonId: devTasks.addonId,
      implementorId: devTasks.implementorId,
      developerId: devTasks.developerId,
      testerId: devTasks.testerId,
      createdAt: devTasks.createdAt,
      updatedAt: devTasks.updatedAt,
    }).from(devTasks).where(eq(devTasks.id, parseInt(id))).limit(1)

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Fetch related info
    const [product] = task.productId
      ? await db.select({ name: products.name, code: products.code }).from(products).where(eq(products.id, task.productId)).limit(1)
      : [null]

    const [module] = task.moduleId
      ? await db.select({ name: modules.name }).from(modules).where(eq(modules.id, task.moduleId)).limit(1)
      : [null]

    const [component] = task.componentId
      ? await db.select({ name: components.name }).from(components).where(eq(components.id, task.componentId)).limit(1)
      : [null]

    const [addon] = task.addonId
      ? await db.select({ name: addons.name }).from(addons).where(eq(addons.id, task.addonId)).limit(1)
      : [null]

    // Fetch assignees
    const [implementor] = task.implementorId
      ? await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, task.implementorId)).limit(1)
      : [null]

    const [developer] = task.developerId
      ? await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, task.developerId)).limit(1)
      : [null]

    const [tester] = task.testerId
      ? await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, task.testerId)).limit(1)
      : [null]

    // Fetch source support ticket if linked
    let supportTicket = null
    if (task.supportTicketId) {
      const [ticket] = await db.select({
        id: tickets.id,
        issueKey: tickets.issueKey,
        title: tickets.title,
        status: tickets.status,
      }).from(tickets).where(eq(tickets.id, task.supportTicketId)).limit(1)
      supportTicket = ticket || null
    }

    res.json({
      ...task,
      productName: product?.name || null,
      productCode: product?.code || null,
      moduleName: module?.name || null,
      componentName: component?.name || null,
      addonName: addon?.name || null,
      implementorName: implementor?.name || null,
      implementorEmail: implementor?.email || null,
      developerName: developer?.name || null,
      developerEmail: developer?.email || null,
      testerName: tester?.name || null,
      testerEmail: tester?.email || null,
      supportTicket,
    })
  } catch (error) {
    console.error('Get task error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
