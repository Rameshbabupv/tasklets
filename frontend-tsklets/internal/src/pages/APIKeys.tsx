import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import type { ApiKey } from '@tsklets/types'

export default function APIKeys() {
  const { token } = useAuthStore()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  async function fetchApiKeys() {
    try {
      const res = await fetch('/api/api-keys', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setApiKeys(data.apiKeys || [])
    } catch (error) {
      console.error('Fetch API keys error:', error)
      toast.error('Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  async function handleRevoke(keyId: number) {
    if (!confirm('Revoke this API key? Any applications using it will stop working.')) return

    try {
      const res = await fetch(`/api/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        setApiKeys(prev => prev.filter(k => k.id !== keyId))
        toast.success('API key revoked')
      } else {
        toast.error('Failed to revoke API key')
      }
    } catch (error) {
      toast.error('Failed to revoke API key')
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
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
                  <span className="inline-block animate-float">🔑</span> API Keys
                </h1>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  Manage API keys for external access to AI configs
                </p>
              </div>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                New API Key
              </motion.button>
            </div>

            {/* Usage info */}
            <div className="rounded-xl border p-4 bg-blue-50 border-blue-200 mb-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600">info</span>
                <div className="text-sm">
                  <p className="font-semibold text-blue-800 mb-1">External API Access</p>
                  <p className="text-blue-700">
                    Use API keys to access configs from external applications like Claude Code CLI.
                    Include the key in the <code className="px-1 py-0.5 bg-blue-100 rounded">X-API-Key</code> header.
                  </p>
                  <p className="text-blue-600 mt-2 font-mono text-xs">
                    GET /api/v1/configs/your-config-slug
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* API Keys List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl border p-4 animate-pulse" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <div className="h-6 rounded w-1/3 mb-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                  <div className="h-4 rounded w-1/4" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                </div>
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-gradient-to-br from-white to-amber-50/30 rounded-2xl border border-amber-100"
            >
              <div className="text-8xl mb-6">🔑</div>
              <h3 className="text-2xl font-bold font-display mb-3" style={{ color: 'var(--text-primary)' }}>
                No API keys yet
              </h3>
              <p className="mb-8 max-w-md mx-auto text-lg" style={{ color: 'var(--text-secondary)' }}>
                Create an API key to access your AI configs from external applications
              </p>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary text-lg px-8 py-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create Your First API Key
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {apiKeys.map((key, i) => (
                  <motion.div
                    key={key.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border p-6 card-hover"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                            {key.name}
                          </h3>
                          <code
                            className="px-2 py-1 rounded text-sm cursor-pointer hover:bg-slate-100"
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                            onClick={() => copyToClipboard(`${key.keyPrefix}...`)}
                            title="Click to copy prefix"
                          >
                            {key.keyPrefix}...
                          </code>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            Created {new Date(key.createdAt).toLocaleDateString()}
                          </div>
                          {key.lastUsedAt && (
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">history</span>
                              Last used {new Date(key.lastUsedAt).toLocaleDateString()}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">speed</span>
                            {key.rateLimit} req/min
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {key.scopes?.map(scope => (
                            <span
                              key={scope}
                              className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"
                            >
                              {scope}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevoke(key.id)}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Revoke
                      </button>
                    </div>
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
          <CreateKeyModal
            onClose={() => {
              setShowCreateModal(false)
              setNewKeyValue(null)
            }}
            onCreated={(keyValue) => {
              setNewKeyValue(keyValue)
              fetchApiKeys()
            }}
            newKeyValue={newKeyValue}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CreateKeyModal({
  onClose,
  onCreated,
  newKeyValue,
}: {
  onClose: () => void
  onCreated: (keyValue: string) => void
  newKeyValue: string | null
}) {
  const { token } = useAuthStore()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, scopes: ['read'] })
      })

      if (res.ok) {
        const data = await res.json()
        onCreated(data.key)
        toast.success('API key created!')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create API key')
      }
    } catch (error) {
      toast.error('Failed to create API key')
    } finally {
      setSubmitting(false)
    }
  }

  function copyKey() {
    if (newKeyValue) {
      navigator.clipboard.writeText(newKeyValue)
      setCopied(true)
      toast.success('API key copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
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
        className="rounded-2xl shadow-2xl max-w-lg w-full"
        style={{ backgroundColor: 'var(--bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {newKeyValue ? (
          // Show the new key
          <>
            <div className="p-6 border-b bg-green-50" style={{ borderColor: 'var(--border-primary)' }}>
              <div className="flex items-center gap-2 text-green-700">
                <span className="material-symbols-outlined">check_circle</span>
                <h2 className="text-xl font-display font-bold">API Key Created</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-600">warning</span>
                  <div className="text-sm">
                    <p className="font-semibold text-amber-800 mb-1">Save this key now!</p>
                    <p className="text-amber-700">
                      This is the only time you'll see this key. Copy it and store it securely.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Your API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyValue}
                    readOnly
                    className="input-field font-mono text-sm flex-1"
                  />
                  <button
                    onClick={copyKey}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Usage Example</p>
                <pre className="text-xs font-mono overflow-x-auto" style={{ color: 'var(--text-primary)' }}>
{`curl -H "X-API-Key: ${newKeyValue}" \\
  https://your-domain.com/api/v1/configs/your-slug`}
                </pre>
              </div>

              <button
                onClick={onClose}
                className="btn-primary w-full mt-6"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          // Create form
          <>
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <h2 className="text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                Create API Key
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Key Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Claude Code CLI, Production App"
                  className="input-field"
                  required
                  autoFocus
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  A descriptive name to help you identify this key
                </p>
              </div>

              <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Permissions</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">read</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Access to read your AI configs</span>
                </div>
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
                  {submitting ? 'Creating...' : 'Create API Key'}
                </motion.button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
