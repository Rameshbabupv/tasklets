import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import ItemDetailModal from '../components/ItemDetailModal'
import { useAuthStore } from '../store/auth'

interface Sprint {
  id: number
  name: string
  goal: string | null
  startDate: string
  endDate: string
  status: 'planning' | 'active' | 'completed' | 'cancelled'
  velocity: number | null
}

interface DevTask {
  id: number
  title: string
  description: string | null
  type: 'task' | 'bug'
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: number
  storyPoints: number | null
  featureId: number
  sprintId: number | null
}

interface Assignment {
  id: number
  taskId: number
  userId: number
}

interface BurndownData {
  days: { date: string; day: number; ideal: number; actual: number | null }[]
  totalPoints: number
}

const columns = [
  { key: 'todo', label: 'To Do', color: 'slate', icon: 'radio_button_unchecked' },
  { key: 'in_progress', label: 'In Progress', color: 'blue', icon: 'pending' },
  { key: 'review', label: 'Review', color: 'amber', icon: 'rate_review' },
  { key: 'done', label: 'Done', color: 'emerald', icon: 'check_circle' },
]

const priorityConfig: Record<number, { label: string; className: string }> = {
  1: { label: 'P1', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  2: { label: 'P2', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  3: { label: 'P3', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  4: { label: 'P4', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
}

const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13] as const

export default function SprintBoard() {
  const { id } = useParams<{ id: string }>()
  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [tasks, setTasks] = useState<DevTask[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [burndownData, setBurndownData] = useState<BurndownData | null>(null)
  const [showBurndown, setShowBurndown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingPoints, setEditingPoints] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<DevTask | null>(null)
  const { token } = useAuthStore()

  const surfaceStyles = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }
  const textPrimary = { color: 'var(--text-primary)' }
  const textSecondary = { color: 'var(--text-secondary)' }
  const textMuted = { color: 'var(--text-muted)' }

  useEffect(() => {
    if (id) fetchSprintData()
  }, [id])

  const fetchSprintData = async () => {
    try {
      const [sprintRes, burndownRes] = await Promise.all([
        fetch(`/api/sprints/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/sprints/${id}/burndown`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const data = await sprintRes.json()
      const burndown = await burndownRes.json()
      setSprint(data.sprint)
      setTasks(data.tasks || [])
      setAssignments(data.assignments || [])
      setBurndownData(burndown)
    } catch (err) {
      console.error('Failed to fetch sprint', err)
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchSprintData()
    } catch (err) {
      console.error('Failed to update task', err)
    }
  }

  const updateStoryPoints = async (taskId: number, points: number | null) => {
    try {
      await fetch(`/api/tasks/${taskId}/points`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ storyPoints: points }),
      })
      setEditingPoints(null)
      fetchSprintData()
    } catch (err) {
      console.error('Failed to update points', err)
    }
  }

  const moveToBacklog = async (taskId: number) => {
    try {
      await fetch(`/api/tasks/${taskId}/sprint`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sprintId: null }),
      })
      fetchSprintData()
    } catch (err) {
      console.error('Failed to move task', err)
    }
  }

  // Filter tasks by search
  const filteredTasks = searchQuery
    ? tasks.filter((t) => {
        const query = searchQuery.toLowerCase()
        return t.title.toLowerCase().includes(query) || t.description?.toLowerCase().includes(query)
      })
    : tasks

  const getColumnTasks = (status: string) => filteredTasks.filter((t) => t.status === status)

  const getColumnColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
      emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
      slate: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
    }
    return colors[color] || colors.slate
  }

  const getCountColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
      amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
      emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
      slate: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    }
    return colors[color] || colors.slate
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate + 'T23:59:59')
    const today = new Date()
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  // Calculate stats
  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
  const completedPoints = tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.storyPoints || 0), 0)
  const remainingPoints = totalPoints - completedPoints

  if (loading) {
    return (
      <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4" style={textSecondary}>Loading sprint...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!sprint) {
    return (
      <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p style={textSecondary}>Sprint not found</p>
            <Link to="/sprints" className="text-primary hover:underline mt-2 block">
              Back to Sprints
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b shrink-0" style={surfaceStyles}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/sprints" className="p-2 hover:bg-primary/10 rounded-lg transition-colors" style={textSecondary}>
                <span className="material-symbols-outlined">arrow_back</span>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold" style={textPrimary}>{sprint.name}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    sprint.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : sprint.status === 'planning'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {sprint.status}
                  </span>
                </div>
                <p className="text-sm" style={textSecondary}>
                  {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                  {sprint.status === 'active' && (
                    <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                      ({getDaysRemaining(sprint.endDate)} days left)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Search and Stats */}
            <div className="flex items-center gap-6">
              {/* Search */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={textMuted}>search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="pl-9 pr-3 py-1.5 rounded-lg border text-sm w-48"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[16px] hover:text-red-500"
                    style={textMuted}
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              <div className="h-10 w-px" style={{ backgroundColor: 'var(--border-primary)' }}></div>

              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{completedPoints}</div>
                <div className="text-xs" style={textSecondary}>Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={textPrimary}>{remainingPoints}</div>
                <div className="text-xs" style={textSecondary}>Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={textSecondary}>{totalPoints}</div>
                <div className="text-xs" style={textSecondary}>Total Points</div>
              </div>
              <div className="h-10 w-px" style={{ backgroundColor: 'var(--border-primary)' }}></div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={textPrimary}>{filteredTasks.length}{searchQuery ? `/${tasks.length}` : ''}</div>
                <div className="text-xs" style={textSecondary}>Tasks</div>
              </div>
            </div>
          </div>

          {sprint.goal && (
            <p className="text-sm mt-2 pl-12" style={textSecondary}>
              <span className="font-medium">Goal:</span> {sprint.goal}
            </p>
          )}

          {/* Burndown Toggle */}
          {sprint.status === 'active' && burndownData && burndownData.days.length > 0 && (
            <button
              onClick={() => setShowBurndown(!showBurndown)}
              className="mt-3 ml-12 flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-[18px]">
                {showBurndown ? 'expand_less' : 'trending_down'}
              </span>
              {showBurndown ? 'Hide Burndown' : 'Show Burndown Chart'}
            </button>
          )}
        </header>

        {/* Burndown Chart (collapsible) */}
        {showBurndown && burndownData && burndownData.days.length > 0 && (
          <div className="px-6 py-4 border-b" style={surfaceStyles}>
            <div className="rounded-xl border p-4" style={surfaceStyles}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={textPrimary}>Sprint Burndown</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-slate-400"></div>
                    <span className="text-xs" style={textSecondary}>Ideal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-primary rounded"></div>
                    <span className="text-xs" style={textSecondary}>Actual</span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="relative h-40">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs pr-2" style={textMuted}>
                  <span>{burndownData.totalPoints}</span>
                  <span>{Math.round(burndownData.totalPoints / 2)}</span>
                  <span>0</span>
                </div>

                {/* Chart area */}
                <div className="ml-8 h-full relative border-l border-b" style={{ borderColor: 'var(--border-primary)' }}>
                  {/* Ideal line (dashed) */}
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <line
                      x1="0"
                      y1="0"
                      x2="100%"
                      y2="100%"
                      stroke="var(--text-muted)"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  </svg>

                  {/* Actual line */}
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={burndownData.days
                        .filter(d => d.actual !== null)
                        .map((d, i, arr) => {
                          const x = (i / Math.max(burndownData.days.length - 1, 1)) * 100
                          const y = 100 - ((d.actual || 0) / Math.max(burndownData.totalPoints, 1)) * 100
                          return `${x}%,${y}%`
                        })
                        .join(' ')}
                    />
                  </svg>

                  {/* Data points */}
                  {burndownData.days
                    .filter(d => d.actual !== null)
                    .map((d, i, arr) => {
                      const x = (i / Math.max(burndownData.days.length - 1, 1)) * 100
                      const y = 100 - ((d.actual || 0) / Math.max(burndownData.totalPoints, 1)) * 100
                      return (
                        <div
                          key={d.day}
                          className="absolute w-2.5 h-2.5 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 ring-2 ring-white dark:ring-slate-800"
                          style={{ left: `${x}%`, top: `${y}%` }}
                          title={`Day ${d.day}: ${d.actual} pts remaining`}
                        />
                      )
                    })}
                </div>
              </div>

              {/* X-axis labels */}
              <div className="ml-8 mt-2 flex justify-between text-xs" style={textMuted}>
                {burndownData.days.filter((_, i) => i === 0 || i === burndownData.days.length - 1 || i % 3 === 0).map((d) => (
                  <span key={d.day}>Day {d.day}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Kanban Board */}
        <div className="flex-1 overflow-auto p-6">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map((column) => {
              const columnTasks = getColumnTasks(column.key)
              const columnPoints = columnTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)

              return (
                <div key={column.key} className="flex flex-col w-80 shrink-0">
                  {/* Column Header */}
                  <div className={`px-4 py-3 rounded-t-xl border-2 ${getColumnColor(column.color)} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]" style={textPrimary}>{column.icon}</span>
                      <span className="font-bold text-sm" style={textPrimary}>{column.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getCountColor(column.color)}`}>
                        {columnTasks.length}
                      </span>
                      <span className="text-xs font-medium" style={textSecondary}>
                        {columnPoints} pts
                      </span>
                    </div>
                  </div>

                  {/* Column Tasks */}
                  <div className={`flex-1 border-2 border-t-0 rounded-b-xl p-3 ${getColumnColor(column.color)} space-y-3 overflow-y-auto`}>
                    {columnTasks.map((task) => {
                      const pConfig = priorityConfig[task.priority] || priorityConfig[3]

                      return (
                        <div
                          key={task.id}
                          className="rounded-lg border p-4 hover:shadow-md transition-shadow group"
                          style={surfaceStyles}
                        >
                          {/* Task Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              {task.type === 'bug' && (
                                <span className="material-symbols-outlined text-red-500 text-[18px]">bug_report</span>
                              )}
                              <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
                                  className="font-semibold text-sm line-clamp-2 text-left hover:text-primary hover:underline transition-colors"
                                  style={textPrimary}
                                >
                                  {task.title}
                                </button>
                            </div>
                          </div>

                          {task.description && (
                            <p className="text-xs line-clamp-2 mb-3" style={textSecondary}>{task.description}</p>
                          )}

                          {/* Tags Row */}
                          <div className="flex items-center gap-2 flex-wrap mb-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${pConfig.className}`}>
                              {pConfig.label}
                            </span>

                            {/* Story Points */}
                            {editingPoints === task.id ? (
                              <div className="flex gap-1">
                                {FIBONACCI_POINTS.map(p => (
                                  <button
                                    key={p}
                                    onClick={() => updateStoryPoints(task.id, p)}
                                    className={`w-6 h-6 rounded text-xs font-bold transition-colors ${
                                      task.storyPoints === p
                                        ? 'bg-primary text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-primary/20'
                                    }`}
                                    style={task.storyPoints !== p ? textSecondary : {}}
                                  >
                                    {p}
                                  </button>
                                ))}
                                <button
                                  onClick={() => setEditingPoints(null)}
                                  className="w-6 h-6 rounded text-xs hover:bg-red-100 dark:hover:bg-red-900/30"
                                  style={textSecondary}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingPoints(task.id)}
                                className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                              >
                                {task.storyPoints ? `${task.storyPoints} pts` : '? pts'}
                              </button>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {column.key !== 'todo' && (
                              <button
                                onClick={() => {
                                  const currentIndex = columns.findIndex(c => c.key === column.key)
                                  if (currentIndex > 0) {
                                    updateTaskStatus(task.id, columns[currentIndex - 1].key)
                                  }
                                }}
                                className="flex-1 px-2 py-1.5 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors"
                                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                              >
                                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                              </button>
                            )}
                            {column.key !== 'done' && (
                              <button
                                onClick={() => {
                                  const currentIndex = columns.findIndex(c => c.key === column.key)
                                  if (currentIndex < columns.length - 1) {
                                    updateTaskStatus(task.id, columns[currentIndex + 1].key)
                                  }
                                }}
                                className="flex-1 px-2 py-1.5 text-xs font-medium bg-primary hover:bg-primary/90 rounded text-white flex items-center justify-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                              </button>
                            )}
                            <button
                              onClick={() => moveToBacklog(task.id)}
                              className="px-2 py-1.5 text-xs rounded transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
                              style={textSecondary}
                              title="Move to Backlog"
                            >
                              <span className="material-symbols-outlined text-[16px]">remove_circle_outline</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}

                    {columnTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12" style={textSecondary}>
                        <span className="material-symbols-outlined text-4xl opacity-50">{column.icon}</span>
                        <p className="text-sm mt-2">No tasks</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedTask && (
        <ItemDetailModal
          item={selectedTask}
          itemType="task"
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
