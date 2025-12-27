import { motion, AnimatePresence } from 'framer-motion'

interface ItemDetail {
  id: number
  title: string
  description?: string | null
  status?: string
  priority?: number
  type?: string
  storyPoints?: number | null
  issueKey?: string
  // Task fields
  estimate?: number | null
  actualTime?: number | null
  dueDate?: string | null
  labels?: string[] | null
  blockedReason?: string | null
  // Bug-specific
  severity?: 'critical' | 'major' | 'minor' | 'trivial' | null
  environment?: 'production' | 'staging' | 'development' | 'local' | null
  // Epic/Feature fields
  targetDate?: string | null
  startDate?: string | null
  color?: string | null
  progress?: number | null
  acceptanceCriteria?: string | null
  // Resolution
  resolution?: string | null
  resolutionNote?: string | null
  closedAt?: string | null
  // Metadata
  metadata?: Record<string, any> | null
  createdAt?: string
  updatedAt?: string
}

interface ItemDetailModalProps {
  item: ItemDetail | null
  itemType: 'epic' | 'feature' | 'task'
  onClose: () => void
}

const priorityLabels: Record<number, { label: string; color: string }> = {
  1: { label: 'P1 - Critical', color: 'bg-red-100 text-red-700' },
  2: { label: 'P2 - High', color: 'bg-amber-100 text-amber-700' },
  3: { label: 'P3 - Medium', color: 'bg-blue-100 text-blue-700' },
  4: { label: 'P4 - Low', color: 'bg-slate-100 text-slate-600' },
}

const statusColors: Record<string, string> = {
  backlog: 'bg-slate-100 text-slate-700',
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-purple-100 text-purple-700',
  blocked: 'bg-red-100 text-red-700',
  done: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  major: 'bg-orange-100 text-orange-700',
  minor: 'bg-yellow-100 text-yellow-700',
  trivial: 'bg-slate-100 text-slate-600',
}

const environmentColors: Record<string, string> = {
  production: 'bg-red-100 text-red-700',
  staging: 'bg-amber-100 text-amber-700',
  development: 'bg-blue-100 text-blue-700',
  local: 'bg-slate-100 text-slate-600',
}

const typeIcons: Record<string, string> = {
  epic: 'bolt',
  feature: 'category',
  task: 'task_alt',
  bug: 'bug_report',
}

export default function ItemDetailModal({ item, itemType, onClose }: ItemDetailModalProps) {
  if (!item) return null

  const priority = priorityLabels[item.priority || 3]
  const statusColor = statusColors[item.status || 'backlog'] || 'bg-slate-100 text-slate-700'

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl"
          style={{ backgroundColor: 'var(--bg-card)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="size-10 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined">{typeIcons[item.type || itemType]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                      {itemType} #{item.id}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                {(item.status || 'backlog').replace('_', ' ')}
              </span>
              {priority && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${priority.color}`}>
                  {priority.label}
                </span>
              )}
              {item.type && itemType === 'task' && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  item.type === 'bug' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {item.type}
                </span>
              )}
              {item.storyPoints && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  {item.storyPoints} pts
                </span>
              )}
              {/* Bug-specific badges */}
              {item.type === 'bug' && item.severity && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${severityColors[item.severity] || 'bg-slate-100 text-slate-600'}`}>
                  {item.severity}
                </span>
              )}
              {item.type === 'bug' && item.environment && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${environmentColors[item.environment] || 'bg-slate-100 text-slate-600'}`}>
                  {item.environment}
                </span>
              )}
              {/* Labels */}
              {item.labels && item.labels.length > 0 && item.labels.map((label: string) => (
                <span key={label} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Blocked Reason */}
          {item.status === 'blocked' && item.blockedReason && (
            <div className="px-6 pt-4">
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-700">
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  Blocked
                </h3>
                <p className="text-sm text-red-600">{item.blockedReason}</p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="p-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <span className="material-symbols-outlined text-[18px]">description</span>
              Description
            </h3>
            {item.description ? (
              <div
                className="prose prose-sm max-w-none p-4 rounded-lg"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              >
                <p className="whitespace-pre-wrap m-0">{item.description}</p>
              </div>
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                No description provided
              </p>
            )}
          </div>

          {/* Epic/Feature Progress Bar */}
          {(itemType === 'epic' || itemType === 'feature') && typeof item.progress === 'number' && (
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Progress</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-500"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Epic/Feature Details Grid */}
          {(itemType === 'epic' || itemType === 'feature') && (item.targetDate || item.startDate || item.resolution) && (
            <div className="px-6 pb-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                Timeline
              </h3>
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {item.startDate && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Start Date</span>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {new Date(item.startDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {item.targetDate && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Target Date</span>
                    <p className={`text-sm font-semibold ${
                      new Date(item.targetDate) < new Date() && item.status !== 'completed'
                        ? 'text-red-600'
                        : ''
                    }`} style={new Date(item.targetDate) >= new Date() || item.status === 'completed' ? { color: 'var(--text-primary)' } : {}}>
                      {new Date(item.targetDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {item.resolution && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Resolution</span>
                    <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                      {item.resolution.replace('_', ' ')}
                    </p>
                  </div>
                )}
                {item.closedAt && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Closed</span>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {new Date(item.closedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              {item.resolutionNote && (
                <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Resolution Note</span>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{item.resolutionNote}</p>
                </div>
              )}
            </div>
          )}

          {/* Acceptance Criteria (Feature only) */}
          {itemType === 'feature' && item.acceptanceCriteria && (
            <div className="px-6 pb-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="material-symbols-outlined text-[18px]">checklist</span>
                Acceptance Criteria
              </h3>
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{item.acceptanceCriteria}</p>
              </div>
            </div>
          )}

          {/* Task Details Grid */}
          {itemType === 'task' && (item.estimate || item.actualTime || item.dueDate || item.resolution) && (
            <div className="px-6 pb-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="material-symbols-outlined text-[18px]">info</span>
                Details
              </h3>
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {item.estimate && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Estimate</span>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.estimate}h</p>
                  </div>
                )}
                {item.actualTime && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Actual Time</span>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.actualTime}h</p>
                  </div>
                )}
                {item.dueDate && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Due Date</span>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {new Date(item.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {item.resolution && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Resolution</span>
                    <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                      {item.resolution.replace('_', ' ')}
                    </p>
                  </div>
                )}
              </div>
              {item.resolutionNote && (
                <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Resolution Note</span>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{item.resolutionNote}</p>
                </div>
              )}
            </div>
          )}

          {/* Metadata (LOC stats, etc.) */}
          {item.metadata && Object.keys(item.metadata).length > 0 && (
            <div className="px-6 pb-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="material-symbols-outlined text-[18px]">code</span>
                Metadata
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {item.metadata.linesAdded !== undefined && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <span className="text-xs font-medium text-green-600">Lines Added</span>
                    <p className="text-lg font-bold text-green-700">+{item.metadata.linesAdded}</p>
                  </div>
                )}
                {item.metadata.linesDeleted !== undefined && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <span className="text-xs font-medium text-red-600">Lines Deleted</span>
                    <p className="text-lg font-bold text-red-700">-{item.metadata.linesDeleted}</p>
                  </div>
                )}
                {item.metadata.filesChanged !== undefined && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <span className="text-xs font-medium text-blue-600">Files Changed</span>
                    <p className="text-lg font-bold text-blue-700">{item.metadata.filesChanged}</p>
                  </div>
                )}
                {item.metadata.sourceTicketId && (
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Source Ticket</span>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>#{item.metadata.sourceTicketId}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {item.createdAt && (
                <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
