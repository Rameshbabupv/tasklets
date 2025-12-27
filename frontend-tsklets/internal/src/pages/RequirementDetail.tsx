import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import { Requirement, RequirementAmendment, RequirementStatus } from '@tsklets/types'

const statusColors: Record<RequirementStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-200',
  brainstorm: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-yellow-500',
  solidified: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-500',
  approved: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500',
  in_development: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500',
  implemented: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500',
  cancelled: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
}

const workflowSteps: RequirementStatus[] = ['draft', 'brainstorm', 'solidified', 'approved', 'in_development', 'implemented']

export default function RequirementDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [requirement, setRequirement] = useState<Requirement | null>(null)
  const [amendments, setAmendments] = useState<RequirementAmendment[]>([])
  const [loading, setLoading] = useState(true)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAmendmentModal, setShowAmendmentModal] = useState(false)
  const [editData, setEditData] = useState<Partial<Requirement>>({})
  const [statusData, setStatusData] = useState({ status: '', participants: '', approvers: '' })
  const [amendmentData, setAmendmentData] = useState({
    title: '',
    description: '',
    businessJustification: '',
    urgency: 'medium' as 'critical' | 'high' | 'medium' | 'low'
  })

  useEffect(() => {
    fetchRequirement()
    fetchAmendments()
  }, [id])

  async function fetchRequirement() {
    try {
      const res = await fetch(`http://localhost:4000/api/requirements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setRequirement(data.requirement)
      setEditData(data.requirement)
    } catch (error) {
      console.error('Fetch requirement error:', error)
      toast.error('Failed to load requirement')
    } finally {
      setLoading(false)
    }
  }

  async function fetchAmendments() {
    try {
      const res = await fetch(`http://localhost:4000/api/requirements/${id}/amendments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setAmendments(data.amendments || [])
    } catch (error) {
      console.error('Fetch amendments error:', error)
    }
  }

  async function handleUpdateStatus() {
    try {
      const body: any = { status: statusData.status }
      if (statusData.participants) {
        body.participants = statusData.participants.split(',').map(s => s.trim())
      }
      if (statusData.approvers) {
        body.approvers = statusData.approvers.split(',').map(s => s.trim())
      }

      const res = await fetch(`http://localhost:4000/api/requirements/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const error = await res.json()
        toast.error(error.error || 'Failed to update status')
        return
      }

      toast.success('Status updated successfully')
      setShowStatusModal(false)
      fetchRequirement()
    } catch (error) {
      console.error('Update status error:', error)
      toast.error('Failed to update status')
    }
  }

  async function handleUpdateRequirement() {
    try {
      const res = await fetch(`http://localhost:4000/api/requirements/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      })

      if (!res.ok) throw new Error('Failed to update requirement')

      toast.success('Requirement updated successfully')
      setShowEditModal(false)
      fetchRequirement()
    } catch (error) {
      console.error('Update requirement error:', error)
      toast.error('Failed to update requirement')
    }
  }

  async function handleCreateAmendment() {
    if (!amendmentData.title) {
      toast.error('Amendment title is required')
      return
    }

    try {
      const res = await fetch(`http://localhost:4000/api/requirements/${id}/amendments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(amendmentData)
      })

      if (!res.ok) throw new Error('Failed to create amendment')

      toast.success('Amendment created successfully')
      setShowAmendmentModal(false)
      setAmendmentData({ title: '', description: '', businessJustification: '', urgency: 'medium' })
      fetchAmendments()
    } catch (error) {
      console.error('Create amendment error:', error)
      toast.error('Failed to create amendment')
    }
  }

  async function handleDeleteRequirement() {
    if (!confirm('Are you sure you want to delete this requirement?')) return

    try {
      const res = await fetch(`http://localhost:4000/api/requirements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Failed to delete requirement')

      toast.success('Requirement deleted')
      navigate('/requirements')
    } catch (error) {
      console.error('Delete requirement error:', error)
      toast.error('Failed to delete requirement')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
      </div>
    )
  }

  if (!requirement) {
    return (
      <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Requirement not found</h2>
            <Link to="/requirements" className="text-primary hover:underline mt-2 inline-block">
              Back to Requirements
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const currentStepIndex = workflowSteps.indexOf(requirement.status)

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Toaster position="top-right" richColors />
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Back button */}
          <Link
            to="/requirements"
            className="inline-flex items-center gap-2 mb-6 text-sm font-medium hover:text-primary transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Back to Requirements
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-mono font-bold px-3 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    {requirement.issueKey}
                  </span>
                  <span className={`px-4 py-1.5 rounded-lg text-sm font-semibold border shadow-sm ${statusColors[requirement.status]}`}>
                    {requirement.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className="text-sm font-bold px-3 py-1 rounded border bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    P{requirement.priority}
                  </span>
                </div>
                <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {requirement.title}
                </h1>
              </div>

              <div className="flex gap-2">
                <motion.button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 rounded-lg border font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit
                </motion.button>
                <motion.button
                  onClick={() => setShowStatusModal(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-spark text-white font-medium flex items-center gap-2 shadow-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                  Change Status
                </motion.button>
                <motion.button
                  onClick={handleDeleteRequirement}
                  className="px-4 py-2 rounded-lg border border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Delete
                </motion.button>
              </div>
            </div>

            {/* Workflow Stepper */}
            <div className="mt-6 p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
              <h3 className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Workflow Progress
              </h3>
              <div className="flex items-center justify-between">
                {workflowSteps.map((step, index) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`size-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
                          index <= currentStepIndex
                            ? 'bg-gradient-spark text-white border-primary shadow-lg'
                            : 'bg-slate-100 text-slate-400 border-slate-300 dark:bg-slate-700 dark:text-slate-500 dark:border-slate-600'
                        }`}
                      >
                        {index < currentStepIndex ? (
                          <span className="material-symbols-outlined text-[20px]">check</span>
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={`text-xs mt-2 text-center capitalize ${
                          index === currentStepIndex ? 'font-semibold' : ''
                        }`}
                        style={{ color: index <= currentStepIndex ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                      >
                        {step.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-2 rounded transition-all ${
                          index < currentStepIndex ? 'bg-gradient-spark' : 'bg-slate-200 dark:bg-slate-600'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Content sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Original Draft */}
              {requirement.originalDraft && (
                <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-slate-500">draft</span>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Original Draft</h3>
                    <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      Preserved
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                    {requirement.originalDraft}
                  </p>
                </div>
              )}

              {/* Claude Rewrite */}
              <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary">psychology</span>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Claude Rewrite</h3>
                  {requirement.status === 'solidified' && (
                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      Solidified
                    </span>
                  )}
                </div>
                {requirement.claudeRewrite ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert" style={{ color: 'var(--text-secondary)' }}>
                    {requirement.claudeRewrite}
                  </div>
                ) : (
                  <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
                    No Claude rewrite yet. Move to "Brainstorm" status to collaborate with Claude.
                  </p>
                )}
              </div>

              {/* Description */}
              {requirement.description && (
                <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Description</h3>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                    {requirement.description}
                  </p>
                </div>
              )}

              {/* Amendments */}
              <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Amendments</h3>
                  <motion.button
                    onClick={() => setShowAmendmentModal(true)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-gradient-spark text-white font-medium flex items-center gap-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Amendment
                  </motion.button>
                </div>

                {amendments.length === 0 ? (
                  <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>No amendments yet</p>
                ) : (
                  <div className="space-y-3">
                    {amendments.map(amendment => (
                      <div
                        key={amendment.id}
                        className="p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer"
                        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              Amendment #{amendment.amendmentNumber}
                            </span>
                            <h4 className="font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>
                              {amendment.title}
                            </h4>
                          </div>
                          <div className="flex gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              amendment.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                              amendment.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                              amendment.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {amendment.urgency.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        {amendment.description && (
                          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                            {amendment.description}
                          </p>
                        )}
                        {amendment.beadsFeatureId && (
                          <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-mono inline-block mt-2">
                            Feature: {amendment.beadsFeatureId}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar metadata */}
            <div className="space-y-6">
              {/* Beads Links */}
              <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Beads Links</h3>
                <div className="space-y-3">
                  {requirement.beadsId && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Beads Issue</p>
                      <span className="text-sm font-mono px-2 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {requirement.beadsId}
                      </span>
                    </div>
                  )}
                  {requirement.beadsEpicId && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Epic ID</p>
                      <span className="text-sm font-mono px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        {requirement.beadsEpicId}
                      </span>
                    </div>
                  )}
                  {!requirement.beadsId && !requirement.beadsEpicId && (
                    <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>No beads links yet</p>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Metadata</h3>
                <div className="space-y-3 text-sm">
                  {requirement.targetDate && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Target Date</p>
                      <p style={{ color: 'var(--text-primary)' }}>
                        {new Date(requirement.targetDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {requirement.labels && requirement.labels.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Labels</p>
                      <div className="flex flex-wrap gap-2">
                        {requirement.labels.map((label, i) => (
                          <span key={i} className="px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {requirement.brainstormParticipants && requirement.brainstormParticipants.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Brainstorm Participants</p>
                      <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                        {requirement.brainstormParticipants.join(', ')}
                      </p>
                    </div>
                  )}
                  {requirement.approvedBy && requirement.approvedBy.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Approved By</p>
                      <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                        {requirement.approvedBy.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Timeline</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Created</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {new Date(requirement.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {requirement.brainstormStartedAt && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Brainstorm Started</span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {new Date(requirement.brainstormStartedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {requirement.solidifiedAt && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Solidified</span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {new Date(requirement.solidifiedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {requirement.implementationStartedAt && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Implementation Started</span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {new Date(requirement.implementationStartedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {requirement.completedAt && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Completed</span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {new Date(requirement.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Status Change Modal */}
      <AnimatePresence>
        {showStatusModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowStatusModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-lg w-full p-6 rounded-xl shadow-2xl"
              style={{ backgroundColor: 'var(--bg-card)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 bg-gradient-spark bg-clip-text text-transparent">
                Change Status
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    New Status *
                  </label>
                  <select
                    value={statusData.status}
                    onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                  >
                    <option value="">Select status</option>
                    {workflowSteps.map(status => (
                      <option key={status} value={status}>{status.replace(/_/g, ' ').toUpperCase()}</option>
                    ))}
                    <option value="cancelled">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Participants (comma-separated user IDs)
                  </label>
                  <input
                    type="text"
                    value={statusData.participants}
                    onChange={(e) => setStatusData({ ...statusData, participants: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                    placeholder="1, 2, 3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Approvers (comma-separated user IDs)
                  </label>
                  <input
                    type="text"
                    value={statusData.approvers}
                    onChange={(e) => setStatusData({ ...statusData, approvers: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                    placeholder="1, 2"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={handleUpdateStatus}
                  className="flex-1 btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Update Status
                </motion.button>
                <motion.button
                  onClick={() => setShowStatusModal(false)}
                  className="px-6 py-2 rounded-lg border font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl w-full p-6 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--bg-card)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 bg-gradient-spark bg-clip-text text-transparent">
                Edit Requirement
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Title</label>
                  <input
                    type="text"
                    value={editData.title || ''}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Description</label>
                  <textarea
                    value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50 h-32 resize-none"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Claude Rewrite</label>
                  <textarea
                    value={editData.claudeRewrite || ''}
                    onChange={(e) => setEditData({ ...editData, claudeRewrite: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50 h-40 resize-none"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                    placeholder="Claude's structured version"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Beads Epic ID</label>
                  <input
                    type="text"
                    value={editData.beadsEpicId || ''}
                    onChange={(e) => setEditData({ ...editData, beadsEpicId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                    placeholder="tsklets-abc123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Priority</label>
                  <select
                    value={editData.priority || 3}
                    onChange={(e) => setEditData({ ...editData, priority: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                  >
                    <option value={0}>P0 - Critical</option>
                    <option value={1}>P1 - High</option>
                    <option value={2}>P2 - Medium</option>
                    <option value={3}>P3 - Normal</option>
                    <option value={4}>P4 - Low</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={handleUpdateRequirement}
                  className="flex-1 btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Save Changes
                </motion.button>
                <motion.button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 rounded-lg border font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Amendment Modal */}
      <AnimatePresence>
        {showAmendmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAmendmentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl w-full p-6 rounded-xl shadow-2xl"
              style={{ backgroundColor: 'var(--bg-card)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 bg-gradient-spark bg-clip-text text-transparent">
                Add Amendment
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={amendmentData.title}
                    onChange={(e) => setAmendmentData({ ...amendmentData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                    placeholder="What needs to be added/changed?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Description
                  </label>
                  <textarea
                    value={amendmentData.description}
                    onChange={(e) => setAmendmentData({ ...amendmentData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50 h-32 resize-none"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                    placeholder="Detailed description of the amendment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Business Justification
                  </label>
                  <textarea
                    value={amendmentData.businessJustification}
                    onChange={(e) => setAmendmentData({ ...amendmentData, businessJustification: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50 h-24 resize-none"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                    placeholder="Why is this amendment needed?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Urgency
                  </label>
                  <select
                    value={amendmentData.urgency}
                    onChange={(e) => setAmendmentData({ ...amendmentData, urgency: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={handleCreateAmendment}
                  className="flex-1 btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create Amendment
                </motion.button>
                <motion.button
                  onClick={() => setShowAmendmentModal(false)}
                  className="px-6 py-2 rounded-lg border font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
