import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import { RoadmapProgress } from '../components/charts/ProgressBar'
import { useAuthStore } from '../store/auth'

interface Feature {
  id: number
  issueKey: string
  title: string
  status: string
  priority: number
  estimate: number | null
  startDate: string | null
  targetDate: string | null
  progress: number
  taskCount: number
  completedTasks: number
}

interface Epic {
  id: number
  issueKey: string
  title: string
  description: string | null
  status: string
  priority: number
  progress: number
  color: string | null
  startDate: string | null
  targetDate: string | null
  productId: number
  productName: string
  productCode: string
  features: Feature[]
  featureCount: number
  completedFeatures: number
}

interface Product {
  id: number
  name: string
  code: string
}

type ViewMode = 'timeline' | 'list'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const STATUS_COLORS: Record<string, string> = {
  backlog: '#94a3b8',
  planned: '#3b82f6',
  in_progress: '#f59e0b',
  completed: '#10b981',
  cancelled: '#ef4444',
}

const EPIC_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
]

export default function Roadmap() {
  const [epics, setEpics] = useState<Epic[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [expandedEpics, setExpandedEpics] = useState<Set<number>>(new Set())
  const { token } = useAuthStore()

  useEffect(() => {
    fetchData()
  }, [selectedProduct])

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` }

      const [roadmapRes, productsRes] = await Promise.all([
        fetch(`/api/executive/roadmap${selectedProduct ? `?productId=${selectedProduct}` : ''}`, { headers }),
        fetch('/api/products', { headers }),
      ])

      const [roadmapData, productsData] = await Promise.all([
        roadmapRes.json(),
        productsRes.json(),
      ])

      setEpics(roadmapData.roadmap || [])
      setProducts(productsData.products || [])
    } catch (err) {
      console.error('Failed to fetch roadmap data', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleEpicExpanded = (epicId: number) => {
    setExpandedEpics(prev => {
      const next = new Set(prev)
      if (next.has(epicId)) {
        next.delete(epicId)
      } else {
        next.add(epicId)
      }
      return next
    })
  }

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    const now = new Date()
    const startMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 6, 1)

    const months: { date: Date; label: string; isCurrentMonth: boolean }[] = []
    let current = new Date(startMonth)

    while (current <= endMonth) {
      months.push({
        date: new Date(current),
        label: `${MONTHS[current.getMonth()]} ${current.getFullYear().toString().slice(-2)}`,
        isCurrentMonth: current.getMonth() === now.getMonth() && current.getFullYear() === now.getFullYear(),
      })
      current.setMonth(current.getMonth() + 1)
    }

    return {
      start: startMonth,
      end: endMonth,
      months,
      totalDays: Math.ceil((endMonth.getTime() - startMonth.getTime()) / (1000 * 60 * 60 * 24)),
    }
  }, [])

  const getBarPosition = (startDate: string | null, targetDate: string | null) => {
    const start = startDate ? new Date(startDate) : new Date()
    const end = targetDate ? new Date(targetDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000)

    const rangeStart = timelineRange.start.getTime()
    const rangeEnd = timelineRange.end.getTime()
    const totalDuration = rangeEnd - rangeStart

    const barStart = Math.max(0, (start.getTime() - rangeStart) / totalDuration) * 100
    const barEnd = Math.min(100, (end.getTime() - rangeStart) / totalDuration) * 100
    const barWidth = Math.max(2, barEnd - barStart)

    return { left: `${barStart}%`, width: `${barWidth}%` }
  }

  const getEpicColor = (epic: Epic, index: number) => {
    return epic.color || EPIC_COLORS[index % EPIC_COLORS.length]
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
                <span className="material-symbols-outlined text-primary text-xl">map</span>
              </span>
            </div>
            <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Loading Roadmap...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
                <span className="material-symbols-outlined text-[22px]">map</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Roadmap</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Product timeline and milestones</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Product Filter */}
            <select
              value={selectedProduct || ''}
              onChange={(e) => setSelectedProduct(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">view_timeline</span>
                Timeline
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">list</span>
                List
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {epics.length === 0 ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center text-slate-400 dark:text-slate-500">
                <span className="material-symbols-outlined text-6xl mb-4">map</span>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No roadmap data</h3>
                <p className="text-sm">Create epics with target dates to see them on the roadmap</p>
              </div>
            </div>
          ) : viewMode === 'timeline' ? (
            <div className="p-6">
              {/* Timeline Header */}
              <div className="mb-4 ml-64 flex border-b border-slate-200 dark:border-slate-800">
                {timelineRange.months.map((month, index) => (
                  <div
                    key={index}
                    className={`flex-1 px-2 py-2 text-center text-xs font-medium border-l border-slate-200 dark:border-slate-800 first:border-l-0 ${
                      month.isCurrentMonth
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {month.label}
                  </div>
                ))}
              </div>

              {/* Timeline Content */}
              <div className="space-y-2">
                {epics.map((epic, epicIndex) => {
                  const isExpanded = expandedEpics.has(epic.id)
                  const epicColor = getEpicColor(epic, epicIndex)
                  const barPosition = getBarPosition(epic.startDate, epic.targetDate)

                  return (
                    <motion.div
                      key={epic.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: epicIndex * 0.05 }}
                    >
                      {/* Epic Row */}
                      <div className="flex items-center group">
                        {/* Epic Info */}
                        <div className="w-64 shrink-0 pr-4">
                          <button
                            onClick={() => toggleEpicExpanded(epic.id)}
                            className="w-full text-left flex items-center gap-2 py-2 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 rounded-lg px-2 -ml-2 transition-colors"
                          >
                            <span
                              className="material-symbols-outlined text-[18px] transition-transform"
                              style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                            >
                              chevron_right
                            </span>
                            <div
                              className="w-2 h-6 rounded-full shrink-0"
                              style={{ backgroundColor: epicColor }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-slate-400">{epic.issueKey}</span>
                                <span className={`
                                  px-1.5 py-0.5 text-[9px] font-bold rounded uppercase
                                  ${epic.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                                  ${epic.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                                  ${epic.status === 'planned' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                                  ${epic.status === 'backlog' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : ''}
                                  ${epic.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                                `}>
                                  {epic.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="font-medium text-sm text-slate-900 dark:text-white truncate mt-0.5">
                                {epic.title}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {epic.completedFeatures}/{epic.featureCount} features
                              </p>
                            </div>
                          </button>
                        </div>

                        {/* Timeline Bar */}
                        <div className="flex-1 h-12 relative">
                          {/* Background Grid */}
                          <div className="absolute inset-0 flex">
                            {timelineRange.months.map((month, index) => (
                              <div
                                key={index}
                                className={`flex-1 border-l border-slate-100 dark:border-slate-800/50 first:border-l-0 ${
                                  month.isCurrentMonth ? 'bg-primary/5 dark:bg-primary/10' : ''
                                }`}
                              />
                            ))}
                          </div>

                          {/* Epic Bar */}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-6 rounded-full flex items-center overflow-hidden shadow-sm group/bar cursor-pointer"
                            style={{
                              left: barPosition.left,
                              width: barPosition.width,
                              backgroundColor: epicColor,
                            }}
                          >
                            {/* Progress Fill */}
                            <div
                              className="absolute inset-y-0 left-0 bg-white/30 rounded-l-full"
                              style={{ width: `${epic.progress}%` }}
                            />
                            {/* Label */}
                            <span className="relative z-10 px-2 text-[10px] font-bold text-white truncate">
                              {epic.progress}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Features (Expanded) */}
                      {isExpanded && epic.features.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-8 border-l-2 border-slate-200 dark:border-slate-700 pl-4"
                        >
                          {epic.features.map((feature) => {
                            const featureBarPosition = getBarPosition(feature.startDate, feature.targetDate)
                            return (
                              <div key={feature.id} className="flex items-center py-1">
                                {/* Feature Info */}
                                <div className="w-56 shrink-0 pr-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[9px] text-slate-400">{feature.issueKey}</span>
                                  </div>
                                  <p className="text-xs text-slate-700 dark:text-slate-300 truncate">
                                    {feature.title}
                                  </p>
                                  <p className="text-[9px] text-slate-500 dark:text-slate-400">
                                    {feature.completedTasks}/{feature.taskCount} tasks
                                  </p>
                                </div>

                                {/* Feature Bar */}
                                <div className="flex-1 h-6 relative">
                                  <div
                                    className="absolute top-1/2 -translate-y-1/2 h-3 rounded-full overflow-hidden"
                                    style={{
                                      left: featureBarPosition.left,
                                      width: featureBarPosition.width,
                                      backgroundColor: `${epicColor}40`,
                                    }}
                                  >
                                    <div
                                      className="absolute inset-y-0 left-0 rounded-l-full"
                                      style={{
                                        width: `${feature.progress}%`,
                                        backgroundColor: epicColor,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-8 flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="text-slate-500 dark:text-slate-400">Backlog</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-full bg-blue-500" />
                  <span className="text-slate-500 dark:text-slate-400">Planned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-full bg-amber-500" />
                  <span className="text-slate-500 dark:text-slate-400">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-500 dark:text-slate-400">Completed</span>
                </div>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="p-6 max-w-4xl mx-auto space-y-6">
              {epics.map((epic, epicIndex) => {
                const epicColor = getEpicColor(epic, epicIndex)
                const isExpanded = expandedEpics.has(epic.id)

                return (
                  <motion.div
                    key={epic.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: epicIndex * 0.05 }}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                  >
                    {/* Epic Header */}
                    <button
                      onClick={() => toggleEpicExpanded(epic.id)}
                      className="w-full text-left p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-1.5 h-full min-h-[60px] rounded-full shrink-0"
                          style={{ backgroundColor: epicColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-slate-400">{epic.issueKey}</span>
                            <span className={`
                              px-2 py-0.5 text-[10px] font-bold rounded uppercase
                              ${epic.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                              ${epic.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                              ${epic.status === 'planned' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                              ${epic.status === 'backlog' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : ''}
                            `}>
                              {epic.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-400">{epic.productName}</span>
                          </div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                            {epic.title}
                          </h3>
                          {epic.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                              {epic.description}
                            </p>
                          )}
                          <RoadmapProgress
                            title=""
                            progress={epic.progress}
                            targetDate={epic.targetDate || undefined}
                            color={epicColor}
                          />
                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                            <span>{epic.featureCount} features</span>
                            <span>{epic.completedFeatures} completed</span>
                            {epic.targetDate && (
                              <span>Target: {new Date(epic.targetDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <span
                          className="material-symbols-outlined text-slate-400 transition-transform shrink-0"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                          expand_more
                        </span>
                      </div>
                    </button>

                    {/* Features List */}
                    {isExpanded && epic.features.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-5 space-y-3"
                      >
                        {epic.features.map((feature) => (
                          <RoadmapProgress
                            key={feature.id}
                            title={feature.title}
                            issueKey={feature.issueKey}
                            progress={feature.progress}
                            targetDate={feature.targetDate || undefined}
                            color={epicColor}
                          />
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
