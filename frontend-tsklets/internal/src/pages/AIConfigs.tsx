import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/auth'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import type { AiConfig, AiConfigContentType, AiConfigVisibility, Tag } from '@tsklets/types'

const contentTypeIcons: Record<AiConfigContentType, { icon: string; label: string; color: string }> = {
  json: { icon: 'data_object', label: 'JSON', color: 'text-yellow-600' },
  yaml: { icon: 'settings_suggest', label: 'YAML', color: 'text-blue-600' },
  markdown: { icon: 'description', label: 'Markdown', color: 'text-purple-600' },
  text: { icon: 'notes', label: 'Text', color: 'text-slate-600' },
}

const visibilityIcons: Record<AiConfigVisibility, { icon: string; label: string; color: string; bgColor: string }> = {
  private: { icon: 'lock', label: 'Private', color: 'text-slate-500', bgColor: 'bg-slate-100' },
  team: { icon: 'group', label: 'Team', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  public: { icon: 'public', label: 'Public', color: 'text-green-600', bgColor: 'bg-green-100' },
}

export default function AIConfigs() {
  const { token } = useAuthStore()
  const [configs, setConfigs] = useState<AiConfig[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'my' | 'favorites'>('all')
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchConfigs()
    fetchTags()
  }, [])

  async function fetchConfigs() {
    try {
      const params = new URLSearchParams()
      if (filter === 'favorites') params.append('favorites', 'true')
      if (visibilityFilter !== 'all') params.append('visibility', visibilityFilter)
      if (tagFilter !== 'all') params.append('tags', tagFilter)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/ai-configs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setConfigs(data.configs || [])
    } catch (error) {
      console.error('Fetch configs error:', error)
      toast.error('Failed to load AI configs')
    } finally {
      setLoading(false)
    }
  }

  async function fetchTags() {
    try {
      const res = await fetch('/api/tags', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setTags(data.tags || [])
    } catch (error) {
      console.error('Fetch tags error:', error)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchConfigs()
    }, 300)
    return () => clearTimeout(timeout)
  }, [filter, visibilityFilter, tagFilter, searchQuery])

  async function toggleFavorite(configId: number, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    try {
      const res = await fetch(`/api/ai-configs/${configId}/favorite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setConfigs(prev => prev.map(c =>
          c.id === configId
            ? { ...c, isFavorited: data.favorited, favoriteCount: c.favoriteCount + (data.favorited ? 1 : -1) }
            : c
        ))
      }
    } catch (error) {
      toast.error('Failed to update favorite')
    }
  }

  return (
    <div className="flex h-screen bg-background-light overflow-hidden">
      <Toaster position="top-right" richColors />
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
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
                  <span className="inline-block animate-float">🤖</span> AI Configs
                </h1>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  Store and manage prompts, skills, hooks, and MCP configurations
                </p>
              </div>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-2 relative overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                New Config
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
              </motion.button>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4 items-center flex-wrap">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: 'var(--text-muted)' }}>
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search configs..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                />
              </div>

              {/* Tab filters */}
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All', icon: 'view_list' },
                  { key: 'my', label: 'My Configs', icon: 'person' },
                  { key: 'favorites', label: 'Favorites', icon: 'star' },
                ].map(tab => (
                  <motion.button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      filter === tab.key
                        ? 'bg-gradient-spark text-white shadow-lg shadow-primary/30'
                        : 'hover:bg-gradient-shimmer border hover:border-primary/30'
                    }`}
                    style={filter !== tab.key ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' } : {}}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                    {tab.label}
                  </motion.button>
                ))}
              </div>

              {/* Visibility filter */}
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
              >
                <option value="all">All Visibility</option>
                <option value="private">Private</option>
                <option value="team">Team</option>
                <option value="public">Public</option>
              </select>

              {/* Tag filter */}
              {tags.length > 0 && (
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                >
                  <option value="all">All Tags</option>
                  {tags.map(tag => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                  ))}
                </select>
              )}
            </div>
          </motion.div>

          {/* Configs Grid */}
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
          ) : configs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-20 bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-blue-100 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-spark opacity-5"></div>
              <div className="relative">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-blue-200 rounded-full blur-3xl opacity-30 animate-pulse-slow"></div>
                  <div className="relative text-8xl animate-float">🤖</div>
                </div>
                <h3 className="text-2xl font-bold font-display mb-3" style={{ color: 'var(--text-primary)' }}>
                  No AI configs yet
                </h3>
                <p className="mb-8 max-w-md mx-auto text-lg" style={{ color: 'var(--text-secondary)' }}>
                  Start storing your prompts, skills, hooks, and MCP configurations. Share them with your team or keep them private.
                </p>
                <motion.button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary text-lg px-8 py-3"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create Your First Config
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {configs.map((config, i) => (
                  <motion.div
                    key={config.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <Link
                      to={`/ai-configs/${config.id}`}
                      className="block rounded-xl border p-6 card-hover relative overflow-hidden group"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                    >
                      <div className="absolute inset-0 bg-gradient-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Name and slug */}
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold font-display truncate" style={{ color: 'var(--text-primary)' }}>
                              {config.name}
                            </h3>
                            <code className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                              {config.slug}
                            </code>
                          </div>

                          {/* Description */}
                          {config.description && (
                            <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                              {config.description}
                            </p>
                          )}

                          {/* Tags */}
                          {config.tags && config.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {config.tags.map(tag => (
                                <span
                                  key={tag.id}
                                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{ backgroundColor: tag.color || '#e5e7eb', color: '#374151' }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Variables */}
                          {config.variables && (
                            (() => {
                              const vars = typeof config.variables === 'string'
                                ? JSON.parse(config.variables)
                                : config.variables
                              return vars && vars.length > 0 ? (
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--text-muted)' }}>code</span>
                                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    Variables: {vars.map((v: { name: string }) => `{{${v.name}}}`).join(', ')}
                                  </span>
                                </div>
                              ) : null
                            })()
                          )}

                          {/* Meta */}
                          <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[18px]">person</span>
                              <span>{config.creator?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[18px]">schedule</span>
                              <span>{new Date(config.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right side */}
                        <div className="flex flex-col items-end gap-3">
                          {/* Favorite button */}
                          <motion.button
                            onClick={(e) => toggleFavorite(config.id, e)}
                            className="p-2 rounded-lg transition-all hover:bg-yellow-50"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <span
                              className={`material-symbols-outlined text-[24px] ${config.isFavorited ? 'text-yellow-500' : ''}`}
                              style={!config.isFavorited ? { color: 'var(--text-muted)' } : {}}
                            >
                              {config.isFavorited ? 'star' : 'star_outline'}
                            </span>
                          </motion.button>

                          {/* Content type */}
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <span className={`material-symbols-outlined text-[18px] ${contentTypeIcons[config.contentType].color}`}>
                              {contentTypeIcons[config.contentType].icon}
                            </span>
                            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                              {contentTypeIcons[config.contentType].label}
                            </span>
                          </div>

                          {/* Visibility */}
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${visibilityIcons[config.visibility].bgColor}`}>
                            <span className={`material-symbols-outlined text-[18px] ${visibilityIcons[config.visibility].color}`}>
                              {visibilityIcons[config.visibility].icon}
                            </span>
                            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                              {config.visibility === 'team' && config.team ? config.team.name : visibilityIcons[config.visibility].label}
                            </span>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                            <div className="flex items-center gap-1" title="Favorites">
                              <span className="material-symbols-outlined text-[18px]">star</span>
                              <span className="font-medium">{config.favoriteCount}</span>
                            </div>
                            <div className="flex items-center gap-1" title="Forks">
                              <span className="material-symbols-outlined text-[18px]">fork_right</span>
                              <span className="font-medium">{config.forkCount}</span>
                            </div>
                            <div className="flex items-center gap-1" title="Uses">
                              <span className="material-symbols-outlined text-[18px]">trending_up</span>
                              <span className="font-medium">{config.usageCount}</span>
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
          <CreateConfigModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false)
              fetchConfigs()
              toast.success('🤖 AI Config created successfully!')
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Create Modal component
function CreateConfigModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const { token } = useAuthStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState<AiConfigContentType>('text')
  const [visibility, setVisibility] = useState<AiConfigVisibility>('private')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/ai-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, content, contentType, visibility })
      })

      if (res.ok) {
        onCreated()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create config')
      }
    } catch (error) {
      console.error('Create config error:', error)
      toast.error('Failed to create config')
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
        className="rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50" style={{ borderColor: 'var(--border-primary)' }}>
          <h2 className="text-2xl font-display font-bold bg-gradient-spark bg-clip-text text-transparent">
            🤖 New AI Config
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-all hover:bg-white"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="config-name" className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Name *
              </label>
              <input
                id="config-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Code Review Prompt"
                className="input-field"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="content-type" className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Content Type
              </label>
              <select
                id="content-type"
                value={contentType}
                onChange={(e) => setContentType(e.target.value as AiConfigContentType)}
                className="input-field"
              >
                <option value="text">Text</option>
                <option value="markdown">Markdown</option>
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="config-description" className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Description
            </label>
            <input
              id="config-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this config"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="config-content" className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Content * <span className="font-normal text-xs">(Use {'{{variable}}'} for placeholders)</span>
            </label>
            <textarea
              id="config-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your prompt, skill definition, or configuration..."
              className="input-field font-mono text-sm min-h-[200px]"
              rows={10}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              Visibility
            </label>
            <div className="space-y-3">
              {[
                { value: 'private', icon: 'lock', label: 'Private', desc: 'Only you can see and use this' },
                { value: 'team', icon: 'group', label: 'Team', desc: 'Share with your team members' },
                { value: 'public', icon: 'public', label: 'Public', desc: 'Everyone in organization can see' },
              ].map(option => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    visibility === option.value
                      ? 'border-primary bg-gradient-shimmer shadow-md'
                      : 'hover:border-primary/30'
                  }`}
                  style={visibility !== option.value ? { borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' } : {}}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={visibility === option.value}
                    onChange={(e) => setVisibility(e.target.value as AiConfigVisibility)}
                    className="mt-1 focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
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
              disabled={submitting || !name.trim() || !content.trim()}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!submitting && name.trim() && content.trim() ? { scale: 1.02 } : {}}
              whileTap={!submitting && name.trim() && content.trim() ? { scale: 0.98 } : {}}
            >
              {submitting ? 'Creating...' : 'Create Config'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
