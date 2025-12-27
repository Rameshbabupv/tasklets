import { motion, AnimatePresence } from 'framer-motion'

interface ItemDetail {
  id: number
  title: string
  description?: string | null
  status?: string
  priority?: number
  type?: string
  storyPoints?: number | null
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
  done: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
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
            </div>
          </div>

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
