import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import VelocityChart from '../components/charts/VelocityChart'
import TaskDonutChart from '../components/charts/TaskDonutChart'
import { RoadmapProgress } from '../components/charts/ProgressBar'
import { useAuthStore } from '../store/auth'

interface DashboardMetrics {
  totalTasks: number
  completedTasks: number
  todoTasks: number
  inProgressTasks: number
  reviewTasks: number
  blockedTasks: number
  totalStoryPoints: number
  completedPoints: number
  activeSprintCount: number
  avgVelocity: number
  openBlockers: number
  criticalBugs: number
  majorBugs: number
  overdueItems: number
  totalEpics: number
  completedEpics: number
  inProgressEpics: number
  totalFeatures: number
  completedFeatures: number
  inProgressFeatures: number
}

interface VelocityTrend {
  sprintId: number
  sprintName: string
  velocity: number
  plannedPoints: number
  completedPoints: number
}

interface TeamMember {
  userId: number
  name: string
  email: string
  tasksAssigned: number
  tasksCompleted: number
  storyPoints: number
  completedPoints: number
  inProgress: number
  linesAdded: number
  linesDeleted: number
}

interface BlockedTask {
  taskId: number
  issueKey: string
  title: string
  type: string
  severity: string | null
  blockedReason: string | null
  featureName: string | null
  epicName: string | null
  daysBlocked: number
}

interface OverdueItem {
  id: number
  issueKey: string
  title: string
  type: string
  dueDate: string
  status: string
}

interface CriticalBug {
  id: number
  issueKey: string
  title: string
  severity: string
  status: string
  createdAt: string
}

interface ProductSummary {
  id: number
  name: string
  code: string
  epicCount: number
  completedEpics: number
  inProgressEpics: number
  totalTasks: number
  completedTasks: number
  progress: number
}

interface EpicData {
  id: number
  issueKey: string
  title: string
  status: string
  progress: number
  color: string | null
  targetDate: string | null
  featureCount: number
  completedFeatures: number
  productName: string
  productCode: string
}

