import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/auth'
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
  comments: Comment[]
  reactions: Reaction[]
}

interface Comment {
  id: number
  comment: string
  createdAt: string
  user: {
    id: number
    name: string
    email: string
  }
}

interface Reaction {
  id: number
  reaction: 'thumbs_up' | 'heart' | 'fire'
  user: {
    id: number
    name: string
  }
}

const statusOptions = [
  { value: 'inbox', label: 'Inbox', icon: 'inbox', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'discussing', label: 'Discussing', icon: 'forum', color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-500' },
  { value: 'vetted', label: 'Vetted', icon: 'verified', color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500' },
  { value: 'in_progress', label: 'In Progress', icon: 'pending', color: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-500' },
  { value: 'shipped', label: 'Shipped', icon: 'rocket_launch', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500' },
]

const reactionEmojis = {
  thumbs_up: '👍',
  heart: '❤️',
  fire: '🔥',
}

export default function IdeaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuthStore()
  const [idea, setIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    fetchIdea()
  }, [id])

  async function fetchIdea() {
    try {
      const res = await fetch(`http://localhost:4000/api/ideas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setIdea(data.idea)
    } catch (error) {
      console.error('Fetch idea error:', error)
      toast.error('Failed to load idea')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(status: string) {
    try {
      const res = await fetch(`http://localhost:4000/api/ideas/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        fetchIdea()
        toast.success(`Status updated to ${status.replace('_', ' ')}!`)

        // Celebration for shipped
        if (status === 'shipped') {
          toast.success('🎉 Idea shipped! Amazing work!', {
            duration: 5000,
          })
        }
      }
    } catch (error) {
      console.error('Update status error:', error)
      toast.error('Failed to update status')
    }
  }

  async function updateVisibility(visibility: string) {
    try {
      const res = await fetch(`http://localhost:4000/api/ideas/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ visibility })
      })
      if (res.ok) {
        fetchIdea()
        toast.success(`Visibility updated to ${visibility}!`)
      }
    } catch (error) {
      console.error('Update visibility error:', error)
      toast.error('Failed to update visibility')
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return

    setSubmittingComment(true)
    try {
      const res = await fetch(`http://localhost:4000/api/ideas/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comment: commentText })
      })
      if (res.ok) {
        setCommentText('')
        fetchIdea()
        toast.success('Comment added!')
      }
    } catch (error) {
      console.error('Add comment error:', error)
      toast.error('Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  async function toggleReaction(reaction: 'thumbs_up' | 'heart' | 'fire') {
    try {
      await fetch(`http://localhost:4000/api/ideas/${id}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reaction })
      })
      fetchIdea()
    } catch (error) {
      console.error('Toggle reaction error:', error)
      toast.error('Failed to toggle reaction')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <Toaster position="top-right" richColors />
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="inline-block animate-float text-6xl mb-4">💡</div>
            <p className="text-slate-500 text-lg">Loading idea...</p>
          </motion.div>
        </main>
      </div>
    )
  }

  if (!idea) {
    return (
      <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <Toaster position="top-right" richColors />
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Idea not found</h2>
            <button onClick={() => navigate('/ideas')} className="btn-primary">
              Back to Ideas
            </button>
          </motion.div>
        </main>
      </div>
    )
  }

  const isCreator = user?.userId === idea.createdBy
  const isAdmin = user?.role === 'admin' || user?.isInternal

  // Group reactions by type
  const reactionCounts = idea.reactions.reduce((acc, r) => {
    acc[r.reaction] = (acc[r.reaction] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const userReactions = idea.reactions
    .filter(r => r.user.id === user?.userId)
    .map(r => r.reaction)

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <Toaster position="top-right" richColors />
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/ideas')}
            className="flex items-center gap-2 text-slate-600 hover:text-primary mb-6 transition-colors group"
          >
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform" aria-hidden="true">arrow_back</span>
            <span className="font-medium">Back to Ideas</span>
          </motion.button>

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-200 bg-gradient-to-br from-white to-purple-50/20">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-display font-bold text-slate-900 mb-3">{idea.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
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

                {/* Edit button */}
                {(isCreator || isAdmin) && (
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-slate-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-purple-50"
                    aria-label="Edit idea"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                  </motion.button>
                )}
              </div>

              {/* Status progression */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {statusOptions.map((s, idx) => {
                  const isActive = s.value === idea.status
                  const isPast = statusOptions.findIndex(x => x.value === idea.status) > idx
                  return (
                    <div key={s.value} className="flex items-center gap-2">
                      <motion.button
                        onClick={() => isCreator || isAdmin ? updateStatus(s.value) : null}
                        disabled={!isCreator && !isAdmin}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${
                          isActive
                            ? s.color + ' shadow-lg'
                            : isPast
                            ? 'bg-slate-100 text-slate-400 border-slate-200'
                            : 'bg-white text-slate-500 hover:bg-gradient-shimmer border-slate-200 hover:border-primary/30'
                        } ${isCreator || isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                        whileHover={isCreator || isAdmin ? { scale: 1.05 } : {}}
                        whileTap={isCreator || isAdmin ? { scale: 0.95 } : {}}
                      >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{s.icon}</span>
                        <span>{s.label}</span>
                      </motion.button>
                      {idx < statusOptions.length - 1 && (
                        <span className="material-symbols-outlined text-slate-300" aria-hidden="true">arrow_forward</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Description */}
            {idea.description && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-8 border-b border-slate-200"
              >
                <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">{idea.description}</p>
              </motion.div>
            )}

            {/* Visibility & Reactions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-8 border-b border-slate-200 space-y-6"
            >
              {/* Visibility */}
              <div>
                <label htmlFor="visibility-select" className="block text-sm font-bold text-slate-700 mb-3">
                  Visibility
                </label>
                <select
                  id="visibility-select"
                  value={idea.visibility}
                  onChange={(e) => updateVisibility(e.target.value)}
                  disabled={!isCreator && !isAdmin}
                  className="input-field max-w-xs"
                >
                  <option value="private">🔒 Private (just me)</option>
                  <option value="team">👥 Team (coming soon)</option>
                  <option value="public">🌐 Public (everyone)</option>
                </select>
              </div>

              {/* Reactions */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Reactions</label>
                <div className="flex gap-3">
                  {Object.entries(reactionEmojis).map(([key, emoji]) => {
                    const count = reactionCounts[key] || 0
                    const hasReacted = userReactions.includes(key as any)
                    return (
                      <motion.button
                        key={key}
                        onClick={() => toggleReaction(key as any)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-all ${
                          hasReacted
                            ? 'border-primary bg-gradient-spark text-white shadow-lg shadow-primary/30'
                            : 'border-slate-200 hover:border-primary/50 hover:bg-gradient-shimmer'
                        }`}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label={`${hasReacted ? 'Remove' : 'Add'} ${key} reaction`}
                      >
                        <span className="text-2xl">{emoji}</span>
                        <span className={`font-bold text-lg ${hasReacted ? 'text-white' : 'text-slate-700'}`}>{count}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>

            {/* Comments */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="p-8"
            >
              <h3 className="text-xl font-display font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span>💬 Comments</span>
                <span className="text-sm font-normal text-slate-500">({idea.commentCount})</span>
              </h3>

              {/* Add comment form */}
              <form onSubmit={addComment} className="mb-8">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add your thoughts..."
                  className="input-field min-h-[120px] mb-3"
                  rows={4}
                  aria-label="Add comment"
                />
                <motion.button
                  type="submit"
                  disabled={!commentText.trim() || submittingComment}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={commentText.trim() && !submittingComment ? { scale: 1.05 } : {}}
                  whileTap={commentText.trim() && !submittingComment ? { scale: 0.95 } : {}}
                >
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </motion.button>
              </form>

              {/* Comments list */}
              <div className="space-y-4">
                <AnimatePresence>
                  {idea.comments.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 bg-gradient-to-br from-slate-50 to-purple-50/20 rounded-xl border border-slate-200"
                    >
                      <div className="text-4xl mb-3">💬</div>
                      <p className="text-slate-500">
                        No comments yet. Be the first to share your thoughts!
                      </p>
                    </motion.div>
                  ) : (
                    idea.comments.map((comment, i) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="size-10 rounded-full bg-gradient-spark flex items-center justify-center text-white text-lg font-bold shadow-md">
                            {comment.user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{comment.user.name}</div>
                            <div className="text-xs text-slate-500">
                              {new Date(comment.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{comment.comment}</p>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
