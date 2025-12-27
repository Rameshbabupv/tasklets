import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import ItemDetailModal from '../components/ItemDetailModal'
import { useAuthStore } from '../store/auth'

interface Epic {
  id: number
  productId: number
  title: string
  description: string | null
  status: string
  priority: number
  createdAt: string
  updatedAt: string
}

interface Feature {
  id: number
  epicId: number
  title: string
  description: string | null
  status: string
  priority: number
  createdAt: string
  updatedAt: string
}

interface DevTask {
  id: number
  featureId: number
  title: string
  description: string | null
  type: 'task' | 'bug'
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: number
  createdAt: string
  updatedAt: string
}

interface EpicProgress {
  epicId: number
  epicTitle: string
  totalTasks: number
  completedTasks: number
  percentage: number
}

interface TaskDistribution {
  todo: number
  in_progress: number
  review: number
  done: number
}

interface DashboardData {
  epics: Epic[]
  features: Feature[]
  tasks: DevTask[]
  epicProgress: EpicProgress[]
  taskStatusDistribution: TaskDistribution
  totalTasks: number
}

interface User {
  id: number
  name: string
  email: string
  role: string
}

export default function ProductDashboard() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedEpics, setExpandedEpics] = useState<Set<number>>(new Set())
  const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(new Set())
  const [developers, setDevelopers] = useState<User[]>([])

  // Modal states
  const [showEpicModal, setShowEpicModal] = useState(false)
  const [showFeatureModal, setShowFeatureModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedEpicId, setSelectedEpicId] = useState<number | null>(null)
  const [selectedFeatureId, setSelectedFeatureId] = useState<number | null>(null)

  // Form states
  const [epicTitle, setEpicTitle] = useState('')
  const [epicDescription, setEpicDescription] = useState('')
  const [epicPriority, setEpicPriority] = useState(3)

  const [featureTitle, setFeatureTitle] = useState('')
  const [featureDescription, setFeatureDescription] = useState('')
  const [featurePriority, setFeaturePriority] = useState(3)

  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskType, setTaskType] = useState<'task' | 'bug'>('task')
  const [taskPriority, setTaskPriority] = useState(3)
  const [selectedDevelopers, setSelectedDevelopers] = useState<number[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedItem, setSelectedItem] = useState<{ item: Epic | Feature | DevTask; type: 'epic' | 'feature' | 'task' } | null>(null)

  const { token } = useAuthStore()

  useEffect(() => {
    fetchDashboard()
    fetchDevelopers()
  }, [id])

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/products/${id}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const dashboardData = await res.json()
      setData(dashboardData)
    } catch (err) {
      console.error('Failed to fetch dashboard', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDevelopers = async () => {
    try {
      // Fetch users from owner tenant (tenantId=1, assuming SysTech is first)
      const res = await fetch('/api/users/tenant/1', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const users = await res.json()
      const devs = users.filter((u: User) => u.role === 'developer')
      setDevelopers(devs)
    } catch (err) {
      console.error('Failed to fetch developers', err)
    }
  }

  const createEpic = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch('/api/epics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: parseInt(id!),
          title: epicTitle,
          description: epicDescription,
          priority: epicPriority,
        }),
      })

      if (!res.ok) throw new Error('Failed to create epic')

      setShowEpicModal(false)
      setEpicTitle('')
      setEpicDescription('')
      setEpicPriority(3)
      fetchDashboard()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const createFeature = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEpicId) return
    setError('')
    setSaving(true)

    try {
      const res = await fetch('/api/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          epicId: selectedEpicId,
          title: featureTitle,
          description: featureDescription,
          priority: featurePriority,
        }),
      })

      if (!res.ok) throw new Error('Failed to create feature')

      setShowFeatureModal(false)
      setFeatureTitle('')
      setFeatureDescription('')
      setFeaturePriority(3)
      setSelectedEpicId(null)
      fetchDashboard()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFeatureId) return
    setError('')
    setSaving(true)

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          featureId: selectedFeatureId,
          title: taskTitle,
          description: taskDescription,
          type: taskType,
          priority: taskPriority,
          assignees: selectedDevelopers,
        }),
      })

      if (!res.ok) throw new Error('Failed to create task')

      setShowTaskModal(false)
      setTaskTitle('')
      setTaskDescription('')
      setTaskType('task')
      setTaskPriority(3)
      setSelectedDevelopers([])
      setSelectedFeatureId(null)
      fetchDashboard()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openFeatureModal = (epicId: number) => {
    setSelectedEpicId(epicId)
    setShowFeatureModal(true)
  }

  const openTaskModal = (featureId: number) => {
    setSelectedFeatureId(featureId)
    setShowTaskModal(true)
  }

  const toggleDeveloper = (devId: number) => {
    if (selectedDevelopers.includes(devId)) {
      setSelectedDevelopers(selectedDevelopers.filter(id => id !== devId))
    } else {
      setSelectedDevelopers([...selectedDevelopers, devId])
    }
  }

  const toggleEpic = (epicId: number) => {
    const newSet = new Set(expandedEpics)
    if (newSet.has(epicId)) {
      newSet.delete(epicId)
    } else {
      newSet.add(epicId)
    }
    setExpandedEpics(newSet)
  }

  const toggleFeature = (featureId: number) => {
    const newSet = new Set(expandedFeatures)
    if (newSet.has(featureId)) {
      newSet.delete(featureId)
    } else {
      newSet.add(featureId)
    }
    setExpandedFeatures(newSet)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'backlog': return 'bg-slate-100 text-slate-700'
      case 'planned': return 'bg-blue-100 text-blue-700'
      case 'in_progress': return 'bg-indigo-100 text-indigo-700'
      case 'completed': return 'bg-emerald-100 text-emerald-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      case 'todo': return 'bg-slate-100 text-slate-700'
      case 'review': return 'bg-amber-100 text-amber-700'
      case 'done': return 'bg-emerald-100 text-emerald-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex overflow-hidden bg-background-light">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="h-screen flex overflow-hidden bg-background-light">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <p>Failed to load dashboard data</p>
          </div>
        </main>
      </div>
    )
  }

  const maxTasks = Math.max(...data.epicProgress.map(e => e.totalTasks), 1)

  return (
    <div className="h-screen flex overflow-hidden bg-background-light">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Link to="/products" className="text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Product Dashboard</h2>
              <p className="text-xs text-slate-500">Development progress and metrics</p>
            </div>
          </div>
          <button
            onClick={() => setShowEpicModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Epic
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                  <span className="material-symbols-outlined text-[20px]">library_books</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{data.epics.length}</p>
                  <p className="text-xs text-slate-500">Epics</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined text-[20px]">extension</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{data.features.length}</p>
                  <p className="text-xs text-slate-500">Features</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined text-[20px]">task_alt</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{data.totalTasks}</p>
                  <p className="text-xs text-slate-500">Total Tasks</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{data.taskStatusDistribution.done}</p>
                  <p className="text-xs text-slate-500">Completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Epic Progress Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600">trending_up</span>
                Epic Progress
              </h3>
              <div className="space-y-4">
                {data.epicProgress.map((epic) => (
                  <div key={epic.epicId}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 truncate flex-1">{epic.epicTitle}</span>
                      <span className="text-xs text-slate-500 ml-2">{epic.completedTasks}/{epic.totalTasks}</span>
                      <span className="text-xs font-bold text-emerald-600 ml-2">{epic.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                        style={{ width: `${epic.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
                {data.epicProgress.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No epics yet</p>
                )}
              </div>
            </div>

            {/* Task Status Distribution */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">donut_small</span>
                Task Status Distribution
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-slate-400"></div>
                    <span className="text-sm text-slate-700">To Do</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{data.taskStatusDistribution.todo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-slate-700">In Progress</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{data.taskStatusDistribution.in_progress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm text-slate-700">Review</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{data.taskStatusDistribution.review}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-emerald-500"></div>
                    <span className="text-sm text-slate-700">Done</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{data.taskStatusDistribution.done}</span>
                </div>

                {/* Visual bar */}
                {data.totalTasks > 0 && (
                  <div className="mt-6">
                    <div className="flex w-full h-8 rounded-lg overflow-hidden">
                      <div
                        className="bg-slate-400 flex items-center justify-center text-white text-xs font-bold"
                        style={{ width: `${(data.taskStatusDistribution.todo / data.totalTasks) * 100}%` }}
                      >
                        {data.taskStatusDistribution.todo > 0 && data.taskStatusDistribution.todo}
                      </div>
                      <div
                        className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
                        style={{ width: `${(data.taskStatusDistribution.in_progress / data.totalTasks) * 100}%` }}
                      >
                        {data.taskStatusDistribution.in_progress > 0 && data.taskStatusDistribution.in_progress}
                      </div>
                      <div
                        className="bg-amber-500 flex items-center justify-center text-white text-xs font-bold"
                        style={{ width: `${(data.taskStatusDistribution.review / data.totalTasks) * 100}%` }}
                      >
                        {data.taskStatusDistribution.review > 0 && data.taskStatusDistribution.review}
                      </div>
                      <div
                        className="bg-emerald-500 flex items-center justify-center text-white text-xs font-bold"
                        style={{ width: `${(data.taskStatusDistribution.done / data.totalTasks) * 100}%` }}
                      >
                        {data.taskStatusDistribution.done > 0 && data.taskStatusDistribution.done}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Epic → Feature → Task Drilldown */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">account_tree</span>
              Epic → Feature → Task Breakdown
            </h3>

            <div className="space-y-2">
              {data.epics.map((epic) => {
                const isExpanded = expandedEpics.has(epic.id)
                const epicFeatures = data.features.filter(f => f.epicId === epic.id)

                return (
                  <div key={epic.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    {/* Epic Row */}
                    <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                      <span
                        onClick={() => toggleEpic(epic.id)}
                        className="material-symbols-outlined text-slate-600 cursor-pointer"
                      >
                        {isExpanded ? 'expand_more' : 'chevron_right'}
                      </span>
                      <span
                        onClick={() => toggleEpic(epic.id)}
                        className="material-symbols-outlined text-purple-600 cursor-pointer"
                      >
                        library_books
                      </span>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">E-{epic.id}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedItem({ item: epic, type: 'epic' }); }}
                        className="font-semibold flex-1 text-left hover:text-primary hover:underline transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {epic.title}
                      </button>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        epic.priority === 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        epic.priority === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        epic.priority === 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}>P{epic.priority}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(epic.status)}`}>
                        {epic.status}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{epicFeatures.length} features</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openFeatureModal(epic.id)
                        }}
                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        Feature
                      </button>
                    </div>

                    {/* Features */}
                    {isExpanded && (
                      <div className="bg-white dark:bg-slate-800">
                        {epicFeatures.map((feature) => {
                          const isFeatureExpanded = expandedFeatures.has(feature.id)
                          const featureTasks = data.tasks.filter(t => t.featureId === feature.id)

                          return (
                            <div key={feature.id} className="border-t border-slate-200 dark:border-slate-700">
                              {/* Feature Row */}
                              <div className="flex items-center gap-3 p-4 pl-12 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                                <span
                                  onClick={() => toggleFeature(feature.id)}
                                  className="material-symbols-outlined text-slate-600 cursor-pointer"
                                >
                                  {isFeatureExpanded ? 'expand_more' : 'chevron_right'}
                                </span>
                                <span
                                  onClick={() => toggleFeature(feature.id)}
                                  className="material-symbols-outlined text-blue-600 cursor-pointer"
                                >
                                  extension
                                </span>
                                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">F-{feature.id}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedItem({ item: feature, type: 'feature' }); }}
                                  className="font-medium flex-1 text-left hover:text-primary hover:underline transition-colors"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {feature.title}
                                </button>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  feature.priority === 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                  feature.priority === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                  feature.priority === 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                }`}>P{feature.priority}</span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(feature.status)}`}>
                                  {feature.status}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{featureTasks.length} tasks</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openTaskModal(feature.id)
                                  }}
                                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-medium flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[14px]">add</span>
                                  Task
                                </button>
                              </div>

                              {/* Tasks */}
                              {isFeatureExpanded && (
                                <div className="bg-slate-50 dark:bg-slate-900/50">
                                  {featureTasks.map((task) => (
                                    <div key={task.id} className="flex items-center gap-2 p-3 pl-20 border-t border-slate-200 dark:border-slate-700">
                                      {task.type === 'bug' ? (
                                        <span className="material-symbols-outlined text-red-500 text-[18px]">bug_report</span>
                                      ) : (
                                        <span className="material-symbols-outlined text-slate-400 text-[18px]">task</span>
                                      )}
                                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">T-{task.id}</span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedItem({ item: task, type: 'task' }); }}
                                        className="text-sm flex-1 text-left hover:text-primary hover:underline transition-colors"
                                        style={{ color: 'var(--text-secondary)' }}
                                      >
                                        {task.title}
                                      </button>
                                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                        task.priority === 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                        task.priority === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                        task.priority === 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                      }`}>P{task.priority}</span>
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                                        {task.status}
                                      </span>
                                    </div>
                                  ))}
                                  {featureTasks.length === 0 && (
                                    <div className="p-4 pl-20 text-sm text-slate-400">No tasks yet</div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {epicFeatures.length === 0 && (
                          <div className="p-4 pl-12 text-sm text-slate-400 border-t border-slate-200 dark:border-slate-700">No features yet</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {data.epics.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <span className="material-symbols-outlined text-4xl">account_tree</span>
                  <p className="mt-2 text-sm">No epics created yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create Epic Modal */}
      {showEpicModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Create New Epic</h3>
              <p className="text-sm text-slate-500 mt-1">Add a new epic to this product</p>
            </div>

            <form onSubmit={createEpic} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={epicTitle}
                  onChange={(e) => setEpicTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., User Authentication Module"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={epicDescription}
                  onChange={(e) => setEpicDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 resize-none"
                  rows={3}
                  placeholder="Brief description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={epicPriority}
                  onChange={(e) => setEpicPriority(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                >
                  <option value={1}>P1 - Critical</option>
                  <option value={2}>P2 - High</option>
                  <option value={3}>P3 - Medium</option>
                  <option value={4}>P4 - Low</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setShowEpicModal(false); setError('') }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Epic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Feature Modal */}
      {showFeatureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Create New Feature</h3>
              <p className="text-sm text-slate-500 mt-1">Add a feature to the selected epic</p>
            </div>

            <form onSubmit={createFeature} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={featureTitle}
                  onChange={(e) => setFeatureTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., Social Login Integration"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={featureDescription}
                  onChange={(e) => setFeatureDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 resize-none"
                  rows={3}
                  placeholder="Brief description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={featurePriority}
                  onChange={(e) => setFeaturePriority(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                >
                  <option value={1}>P1 - Critical</option>
                  <option value={2}>P2 - High</option>
                  <option value={3}>P3 - Medium</option>
                  <option value={4}>P4 - Low</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setShowFeatureModal(false); setSelectedEpicId(null); setError('') }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Feature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem.item}
          itemType={selectedItem.type}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Create New Task</h3>
              <p className="text-sm text-slate-500 mt-1">Add a task to the selected feature</p>
            </div>

            <form onSubmit={createTask} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., Implement Google OAuth"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 resize-none"
                  rows={2}
                  placeholder="Brief description"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as 'task' | 'bug')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="task">Task</option>
                    <option value="bug">Bug</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                  >
                    <option value={1}>P1</option>
                    <option value={2}>P2</option>
                    <option value={3}>P3</option>
                    <option value={4}>P4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assign Developers</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-3">
                  {developers.map((dev) => (
                    <label key={dev.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedDevelopers.includes(dev.id)}
                        onChange={() => toggleDeveloper(dev.id)}
                        className="rounded border-slate-300 text-primary focus:ring-primary/20"
                      />
                      <span className="text-sm text-slate-700">{dev.name}</span>
                      <span className="text-xs text-slate-400">({dev.email})</span>
                    </label>
                  ))}
                  {developers.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-2">No developers available</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskModal(false)
                    setSelectedFeatureId(null)
                    setSelectedDevelopers([])
                    setError('')
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
