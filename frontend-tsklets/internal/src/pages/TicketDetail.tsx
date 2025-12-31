import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/auth'
import ImageModal from '../components/ImageModal'

interface Ticket {
  id: string
  issueKey: string
  title: string
  description: string
  type: string
  status: 'pending_internal_review' | 'open' | 'in_progress' | 'waiting_for_customer' | 'rebuttal' | 'resolved' | 'closed' | 'cancelled'
  clientPriority: number
  clientSeverity: number
  internalPriority: number | null
  internalSeverity: number | null
  clientId: number | null
  clientName: string | null
  productId: number
  productCode: string | null
  productName: string | null
  creatorName: string | null
  reporterName: string | null
  assigneeName: string | null
  tenantName: string
  createdAt: string
  // Escalation fields
  escalationReason: string | null
  escalationNote: string | null
  pushedToSystechAt: string | null
  labels: string[] | null
}

// Escalation reason labels
const escalationReasonLabels: Record<string, string> = {
  executive_request: 'Executive Request',
  production_down: 'Production Down',
  compliance: 'Compliance',
  customer_impact: 'Customer Impact',
  other: 'Other',
}

// Helper to check if ticket is escalated
const isEscalated = (ticket: Ticket) => ticket.labels?.includes('escalated')

// Helper to check if ticket was created by Systech
const isCreatedBySystech = (ticket: Ticket) => ticket.labels?.includes('created_by_systech')

interface Attachment {
  id: number
  ticketId: string
  fileUrl: string
  fileName: string
  fileSize?: number
  createdAt: string
}

const statuses = ['pending_internal_review', 'open', 'in_progress', 'waiting_for_customer', 'rebuttal', 'resolved', 'closed', 'cancelled']
const priorities = [1, 2, 3, 4, 5]

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