export default function ExecutiveDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [velocityTrend, setVelocityTrend] = useState<VelocityTrend[]>([])
  const [teamProductivity, setTeamProductivity] = useState<TeamMember[]>([])
  const [blockedTasks, setBlockedTasks] = useState<BlockedTask[]>([])
  const [overdueItems, setOverdueItems] = useState<OverdueItem[]>([])
  const [criticalBugs, setCriticalBugs] = useState<CriticalBug[]>([])
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [epics, setEpics] = useState<EpicData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const { token } = useAuthStore()

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` }

      const [dashboardRes, velocityRes, teamRes, blockersRes, productsRes, roadmapRes] = await Promise.all([
        fetch('/api/executive/dashboard', { headers }),
        fetch('/api/executive/velocity-trend', { headers }),
        fetch('/api/executive/team-productivity', { headers }),
        fetch('/api/executive/blockers', { headers }),
        fetch('/api/executive/products', { headers }),
        fetch('/api/executive/roadmap', { headers }),
      ])

      const [dashboardData, velocityData, teamData, blockersData, productsData, roadmapData] = await Promise.all([
        dashboardRes.json(),
        velocityRes.json(),
        teamRes.json(),
        blockersRes.json(),
        productsRes.json(),
        roadmapRes.json(),
      ])

      setMetrics(dashboardData.metrics)
      setLastUpdated(dashboardData.lastUpdated)
      setVelocityTrend(velocityData.velocityTrend || [])
      setTeamProductivity(teamData.teamProductivity || [])
      setBlockedTasks(blockersData.blockedTasks || [])
      setOverdueItems(blockersData.overdueItems || [])
      setCriticalBugs(blockersData.criticalBugs || [])
      setProducts(productsData.products || [])
      setEpics(roadmapData.roadmap || [])
    } catch (err) {
      console.error('Failed to fetch executive data', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-800 border-t-primary mx-auto" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">monitoring</span>
              </span>
            </div>
            <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Loading Executive Dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  const taskDistribution = [
    { label: 'To Do', value: metrics?.todoTasks || 0, color: '#64748b' },
    { label: 'In Progress', value: metrics?.inProgressTasks || 0, color: '#3b82f6' },
    { label: 'Review', value: metrics?.reviewTasks || 0, color: '#f59e0b' },
    { label: 'Done', value: metrics?.completedTasks || 0, color: '#10b981' },
    { label: 'Blocked', value: metrics?.blockedTasks || 0, color: '#ef4444' },
  ]

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
                <span className="material-symbols-outlined text-[22px]">monitoring</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Executive Overview</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Real-time project health and metrics</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              <span>Updated {lastUpdated ? formatTime(lastUpdated) : 'now'}</span>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Refresh
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-6 max-w-[1800px] mx-auto"
          >
            {/* KPI Cards Row */}
            <motion.div variants={fadeInUp} className="grid grid-cols-4 gap-4">
              {/* Story Points Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Story Points</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                        {metrics?.completedPoints || 0}
                      </span>
                      <span className="text-lg text-slate-400 dark:text-slate-500">
                        / {metrics?.totalStoryPoints || 0}
                      </span>
                    </div>
                    <div className="mt-2 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${metrics?.totalStoryPoints ? (metrics.completedPoints / metrics.totalStoryPoints) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">analytics</span>
                  </div>
                </div>
              </div>

              {/* Active Sprints Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Sprints</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                        {metrics?.activeSprintCount || 0}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {metrics?.inProgressTasks || 0} tasks in progress
                    </p>
                  </div>
                  <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">sprint</span>
                  </div>
                </div>
              </div>

              {/* Blockers Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Open Blockers</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className={`text-3xl font-bold tabular-nums ${(metrics?.openBlockers || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        {metrics?.openBlockers || 0}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        {metrics?.criticalBugs || 0} critical
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {metrics?.majorBugs || 0} major
                      </span>
                    </div>
                  </div>
                  <div className={`size-10 rounded-lg flex items-center justify-center ${(metrics?.openBlockers || 0) > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <span className={`material-symbols-outlined ${(metrics?.openBlockers || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>block</span>
                  </div>
                </div>
              </div>

              {/* Velocity Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg Velocity</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                        {metrics?.avgVelocity || 0}
                      </span>
                      <span className="text-sm text-slate-400 dark:text-slate-500">pts/sprint</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {metrics?.overdueItems || 0} overdue items
                    </p>
                  </div>
                  <div className="size-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-violet-600 dark:text-violet-400">speed</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Charts Row */}
            <motion.div variants={fadeInUp} className="grid grid-cols-5 gap-6">
              {/* Velocity Trend Chart */}
              <div className="col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Velocity Trend</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Last 6 completed sprints</p>
                  </div>
                </div>
                <VelocityChart data={velocityTrend} height={220} />
              </div>

              {/* Task Distribution */}
              <div className="col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Task Distribution</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">By status</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <TaskDonutChart
                    data={taskDistribution}
                    size={160}
                    strokeWidth={20}
                    centerValue={metrics?.totalTasks || 0}
                    centerLabel="Total"
                  />
                </div>
              </div>
            </motion.div>

            {/* Two Columns: Risks & Team Productivity */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-6">
              {/* Risks & Blockers Panel */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500 text-[20px]">warning</span>
                    Risks & Blockers
                  </h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {blockedTasks.length === 0 && criticalBugs.length === 0 && overdueItems.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                      <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                      <p>No blockers or critical issues</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {/* Blocked Tasks */}
                      {blockedTasks.map((task) => (
                        <div key={task.taskId} className="px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-500 text-[18px] mt-0.5">block</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-slate-400">{task.issueKey}</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                  {task.title}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {task.blockedReason || 'No reason specified'}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                <span>{task.featureName}</span>
                                <span className="text-red-500 font-medium">{task.daysBlocked}d blocked</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Critical Bugs */}
                      {criticalBugs.map((bug) => (
                        <div key={bug.id} className="px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-500 text-[18px] mt-0.5">bug_report</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-slate-400">{bug.issueKey}</span>
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                  bug.severity === 'critical'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                  {bug.severity?.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate mt-0.5">
                                {bug.title}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Overdue Items */}
                      {overdueItems.slice(0, 5).map((item) => (
                        <div key={item.id} className="px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-amber-500 text-[18px] mt-0.5">schedule</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-slate-400">{item.issueKey}</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                  {item.title}
                                </span>
                              </div>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                Due: {new Date(item.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Team Productivity */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500 text-[20px]">groups</span>
                    Team Productivity
                  </h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {teamProductivity.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                      <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                      <p>No developer data available</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {teamProductivity.map((member) => (
                        <div key={member.userId} className="px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="font-medium text-sm text-slate-900 dark:text-white">{member.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {member.inProgress} in progress
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                    {member.tasksCompleted}
                                  </p>
                                  <p className="text-[10px] text-slate-400 uppercase">Done</p>
                                </div>
                                <div>
                                  <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                                    {member.completedPoints}
                                  </p>
                                  <p className="text-[10px] text-slate-400 uppercase">Points</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Epic Progress Overview */}
            <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-violet-500 text-[20px]">flag</span>
                  Epic Progress Overview
                </h3>
              </div>
              <div className="p-6">
                {epics.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-2">folder_off</span>
                    <p>No epics found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {epics.slice(0, 6).map((epic) => (
                      <RoadmapProgress
                        key={epic.id}
                        title={epic.title}
                        issueKey={epic.issueKey}
                        progress={epic.progress}
                        targetDate={epic.targetDate || undefined}
                        color={epic.color || undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Products Quick Access */}
            <motion.div variants={fadeInUp}>
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-[20px]">inventory_2</span>
                Products Overview
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{product.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{product.code}</p>
                      </div>
                      <div className={`
                        text-2xl font-bold tabular-nums
                        ${product.progress >= 80 ? 'text-emerald-600 dark:text-emerald-400' : ''}
                        ${product.progress >= 50 && product.progress < 80 ? 'text-blue-600 dark:text-blue-400' : ''}
                        ${product.progress < 50 ? 'text-slate-600 dark:text-slate-400' : ''}
                      `}>
                        {product.progress}%
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          product.progress >= 80
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                            : product.progress >= 50
                              ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                              : 'bg-gradient-to-r from-slate-500 to-slate-400'
                        }`}
                        style={{ width: `${product.progress}%` }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{product.epicCount} epics</span>
                      <span>{product.completedTasks}/{product.totalTasks} tasks</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
