import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/auth'

// Types for changelog entries
export type ChangeType =
  | 'created'
  | 'status_changed'
  | 'priority_changed'
  | 'severity_changed'
  | 'comment_added'
  | 'attachment_added'
  | 'watcher_added'
  | 'watcher_removed'
  | 'escalated'
  | 'assigned'
  | 'pushed_to_systech'
  | 'resolved'
  | 'reopened'

export interface ChangelogEntry {
  id: number
  ticketId: string
  changeType: ChangeType
  userId: number
  userName: string
  userEmail?: string
  oldValue?: string | null
  newValue?: string | null
  metadata?: Record<string, any>
  createdAt: string
}

// Configuration for each change type
const changeConfig: Record<ChangeType, {
  icon: string
  label: string
  bgColor: string
  textColor: string
  borderColor: string
  iconBg: string
}> = {
  created: {
    icon: 'add_circle',
    label: 'Created',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-500',
  },
  status_changed: {
    icon: 'swap_horiz',
    label: 'Status',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-500',
  },
  priority_changed: {
    icon: 'priority_high',
    label: 'Priority',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    textColor: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-500',
  },
  severity_changed: {
    icon: 'warning',
    label: 'Severity',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-700 dark:text-orange-300',
    borderColor: 'border-orange-200 dark:border-orange-800',
    iconBg: 'bg-orange-500',
  },
  comment_added: {
    icon: 'chat_bubble',
    label: 'Comment',
    bgColor: 'bg-slate-50 dark:bg-slate-800/50',
    textColor: 'text-slate-700 dark:text-slate-300',
    borderColor: 'border-slate-200 dark:border-slate-700',
    iconBg: 'bg-slate-500',
  },
  attachment_added: {
    icon: 'attach_file',
    label: 'Attachment',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    textColor: 'text-violet-700 dark:text-violet-300',
    borderColor: 'border-violet-200 dark:border-violet-800',
    iconBg: 'bg-violet-500',
  },
  watcher_added: {
    icon: 'visibility',
    label: 'Watcher Added',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    iconBg: 'bg-cyan-500',
  },
  watcher_removed: {
    icon: 'visibility_off',
    label: 'Watcher Removed',
    bgColor: 'bg-slate-50 dark:bg-slate-800/50',
    textColor: 'text-slate-600 dark:text-slate-400',
    borderColor: 'border-slate-200 dark:border-slate-700',
    iconBg: 'bg-slate-400',
  },
  escalated: {
    icon: 'local_fire_department',
    label: 'Escalated',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-red-200 dark:border-red-800',
    iconBg: 'bg-gradient-to-br from-red-500 to-orange-500',
  },
  assigned: {
    icon: 'person_add',
    label: 'Assigned',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    iconBg: 'bg-indigo-500',
  },
  pushed_to_systech: {
    icon: 'send',
    label: 'Pushed to Systech',
    bgColor: 'bg-sky-50 dark:bg-sky-900/20',
    textColor: 'text-sky-700 dark:text-sky-300',
    borderColor: 'border-sky-200 dark:border-sky-800',
    iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600',
  },
  resolved: {
    icon: 'check_circle',
    label: 'Resolved',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-500',
  },
  reopened: {
    icon: 'refresh',
    label: 'Reopened',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    textColor: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-500',
  },
}

// Format status for display
function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// Format priority for display
function formatPriority(priority: string | number): string {
  const p = typeof priority === 'string' ? parseInt(priority) : priority
  const labels: Record<number, string> = {
    1: 'P1 - Critical',
    2: 'P2 - High',
    3: 'P3 - Medium',
    4: 'P4 - Low',
  }
  return labels[p] || `P${p}`
}

// Relative time formatting
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  return `${diffMonths}mo ago`
}