interface User {
  id: number
  name: string
  email: string
}

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalImage, setModalImage] = useState<{ url: string; name: string; size?: number } | null>(null)

  // Form state for internal fields
  const [status, setStatus] = useState('')
  const [internalPriority, setInternalPriority] = useState<number | ''>('')
  const [internalSeverity, setInternalSeverity] = useState<number | ''>('')

  // Create Dev Task state
  const [showSpawnModal, setShowSpawnModal] = useState(false)
  const [epics, setEpics] = useState<Epic[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [selectedEpicId, setSelectedEpicId] = useState<number | ''>('')
  const [selectedFeatureId, setSelectedFeatureId] = useState<number | ''>('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [spawning, setSpawning] = useState(false)
  const [spawnError, setSpawnError] = useState('')

  // New: Product structure
  const [modules, setModules] = useState<Module[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState<number | ''>('')
  const [selectedComponentId, setSelectedComponentId] = useState<number | ''>('')
  const [selectedAddonId, setSelectedAddonId] = useState<number | ''>('')

  // New: Role assignments
  const [internalUsers, setInternalUsers] = useState<User[]>([])
  const [implementorId, setImplementorId] = useState<number | ''>('')
  const [developerId, setDeveloperId] = useState<number | ''>('')
  const [testerId, setTesterId] = useState<number | ''>('')

  useEffect(() => {
    fetchTicket()
  }, [id])

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      const t = data.ticket
      setTicket(t)
      setAttachments(data.attachments || [])
      setStatus(t.status)
      setInternalPriority(t.internalPriority || '')
      setInternalSeverity(t.internalSeverity || '')
    } catch (err) {
      console.error('Failed to fetch ticket', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          internalPriority: internalPriority || null,
          internalSeverity: internalSeverity || null,
        }),
      })
      navigate('/')
    } catch (err) {
      console.error('Failed to update ticket', err)
    } finally {
      setSaving(false)
    }
  }

  const openSpawnModal = async () => {
    setShowSpawnModal(true)
    setTaskTitle(`Fix: ${ticket?.title}`)
    setTaskDescription(ticket?.description || '')

    // Fetch internal users for role assignments
    try {
      const res = await fetch('/api/users?internal=true', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setInternalUsers(data.users || data || [])
    } catch (err) {
      console.error('Failed to fetch users', err)
    }

    // Fetch modules and addons for the ticket's product
    if (ticket?.productId) {
      try {
        const [modulesRes, addonsRes] = await Promise.all([
          fetch(`/api/products/${ticket.productId}/modules`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/products/${ticket.productId}/addons`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        const modulesData = await modulesRes.json()
        const addonsData = await addonsRes.json()
        setModules(modulesData || [])
        setAddons(addonsData || [])
      } catch (err) {
        console.error('Failed to fetch product structure', err)
      }
    }

    // Fetch all epics (for optional feature link)
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

  const fetchFeatures = async (epicId: number) => {
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

  const handleEpicChange = (epicId: string) => {
    setSelectedEpicId(epicId ? parseInt(epicId) : '')
    setSelectedFeatureId('')
    setFeatures([])
    if (epicId) {
      fetchFeatures(parseInt(epicId))
    }
  }

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

  const handleSpawnTask = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required role assignments
    if (!implementorId || !developerId || !testerId) {
      setSpawnError('Please assign Implementor, Developer, and Tester')
      return
    }

    setSpawning(true)
    setSpawnError('')

    try {
      const res = await fetch(`/api/tasks/from-support-ticket/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          type: 'bug',
          // Role assignments
          implementorId,
          developerId,
          testerId,
          // Product structure (optional)
          moduleId: selectedModuleId || null,
          componentId: selectedComponentId || null,
          addonId: selectedAddonId || null,
          // Optional feature link
          featureId: selectedFeatureId || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create dev task')
      }

      const data = await res.json()

      // Reset form
      setShowSpawnModal(false)
      setSelectedEpicId('')
      setSelectedFeatureId('')
      setSelectedModuleId('')
      setSelectedComponentId('')
      setSelectedAddonId('')
      setImplementorId('')
      setDeveloperId('')
      setTesterId('')
      setTaskTitle('')
      setTaskDescription('')

      // Refresh ticket to show updated status
      fetchTicket()

      alert(`Dev task ${data.task.issueKey} created! Ticket assigned to implementor and moved to In Progress.`)
    } catch (err: any) {
      setSpawnError(err.message)
    } finally {
      setSpawning(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex overflow-hidden bg-background-light">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-slate-500">Loading...</div>
        </main>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="h-screen flex overflow-hidden bg-background-light">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-slate-500">Ticket not found</div>
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background-light">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`h-16 px-6 border-b bg-white flex items-center justify-between shrink-0 ${isEscalated(ticket) ? 'border-red-300' : 'border-slate-200'}`}>
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={() => navigate('/tickets')} className="text-slate-500 hover:text-slate-700">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 className="text-lg font-bold text-slate-900">{ticket.issueKey}</h2>
            {isEscalated(ticket) && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1.5 animate-pulse">
                <span className="material-symbols-outlined text-sm">priority_high</span>
                ESCALATED
              </span>
            )}
            {isCreatedBySystech(ticket) && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">business</span>
                INTERNAL
              </span>
            )}
            {ticket.productName && (
              <span className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{ticket.productName}</span>
            )}
            {ticket.clientName && (
              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{ticket.clientName}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openSpawnModal}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_task</span>
              Create Dev Task
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
            {/* Left: Details */}
            <div className="col-span-2 space-y-6">
              {/* Escalation Info Banner */}
              {isEscalated(ticket) && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-2xl text-red-600">priority_high</span>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-red-700 mb-1">Escalated Ticket</h3>
                      {ticket.escalationReason && (
                        <p className="text-sm text-red-600 mb-2">
                          <span className="font-medium">Reason:</span> {escalationReasonLabels[ticket.escalationReason] || ticket.escalationReason}
                        </p>
                      )}
                      {ticket.escalationNote && (
                        <p className="text-sm text-red-600">
                          <span className="font-medium">Note:</span> {ticket.escalationNote}
                        </p>
                      )}
                      {ticket.pushedToSystechAt && (
                        <p className="text-xs text-red-500 mt-2">
                          Escalated on {new Date(ticket.pushedToSystechAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">{ticket.title}</h3>
                <p className="text-slate-600 whitespace-pre-wrap">{ticket.description || 'No description provided.'}</p>
              </div>

              {/* Client Info */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                  Client Reported
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide">Priority</label>
                    <div className="text-lg font-bold text-slate-900">P{ticket.clientPriority}</div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide">Severity</label>
                    <div className="text-lg font-bold text-slate-900">S{ticket.clientSeverity}</div>
                  </div>
                </div>
              </div>

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                    Attachments ({attachments.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {attachments.map((att) => (
                      <div key={att.id} className="group">
                        {/* Thumbnail */}
                        <div
                          onClick={() => setModalImage({ url: att.fileUrl, name: att.fileName, size: att.fileSize })}
                          className="aspect-square rounded-lg overflow-hidden bg-slate-100 border-2 border-slate-200 cursor-pointer hover:border-primary transition-colors"
                        >
                          <img
                            src={att.fileUrl}
                            alt={att.fileName}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* File info */}
                        <div className="mt-2">
                          <p className="text-xs text-slate-600 truncate" title={att.fileName}>
                            {att.fileName}
                          </p>
                          {att.fileSize && (
                            <p className="text-xs text-slate-400">
                              {att.fileSize < 1024
                                ? att.fileSize + ' B'
                                : att.fileSize < 1024 * 1024
                                ? (att.fileSize / 1024).toFixed(1) + ' KB'
                                : (att.fileSize / (1024 * 1024)).toFixed(1) + ' MB'}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="space-y-6">
              {/* Status */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h4 className="font-semibold text-slate-700 mb-4">Status</h4>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Internal Triage */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">tune</span>
                  Internal Triage
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-2">Internal Priority</label>
                    <select
                      value={internalPriority}
                      onChange={(e) => setInternalPriority(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Use client priority</option>
                      {priorities.map((p) => (
                        <option key={p} value={p}>P{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-2">Internal Severity</label>
                    <select
                      value={internalSeverity}
                      onChange={(e) => setInternalSeverity(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Use client severity</option>
                      {priorities.map((p) => (
                        <option key={p} value={p}>S{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
                <div className="flex justify-between mb-2">
                  <span>Created</span>
                  <span className="font-medium text-slate-700">{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {modalImage && (
        <ImageModal
          imageUrl={modalImage.url}
          fileName={modalImage.name}
          fileSize={modalImage.size}
          onClose={() => setModalImage(null)}
        />
      )}

      {/* Create Dev Task Modal */}
      {showSpawnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-900">Create Development Task</h3>
              <p className="text-sm text-slate-500 mt-1">
                From: <span className="font-medium text-slate-700">{ticket?.issueKey}</span> • {ticket?.productName}
              </p>
            </div>

            <form onSubmit={handleSpawnTask} className="p-6 space-y-6">
              {spawnError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {spawnError}
                </div>
              )}

              {/* Role Assignments Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-emerald-600">group</span>
                  Role Assignments *
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Implementor</label>
                    <select
                      value={implementorId}
                      onChange={(e) => setImplementorId(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20"
                      required
                    >
                      <option value="">Select...</option>
                      {internalUsers.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">Overall responsible</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Developer</label>
                    <select
                      value={developerId}
                      onChange={(e) => setDeveloperId(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20"
                      required
                    >
                      <option value="">Select...</option>
                      {internalUsers.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">Writes the code</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tester</label>
                    <select
                      value={testerId}
                      onChange={(e) => setTesterId(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/20"
                      required
                    >
                      <option value="">Select...</option>
                      {internalUsers.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">Tests the fix</p>
                  </div>
                </div>
              </div>

              {/* Product Structure Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-blue-600">category</span>
                  Product Structure (Optional)
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Module</label>
                    <select
                      value={selectedModuleId}
                      onChange={(e) => handleModuleChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select module...</option>
                      {modules.map((mod) => (
                        <option key={mod.id} value={mod.id}>{mod.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Component</label>
                    <select
                      value={selectedComponentId}
                      onChange={(e) => setSelectedComponentId(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                      disabled={!selectedModuleId}
                    >
                      <option value="">Select component...</option>
                      {components.map((comp) => (
                        <option key={comp.id} value={comp.id}>{comp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Addon</label>
                    <select
                      value={selectedAddonId}
                      onChange={(e) => setSelectedAddonId(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select addon...</option>
                      {addons.map((addon) => (
                        <option key={addon.id} value={addon.id}>{addon.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Feature Link Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-orange-600">link</span>
                  Link to Feature (Optional)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Epic</label>
                    <select
                      value={selectedEpicId}
                      onChange={(e) => handleEpicChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select Epic...</option>
                      {epics.map((epic) => (
                        <option key={epic.id} value={epic.id}>{epic.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Feature</label>
                    <select
                      value={selectedFeatureId}
                      onChange={(e) => setSelectedFeatureId(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                      disabled={!selectedEpicId}
                    >
                      <option value="">Select Feature...</option>
                      {features.map((feature) => (
                        <option key={feature.id} value={feature.id}>{feature.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Task Details Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-slate-600">description</span>
                  Task Details
                </h4>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Ticket will be assigned to Implementor and moved to In Progress
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSpawnModal(false)
                      setSelectedEpicId('')
                      setSelectedFeatureId('')
                      setSelectedModuleId('')
                      setSelectedComponentId('')
                      setSelectedAddonId('')
                      setImplementorId('')
                      setDeveloperId('')
                      setTesterId('')
                      setSpawnError('')
                    }}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={spawning}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                  >
                    {spawning ? (
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
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
