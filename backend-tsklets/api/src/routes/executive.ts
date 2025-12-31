import { Router } from 'express'
import { db } from '../db/index.js'
import { epics, features, devTasks, sprints, users, products, taskAssignments } from '../db/schema.js'
import { eq, desc, sql, and, or, lt, isNotNull, inArray } from 'drizzle-orm'
import { authenticate, requireInternal } from '../middleware/auth.js'

export const executiveRoutes = Router()

// All executive routes require authentication and internal access
executiveRoutes.use(authenticate)
executiveRoutes.use(requireInternal)

// GET /api/executive/dashboard - Cross-product metrics aggregation
executiveRoutes.get('/dashboard', async (req, res) => {
  try {
    const { tenantId } = req.user!

    // Get task statistics
    const taskStats = await db.select({
      totalTasks: sql<number>`count(*)::int`,
      completedTasks: sql<number>`count(*) filter (where ${devTasks.status} = 'done')::int`,
      todoTasks: sql<number>`count(*) filter (where ${devTasks.status} = 'todo')::int`,
      inProgressTasks: sql<number>`count(*) filter (where ${devTasks.status} = 'in_progress')::int`,
      reviewTasks: sql<number>`count(*) filter (where ${devTasks.status} = 'review')::int`,
      blockedTasks: sql<number>`count(*) filter (where ${devTasks.status} = 'blocked')::int`,
      totalStoryPoints: sql<number>`coalesce(sum(${devTasks.storyPoints}), 0)::int`,
      completedPoints: sql<number>`coalesce(sum(${devTasks.storyPoints}) filter (where ${devTasks.status} = 'done'), 0)::int`,
      criticalBugs: sql<number>`count(*) filter (where ${devTasks.type} = 'bug' and ${devTasks.severity} = 'critical' and ${devTasks.status} != 'done')::int`,
      majorBugs: sql<number>`count(*) filter (where ${devTasks.type} = 'bug' and ${devTasks.severity} = 'major' and ${devTasks.status} != 'done')::int`,
    }).from(devTasks)
      .where(eq(devTasks.tenantId, tenantId))

    // Get active sprints count
    const activeSprintsResult = await db.select({
      count: sql<number>`count(*)::int`
    }).from(sprints)
      .where(and(
        eq(sprints.tenantId, tenantId),
        eq(sprints.status, 'active')
      ))

    // Calculate average velocity from completed sprints
    const velocityResult = await db.select({
      avgVelocity: sql<number>`coalesce(avg(${sprints.velocity}), 0)::int`
    }).from(sprints)
      .where(and(
        eq(sprints.tenantId, tenantId),
        eq(sprints.status, 'completed'),
        isNotNull(sprints.velocity)
      ))

    // Get overdue items (tasks with dueDate < now and not done)
    const overdueResult = await db.select({
      count: sql<number>`count(*)::int`
    }).from(devTasks)
      .where(and(
        eq(devTasks.tenantId, tenantId),
        lt(devTasks.dueDate, new Date()),
        sql`${devTasks.status} != 'done'`
      ))

    // Get epic statistics
    const epicStats = await db.select({
      totalEpics: sql<number>`count(*)::int`,
      completedEpics: sql<number>`count(*) filter (where ${epics.status} = 'completed')::int`,
      inProgressEpics: sql<number>`count(*) filter (where ${epics.status} = 'in_progress')::int`,
    }).from(epics)
      .where(eq(epics.tenantId, tenantId))

    // Get feature statistics
    const featureStats = await db.select({
      totalFeatures: sql<number>`count(*)::int`,
      completedFeatures: sql<number>`count(*) filter (where ${features.status} = 'completed')::int`,
      inProgressFeatures: sql<number>`count(*) filter (where ${features.status} = 'in_progress')::int`,
    }).from(features)
      .where(eq(features.tenantId, tenantId))

    const stats = taskStats[0]
    const activeSprintsCount = activeSprintsResult[0]?.count || 0
    const avgVelocity = velocityResult[0]?.avgVelocity || 0
    const overdueCount = overdueResult[0]?.count || 0
    const epicStat = epicStats[0]
    const featureStat = featureStats[0]

    res.json({
      metrics: {
        // Task metrics
        totalTasks: stats?.totalTasks || 0,
        completedTasks: stats?.completedTasks || 0,
        todoTasks: stats?.todoTasks || 0,
        inProgressTasks: stats?.inProgressTasks || 0,
        reviewTasks: stats?.reviewTasks || 0,
        blockedTasks: stats?.blockedTasks || 0,
        // Story points
        totalStoryPoints: stats?.totalStoryPoints || 0,
        completedPoints: stats?.completedPoints || 0,
        // Sprint metrics
        activeSprintCount: activeSprintsCount,
        avgVelocity: avgVelocity,
        // Risks
        openBlockers: stats?.blockedTasks || 0,
        criticalBugs: stats?.criticalBugs || 0,
        majorBugs: stats?.majorBugs || 0,
        overdueItems: overdueCount,
        // Epic/Feature overview
        totalEpics: epicStat?.totalEpics || 0,
        completedEpics: epicStat?.completedEpics || 0,
        inProgressEpics: epicStat?.inProgressEpics || 0,
        totalFeatures: featureStat?.totalFeatures || 0,
        completedFeatures: featureStat?.completedFeatures || 0,
        inProgressFeatures: featureStat?.inProgressFeatures || 0,
      },
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Executive dashboard error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/executive/velocity-trend - Last 6 sprints velocity data
executiveRoutes.get('/velocity-trend', async (req, res) => {
  try {
    const { tenantId } = req.user!

    // Get last 6 completed sprints with their task stats
    const completedSprints = await db.select({
      id: sprints.id,
      name: sprints.name,
      velocity: sprints.velocity,
      startDate: sprints.startDate,
      endDate: sprints.endDate,
    }).from(sprints)
      .where(and(
        eq(sprints.tenantId, tenantId),
        eq(sprints.status, 'completed')
      ))
      .orderBy(desc(sprints.endDate))
      .limit(6)

    // For each sprint, calculate planned vs completed points
    const velocityData = await Promise.all(
      completedSprints.reverse().map(async (sprint) => {
        const sprintTasks = await db.select({
          plannedPoints: sql<number>`coalesce(sum(${devTasks.storyPoints}), 0)::int`,
          completedPoints: sql<number>`coalesce(sum(${devTasks.storyPoints}) filter (where ${devTasks.status} = 'done'), 0)::int`,
        }).from(devTasks)
          .where(eq(devTasks.sprintId, sprint.id))

        return {
          sprintId: sprint.id,
          sprintName: sprint.name,
          velocity: sprint.velocity || sprintTasks[0]?.completedPoints || 0,
          plannedPoints: sprintTasks[0]?.plannedPoints || 0,
          completedPoints: sprintTasks[0]?.completedPoints || 0,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
        }
      })
    )

    res.json({ velocityTrend: velocityData })
  } catch (error) {
    console.error('Velocity trend error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/executive/team-productivity - Tasks per developer
executiveRoutes.get('/team-productivity', async (req, res) => {
  try {
    const { tenantId } = req.user!

    // Get developers with task counts
    const devUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    }).from(users)
      .where(and(
        eq(users.tenantId, tenantId),
        eq(users.role, 'developer'),
        eq(users.isActive, true)
      ))

    // For each developer, get their productivity stats
    const productivity = await Promise.all(
      devUsers.map(async (user) => {
        // Get assigned tasks stats
        const assignedTasks = await db.select({
          taskId: taskAssignments.taskId,
        }).from(taskAssignments)
          .where(and(
            eq(taskAssignments.tenantId, tenantId),
            eq(taskAssignments.userId, user.id)
          ))

        const taskIds = assignedTasks.map(t => t.taskId)

        if (taskIds.length === 0) {
          return {
            userId: user.id,
            name: user.name,
            email: user.email,
            tasksAssigned: 0,
            tasksCompleted: 0,
            storyPoints: 0,
            completedPoints: 0,
            inProgress: 0,
            linesAdded: 0,
            linesDeleted: 0,
          }
        }

        // Get stats for assigned tasks
        const taskStats = await db.select({
          tasksAssigned: sql<number>`count(*)::int`,
          tasksCompleted: sql<number>`count(*) filter (where ${devTasks.status} = 'done')::int`,
          inProgress: sql<number>`count(*) filter (where ${devTasks.status} = 'in_progress')::int`,
          storyPoints: sql<number>`coalesce(sum(${devTasks.storyPoints}), 0)::int`,
          completedPoints: sql<number>`coalesce(sum(${devTasks.storyPoints}) filter (where ${devTasks.status} = 'done'), 0)::int`,
        }).from(devTasks)
          .where(inArray(devTasks.id, taskIds))

        // Extract code stats from metadata (if tracked)
        const tasksWithMeta = await db.select({
          metadata: devTasks.metadata,
        }).from(devTasks)
          .where(and(
            inArray(devTasks.id, taskIds),
            isNotNull(devTasks.metadata)
          ))

        let linesAdded = 0
        let linesDeleted = 0
        tasksWithMeta.forEach(t => {
          const meta = t.metadata as any
          if (meta?.linesAdded) linesAdded += meta.linesAdded
          if (meta?.linesDeleted) linesDeleted += meta.linesDeleted
        })

        const stats = taskStats[0]
        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          tasksAssigned: stats?.tasksAssigned || 0,
          tasksCompleted: stats?.tasksCompleted || 0,
          storyPoints: stats?.storyPoints || 0,
          completedPoints: stats?.completedPoints || 0,
          inProgress: stats?.inProgress || 0,
          linesAdded,
          linesDeleted,
        }
      })
    )

    // Sort by completed tasks descending
    productivity.sort((a, b) => b.tasksCompleted - a.tasksCompleted)

    res.json({ teamProductivity: productivity })
  } catch (error) {
    console.error('Team productivity error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/executive/blockers - All blocked tasks with reasons
executiveRoutes.get('/blockers', async (req, res) => {
  try {
    const { tenantId } = req.user!

    // Get all blocked tasks with feature and epic info
    const blockedTasks = await db.select({
      id: devTasks.id,
      issueKey: devTasks.issueKey,
      title: devTasks.title,
      type: devTasks.type,
      severity: devTasks.severity,
      blockedReason: devTasks.blockedReason,
      createdAt: devTasks.createdAt,
      updatedAt: devTasks.updatedAt,
      featureId: devTasks.featureId,
    }).from(devTasks)
      .where(and(
        eq(devTasks.tenantId, tenantId),
        eq(devTasks.status, 'blocked')
      ))
      .orderBy(desc(devTasks.updatedAt))

    // Enrich with feature and epic names
    const enrichedBlockers = await Promise.all(
      blockedTasks.map(async (task) => {
        const featureData = await db.select({
          title: features.title,
          epicId: features.epicId,
        }).from(features)
          .where(eq(features.id, task.featureId))
          .limit(1)

        let epicName = null
        if (featureData[0]?.epicId) {
          const epicData = await db.select({
            title: epics.title,
          }).from(epics)
            .where(eq(epics.id, featureData[0].epicId))
            .limit(1)
          epicName = epicData[0]?.title
        }

        // Calculate days blocked
        const updatedAt = new Date(task.updatedAt!)
        const daysBlocked = Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24))

        return {
          taskId: task.id,
          issueKey: task.issueKey,
          title: task.title,
          type: task.type,
          severity: task.severity,
          blockedReason: task.blockedReason,
          featureName: featureData[0]?.title || null,
          epicName,
          daysBlocked,
          updatedAt: task.updatedAt,
        }
      })
    )

    // Get overdue items
    const overdueItems = await db.select({
      id: devTasks.id,
      issueKey: devTasks.issueKey,
      title: devTasks.title,
      type: devTasks.type,
      dueDate: devTasks.dueDate,
      status: devTasks.status,
    }).from(devTasks)
      .where(and(
        eq(devTasks.tenantId, tenantId),
        lt(devTasks.dueDate, new Date()),
        sql`${devTasks.status} != 'done'`
      ))
      .orderBy(devTasks.dueDate)

    // Get critical/major bugs
    const criticalBugs = await db.select({
      id: devTasks.id,
      issueKey: devTasks.issueKey,
      title: devTasks.title,
      severity: devTasks.severity,
      status: devTasks.status,
      createdAt: devTasks.createdAt,
    }).from(devTasks)
      .where(and(
        eq(devTasks.tenantId, tenantId),
        eq(devTasks.type, 'bug'),
        or(
          eq(devTasks.severity, 'critical'),
          eq(devTasks.severity, 'major')
        ),
        sql`${devTasks.status} != 'done'`
      ))
      .orderBy(desc(devTasks.createdAt))

    res.json({
      blockedTasks: enrichedBlockers,
      overdueItems,
      criticalBugs,
    })
  } catch (error) {
    console.error('Blockers error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/executive/roadmap - Epics/Features with timeline data
executiveRoutes.get('/roadmap', async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { productId } = req.query

    // Build where clause
    const whereClause = productId
      ? and(eq(epics.tenantId, tenantId), eq(epics.productId, parseInt(productId as string)))
      : eq(epics.tenantId, tenantId)

    // Get epics with their features
    const epicList = await db.select({
      id: epics.id,
      issueKey: epics.issueKey,
      title: epics.title,
      description: epics.description,
      status: epics.status,
      priority: epics.priority,
      progress: epics.progress,
      color: epics.color,
      startDate: epics.startDate,
      targetDate: epics.targetDate,
      productId: epics.productId,
    }).from(epics)
      .where(whereClause)
      .orderBy(epics.priority, epics.createdAt)

    // Enrich epics with features and calculate progress
    const roadmapData = await Promise.all(
      epicList.map(async (epic) => {
        // Get features for this epic
        const featureList = await db.select({
          id: features.id,
          issueKey: features.issueKey,
          title: features.title,
          status: features.status,
          priority: features.priority,
          estimate: features.estimate,
          startDate: features.startDate,
          targetDate: features.targetDate,
        }).from(features)
          .where(eq(features.epicId, epic.id))
          .orderBy(features.priority, features.createdAt)

        // Calculate feature progress based on tasks
        const enrichedFeatures = await Promise.all(
          featureList.map(async (feature) => {
            const taskStats = await db.select({
              total: sql<number>`count(*)::int`,
              completed: sql<number>`count(*) filter (where ${devTasks.status} = 'done')::int`,
            }).from(devTasks)
              .where(eq(devTasks.featureId, feature.id))

            const total = taskStats[0]?.total || 0
            const completed = taskStats[0]?.completed || 0
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0

            return {
              ...feature,
              progress,
              taskCount: total,
              completedTasks: completed,
            }
          })
        )

        // Calculate epic progress from features
        const totalFeatures = enrichedFeatures.length
        const completedFeatures = enrichedFeatures.filter(f => f.status === 'completed').length
        const avgProgress = totalFeatures > 0
          ? Math.round(enrichedFeatures.reduce((sum, f) => sum + f.progress, 0) / totalFeatures)
          : (epic.progress || 0)

        // Get product name
        const productData = await db.select({
          name: products.name,
          code: products.code,
        }).from(products)
          .where(eq(products.id, epic.productId))
          .limit(1)

        return {
          id: epic.id,
          type: 'epic' as const,
          issueKey: epic.issueKey,
          title: epic.title,
          description: epic.description,
          status: epic.status,
          priority: epic.priority,
          progress: avgProgress,
          color: epic.color,
          startDate: epic.startDate,
          targetDate: epic.targetDate,
          productId: epic.productId,
          productName: productData[0]?.name,
          productCode: productData[0]?.code,
          features: enrichedFeatures,
          featureCount: totalFeatures,
          completedFeatures,
        }
      })
    )

    res.json({ roadmap: roadmapData })
  } catch (error) {
    console.error('Roadmap error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/executive/products - Product summary with progress
executiveRoutes.get('/products', async (req, res) => {
  try {
    const { tenantId } = req.user!

    const productList = await db.select({
      id: products.id,
      name: products.name,
      code: products.code,
      description: products.description,
    }).from(products)
      .where(eq(products.tenantId, tenantId))

    const productSummary = await Promise.all(
      productList.map(async (product) => {
        // Get epic stats for this product
        const epicStats = await db.select({
          total: sql<number>`count(*)::int`,
          completed: sql<number>`count(*) filter (where ${epics.status} = 'completed')::int`,
          inProgress: sql<number>`count(*) filter (where ${epics.status} = 'in_progress')::int`,
        }).from(epics)
          .where(eq(epics.productId, product.id))

        // Get all feature IDs for this product's epics
        const productEpics = await db.select({ id: epics.id })
          .from(epics)
          .where(eq(epics.productId, product.id))

        const epicIds = productEpics.map(e => e.id)

        let taskStats = { total: 0, completed: 0 }
        if (epicIds.length > 0) {
          const productFeatures = await db.select({ id: features.id })
            .from(features)
            .where(inArray(features.epicId, epicIds))

          const featureIds = productFeatures.map(f => f.id)

          if (featureIds.length > 0) {
            const stats = await db.select({
              total: sql<number>`count(*)::int`,
              completed: sql<number>`count(*) filter (where ${devTasks.status} = 'done')::int`,
            }).from(devTasks)
              .where(inArray(devTasks.featureId, featureIds))

            taskStats = stats[0] || { total: 0, completed: 0 }
          }
        }

        const progress = taskStats.total > 0
          ? Math.round((taskStats.completed / taskStats.total) * 100)
          : 0

        return {
          id: product.id,
          name: product.name,
          code: product.code,
          description: product.description,
          epicCount: epicStats[0]?.total || 0,
          completedEpics: epicStats[0]?.completed || 0,
          inProgressEpics: epicStats[0]?.inProgress || 0,
          totalTasks: taskStats.total,
          completedTasks: taskStats.completed,
          progress,
        }
      })
    )

    res.json({ products: productSummary })
  } catch (error) {
    console.error('Products summary error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