// Full date formatting
function getFullDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Generate a consistent color from a string (for avatars)
function stringToColor(str: string): string {
  const colors = [
    'bg-rose-500',
    'bg-pink-500',
    'bg-fuchsia-500',
    'bg-purple-500',
    'bg-violet-500',
    'bg-indigo-500',
    'bg-blue-500',
    'bg-sky-500',
    'bg-cyan-500',
    'bg-teal-500',
    'bg-emerald-500',
    'bg-green-500',
    'bg-lime-500',
    'bg-amber-500',
    'bg-orange-500',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// Build the change description
function getChangeDescription(entry: ChangelogEntry): React.ReactNode {
  const config = changeConfig[entry.changeType]

  switch (entry.changeType) {
    case 'created':
      return <span>created this ticket</span>

    case 'status_changed':
      return (
        <span className="flex items-center gap-2 flex-wrap">
          <span>changed status from</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-xs font-medium line-through opacity-70">
            {formatStatus(entry.oldValue || '')}
          </span>
          <span className="material-symbols-outlined text-sm text-slate-400">arrow_forward</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            {formatStatus(entry.newValue || '')}
          </span>
        </span>
      )

    case 'priority_changed':
      return (
        <span className="flex items-center gap-2 flex-wrap">
          <span>changed priority from</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-xs font-medium line-through opacity-70">
            {formatPriority(entry.oldValue || '')}
          </span>
          <span className="material-symbols-outlined text-sm text-slate-400">arrow_forward</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-semibold">
            {formatPriority(entry.newValue || '')}
          </span>
        </span>
      )

    case 'severity_changed':
      return (
        <span className="flex items-center gap-2 flex-wrap">
          <span>changed severity from</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-xs font-medium line-through opacity-70">
            S{entry.oldValue}
          </span>
          <span className="material-symbols-outlined text-sm text-slate-400">arrow_forward</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-xs font-semibold">
            S{entry.newValue}
          </span>
        </span>
      )

    case 'comment_added':
      return (
        <span className="flex flex-col gap-1">
          <span>added a comment</span>
          {entry.metadata?.preview && (
            <span className="text-xs text-slate-500 dark:text-slate-400 italic truncate max-w-xs">
              "{entry.metadata.preview}"
            </span>
          )}
        </span>
      )

    case 'attachment_added':
      return (
        <span className="flex items-center gap-2">
          <span>added an attachment</span>
          {entry.metadata?.fileName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-medium">
              <span className="material-symbols-outlined text-xs">description</span>
              {entry.metadata.fileName}
            </span>
          )}
        </span>
      )

    case 'watcher_added':
      return (
        <span className="flex items-center gap-2">
          <span>added</span>
          <span className="font-semibold">{entry.newValue}</span>
          <span>as a watcher</span>
        </span>
      )

    case 'watcher_removed':
      return (
        <span className="flex items-center gap-2">
          <span>removed</span>
          <span className="font-semibold">{entry.oldValue}</span>
          <span>from watchers</span>
        </span>
      )

    case 'escalated':
      return (
        <span className="flex flex-col gap-1">
          <span className="flex items-center gap-2">
            <span>escalated this ticket</span>
            {entry.metadata?.reason && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold">
                {entry.metadata.reason.replace(/_/g, ' ')}
              </span>
            )}
          </span>
          {entry.metadata?.note && (
            <span className="text-xs text-slate-500 dark:text-slate-400 italic">
              Note: {entry.metadata.note}
            </span>
          )}
        </span>
      )

    case 'assigned':
      return (
        <span className="flex items-center gap-2">
          <span>assigned ticket to</span>
          <span className="font-semibold">{entry.newValue}</span>
        </span>
      )

    case 'pushed_to_systech':
      return <span>pushed this ticket to Systech</span>

    case 'resolved':
      return (
        <span className="flex items-center gap-2">
          <span>resolved this ticket</span>
          {entry.metadata?.resolution && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              {entry.metadata.resolution.replace(/_/g, ' ')}
            </span>
          )}
        </span>
      )

    case 'reopened':
      return <span>reopened this ticket</span>

    default:
      return <span>made a change</span>
  }
}

interface TicketChangelogProps {
  ticketId: string
  className?: string
}

