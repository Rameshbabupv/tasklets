import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/auth'

interface Ticket {
  id: string
  issueKey: string
  title: string
  description: string
  productId: number
  productName: string | null
  productCode: string | null
}

interface User {
  id: number
  name: string
  email: string
}

interface Module {
  id: number
  productId: number
  name: string
}

interface Component {
  id: number
  moduleId: number
  name: string
}

interface Addon {
  id: number
  productId: number
  name: string
}

interface Epic {
  id: number
  productId: number
  title: string
}

interface Feature {
  id: number
  epicId: number
  title: string
}

interface DevTaskModalProps {
  ticket: Ticket
  onClose: () => void
  onSuccess: (issueKey: string) => void
}

export default function DevTaskModal({ ticket, onClose, onSuccess }: DevTaskModalProps) {
  const { token } = useAuthStore()
  const [isClosing, setIsClosing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<string | null>(null)

  // Form state - Role assignments
  const [internalUsers, setInternalUsers] = useState<User[]>([])
  const [implementorId, setImplementorId] = useState<number | ''>('')
  const [developerId, setDeveloperId] = useState<number | ''>('')
  const [testerId, setTesterId] = useState<number | ''>('')

  // Product structure
  const [modules, setModules] = useState<Module[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState<number | ''>('')
  const [selectedComponentId, setSelectedComponentId] = useState<number | ''>('')
  const [selectedAddonId, setSelectedAddonId] = useState<number | ''>('')

  // Feature link
  const [epics, setEpics] = useState<Epic[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [selectedEpicId, setSelectedEpicId] = useState<number | ''>('')
  const [selectedFeatureId, setSelectedFeatureId] = useState<number | ''>('')

  // Task details
  const [taskTitle, setTaskTitle] = useState(`Fix: ${ticket.title}`)
  const [taskDescription, setTaskDescription] = useState(ticket.description || '')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    loadInitialData()

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const loadInitialData = async () => {
    // Fetch internal users (systech.com users)
    try {
      const res = await fetch('/api/users/internal', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setInternalUsers(data || [])
    } catch (err) {
      console.error('Failed to fetch users', err)
    }

    // Fetch modules, addons, and product defaults for the ticket's product
    if (ticket.productId) {
      try {
        const [modulesRes, addonsRes, productsRes] = await Promise.all([
          fetch(`/api/products/${ticket.productId}/modules`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/products/${ticket.productId}/addons`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/products', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        const modulesData = await modulesRes.json()
        const addonsData = await addonsRes.json()
        const productsData = await productsRes.json()

        setModules(modulesData || [])
        setAddons(addonsData || [])

        // Find the product and pre-fill role assignments from defaults
        const product = productsData.find((p: any) => p.id === ticket.productId)
        if (product) {
          if (product.defaultImplementorId) setImplementorId(product.defaultImplementorId)
          if (product.defaultDeveloperId) setDeveloperId(product.defaultDeveloperId)
          if (product.defaultTesterId) setTesterId(product.defaultTesterId)
        }
      } catch (err) {
        console.error('Failed to fetch product structure', err)
      }
    }

    // Fetch all epics
    try {
      const res = await fetch('/api/epics', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setEpics(data.epics || [])
    } catch (err) {
      console.error('Failed to fetch epics', err)
    }
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => onClose(), 200)
  }

  // Handle module change - fetch components
  const handleModuleChange = async (moduleId: string) => {
    setSelectedModuleId(moduleId ? parseInt(moduleId) : '')
    setSelectedComponentId('')
    setComponents([])
    if (moduleId) {
      try {
        const res = await fetch(`/api/products/modules/${moduleId}/components`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setComponents(data || [])
      } catch (err) {
        console.error('Failed to fetch components', err)
      }
    }
  }

  // Handle epic change - fetch features
  const handleEpicChange = async (epicId: string) => {
    setSelectedEpicId(epicId ? parseInt(epicId) : '')
    setSelectedFeatureId('')
    setFeatures([])
    if (epicId) {
      try {
        const res = await fetch(`/api/features?epicId=${epicId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setFeatures(data.features || [])
      } catch (err) {
        console.error('Failed to fetch features', err)
      }
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!implementorId || !developerId || !testerId) {
      setError('Please assign Implementor, Developer, and Tester')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/tasks/from-support-ticket/${ticket.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          type: 'bug',
          implementorId,
          developerId,
          testerId,
          moduleId: selectedModuleId || null,
          componentId: selectedComponentId || null,
          addonId: selectedAddonId || null,
          featureId: selectedFeatureId || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create dev task')
      }

      const data = await res.json()
      setSuccess(data.task.issueKey)

      // Auto-close after showing success
      setTimeout(() => {
        onSuccess(data.task.issueKey)
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto
        ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl my-8 rounded-2xl shadow-2xl overflow-hidden
          ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
        style={{ backgroundColor: 'var(--bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        {/* Header Content */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-xl text-white">add_task</span>
            </div>
            <div>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Create Development Task</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                From: <span className="font-medium text-violet-600 dark:text-violet-400">{ticket.issueKey}</span>
                {ticket.productName && (
                  <> • <span className="font-medium">{ticket.productName}</span></>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="size-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Ticket Context Banner */}
        <div className="px-6 py-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
          <span className="material-symbols-outlined text-orange-500">support_agent</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {ticket.title}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Success Message */}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center">
              <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">check_circle</span>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Dev task <span className="font-mono font-bold">{success}</span> created!
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Ticket assigned to implementor and moved to In Progress
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          {!success && (
            <>
              {/* Role Assignments Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <span className="material-symbols-outlined text-lg text-emerald-500">group</span>
                  Role Assignments <span className="text-red-500">*</span>
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Implementor
                    </label>
                    <select
                      value={implementorId}
                      onChange={(e) => setImplementorId(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                      required
                    >
                      <option value="">Select...</option>
                      {internalUsers.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Overall responsible</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Developer
                    </label>
                    <select
                      value={developerId}
                      onChange={(e) => setDeveloperId(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                      required
                    >
                      <option value="">Select...</option>
                      {internalUsers.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Writes the code</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Tester
                    </label>
                    <select
                      value={testerId}
                      onChange={(e) => setTesterId(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                      required
                    >
                      <option value="">Select...</option>
                      {internalUsers.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Tests the fix</p>
                  </div>
                </div>
              </div>

              {/* Product Structure Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <span className="material-symbols-outlined text-lg text-blue-500">category</span>
                  Product Structure <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(Optional)</span>
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Module
                    </label>
                    <select
                      value={selectedModuleId}
                      onChange={(e) => handleModuleChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Select module...</option>
                      {modules.map((mod) => (
                        <option key={mod.id} value={mod.id}>{mod.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Component
                    </label>
                    <select
                      value={selectedComponentId}
                      onChange={(e) => setSelectedComponentId(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                      disabled={!selectedModuleId}
                    >
                      <option value="">Select component...</option>
                      {components.map((comp) => (
                        <option key={comp.id} value={comp.id}>{comp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Addon
                    </label>
                    <select
                      value={selectedAddonId}
                      onChange={(e) => setSelectedAddonId(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Select addon...</option>
                      {addons.map((addon) => (
                        <option key={addon.id} value={addon.id}>{addon.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Link to Feature Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <span className="material-symbols-outlined text-lg text-orange-500">link</span>
                  Link to Feature <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(Optional)</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Epic
                    </label>
                    <select
                      value={selectedEpicId}
                      onChange={(e) => handleEpicChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Select epic...</option>
                      {epics.map((epic) => (
                        <option key={epic.id} value={epic.id}>{epic.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Feature
                    </label>
                    <select
                      value={selectedFeatureId}
                      onChange={(e) => setSelectedFeatureId(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 disabled:opacity-50"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                      disabled={!selectedEpicId}
                    >
                      <option value="">Select feature...</option>
                      {features.map((feature) => (
                        <option key={feature.id} value={feature.id}>{feature.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Task Details Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <span className="material-symbols-outlined text-lg text-slate-500">description</span>
                  Task Details
                </h4>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Description
                  </label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    rows={3}
                  />
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {!success && 'Ticket will be assigned to Implementor and moved to In Progress'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                {success ? 'Close' : 'Cancel'}
              </button>
              {!success && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">add_task</span>
                      Create Dev Task
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(20px) scale(0.98); }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .animate-fade-out { animation: fadeOut 0.2s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        .animate-slide-down { animation: slideDown 0.2s ease-out forwards; }
      `}</style>
    </div>
  )
}
