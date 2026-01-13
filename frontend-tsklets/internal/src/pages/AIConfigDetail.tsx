import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import type { AiConfig, AiConfigVersion, AiConfigContentType, AiConfigVisibility, Tag } from '@tsklets/types'

const contentTypeIcons: Record<AiConfigContentType, { icon: string; label: string; color: string }> = {
  json: { icon: 'data_object', label: 'JSON', color: 'text-yellow-600' },
  yaml: { icon: 'settings_suggest', label: 'YAML', color: 'text-blue-600' },
  markdown: { icon: 'description', label: 'Markdown', color: 'text-purple-600' },
  text: { icon: 'notes', label: 'Text', color: 'text-slate-600' },
}

const visibilityOptions: { value: AiConfigVisibility; icon: string; label: string; desc: string }[] = [
  { value: 'private', icon: 'lock', label: 'Private', desc: 'Only you' },
  { value: 'team', icon: 'group', label: 'Team', desc: 'Team members' },
  { value: 'public', icon: 'public', label: 'Public', desc: 'Everyone' },
]

export default function AIConfigDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuthStore()
  const [config, setConfig] = useState<AiConfig | null>(null)
  const [versions, setVersions] = useState<AiConfigVersion[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)

  // Edit state
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editContentType, setEditContentType] = useState<AiConfigContentType>('text')
  const [editVisibility, setEditVisibility] = useState<AiConfigVisibility>('private')

  useEffect(() => {
    fetchConfig()
    fetchVersions()
    fetchTags()
  }, [id])

  async function fetchConfig() {
    try {
      const res = await fetch(`/api/ai-configs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        toast.error('Config not found')
        navigate('/ai-configs')
        return
      }
      const data = await res.json()
      setConfig(data.config)
      // Initialize edit state
      setEditName(data.config.name)
      setEditDescription(data.config.description || '')
      setEditContent(data.config.content)
      setEditContentType(data.config.contentType)
      setEditVisibility(data.config.visibility)
    } catch (error) {
      console.error('Fetch config error:', error)
      toast.error('Failed to load config')
    } finally {
      setLoading(false)
    }
  }

  async function fetchVersions() {
    try {
      const res = await fetch(`/api/ai-configs/${id}/versions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setVersions(data.versions || [])
    } catch (error) {
      console.error('Fetch versions error:', error)
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

  async function handleSave() {
    if (!editName.trim() || !editContent.trim()) {
      toast.error('Name and content are required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/ai-configs/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          content: editContent,
          contentType: editContentType,
          visibility: editVisibility,
        })
      })

      if (res.ok) {
        const data = await res.json()
        setConfig(data.config)
        setEditMode(false)
        fetchVersions()
        toast.success(data.versionCreated ? 'Saved! New version created.' : 'Saved!')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this config? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/ai-configs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        toast.success('Config deleted')
        navigate('/ai-configs')
      } else {
        toast.error('Failed to delete')
      }
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  async function handleRollback(versionNumber: number) {
    if (!confirm(`Rollback to version ${versionNumber}? This will set it as the active version.`)) return

    try {
      const res = await fetch(`/api/ai-configs/${id}/versions/${versionNumber}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        fetchConfig()
        fetchVersions()
        toast.success(`Rolled back to version ${versionNumber}`)
      } else {
        toast.error('Failed to rollback')
      }
    } catch (error) {
      toast.error('Failed to rollback')
    }
  }

  async function handleFork() {
    try {
      const res = await fetch(`/api/ai-configs/${id}/fork`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Config forked!')
        navigate(`/ai-configs/${data.config.id}`)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to fork')
      }
    } catch (error) {
      toast.error('Failed to fork')
    }
  }

  async function toggleFavorite() {
    try {
      const res = await fetch(`/api/ai-configs/${id}/favorite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setConfig(prev => prev ? {
          ...prev,
          isFavorited: data.favorited,
          favoriteCount: prev.favoriteCount + (data.favorited ? 1 : -1)
        } : null)
      }
    } catch (error) {
      toast.error('Failed to update favorite')
    }
  }

  async function addTag(tagId: number) {
    try {
      const res = await fetch(`/api/ai-configs/${id}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tagIds: [tagId] })
      })
      if (res.ok) {
        fetchConfig()
        toast.success('Tag added')
      }
    } catch (error) {
      toast.error('Failed to add tag')
    }
  }

  async function removeTag(tagId: number) {
    try {
      const res = await fetch(`/api/ai-configs/${id}/tags/${tagId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        fetchConfig()
        toast.success('Tag removed')
      }
    } catch (error) {
      toast.error('Failed to remove tag')
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const isOwner = config?.createdBy === user?.id
  const canEdit = isOwner

  if (loading) {
    return (
      <div className="flex h-screen bg-background-light overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading config...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="flex h-screen bg-background-light overflow-hidden">
      <Toaster position="top-right" richColors />
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              <button onClick={() => navigate('/ai-configs')} className="hover:text-primary transition-colors">
                AI Configs
              </button>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span style={{ color: 'var(--text-secondary)' }}>{config.name}</span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {editMode ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-3xl font-display font-bold bg-transparent border-b-2 border-primary w-full focus:outline-none mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  />
                ) : (
                  <h1 className="text-3xl font-display font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {config.name}
                  </h1>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Slug with copy */}
                  <button
                    onClick={() => copyToClipboard(config.slug, 'Slug')}
                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                    title="Click to copy slug"
                  >
                    <code className="text-sm" style={{ color: 'var(--text-muted)' }}>{config.slug}</code>
                    <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--text-muted)' }}>content_copy</span>
                  </button>

                  {/* Content type */}
                  <span className={`flex items-center gap-1 px-2 py-1 rounded ${contentTypeIcons[config.contentType].color}`}
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <span className="material-symbols-outlined text-[16px]">{contentTypeIcons[config.contentType].icon}</span>
                    <span className="text-sm">{contentTypeIcons[config.contentType].label}</span>
                  </span>

                  {/* Visibility */}
                  <span className="flex items-center gap-1 px-2 py-1 rounded text-sm"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                    <span className="material-symbols-outlined text-[16px]">
                      {visibilityOptions.find(v => v.value === config.visibility)?.icon}
                    </span>
                    {config.visibility}
                  </span>

                  {/* Forked from */}
                  {config.forkedFromId && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded text-sm"
                      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined text-[16px]">fork_right</span>
                      Forked
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={toggleFavorite}
                  className="p-2 rounded-lg transition-all hover:bg-yellow-50"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title={config.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <span className={`material-symbols-outlined text-[24px] ${config.isFavorited ? 'text-yellow-500' : ''}`}
                    style={!config.isFavorited ? { color: 'var(--text-muted)' } : {}}>
                    {config.isFavorited ? 'star' : 'star_outline'}
                  </span>
                </motion.button>

                <motion.button
                  onClick={handleFork}
                  className="btn-secondary flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="material-symbols-outlined text-[18px]">fork_right</span>
                  Fork
                </motion.button>

                {canEdit && !editMode && (
                  <motion.button
                    onClick={() => setEditMode(true)}
                    className="btn-primary flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Edit
                  </motion.button>
                )}

                {editMode && (
                  <>
                    <button
                      onClick={() => {
                        setEditMode(false)
                        setEditName(config.name)
                        setEditDescription(config.description || '')
                        setEditContent(config.content)
                        setEditContentType(config.contentType)
                        setEditVisibility(config.visibility)
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <motion.button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      {saving ? 'Saving...' : 'Save'}
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-3 gap-6">
            {/* Main content area */}
            <div className="col-span-2 space-y-6">
              {/* Description */}
              <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Description</h3>
                {editMode ? (
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Add a description..."
                    className="input-field w-full"
                    rows={2}
                  />
                ) : (
                  <p style={{ color: config.description ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {config.description || 'No description'}
                  </p>
                )}
              </div>

              {/* Content */}
              <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Content</h3>
                  <div className="flex items-center gap-2">
                    {editMode && (
                      <select
                        value={editContentType}
                        onChange={(e) => setEditContentType(e.target.value as AiConfigContentType)}
                        className="px-3 py-1 rounded-lg border text-sm"
                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
                      >
                        <option value="text">Text</option>
                        <option value="markdown">Markdown</option>
                        <option value="json">JSON</option>
                        <option value="yaml">YAML</option>
                      </select>
                    )}
                    <button
                      onClick={() => copyToClipboard(editMode ? editContent : config.content, 'Content')}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm hover:bg-slate-100 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      Copy
                    </button>
                  </div>
                </div>

                {editMode ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full font-mono text-sm p-4 rounded-lg border min-h-[400px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
                    spellCheck={false}
                  />
                ) : (
                  <pre
                    className="font-mono text-sm p-4 rounded-lg overflow-x-auto"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  >
                    {config.content}
                  </pre>
                )}

                {/* Variables */}
                {config.variables && (
                  (() => {
                    const vars = typeof config.variables === 'string'
                      ? JSON.parse(config.variables)
                      : config.variables
                    return vars && vars.length > 0 ? (
                      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                        <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                          Detected Variables
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {vars.map((v: { name: string }) => (
                            <code
                              key={v.name}
                              className="px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                            >
                              {`{{${v.name}}}`}
                            </code>
                          ))}
                        </div>
                      </div>
                    ) : null
                  })()
                )}
              </div>

              {/* Visibility (edit mode) */}
              {editMode && (
                <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Visibility</h3>
                  <div className="flex gap-3">
                    {visibilityOptions.map(opt => (
                      <label
                        key={opt.value}
                        className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          editVisibility === opt.value
                            ? 'border-primary bg-gradient-shimmer'
                            : 'hover:border-primary/30'
                        }`}
                        style={editVisibility !== opt.value ? { borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' } : {}}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          value={opt.value}
                          checked={editVisibility === opt.value}
                          onChange={(e) => setEditVisibility(e.target.value as AiConfigVisibility)}
                          className="sr-only"
                        />
                        <span className="material-symbols-outlined text-[20px]">{opt.icon}</span>
                        <div>
                          <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{opt.label}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats */}
              <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined text-[18px]">star</span>
                      Favorites
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{config.favoriteCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined text-[18px]">fork_right</span>
                      Forks
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{config.forkCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined text-[18px]">trending_up</span>
                      Uses
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{config.usageCount}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Tags</h3>
                  {canEdit && (
                    <button
                      onClick={() => setShowTagModal(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      + Add
                    </button>
                  )}
                </div>
                {config.tags && config.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {config.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium group"
                        style={{ backgroundColor: tag.color || '#e5e7eb', color: '#374151' }}
                      >
                        {tag.name}
                        {canEdit && (
                          <button
                            onClick={() => removeTag(tag.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tags</p>
                )}
              </div>

              {/* Version History */}
              <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Version History</h3>
                  <button
                    onClick={() => setShowVersions(!showVersions)}
                    className="text-sm text-primary hover:underline"
                  >
                    {showVersions ? 'Hide' : `Show (${versions.length})`}
                  </button>
                </div>

                <AnimatePresence>
                  {showVersions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {versions.length === 0 ? (
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No versions yet</p>
                      ) : (
                        versions.map(version => (
                          <div
                            key={version.id}
                            className={`p-3 rounded-lg border ${
                              version.id === config.activeVersionId
                                ? 'border-primary bg-primary/5'
                                : ''
                            }`}
                            style={version.id !== config.activeVersionId ? {
                              borderColor: 'var(--border-primary)',
                              backgroundColor: 'var(--bg-tertiary)'
                            } : {}}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                v{version.version}
                                {version.id === config.activeVersionId && (
                                  <span className="ml-2 text-xs text-primary">(active)</span>
                                )}
                              </span>
                              {canEdit && version.id !== config.activeVersionId && (
                                <button
                                  onClick={() => handleRollback(version.version)}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Rollback
                                </button>
                              )}
                            </div>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {new Date(version.createdAt).toLocaleString()}
                            </p>
                            {version.changeNote && (
                              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                {version.changeNote}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Metadata */}
              <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Created by</span>
                    <span style={{ color: 'var(--text-primary)' }}>{config.creator?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Created</span>
                    <span style={{ color: 'var(--text-primary)' }}>{new Date(config.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Updated</span>
                    <span style={{ color: 'var(--text-primary)' }}>{new Date(config.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Danger zone */}
              {canEdit && (
                <div className="rounded-xl border border-red-200 p-6 bg-red-50">
                  <h3 className="text-sm font-semibold text-red-700 mb-3">Danger Zone</h3>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Delete Config
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Tag Modal */}
      <AnimatePresence>
        {showTagModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowTagModal(false)}
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
                  Add Tags
                </h2>
              </div>
              <div className="p-6">
                {tags.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No tags available. Create tags first.</p>
                ) : (
                  <div className="space-y-2">
                    {tags
                      .filter(t => !config.tags?.some(ct => ct.id === t.id))
                      .map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => {
                            addTag(tag.id)
                            setShowTagModal(false)
                          }}
                          className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left"
                        >
                          <span
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: tag.color || '#e5e7eb' }}
                          />
                          <span style={{ color: 'var(--text-primary)' }}>{tag.name}</span>
                        </button>
                      ))}
                    {tags.filter(t => !config.tags?.some(ct => ct.id === t.id)).length === 0 && (
                      <p style={{ color: 'var(--text-muted)' }}>All tags already assigned</p>
                    )}
                  </div>
                )}
              </div>
              <div className="p-6 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                <button
                  onClick={() => setShowTagModal(false)}
                  className="btn-secondary w-full"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
