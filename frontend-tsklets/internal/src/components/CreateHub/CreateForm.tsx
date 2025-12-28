import { motion } from 'framer-motion'
import { useState } from 'react'
import { useCreateHub, CreateType } from '../../store/createHub'
import { useAuthStore } from '../../store/auth'
import { toast } from 'sonner'

interface CreateFormProps {
  type: CreateType
}

const typeConfig = {
  idea: { icon: '💡', color: 'from-yellow-500 to-amber-500', label: 'Idea' },
  requirement: { icon: '📝', color: 'from-blue-500 to-indigo-500', label: 'Requirement' },
  epic: { icon: '🎯', color: 'from-purple-500 to-pink-500', label: 'Epic' },
  feature: { icon: '✨', color: 'from-cyan-500 to-blue-500', label: 'Feature' },
  task: { icon: '✅', color: 'from-green-500 to-emerald-500', label: 'Task' },
  bug: { icon: '🐛', color: 'from-red-500 to-rose-500', label: 'Bug' },
  ticket: { icon: '🎫', color: 'from-orange-500 to-amber-500', label: 'Ticket' },
}

export default function CreateForm({ type }: CreateFormProps) {
  const { close, selectType } = useCreateHub()
  const { token } = useAuthStore()
  const [mode, setMode] = useState<'quick' | 'detailed'>('quick')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 3,
    labels: '',
    targetDate: '',
  })

  const config = typeConfig[type]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      let endpoint = ''
      const body: any = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
      }

      // Add type-specific fields
      if (type === 'requirement') {
        endpoint = '/api/requirements'
        body.productId = 1 // TODO: Get from context or user selection
        body.originalDraft = formData.description
      } else if (type === 'idea') {
        endpoint = '/api/ideas'
        body.visibility = 'private'
      } else if (type === 'epic') {
        endpoint = '/api/epics'
        body.productId = 1 // TODO: Get from context
      } else if (type === 'feature') {
        endpoint = '/api/features'
        body.epicId = 1 // TODO: Get from context or user selection
      } else if (type === 'task') {
        endpoint = '/api/tasks'
        body.featureId = 1 // TODO: Get from context
        body.type = 'task'
      } else if (type === 'bug') {
        endpoint = '/api/tasks'
        body.featureId = 1 // TODO: Get from context
        body.type = 'bug'
      } else if (type === 'ticket') {
        endpoint = '/api/tickets'
        body.clientId = 1 // TODO: Get from context
        body.productId = 1
      }

      // Add optional fields for detailed mode
      if (mode === 'detailed') {
        if (formData.labels) {
          body.labels = formData.labels.split(',').map(l => l.trim())
        }
        if (formData.targetDate) {
          body.targetDate = formData.targetDate
        }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create')
      }

      const data = await res.json()
      const createdItem = data[type] || data.idea || data.requirement || data.epic || data.feature || data.task || data.ticket

      toast.success(`${config.label} created successfully!`, {
        description: createdItem.issueKey || createdItem.title
      })

      // Close modal
      close()

      // Refresh the page or update the list
      window.location.reload()
    } catch (error: any) {
      console.error('Create error:', error)
      toast.error(`Failed to create ${config.label.toLowerCase()}`, {
        description: error.message
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6"
    >
      {/* Back button */}
      <button
        onClick={() => selectType(null)}
        className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to selection
      </button>

      {/* Header with type indicator */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`size-16 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center text-3xl shadow-lg`}>
          {config.icon}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            Create {config.label}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {mode === 'quick' ? 'Quick capture mode' : 'Detailed planning mode'}
          </p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setMode('quick')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'quick'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          ⚡ Quick Capture
        </button>
        <button
          onClick={() => setMode('detailed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'detailed'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          📋 Detailed Planning
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title - always shown */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={`What's this ${type} about?`}
            required
            autoFocus
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        {/* Description - always shown but larger in detailed mode */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Description {mode === 'detailed' && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={mode === 'quick' ? 'Optional details...' : 'Provide comprehensive details...'}
            required={mode === 'detailed'}
            rows={mode === 'quick' ? 3 : 6}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
          />
        </div>

        {/* Additional fields in detailed mode */}
        {mode === 'detailed' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-900 dark:text-white"
                >
                  <option value="0">P0 - Critical</option>
                  <option value="1">P1 - High</option>
                  <option value="2">P2 - Medium</option>
                  <option value="3">P3 - Normal</option>
                  <option value="4">P4 - Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Target Date
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Labels (comma-separated)
              </label>
              <input
                type="text"
                value={formData.labels}
                onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
                placeholder="frontend, urgent, customer-request"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <motion.button
            type="submit"
            disabled={submitting}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold text-white shadow-lg bg-gradient-to-r ${config.color} hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed`}
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
          >
            {submitting ? 'Creating...' : `Create ${config.label}`}
          </motion.button>
          <button
            type="button"
            onClick={() => selectType(null)}
            disabled={submitting}
            className="px-6 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  )
}
