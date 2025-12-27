import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/auth'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, Toaster } from 'sonner'

interface Idea {
  id: number
  title: string
  description: string | null
  status: 'inbox' | 'discussing' | 'vetted' | 'in_progress' | 'shipped' | 'archived'
  visibility: 'private' | 'team' | 'public'
  teamId: number | null
  createdBy: number
  createdAt: string
  publishedAt: string | null
  voteCount: number
  commentCount: number
  creator: {
    id: number
    name: string
    email: string
  }
  team: {
    id: number
    name: string
  } | null
}

const statusColors = {
  inbox: 'bg-slate-100 text-slate-700 border-slate-200',
  discussing: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-500',
  vetted: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500',
  in_progress: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-500',
  shipped: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500',
  archived: 'bg-gray-100 text-gray-500 border-gray-200',
}

const visibilityIcons = {
  private: { icon: 'lock', color: 'text-slate-500', label: 'Private', bgColor: 'bg-slate-100' },
  team: { icon: 'group', color: 'text-blue-600', label: 'Team', bgColor: 'bg-blue-100' },
  public: { icon: 'public', color: 'text-green-600', label: 'Public', bgColor: 'bg-green-100' },
}

export default function Ideas() {
  const { token } = useAuthStore()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'my' | 'team' | 'private'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchIdeas()
  }, [])

  async function fetchIdeas() {
    try {
      const res = await fetch('http://localhost:4000/api/ideas', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setIdeas(data.ideas || [])
    } catch (error) {
      console.error('Fetch ideas error:', error)
      toast.error('Failed to load ideas')
    } finally {
      setLoading(false)
    }
  }

  const filteredIdeas = ideas.filter(idea => {
    if (statusFilter !== 'all' && idea.status !== statusFilter) {
      return false
    }
    if (filter === 'private' && idea.visibility !== 'private') {
      return false
    }
    if (filter === 'team' && idea.visibility !== 'team') {
      return false
    }
    return true
  })

  return (
    <div className="flex h-screen bg-background-light overflow-hidden">
      <Toaster position="top-right" richColors />
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header with gradient */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-display font-bold bg-gradient-spark bg-clip-text text-transparent mb-2">
                  <span className="inline-block animate-float">💡</span> SPARK Ideas
                </h1>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Capture ideas without constraints. Vet them with your team.</p>
              </div>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-2 relative overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                New Idea
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
              </motion.button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center flex-wrap">
              {/* Tab filters */}
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'my', label: 'My Ideas' },
                  { key: 'team', label: 'Team' },
                  { key: 'private', label: 'Private' },
                ].map(tab => (
                  <motion.button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === tab.key
                        ? 'bg-gradient-spark text-white shadow-lg shadow-primary/30'
                        : 'hover:bg-gradient-shimmer border hover:border-primary/30'
                    }`}
                    style={filter !== tab.key ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' } : {}}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tab.label}
                  </motion.button>
                ))}
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
              >
                <option value="all">All Status</option>
                <option value="inbox">Inbox</option>
                <option value="discussing">Discussing</option>
                <option value="vetted">Vetted</option>
                <option value="in_progress">In Progress</option>
                <option value="shipped">Shipped</option>
              </select>
            </div>
          </motion.div>

          {/* Ideas Grid */}
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl border p-6 animate-pulse" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <div className="h-6 rounded w-3/4 mb-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                  <div className="h-4 rounded w-1/2 mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                  <div className="flex gap-4">
                    <div className="h-4 rounded w-24" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                    <div className="h-4 rounded w-24" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredIdeas.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-20 bg-gradient-to-br from-white to-purple-50/30 rounded-2xl border border-purple-100 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-spark opacity-5"></div>
              <div className="relative">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-yellow-200 rounded-full blur-3xl opacity-30 animate-pulse-slow"></div>
                  <div className="relative text-8xl animate-float">💡</div>
                </div>
                <h3 className="text-2xl font-bold font-display mb-3" style={{ color: 'var(--text-primary)' }}>
                  No ideas yet
                </h3>
                <p className="mb-8 max-w-md mx-auto text-lg" style={{ color: 'var(--text-secondary)' }}>
                  Start capturing your brilliant thoughts! Ideas can be kept private, shared with your team, or published for everyone.
                </p>
                <motion.button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary text-lg px-8 py-3"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create Your First Idea
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {filteredIdeas.map((idea, i) => (
                  <motion.div
                    key={idea.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <Link
                      to={`/ideas/${idea.id}`}
                      className="block rounded-xl border p-6 card-hover relative overflow-hidden group"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                    >
                      <div className="absolute inset-0 bg-gradient-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <h3 className="text-lg font-bold font-display mb-2 truncate" style={{ color: 'var(--text-primary)' }}>
                            {idea.title}
                          </h3>

                          {/* Description */}
                          {idea.description && (
                            <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                              {idea.description}
                            </p>
                          )}

                          {/* Meta */}
                          <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person</span>
                              <span>{idea.creator.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">schedule</span>
                              <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right side: Status, visibility, stats */}
                        <div className="flex flex-col items-end gap-3">
                          {/* Visibility */}
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${visibilityIcons[idea.visibility].bgColor}`}>
                            <span className={`material-symbols-outlined text-[18px] ${visibilityIcons[idea.visibility].color}`} aria-hidden="true">
                              {visibilityIcons[idea.visibility].icon}
                            </span>
                            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                              {idea.visibility === 'team' && idea.team ? idea.team.name : visibilityIcons[idea.visibility].label}
                            </span>
                          </div>

                          {/* Status */}
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 ${statusColors[idea.status]} shadow-sm`}>
                            {idea.status.replace('_', ' ').toUpperCase()}
                          </span>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">thumb_up</span>
                              <span className="font-medium">{idea.voteCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">comment</span>
                              <span className="font-medium">{idea.commentCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateIdeaModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false)
              fetchIdeas()
              toast.success('💡 Idea created successfully!')
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Modal component
function CreateIdeaModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const { token } = useAuthStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'team' | 'public'>('private')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('http://localhost:4000/api/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, visibility })
      })

      if (res.ok) {
        onCreated()
      } else {
        toast.error('Failed to create idea')
      }
    } catch (error) {
      console.error('Create idea error:', error)
      toast.error('Failed to create idea')
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
        transition={{ type: 'spring', duration: 0.3 }}
        className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50" style={{ borderColor: 'var(--border-primary)' }}>
          <h2 className="text-2xl font-display font-bold bg-gradient-spark bg-clip-text text-transparent">
            💡 New Idea
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-all hover:bg-white"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="idea-title" className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Title *
            </label>
            <input
              id="idea-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Add dark mode support"
              className="input-field"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="idea-description" className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Description
            </label>
            <textarea
              id="idea-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your idea in detail..."
              className="input-field min-h-[120px]"
              rows={5}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              Who can see this?
            </label>
            <div className="space-y-3">
              {[
                { value: 'private', icon: 'lock', label: 'Private', desc: 'Just me for now' },
                { value: 'team', icon: 'group', label: 'Team', desc: 'Share with my team (coming soon)' },
                { value: 'public', icon: 'public', label: 'Public', desc: 'Everyone in organization' },
              ].map(option => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    visibility === option.value
                      ? 'border-primary bg-gradient-shimmer shadow-md'
                      : 'hover:border-primary/30'
                  } ${option.value === 'team' ? 'opacity-60' : ''}`}
                  style={visibility !== option.value ? { borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' } : {}}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={visibility === option.value}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="mt-1 focus:ring-2 focus:ring-primary"
                    disabled={option.value === 'team'}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{option.icon}</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{option.label}</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={submitting || !title.trim()}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!submitting && title.trim() ? { scale: 1.02 } : {}}
              whileTap={!submitting && title.trim() ? { scale: 0.98 } : {}}
            >
              {submitting ? 'Creating...' : 'Create Idea'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
