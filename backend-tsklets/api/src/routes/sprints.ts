import { Router } from 'express'
import { db } from '../db/index.js'
import { sprints, sprintRetros, sprintCapacity, devTasks, taskAssignments, users } from '../db/schema.js'
import { eq, isNull, desc, and, inArray } from 'drizzle-orm'
import { authenticate, requireInternal } from '../middleware/auth.js'

export const sprintRoutes = Router()

// All sprint routes require authentication
sprintRoutes.use(authenticate)

// Helper: Generate sprint name from date (e.g., "Jan-I-26")
function generateSprintName(startDate: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[startDate.getMonth()]
  const half = startDate.getDate() <= 15 ? 'I' : 'II'
  const year = String(startDate.getFullYear()).slice(-2)
  return `${month}-${half}-${year}`
}

// Helper: Calculate end date (2 weeks from start)
function calculateEndDate(startDate: Date): Date {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 13) // 14 days total (inclusive)
  return endDate
}

// ============================================
// SPRINT CRUD
// ============================================

// List all sprints
sprintRoutes.get('/', requireInternal, async (req, res) => {
  try {
    const { status } = req.query

    let query = db.select().from(sprints).orderBy(desc(sprints.startDate))

    if (status && typeof status === 'string') {
      const allSprints = await query
      const filtered = allSprints.filter(s => s.status === status)
      return res.json({ sprints: filtered })
    }

    const allSprints = await query
    res.json({ sprints: allSprints })
  } catch (error) {
    console.error('List sprints error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get active sprint
sprintRoutes.get('/active', requireInternal, async (req, res) => {
  try {
    const [sprint] = await db.select().from(sprints)
      .where(eq(sprints.status, 'active'))
      .limit(1)

    if (!sprint) {
      return res.json({ sprint: null })
    }

    // Get tasks for this sprint
    const tasks = await db.select().from(devTasks)
      .where(eq(devTasks.sprintId, sprint.id))

    res.json({ sprint, tasks })
  } catch (error) {
    console.error('Get active sprint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get sprint by ID with tasks and capacity
sprintRoutes.get('/:id', requireInternal, async (req, res) => {
  try {
    const { id } = req.params

    const [sprint] = await db.select().from(sprints)
      .where(eq(sprints.id, parseInt(id)))
      .limit(1)

    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' })
    }

    // Get tasks
    const tasks = await db.select().from(devTasks)
      .where(eq(devTasks.sprintId, sprint.id))

    // Get task assignments
    const taskIds = tasks.map(t => t.id)
    const assignments = taskIds.length > 0
      ? await db.select().from(taskAssignments).where(inArray(taskAssignments.taskId, taskIds))
      : []

    // Get capacity
    const capacities = await db.select().from(sprintCapacity)
      .where(eq(sprintCapacity.sprintId, sprint.id))

    res.json({ sprint, tasks, assignments, capacities })
  } catch (error) {
    console.error('Get sprint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create sprint
sprintRoutes.post('/', requireInternal, async (req, res) => {
  try {
    const { name, goal, startDate } = req.body

    if (!startDate) {
      return res.status(400).json({ error: 'startDate is required' })
    }

    const start = new Date(startDate)
    const end = calculateEndDate(start)
    const sprintName = name || generateSprintName(start)

    const [sprint] = await db.insert(sprints).values({
      name: sprintName,
      goal: goal || null,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      status: 'planning',
    }).returning()

    res.status(201).json({ sprint })
  } catch (error) {
    console.error('Create sprint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update sprint
sprintRoutes.patch('/:id', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { name, goal, startDate, endDate } = req.body

    const [sprint] = await db.select().from(sprints)
      .where(eq(sprints.id, parseInt(id)))
      .limit(1)

    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' })
    }

    const updateData: any = { updatedAt: new Date().toISOString() }
    if (name) updateData.name = name
    if (goal !== undefined) updateData.goal = goal
    if (startDate) updateData.startDate = startDate
    if (endDate) updateData.endDate = endDate

    const [updated] = await db.update(sprints)
      .set(updateData)
      .where(eq(sprints.id, parseInt(id)))
      .returning()

    res.json({ sprint: updated })
  } catch (error) {
    console.error('Update sprint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete sprint (only if planning)
sprintRoutes.delete('/:id', requireInternal, async (req, res) => {
  try {
    const { id } = req.params

    const [sprint] = await db.select().from(sprints)
      .where(eq(sprints.id, parseInt(id)))
      .limit(1)

    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' })
    }

    if (sprint.status !== 'planning') {
      return res.status(400).json({ error: 'Can only delete sprints in planning status' })
    }

    // Move tasks back to backlog
    await db.update(devTasks)
      .set({ sprintId: null })
      .where(eq(devTasks.sprintId, parseInt(id)))

    // Delete capacity records
    await db.delete(sprintCapacity).where(eq(sprintCapacity.sprintId, parseInt(id)))

    // Delete sprint
    await db.delete(sprints).where(eq(sprints.id, parseInt(id)))

    res.json({ success: true })
  } catch (error) {
    console.error('Delete sprint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// SPRINT LIFECYCLE
// ============================================

// Start sprint
sprintRoutes.post('/:id/start', requireInternal, async (req, res) => {
  try {
    const { id } = req.params

    // Check no other active sprint
    const [activeSprint] = await db.select().from(sprints)
      .where(eq(sprints.status, 'active'))
      .limit(1)

    if (activeSprint) {
      return res.status(400).json({ error: 'Another sprint is already active. Complete it first.' })
    }

    const [sprint] = await db.select().from(sprints)
      .where(eq(sprints.id, parseInt(id)))
      .limit(1)

    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' })
    }

    if (sprint.status !== 'planning') {
      return res.status(400).json({ error: 'Can only start sprints in planning status' })
    }

    const [updated] = await db.update(sprints)
      .set({ status: 'active', updatedAt: new Date().toISOString() })
      .where(eq(sprints.id, parseInt(id)))
      .returning()

    res.json({ sprint: updated })
  } catch (error) {
    console.error('Start sprint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Complete sprint
sprintRoutes.post('/:id/complete', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { moveIncompleteTo } = req.body // 'backlog' | 'next' | sprintId

    const [sprint] = await db.select().from(sprints)
      .where(eq(sprints.id, parseInt(id)))
      .limit(1)

    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' })
    }

    if (sprint.status !== 'active') {
      return res.status(400).json({ error: 'Can only complete active sprints' })
    }

    // Get all tasks in this sprint
    const tasks = await db.select().from(devTasks)
      .where(eq(devTasks.sprintId, parseInt(id)))

    // Calculate velocity (sum of story points for done tasks)
    const completedPoints = tasks
      .filter(t => t.status === 'done')
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0)

    // Get incomplete tasks
    const incompleteTasks = tasks.filter(t => t.status !== 'done')

    // Move incomplete tasks
    if (incompleteTasks.length > 0) {
      let targetSprintId: number | null = null

      if (moveIncompleteTo === 'next') {
        // Find next planning sprint
        const [nextSprint] = await db.select().from(sprints)
          .where(eq(sprints.status, 'planning'))
          .orderBy(sprints.startDate)
          .limit(1)

        targetSprintId = nextSprint?.id || null
      } else if (typeof moveIncompleteTo === 'number') {
        targetSprintId = moveIncompleteTo
      }
      // else backlog (null)

      const incompleteIds = incompleteTasks.map(t => t.id)
      await db.update(devTasks)
        .set({ sprintId: targetSprintId })
        .where(inArray(devTasks.id, incompleteIds))
    }

    // Update sprint
    const [updated] = await db.update(sprints)
      .set({
        status: 'completed',
        velocity: completedPoints,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sprints.id, parseInt(id)))
      .returning()

    res.json({
      sprint: updated,
      stats: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'done').length,
        incompleteTasks: incompleteTasks.length,
        velocity: completedPoints,
      }
    })
  } catch (error) {
    console.error('Complete sprint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// CAPACITY
// ============================================

// Get capacity for sprint
sprintRoutes.get('/:id/capacity', requireInternal, async (req, res) => {
  try {
    const { id } = req.params

    const capacities = await db.select({
      id: sprintCapacity.id,
      sprintId: sprintCapacity.sprintId,
      userId: sprintCapacity.userId,
      availablePoints: sprintCapacity.availablePoints,
      userName: users.name,
      userEmail: users.email,
    })
      .from(sprintCapacity)
      .leftJoin(users, eq(sprintCapacity.userId, users.id))
      .where(eq(sprintCapacity.sprintId, parseInt(id)))

    res.json({ capacities })
  } catch (error) {
    console.error('Get capacity error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Set capacity for developer
sprintRoutes.post('/:id/capacity', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { userId, availablePoints } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }

    // Check if exists
    const [existing] = await db.select().from(sprintCapacity)
      .where(and(
        eq(sprintCapacity.sprintId, parseInt(id)),
        eq(sprintCapacity.userId, userId)
      ))
      .limit(1)

    if (existing) {
      // Update
      const [updated] = await db.update(sprintCapacity)
        .set({ availablePoints: availablePoints || 20 })
        .where(eq(sprintCapacity.id, existing.id))
        .returning()

      return res.json({ capacity: updated })
    }

    // Create
    const [capacity] = await db.insert(sprintCapacity).values({
      sprintId: parseInt(id),
      userId,
      availablePoints: availablePoints || 20,
    }).returning()

    res.status(201).json({ capacity })
  } catch (error) {
    console.error('Set capacity error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// RETROSPECTIVE
// ============================================

// Get retro
sprintRoutes.get('/:id/retro', requireInternal, async (req, res) => {
  try {
    const { id } = req.params

    const [retro] = await db.select().from(sprintRetros)
      .where(eq(sprintRetros.sprintId, parseInt(id)))
      .limit(1)

    res.json({ retro: retro || null })
  } catch (error) {
    console.error('Get retro error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create/update retro
sprintRoutes.post('/:id/retro', requireInternal, async (req, res) => {
  try {
    const { id } = req.params
    const { wentWell, improvements, actionItems } = req.body

    // Check if exists
    const [existing] = await db.select().from(sprintRetros)
      .where(eq(sprintRetros.sprintId, parseInt(id)))
      .limit(1)

    if (existing) {
      // Update
      const [updated] = await db.update(sprintRetros)
        .set({
          wentWell: wentWell ?? existing.wentWell,
          improvements: improvements ?? existing.improvements,
          actionItems: actionItems ?? existing.actionItems,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(sprintRetros.id, existing.id))
        .returning()

      return res.json({ retro: updated })
    }

    // Create
    const [retro] = await db.insert(sprintRetros).values({
      sprintId: parseInt(id),
      wentWell,
      improvements,
      actionItems,
    }).returning()

    res.status(201).json({ retro })
  } catch (error) {
    console.error('Save retro error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// BACKLOG
// ============================================

// Get backlog (tasks with no sprint)
sprintRoutes.get('/backlog/tasks', requireInternal, async (req, res) => {
  try {
    const tasks = await db.select().from(devTasks)
      .where(isNull(devTasks.sprintId))
      .orderBy(devTasks.priority, desc(devTasks.createdAt))

    // Get assignments for these tasks
    const taskIds = tasks.map(t => t.id)
    const assignments = taskIds.length > 0
      ? await db.select().from(taskAssignments).where(inArray(taskAssignments.taskId, taskIds))
      : []

    res.json({ tasks, assignments })
  } catch (error) {
    console.error('Get backlog error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// METRICS
// ============================================

// Get velocity history (last 6 completed sprints)
sprintRoutes.get('/metrics/velocity', requireInternal, async (req, res) => {
  try {
    const completedSprints = await db.select().from(sprints)
      .where(eq(sprints.status, 'completed'))
      .orderBy(desc(sprints.endDate))
      .limit(6)

    const velocityData = completedSprints.reverse().map(s => ({
      sprintId: s.id,
      name: s.name,
      velocity: s.velocity || 0,
      endDate: s.endDate,
    }))

    const avgVelocity = velocityData.length > 0
      ? Math.round(velocityData.reduce((sum, v) => sum + v.velocity, 0) / velocityData.length)
      : 0

    res.json({ velocityData, avgVelocity })
  } catch (error) {
    console.error('Get velocity error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get burndown data for sprint
sprintRoutes.get('/:id/burndown', requireInternal, async (req, res) => {
  try {
    const { id } = req.params

    const [sprint] = await db.select().from(sprints)
      .where(eq(sprints.id, parseInt(id)))
      .limit(1)

    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' })
    }

    // Get tasks
    const tasks = await db.select().from(devTasks)
      .where(eq(devTasks.sprintId, parseInt(id)))

    // Calculate total points
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
    const completedPoints = tasks
      .filter(t => t.status === 'done')
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0)
    const remainingPoints = totalPoints - completedPoints

    // Calculate ideal burndown
    const startDate = new Date(sprint.startDate)
    const endDate = new Date(sprint.endDate)
    const today = new Date()
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const elapsedDays = Math.min(
      Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      totalDays
    )

    const idealRemaining = Math.max(0, totalPoints - (totalPoints / totalDays) * elapsedDays)

    res.json({
      totalPoints,
      completedPoints,
      remainingPoints,
      idealRemaining: Math.round(idealRemaining),
      totalDays,
      elapsedDays,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
    })
  } catch (error) {
    console.error('Get burndown error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
