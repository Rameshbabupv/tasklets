import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/auth'
import ImageModal from '../components/ImageModal'

interface Ticket {
  id: number
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  clientPriority: number
  clientSeverity: number
  internalPriority: number | null
  internalSeverity: number | null
  tenantName: string
  createdAt: string
}

interface Attachment {
  id: number
  ticketId: number
  fileUrl: string
  fileName: string
  fileSize?: number
  createdAt: string
}

const statuses = ['open', 'in_progress', 'resolved', 'closed']
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

  // Spawn task state
  const [showSpawnModal, setShowSpawnModal] = useState(false)
  const [epics, setEpics] = useState<Epic[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [selectedEpicId, setSelectedEpicId] = useState<number | ''>('')
  const [selectedFeatureId, setSelectedFeatureId] = useState<number | ''>('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [spawning, setSpawning] = useState(false)
  const [spawnError, setSpawnError] = useState('')

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
    setTaskTitle(`Bug from ticket: ${ticket?.title}`)
    setTaskDescription(ticket?.description || '')

    // Fetch all epics (assuming from all products for now)
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

  const handleSpawnTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFeatureId) {
      setSpawnError('Please select a feature')
      return
    }

    setSpawning(true)
    setSpawnError('')

    try {
      const res = await fetch(`/api/tasks/spawn-from-ticket/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          featureId: selectedFeatureId,
          title: taskTitle,
          description: taskDescription,
          type: 'bug',
        }),
      })

      if (!res.ok) throw new Error('Failed to spawn task')

      setShowSpawnModal(false)
      setSelectedEpicId('')
      setSelectedFeatureId('')
      setTaskTitle('')
      setTaskDescription('')
      alert('Dev task created successfully!')
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
        <header className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-700">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 className="text-lg font-bold text-slate-900">Ticket #{ticket.id}</h2>
            <span className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{ticket.tenantName}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openSpawnModal}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_task</span>
              Spawn Dev Task
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
                      {s.replace('_', ' ').toUpperCase()}
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

      {/* Spawn Task Modal */}
      {showSpawnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Spawn Dev Task from Ticket</h3>
              <p className="text-sm text-slate-500 mt-1">Create a development task from this support ticket</p>
            </div>

            <form onSubmit={handleSpawnTask} className="p-6 space-y-4">
              {spawnError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{spawnError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Epic *</label>
                <select
                  value={selectedEpicId}
                  onChange={(e) => handleEpicChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                  required
                >
                  <option value="">Select Epic...</option>
                  {epics.map((epic) => (
                    <option key={epic.id} value={epic.id}>{epic.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Feature *</label>
                <select
                  value={selectedFeatureId}
                  onChange={(e) => setSelectedFeatureId(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                  required
                  disabled={!selectedEpicId}
                >
                  <option value="">Select Feature...</option>
                  {features.map((feature) => (
                    <option key={feature.id} value={feature.id}>{feature.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowSpawnModal(false)
                    setSelectedEpicId('')
                    setSelectedFeatureId('')
                    setSpawnError('')
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={spawning}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {spawning ? 'Creating...' : 'Create Bug Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
