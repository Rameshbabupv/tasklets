import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import { useAuthStore } from '../store/auth'
import type { Ticket, Attachment, TicketComment, TicketWatcher, EscalationReason } from '@tsklets/types'
import { StatusBadge, PriorityPill } from '@tsklets/ui'
import { formatDateTime } from '@tsklets/utils'
import ImageModal from '../components/ImageModal'
import TicketChangelog from '../components/TicketChangelog'

interface CompanyUser {
  id: number
  name: string
  email: string
  role: string
}

const ESCALATION_REASONS: { value: EscalationReason; label: string; description: string }[] = [
  { value: 'executive_request', label: 'Executive Request', description: 'Requested by C-level or senior leadership' },
  { value: 'production_down', label: 'Production Down', description: 'Critical system outage affecting operations' },
  { value: 'compliance', label: 'Compliance', description: 'Regulatory or compliance requirement' },
  { value: 'customer_impact', label: 'Customer Impact', description: 'Significant customer-facing issue' },
  { value: 'other', label: 'Other', description: 'Other urgent reason' },
]

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuthStore()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [comments, setComments] = useState<TicketComment[]>([])
  const [watchers, setWatchers] = useState<TicketWatcher[]>([])
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [modalImage, setModalImage] = useState<{ url: string; name: string; size?: number } | null>(null)

  // Triage modal states
  const [showEscalateModal, setShowEscalateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showAddWatcherModal, setShowAddWatcherModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Escalation form
  const [escalationReason, setEscalationReason] = useState<EscalationReason>('customer_impact')
  const [escalationNote, setEscalationNote] = useState('')

  // Add watcher form
  const [watcherEmail, setWatcherEmail] = useState('')
  const [selectedWatcherUserId, setSelectedWatcherUserId] = useState<number | null>(null)

  // Attachment upload
  const [uploading, setUploading] = useState(false)

  const isCompanyAdmin = user?.role === 'company_admin'
  const isPendingReview = ticket?.status === 'pending_internal_review'
  const isWatching = watchers.some(w => w.userId === user?.id)

  useEffect(() => {
    fetchTicket()
    fetchWatchers()
    if (isCompanyAdmin) {
      fetchCompanyUsers()
    }
  }, [id, isCompanyAdmin])

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setTicket(data.ticket)
      setAttachments(data.attachments || [])
      setComments(data.comments || [])
    } catch (err) {
      console.error('Failed to fetch ticket:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchWatchers = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}/watchers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setWatchers(data.watchers || [])
      }
    } catch (err) {
      console.error('Failed to fetch watchers:', err)
    }
  }

  const fetchCompanyUsers = async () => {
    try {
      const res = await fetch('/api/users/company', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCompanyUsers(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to fetch company users:', err)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      const res = await fetch(`/api/tickets/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment, isInternal: false }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments([...comments, data.comment])
        setNewComment('')
      }
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  // Triage Actions
  const handlePushToSystech = async () => {
    if (!confirm('Push this ticket to Systech? This will start the SLA clock.')) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/tickets/${id}/push-to-systech`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to push ticket')
      }

      toast.success('Ticket pushed to Systech successfully')
      fetchTicket()
    } catch (err: any) {
      toast.error(err.message || 'Failed to push ticket')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEscalate = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/tickets/${id}/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ escalationReason, escalationNote: escalationNote || undefined }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to escalate ticket')
      }

      toast.success('Ticket escalated successfully')
      setShowEscalateModal(false)
      setEscalationNote('')
      fetchTicket()
    } catch (err: any) {
      toast.error(err.message || 'Failed to escalate ticket')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssignInternal = async (assigneeId: number) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/tickets/${id}/assign-internal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ internalAssignedTo: assigneeId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to assign ticket')
      }

      toast.success('Ticket assigned internally')
      setShowAssignModal(false)
      fetchTicket()
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign ticket')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResolveInternally = async () => {
    if (!confirm('Resolve this ticket internally without Systech involvement?')) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'resolved', resolution: 'resolved_internally' }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to resolve ticket')
      }

      toast.success('Ticket resolved internally')
      fetchTicket()
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve ticket')
    } finally {
      setActionLoading(false)
    }
  }

  // Watcher Actions
  const handleAddSelfAsWatcher = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/tickets/${id}/watchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user?.id }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add watcher')
      }

      toast.success('You are now watching this ticket')
      fetchWatchers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add watcher')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddWatcher = async () => {
    if (!selectedWatcherUserId && !watcherEmail) {
      toast.error('Please select a user or enter an email')
      return
    }

    setActionLoading(true)
    try {
      const body = selectedWatcherUserId
        ? { userId: selectedWatcherUserId }
        : { email: watcherEmail }

      const res = await fetch(`/api/tickets/${id}/watchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add watcher')
      }

      toast.success('Watcher added successfully')
      setShowAddWatcherModal(false)
      setWatcherEmail('')
      setSelectedWatcherUserId(null)
      fetchWatchers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add watcher')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveWatcher = async (watcherId: number) => {
    if (!confirm('Remove this watcher?')) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/tickets/${id}/watchers/${watcherId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove watcher')
      }

      toast.success('Watcher removed')
      fetchWatchers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove watcher')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle attachment upload
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }

      const res = await fetch(`/api/tickets/${id}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to upload attachments')
      }

      const data = await res.json()
      setAttachments([...attachments, ...data.attachments])
      toast.success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded`)
      // Reset file input
      e.target.value = ''
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload attachments')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center gap-3">
          <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>Ticket not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <header className="bg-gradient-to-r from-white to-purple-50/30 dark:from-slate-800 dark:to-purple-900/30 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg">
                <span className="material-symbols-outlined text-xl">support_agent</span>
              </div>
              <div>
                <span className="font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Support Desk</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Client Portal</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link to="/" className="text-primary hover:text-blue-600">Home</Link>
          <span className="mx-2" style={{ color: 'var(--text-muted)' }}>/</span>
          <Link to="/tickets" className="text-primary hover:text-blue-600">Tickets</Link>
          <span className="mx-2" style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>{ticket.issueKey || `#${ticket.id}`}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Header */}
            <div className="rounded-xl shadow-card p-6" style={{ backgroundColor: 'var(--bg-card)', borderWidth: '1px', borderColor: 'var(--border-primary)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{ticket.title}</h1>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Created on {formatDateTime(ticket.createdAt)}
                    {ticket.createdByName && ` by ${ticket.createdByName}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={ticket.status} />
                  <PriorityPill priority={ticket.clientPriority} />
                </div>
              </div>
              {ticket.description && (
                <p className="whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{ticket.description}</p>
              )}

              {/* Escalation Info */}
              {ticket.escalationReason && (
                <div className="mt-4 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">priority_high</span>
                    <span className="font-semibold text-orange-800 dark:text-orange-300">Escalated</span>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    <strong>Reason:</strong> {ESCALATION_REASONS.find(r => r.value === ticket.escalationReason)?.label || ticket.escalationReason}
                  </p>
                  {ticket.escalationNote && (
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      <strong>Note:</strong> {ticket.escalationNote}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Triage Actions - Only for company_admin and pending_internal_review */}
            {isCompanyAdmin && isPendingReview && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl shadow-card p-6"
                style={{ backgroundColor: 'var(--bg-card)', borderWidth: '1px', borderColor: 'var(--border-primary)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-orange-500">assignment</span>
                  <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Internal Triage Actions</h2>
                </div>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  This ticket is pending internal review. Choose an action below:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handlePushToSystech}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">send</span>
                    Push to Systech
                  </button>
                  <button
                    onClick={() => setShowEscalateModal(true)}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">priority_high</span>
                    Escalate
                  </button>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">person_add</span>
                    Assign Internally
                  </button>
                  <button
                    onClick={handleResolveInternally}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    Resolve Internally
                  </button>
                </div>
              </motion.div>
            )}

            {/* Comments */}
            <div className="rounded-xl shadow-card" style={{ backgroundColor: 'var(--bg-card)', borderWidth: '1px', borderColor: 'var(--border-primary)' }}>
              <div className="px-6 py-4" style={{ borderBottomWidth: '1px', borderBottomColor: 'var(--border-primary)' }}>
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Comments</h2>
              </div>

              <div style={{ borderTopWidth: '0' }}>
                {comments.filter(c => !c.isInternal).map((comment, idx) => (
                  <div key={comment.id} className="p-6" style={idx > 0 ? { borderTopWidth: '1px', borderTopColor: 'var(--border-primary)' } : {}}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                        U
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>User</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDateTime(comment.createdAt)}</p>
                      </div>
                    </div>
                    <p className="ml-11" style={{ color: 'var(--text-secondary)' }}>{comment.content}</p>
                  </div>
                ))}

                {comments.length === 0 && (
                  <div className="p-6 text-center" style={{ color: 'var(--text-secondary)' }}>
                    No comments yet
                  </div>
                )}
              </div>

              {/* Add Comment */}
              <form onSubmit={handleAddComment} className="p-6" style={{ borderTopWidth: '1px', borderTopColor: 'var(--border-primary)' }}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your reply here..."
                  rows={3}
                  className="block w-full rounded-lg border-0 py-3 px-4 ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-primary text-sm mb-4"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-secondary)'
                  }}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                  >
                    Send Reply
                  </button>
                </div>
              </form>
            </div>

            {/* Changelog / Activity Log */}
            <div className="rounded-xl shadow-card" style={{ backgroundColor: 'var(--bg-card)', borderWidth: '1px', borderColor: 'var(--border-primary)' }}>
              <div className="p-6">
                <TicketChangelog ticketId={ticket.id.toString()} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Properties */}
            <div className="rounded-xl shadow-card p-6" style={{ backgroundColor: 'var(--bg-card)', borderWidth: '1px', borderColor: 'var(--border-primary)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Ticket Properties</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm" style={{ color: 'var(--text-secondary)' }}>Status</dt>
                  <dd className="mt-1"><StatusBadge status={ticket.status} /></dd>
                </div>
                <div>
                  <dt className="text-sm" style={{ color: 'var(--text-secondary)' }}>Priority</dt>
                  <dd className="mt-1"><PriorityPill priority={ticket.clientPriority} /></dd>
                </div>
                <div>
                  <dt className="text-sm" style={{ color: 'var(--text-secondary)' }}>Severity</dt>
                  <dd className="mt-1"><PriorityPill priority={ticket.clientSeverity} /></dd>
                </div>
                {ticket.pushedToSystechAt && (
                  <div>
                    <dt className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pushed to Systech</dt>
                    <dd className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {formatDateTime(ticket.pushedToSystechAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Watchers Section */}
            <div className="rounded-xl shadow-card p-6" style={{ backgroundColor: 'var(--bg-card)', borderWidth: '1px', borderColor: 'var(--border-primary)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Watchers ({watchers.length})
                </h3>
                {!isWatching && (
                  <button
                    onClick={handleAddSelfAsWatcher}
                    disabled={actionLoading}
                    className="text-xs flex items-center gap-1 text-primary hover:text-blue-600 font-medium disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    Watch
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {watchers.map((watcher) => (
                  <div
                    key={watcher.id}
                    className="flex items-center justify-between p-2 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">
                        {watcher.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {watcher.user?.name || 'Unknown'}
                          {watcher.userId === user?.id && (
                            <span className="text-xs text-primary ml-1">(you)</span>
                          )}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {watcher.user?.email}
                        </p>
                      </div>
                    </div>
                    {(isCompanyAdmin || watcher.userId === user?.id) && (
                      <button
                        onClick={() => handleRemoveWatcher(watcher.id)}
                        disabled={actionLoading}
                        className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Remove watcher"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    )}
                  </div>
                ))}

                {watchers.length === 0 && (
                  <p className="text-sm text-center py-2" style={{ color: 'var(--text-muted)' }}>
                    No watchers yet
                  </p>
                )}
              </div>

              {/* Add Watcher (company_admin only) */}
              {isCompanyAdmin && (
                <button
                  onClick={() => setShowAddWatcherModal(true)}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-dashed transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                >
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Add Watcher
                </button>
              )}
            </div>

            {/* Attachments */}
            <div className="rounded-xl shadow-card p-6" style={{ backgroundColor: 'var(--bg-card)', borderWidth: '1px', borderColor: 'var(--border-primary)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Attachments ({attachments.length})
                </h3>
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {attachments.map((att) => (
                    <div key={att.id} className="group">
                      {/* Thumbnail */}
                      <div
                        onClick={() => setModalImage({ url: att.fileUrl, name: att.fileName, size: att.fileSize })}
                        className="aspect-square rounded-lg overflow-hidden border-2 cursor-pointer hover:border-primary transition-colors"
                        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
                      >
                        <img
                          src={att.fileUrl}
                          alt={att.fileName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* File info */}
                      <div className="mt-2">
                        <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }} title={att.fileName}>
                          {att.fileName}
                        </p>
                        {att.fileSize && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
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
              )}

              {/* Upload Button */}
              <label
                className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                  uploading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
              >
                <span className="material-symbols-outlined text-lg">
                  {uploading ? 'hourglass_empty' : 'upload_file'}
                </span>
                <span className="text-sm font-medium">
                  {uploading ? 'Uploading...' : 'Add Attachments'}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleAttachmentUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
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

      {/* Escalate Modal */}
      <AnimatePresence>
        {showEscalateModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowEscalateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <span className="material-symbols-outlined">priority_high</span>
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">Escalate Ticket</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Escalate this ticket to Systech with priority
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Escalation Reason *
                  </label>
                  <div className="space-y-2">
                    {ESCALATION_REASONS.map((reason) => (
                      <label
                        key={reason.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          escalationReason === reason.value
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="escalationReason"
                          value={reason.value}
                          checked={escalationReason === reason.value}
                          onChange={() => setEscalationReason(reason.value)}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                            {reason.label}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {reason.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Additional Note (optional)
                  </label>
                  <textarea
                    value={escalationNote}
                    onChange={(e) => setEscalationNote(e.target.value)}
                    placeholder="Provide additional context for the escalation..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowEscalateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEscalate}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">priority_high</span>
                  {actionLoading ? 'Escalating...' : 'Escalate Ticket'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Internal Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowAssignModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">Assign Internally</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select a team member to handle this ticket
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {companyUsers.filter(u => u.id !== user?.id).map((companyUser) => (
                  <button
                    key={companyUser.id}
                    onClick={() => handleAssignInternal(companyUser.id)}
                    disabled={actionLoading}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-medium">
                      {companyUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        {companyUser.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {companyUser.email} - {companyUser.role}
                      </p>
                    </div>
                  </button>
                ))}
                {companyUsers.length <= 1 && (
                  <p className="text-center py-4 text-slate-500 dark:text-slate-400">
                    No other team members available
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Watcher Modal */}
      <AnimatePresence>
        {showAddWatcherModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowAddWatcherModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-600 text-white">
                  <span className="material-symbols-outlined">visibility</span>
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">Add Watcher</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select a user or enter an email address
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Select from company users */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Select Team Member
                  </label>
                  <select
                    value={selectedWatcherUserId || ''}
                    onChange={(e) => {
                      setSelectedWatcherUserId(e.target.value ? Number(e.target.value) : null)
                      setWatcherEmail('')
                    }}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">-- Select a user --</option>
                    {companyUsers
                      .filter(u => !watchers.some(w => w.userId === u.id))
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                  <span className="text-xs text-slate-400">or</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                </div>

                {/* Enter email */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={watcherEmail}
                    onChange={(e) => {
                      setWatcherEmail(e.target.value)
                      setSelectedWatcherUserId(null)
                    }}
                    placeholder="user@company.com"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowAddWatcherModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWatcher}
                  disabled={actionLoading || (!selectedWatcherUserId && !watcherEmail)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  {actionLoading ? 'Adding...' : 'Add Watcher'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />
    </div>
  )
}