export default function TicketChangelog({ ticketId, className = '' }: TicketChangelogProps) {
  const { token } = useAuthStore()
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hideComments, setHideComments] = useState(true)

  useEffect(() => {
    fetchChangelog()
  }, [ticketId])

  const fetchChangelog = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/changelog`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch changelog')
      const data = await res.json()
      setEntries(data.changelog || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load changelog')
      // For demo, set mock data
      setEntries(getMockData())
    } finally {
      setLoading(false)
    }
  }

  // Filter entries based on hideComments checkbox
  const filteredEntries = hideComments
    ? entries.filter(e => e.changeType !== 'comment_added')
    : entries

  const commentCount = entries.filter(e => e.changeType === 'comment_added').length

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-16 ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 rounded-full" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading changelog...</p>
        </div>
      </div>
    )
  }

  if (error && entries.length === 0) {
    return (
      <div className={`flex items-center justify-center py-16 ${className}`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-red-500">error</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Failed to load changelog</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchChangelog}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header with checkbox filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
            <span className="material-symbols-outlined text-xl text-slate-600 dark:text-slate-300">history</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Activity Log</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
              {hideComments && commentCount > 0 && ` • ${commentCount} comment${commentCount > 1 ? 's' : ''} hidden`}
            </p>
          </div>
        </div>

        {/* Hide comments checkbox */}
        {commentCount > 0 && (
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <input
              type="checkbox"
              checked={hideComments}
              onChange={(e) => setHideComments(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none">
              Hide comments
            </span>
          </label>
        )}
      </div>

      {/* Timeline */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-slate-400">inbox</span>
          </div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">No activity yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Changes to this ticket will appear here
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-slate-300 via-slate-200 to-transparent dark:from-slate-600 dark:via-slate-700" />

          {/* Entries */}
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {filteredEntries.map((entry, index) => {
                const config = changeConfig[entry.changeType]
                const isFirst = index === 0
                const isLast = index === filteredEntries.length - 1

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    className="relative group"
                  >
                    {/* Timeline node */}
                    <div className="absolute left-0 top-4 z-10">
                      <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-slate-900 transition-transform group-hover:scale-110`}>
                        <span className="material-symbols-outlined text-lg text-white">
                          {config.icon}
                        </span>
                      </div>
                    </div>

                    {/* Content card */}
                    <div className={`ml-14 p-4 rounded-xl border ${config.borderColor} ${config.bgColor} transition-all group-hover:shadow-md`}>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* User avatar */}
                          <div className={`shrink-0 w-7 h-7 rounded-full ${stringToColor(entry.userName)} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                            {getInitials(entry.userName)}
                          </div>
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {entry.userName}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <div className="shrink-0 relative group/time">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tabular-nums">
                            {getRelativeTime(entry.createdAt)}
                          </span>
                          {/* Tooltip with full date */}
                          <div className="absolute right-0 top-full mt-1 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover/time:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-xl">
                            {getFullDate(entry.createdAt)}
                            <div className="absolute -top-1 right-3 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45" />
                          </div>
                        </div>
                      </div>

                      {/* Change description */}
                      <div className={`text-sm ${config.textColor}`}>
                        {getChangeDescription(entry)}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* End of timeline marker */}
          <div className="relative mt-4 ml-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Mock data for demo/development
function getMockData(): ChangelogEntry[] {
  const now = new Date()
  return [
    {
      id: 1,
      ticketId: 'demo',
      changeType: 'created',
      userId: 1,
      userName: 'John Smith',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      ticketId: 'demo',
      changeType: 'status_changed',
      userId: 2,
      userName: 'Sarah Connor',
      oldValue: 'open',
      newValue: 'in_progress',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      ticketId: 'demo',
      changeType: 'attachment_added',
      userId: 1,
      userName: 'John Smith',
      metadata: { fileName: 'screenshot.png' },
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
    },
    {
      id: 4,
      ticketId: 'demo',
      changeType: 'priority_changed',
      userId: 3,
      userName: 'Mike Johnson',
      oldValue: '3',
      newValue: '1',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 5,
      ticketId: 'demo',
      changeType: 'escalated',
      userId: 3,
      userName: 'Mike Johnson',
      metadata: { reason: 'production_down', note: 'Customer operations affected' },
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 1800000).toISOString(),
    },
    {
      id: 6,
      ticketId: 'demo',
      changeType: 'comment_added',
      userId: 2,
      userName: 'Sarah Connor',
      metadata: { preview: 'Looking into this issue now...' },
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 7,
      ticketId: 'demo',
      changeType: 'watcher_added',
      userId: 3,
      userName: 'Mike Johnson',
      newValue: 'Alice Brown',
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 8,
      ticketId: 'demo',
      changeType: 'assigned',
      userId: 2,
      userName: 'Sarah Connor',
      newValue: 'Dev Team Alpha',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 9,
      ticketId: 'demo',
      changeType: 'status_changed',
      userId: 4,
      userName: 'Dev Team Alpha',
      oldValue: 'in_progress',
      newValue: 'resolved',
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
  ]
}
