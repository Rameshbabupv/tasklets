import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/auth'
import { toast } from 'sonner'

interface DevTask {
  id: number
  issueKey: string | null
  title: string
  description: string | null
  type: 'task' | 'bug'
  status: string
  priority: number
  storyPoints: number | null
  estimate: number | null
  actualTime: number | null
  dueDate: string | null
  labels: string[] | null
  blockedReason: string | null
  severity: string | null
  environment: string | null
  productId: number
  productName: string | null
  productCode: string | null
  moduleName: string | null
  componentName: string | null
  addonName: string | null
  implementorId: number | null
  implementorName: string | null
  implementorEmail: string | null
  developerId: number | null
  developerName: string | null
  developerEmail: string | null
  testerId: number | null
  testerName: string | null
  testerEmail: string | null
  supportTicket: {
    id: string
    issueKey: string
    title: string
    status: string
  } | null
  createdAt: string
  updatedAt: string
}

interface DevTaskDetailModalProps {
  taskId: number
  onClose: () => void
  onStatusChange?: () => void
}

// Status configuration
const statusConfig: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  todo: { label: 'To Do', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', icon: 'radio_button_unchecked' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', icon: 'pending' },
  review: { label: 'Review', bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', icon: 'rate_review' },
  testing: { label: 'Testing', bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', icon: 'science' },
  blocked: { label: 'Blocked', bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', icon: 'block' },
  done: { label: 'Done', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', icon: 'check_circle' },
}

const priorityConfig: Record<number, { label: string; short: string; color: string }> = {
  1: { label: 'Critical', short: 'P1', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30' },
  2: { label: 'High', short: 'P2', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30' },
  3: { label: 'Medium', short: 'P3', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
  4: { label: 'Low', short: 'P4', color: 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800' },
}

export default function DevTaskDetailModal({ taskId, onClose, onStatusChange }: DevTaskDetailModalProps) {
  const { token } = useAuthStore()
  const [task, setTask] = useState<DevTask | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchTask()
    document.body.style.overflow = 'hidden'

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleEscape)
    }
  }, [taskId])

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch task')
      const data = await res.json()
      setTask(data)
    } catch (err) {
      console.error('Failed to fetch task', err)
      toast.error('Failed to load task details')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => onClose(), 200)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')

      setTask({ ...task, status: newStatus })
      toast.success(`Status updated to ${statusConfig[newStatus]?.label || newStatus}`)
      onStatusChange?.()
    } catch (err) {
      console.error('Failed to update status', err)
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto
        ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl my-8 rounded-2xl shadow-2xl overflow-hidden
          ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
        style={{ backgroundColor: 'var(--bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className={`h-1.5 w-full ${task?.type === 'bug'
          ? 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500'
          : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500'
        }`} />

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-3xl animate-spin" style={{ color: 'var(--text-muted)' }}>
                progress_activity
              </span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading task...</p>
            </div>
          </div>
        ) : task ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-start justify-between gap-4" style={{ borderColor: 'var(--border-primary)' }}>
              <div className="flex items-start gap-3 min-w-0">
                <div className={`size-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${
                  task.type === 'bug'
                    ? 'bg-gradient-to-br from-red-500 to-rose-500'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                }`}>
                  <span className="material-symbols-outlined text-xl text-white">
                    {task.type === 'bug' ? 'bug_report' : 'task_alt'}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      task.type === 'bug' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {task.issueKey || `#${task.id}`}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${priorityConfig[task.priority]?.color || ''}`}>
                      {priorityConfig[task.priority]?.short || `P${task.priority}`}
                    </span>
                  </div>
                  <h3 className="font-bold mt-1 text-lg" style={{ color: 'var(--text-primary)' }}>
                    {task.title}
                  </h3>
                  {task.productName && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {task.productCode && <span className="font-medium">{task.productCode}</span>}
                      {task.productCode && ' • '}
                      {task.productName}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="size-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col lg:flex-row">
              {/* Main Content */}
              <div className="flex-1 p-6 min-w-0 space-y-6">
                {/* Description */}
                {task.description && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                      Description
                    </h4>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                      {task.description}
                    </p>
                  </div>
                )}

                {/* Product Structure */}
                {(task.moduleName || task.componentName || task.addonName) && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                      Location
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {task.moduleName && (
                        <span className="text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          <span className="material-symbols-outlined text-sm align-text-bottom mr-1">folder</span>
                          {task.moduleName}
                        </span>
                      )}
                      {task.componentName && (
                        <span className="text-xs px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                          <span className="material-symbols-outlined text-sm align-text-bottom mr-1">widgets</span>
                          {task.componentName}
                        </span>
                      )}
                      {task.addonName && (
                        <span className="text-xs px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <span className="material-symbols-outlined text-sm align-text-bottom mr-1">extension</span>
                          {task.addonName}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Bug Specific */}
                {task.type === 'bug' && (task.severity || task.environment) && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                      Bug Details
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {task.severity && (
                        <span className={`text-xs px-2 py-1 rounded-lg border ${
                          task.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' :
                          task.severity === 'major' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' :
                          'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}>
                          Severity: {task.severity}
                        </span>
                      )}
                      {task.environment && (
                        <span className="text-xs px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Env: {task.environment}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Source Ticket */}
                {task.supportTicket && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                      Source Ticket
                    </h4>
                    <div
                      className="p-3 rounded-xl border flex items-center gap-3"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
                    >
                      <div className="size-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 shrink-0">
                        <span className="material-symbols-outlined text-lg">support_agent</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
                            {task.supportTicket.issueKey}
                          </span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase ${
                            task.supportTicket.status === 'resolved' || task.supportTicket.status === 'closed'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          }`}>
                            {task.supportTicket.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                          {task.supportTicket.title}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Blocked Reason */}
                {task.status === 'blocked' && task.blockedReason && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-red-500">block</span>
                      <div>
                        <h4 className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Blocked Reason</h4>
                        <p className="text-sm text-red-600 dark:text-red-400">{task.blockedReason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l p-6 space-y-5"
                style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>

                {/* Status Selector */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                    Status
                  </h4>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updating}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  >
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                {/* Assignees */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                    Team
                  </h4>
                  <div className="space-y-3">
                    {/* Implementor */}
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <span className="material-symbols-outlined text-sm">architecture</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-medium" style={{ color: 'var(--text-muted)' }}>Implementor</p>
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {task.implementorName || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                        </p>
                      </div>
                    </div>
                    {/* Developer */}
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <span className="material-symbols-outlined text-sm">code</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-medium" style={{ color: 'var(--text-muted)' }}>Developer</p>
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {task.developerName || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                        </p>
                      </div>
                    </div>
                    {/* Tester */}
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                        <span className="material-symbols-outlined text-sm">bug_report</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-medium" style={{ color: 'var(--text-muted)' }}>Tester</p>
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {task.testerName || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Story Points */}
                {task.storyPoints !== null && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                      Story Points
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-indigo-500">speed</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{task.storyPoints}</span>
                    </div>
                  </div>
                )}

                {/* Labels */}
                {task.labels && task.labels.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                      Labels
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {task.labels.map((label, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700" style={{ color: 'var(--text-secondary)' }}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="pt-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                  <div className="space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <p>Created: {formatDate(task.createdAt)}</p>
                    <p>Updated: {formatDate(task.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl mb-2" style={{ color: 'var(--text-muted)' }}>error</span>
            <p style={{ color: 'var(--text-muted)' }}>Task not found</p>
          </div>
        )}
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(20px) scale(0.98); }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .animate-fade-out { animation: fadeOut 0.2s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        .animate-slide-down { animation: slideDown 0.2s ease-out forwards; }
      `}</style>
    </div>
  )
}
