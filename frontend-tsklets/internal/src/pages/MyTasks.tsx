import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import ItemDetailModal from '../components/ItemDetailModal'
import { useAuthStore } from '../store/auth'

interface DevTask {
  id: number
  title: string
  description: string | null
  type: 'task' | 'bug'
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: number
  featureId: number
  createdAt: string
  updatedAt: string
}

const columns = [
  { key: 'todo', label: 'To Do', color: 'slate', icon: 'radio_button_unchecked' },
  { key: 'in_progress', label: 'In Progress', color: 'blue', icon: 'pending' },
  { key: 'review', label: 'Review', color: 'amber', icon: 'rate_review' },
  { key: 'done', label: 'Done', color: 'emerald', icon: 'check_circle' },
]

const priorityConfig: Record<number, { label: string; className: string }> = {
  1: { label: 'P1', className: 'bg-red-100 text-red-700 border-red-200' },
  2: { label: 'P2', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  3: { label: 'P3', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  4: { label: 'P4', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

export default function MyTasks() {
  const [tasks, setTasks] = useState<DevTask[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<DevTask | null>(null)
  const { token } = useAuthStore()

  useEffect(() => {
    fetchMyTasks()
  }, [])

  const fetchMyTasks = async () => {
    try {
      const res = await fetch('/api/tasks/my-tasks', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (err) {
      console.error('Failed to fetch my tasks', err)
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
      fetchMyTasks()
    } catch (err) {
      console.error('Failed to update task', err)
    }
  }

  const getColumnTasks = (status: string) => tasks.filter((t) => t.status === status)

  const getColumnColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 border-blue-200'
      case 'amber': return 'bg-amber-50 border-amber-200'
      case 'emerald': return 'bg-emerald-50 border-emerald-200'
      default: return 'bg-slate-50 border-slate-200'
    }
  }

  const getCountColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-700'
      case 'amber': return 'bg-amber-100 text-amber-700'
      case 'emerald': return 'bg-emerald-100 text-emerald-700'
      default: return 'bg-slate-200 text-slate-600'
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex overflow-hidden bg-background-light">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading your tasks...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background-light">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <span className="material-symbols-outlined text-[20px]">task_alt</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">My Tasks</h2>
                <p className="text-xs text-slate-500">Your assigned development work</p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 font-medium">{tasks.length} total tasks</span>
            </div>
          </div>
        </header>

        {/* Kanban Board */}
        <div className="flex-1 overflow-auto p-6">
          <div className="flex gap-6 h-full">
            {columns.map((column) => {
              const columnTasks = getColumnTasks(column.key)
              return (
                <div key={column.key} className="flex-1 flex flex-col min-w-80">
                  {/* Column Header */}
                  <div className={`px-4 py-3 rounded-t-xl border-2 ${getColumnColor(column.color)} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-slate-700">{column.icon}</span>
                      <span className="font-bold text-sm text-slate-900">{column.label}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getCountColor(column.color)}`}>
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Column Tasks */}
                  <div className={`flex-1 border-2 border-t-0 rounded-b-xl p-3 ${getColumnColor(column.color)} space-y-3 overflow-y-auto`}>
                    {columnTasks.map((task) => {
                      const pConfig = priorityConfig[task.priority] || priorityConfig[3]
                      return (
                        <div
                          key={task.id}
                          className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              {task.type === 'bug' && (
                                <span className="material-symbols-outlined text-red-500 text-[18px]">bug_report</span>
                              )}
                              <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
                                  className="font-semibold text-sm text-slate-900 line-clamp-2 text-left hover:text-primary hover:underline transition-colors"
                                >
                                  {task.title}
                                </button>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold border ${pConfig.className} shrink-0 ml-2`}>
                              {pConfig.label}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-xs text-slate-600 line-clamp-2 mb-3">{task.description}</p>
                          )}

                          {/* Status Change Buttons */}
                          <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {column.key !== 'todo' && (
                              <button
                                onClick={() => {
                                  const currentIndex = columns.findIndex(c => c.key === column.key)
                                  if (currentIndex > 0) {
                                    updateTaskStatus(task.id, columns[currentIndex - 1].key)
                                  }
                                }}
                                className="flex-1 px-2 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-700 flex items-center justify-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                                Move Back
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
                                Move Forward
                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {columnTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <span className="material-symbols-outlined text-4xl">{column.icon}</span>
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
