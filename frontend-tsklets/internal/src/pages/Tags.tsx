import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import type { Tag } from '@tsklets/types'

const defaultColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
  '#64748b', // slate
]

export default function Tags() {
  const { token } = useAuthStore()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  useEffect(() => {
    fetchTags()
  }, [])

  async function fetchTags() {
    try {
      const res = await fetch('/api/tags', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setTags(data.tags || [])
    } catch (error) {
      console.error('Fetch tags error:', error)
      toast.error('Failed to load tags')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(tagId: number) {
    if (!confirm('Delete this tag? It will be removed from all configs.')) return

    try {
      const res = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        setTags(prev => prev.filter(t => t.id !== tagId))
        toast.success('Tag deleted')
      } else {
        toast.error('Failed to delete tag')
      }
    } catch (error) {
      toast.error('Failed to delete tag')
    }
  }

  return (
    <div className="flex h-screen bg-background-light overflow-hidden">
      <Toaster position="top-right" richColors />
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-display font-bold bg-gradient-spark bg-clip-text text-transparent mb-2">
                  <span className="inline-block animate-float">🏷️</span> Tags
                </h1>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  Organize your AI configs with tags
                </p>
              </div>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                New Tag
              </motion.button>
            </div>
          </motion.div>

          {/* Tags Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="rounded-xl border p-4 animate-pulse" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <div className="h-6 rounded w-3/4 mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                  <div className="h-4 rounded w-1/2" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                </div>
              ))}
            </div>
          ) : tags.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl border border-indigo-100"
            >
              <div className="text-8xl mb-6">🏷️</div>
              <h3 className="text-2xl font-bold font-display mb-3" style={{ color: 'var(--text-primary)' }}>
                No tags yet
              </h3>
              <p className="mb-8 max-w-md mx-auto text-lg" style={{ color: 'var(--text-secondary)' }}>
                Create tags to organize and categorize your AI configs
              </p>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary text-lg px-8 py-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create Your First Tag
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <AnimatePresence>
                {tags.map((tag, i) => (
                  <motion.div
                    key={tag.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border p-4 card-hover group relative"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: tag.color || '#6366f1' }}
                        />
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                            {tag.name}
                          </h3>
                          <code className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {tag.slug}
                          </code>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingTag(tag)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Edit tag"
                        >
                          <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--text-muted)' }}>edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(tag.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete tag"
                        >
                          <span className="material-symbols-outlined text-[18px] text-red-500">delete</span>
                        </button>
                      </div>
                    </div>

                    {tag.description && (
                      <p className="mt-2 text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {tag.description}
                      </p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingTag) && (
          <TagModal
            tag={editingTag}
            onClose={() => {
              setShowCreateModal(false)
              setEditingTag(null)
            }}
            onSaved={() => {
              setShowCreateModal(false)
              setEditingTag(null)
              fetchTags()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function TagModal({
  tag,
  onClose,
  onSaved,
}: {
  tag: Tag | null
  onClose: () => void
  onSaved: () => void
}) {
  const { token } = useAuthStore()
  const [name, setName] = useState(tag?.name || '')
  const [description, setDescription] = useState(tag?.description || '')
  const [color, setColor] = useState(tag?.color || '#6366f1')
  const [submitting, setSubmitting] = useState(false)

  const isEdit = !!tag

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    try {
      const url = isEdit ? `/api/tags/${tag.id}` : '/api/tags'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, color })
      })

      if (res.ok) {
        toast.success(isEdit ? 'Tag updated' : 'Tag created')
        onSaved()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to save tag')
      }
    } catch (error) {
      toast.error('Failed to save tag')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="rounded-2xl shadow-2xl max-w-md w-full"
        style={{ backgroundColor: 'var(--bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <h2 className="text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit Tag' : 'New Tag'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Prompts, Skills, Hooks"
              className="input-field"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="input-field"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {defaultColors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Custom:</span>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="input-field w-28 font-mono text-sm"
                placeholder="#6366f1"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
            <span className="text-sm font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              Preview
            </span>
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ backgroundColor: color, color: isLightColor(color) ? '#1f2937' : '#ffffff' }}
            >
              {name || 'Tag Name'}
            </span>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={submitting || !name.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
              whileHover={!submitting && name.trim() ? { scale: 1.02 } : {}}
              whileTap={!submitting && name.trim() ? { scale: 0.98 } : {}}
            >
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Tag'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Helper to determine if a color is light (for text contrast)
function isLightColor(color: string): boolean {
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128
}
