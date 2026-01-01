import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '../store/auth'

interface Ticket {
  id: string
  issueKey: string
  title: string
  description: string
  type: string
  status: string
  clientPriority: number
  clientSeverity: number
  internalPriority: number | null
  internalSeverity: number | null
  clientId: number | null
  clientName: string | null
  clientType: string | null
  productId: number
  productCode: string | null
  productName: string | null
  createdBy: number
  creatorName: string | null
  creatorEmail: string | null
  reporterId: number | null
  reporterName: string | null
  reporterEmail: string | null
  assignedTo: number | null
  assigneeName: string | null
  assigneeEmail: string | null
  parentId: string | null
  labels: string[] | null
  storyPoints: number | null
  estimate: string | null
  dueDate: string | null
  beadsId: string | null
  resolution: string | null
  resolutionNote: string | null
  createdAt: string
  updatedAt: string
  // Escalation fields
  escalationReason: string | null
  escalationNote: string | null
  pushedToSystechAt: string | null
  pushedToSystechBy: number | null
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

// Helper to calculate SLA time since escalation
const getSlaTime = (pushedToSystechAt: string | null): { hours: number; display: string; urgency: 'normal' | 'warning' | 'critical' } => {
  if (!pushedToSystechAt) return { hours: 0, display: '-', urgency: 'normal' }

  const pushed = new Date(pushedToSystechAt)
  const now = new Date()
  const diffMs = now.getTime() - pushed.getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  let urgency: 'normal' | 'warning' | 'critical' = 'normal'
  if (hours >= 24) urgency = 'critical'
  else if (hours >= 8) urgency = 'warning'

  let display = ''
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    display = `${days}d ${hours % 24}h`
  } else if (hours > 0) {
    display = `${hours}h ${minutes}m`
  } else {
    display = `${minutes}m`
  }

  return { hours, display, urgency }
}

interface Attachment {
  id: number
  ticketId: string
  fileUrl: string
  fileName: string
  fileSize?: number
  createdAt: string
}

interface Comment {
  id: number
  ticketId: string
  content: string
  isInternal: boolean
  authorName: string
  createdAt: string
}

interface LinkedTicket {
  id: string
  issueKey: string
  title: string
  type: string
  status: string
}

interface TicketLink {
  id: number
  linkType: string
  direction: string
  ticket: LinkedTicket | null
}

interface DevTaskTicket {
  id: string
  issueKey: string
  title: string
  description: string
  productId: number
  productName: string | null
  productCode: string | null
}

interface TicketModalProps {
  issueKey: string
  onClose: () => void
  onStatusChange?: () => void
  onCreateDevTask?: (ticket: DevTaskTicket) => void
}

// Type configuration
const typeConfig: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  support: { icon: 'support_agent', color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Support' },
  bug: { icon: 'bug_report', color: 'text-red-500', bg: 'bg-red-500/10', label: 'Bug' },
  task: { icon: 'task_alt', color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Task' },
  feature: { icon: 'auto_awesome', color: 'text-cyan-500', bg: 'bg-cyan-500/10', label: 'Feature' },
  feature_request: { icon: 'lightbulb', color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Request' },
  epic: { icon: 'bolt', color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Epic' },
  spike: { icon: 'science', color: 'text-indigo-500', bg: 'bg-indigo-500/10', label: 'Spike' },
  note: { icon: 'note', color: 'text-slate-500', bg: 'bg-slate-500/10', label: 'Note' },
}

// Status configuration
const statusConfig: Record<string, { color: string; bg: string; icon: string }> = {
  pending_internal_review: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/50', icon: 'hourglass_empty' },
  open: { color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-700', icon: 'radio_button_unchecked' },
  in_progress: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/50', icon: 'pending' },
  waiting_for_customer: { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/50', icon: 'schedule' },
  rebuttal: { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/50', icon: 'reply' },
  review: { color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/50', icon: 'rate_review' },
  blocked: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/50', icon: 'block' },
  resolved: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/50', icon: 'check_circle' },
  closed: { color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-200 dark:bg-slate-800', icon: 'cancel' },
  cancelled: { color: 'text-slate-400 dark:text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', icon: 'do_not_disturb_on' },
}

// Priority colors
const priorityColors: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-blue-500',
  4: 'bg-emerald-500',
  5: 'bg-slate-400',
}

export default function TicketModal({ issueKey, onClose, onStatusChange, onCreateDevTask }: TicketModalProps) {
  const { token } = useAuthStore()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [parent, setParent] = useState<LinkedTicket | null>(null)
  const [children, setChildren] = useState<LinkedTicket[]>([])
  const [links, setLinks] = useState<TicketLink[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'attachments' | 'related'>('details')
  const [isClosing, setIsClosing] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isInternalComment, setIsInternalComment] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [selectedImage, setSelectedImage] = useState<Attachment | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Reassign to internal modal state
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [reassignComment, setReassignComment] = useState('')
  const [reassigning, setReassigning] = useState(false)
  const [reassignError, setReassignError] = useState('')

  useEffect(() => {
    fetchTicket()
    document.body.style.overflow = 'hidden'

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleEscape)
    }
  }, [issueKey])

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${issueKey}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setTicket(data.ticket)
      setAttachments(data.attachments || [])
      setComments(data.comments || [])
      setParent(data.parent || null)
      setChildren(data.children || [])
      setLinks(data.links || [])
    } catch (err) {
      console.error('Failed to fetch ticket', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => onClose(), 200)
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await fetch(`/api/tickets/${issueKey}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchTicket()
      onStatusChange?.()
    } catch (err) {
      console.error('Failed to update status', err)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmittingComment(true)
    try {
      await fetch(`/api/tickets/${ticket?.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newComment,
          isInternal: isInternalComment,
        }),
      })
      setNewComment('')
      fetchTicket()
    } catch (err) {
      console.error('Failed to add comment', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  // Handle reassign to internal
  const handleReassignToInternal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reassignComment.trim()) {
      setReassignError('A comment explaining the reassignment reason is required')
      return
    }

    setReassigning(true)
    setReassignError('')

    try {
      const res = await fetch(`/api/tickets/${ticket?.id}/reassign-to-internal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: reassignComment }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to reassign ticket')
      }

      setShowReassignModal(false)
      setReassignComment('')
      fetchTicket()
      onStatusChange?.()
    } catch (err: any) {
      setReassignError(err.message)
    } finally {
      setReassigning(false)
    }
  }

  // Handle mark as rebuttal
  const handleMarkAsRebuttal = async () => {
    try {
      await fetch(`/api/tickets/${issueKey}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'rebuttal' }),
      })
      fetchTicket()
      onStatusChange?.()
    } catch (err) {
      console.error('Failed to mark as rebuttal', err)
    }
  }

  // Handle create dev task - close this modal and trigger callback
  const handleCreateDevTask = () => {
    if (!ticket) return

    // Close this modal first
    setIsClosing(true)

    // After close animation, trigger the callback with ticket data
    setTimeout(() => {
      onCreateDevTask?.({
        id: ticket.id,
        issueKey: ticket.issueKey,
        title: ticket.title,
        description: ticket.description,
        productId: ticket.productId,
        productName: ticket.productName,
        productCode: ticket.productCode,
      })
    }, 200)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="flex items-center gap-3 text-white">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          <span>Loading ticket...</span>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">error</span>
          <p className="text-slate-600 dark:text-slate-300">Ticket not found</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
            Close
          </button>
        </div>
      </div>
    )
  }

  const tConfig = typeConfig[ticket.type] || typeConfig.support
  const sConfig = statusConfig[ticket.status] || statusConfig.open
  const priority = ticket.internalPriority || ticket.clientPriority || 3
  const ticketIsEscalated = isEscalated(ticket)
  const ticketIsCreatedBySystech = isCreatedBySystech(ticket)
  const slaTime = getSlaTime(ticket.pushedToSystechAt)

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8 overflow-y-auto
        ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-5xl mt-8 mb-8 rounded-2xl shadow-2xl overflow-hidden ${
          ticketIsEscalated ? 'ring-2 ring-red-500' : ''
        }
          ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* Header - Gradient bar (red for escalated) */}
        <div className={`h-1.5 w-full ${
          ticketIsEscalated
            ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-500'
            : 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500'
        }`} />

        {/* Header Content */}
        <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              {/* Type Icon */}
              <div className={`shrink-0 size-12 rounded-xl ${tConfig.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-2xl ${tConfig.color}`}>{tConfig.icon}</span>
              </div>

              {/* Title & Key */}
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="text-sm font-mono font-bold text-violet-600 dark:text-violet-400">
                    {ticket.issueKey}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${sConfig.bg} ${sConfig.color}`}>
                    <span className="material-symbols-outlined text-sm">{sConfig.icon}</span>
                    {ticket.status.replace(/_/g, ' ')}
                  </span>
                  {ticketIsEscalated && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 flex items-center gap-1.5 animate-pulse">
                      <span className="material-symbols-outlined text-sm">priority_high</span>
                      ESCALATED
                    </span>
                  )}
                  {ticketIsCreatedBySystech && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">business</span>
                      CREATED BY SYSTECH
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {ticket.title}
                </h2>
                <div className="flex items-center gap-3 mt-2 text-sm flex-wrap" style={{ color: 'var(--text-muted)' }}>
                  {ticket.productName && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">inventory_2</span>
                      {ticket.productName}
                    </span>
                  )}
                  {ticket.clientName && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">business</span>
                      {ticket.clientName}
                    </span>
                  )}
                  {/* SLA Timer for escalated tickets */}
                  {ticket.pushedToSystechAt && (
                    <span className={`flex items-center gap-1.5 font-medium ${
                      slaTime.urgency === 'critical'
                        ? 'text-red-600 dark:text-red-400'
                        : slaTime.urgency === 'warning'
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined text-base">timer</span>
                      SLA: {slaTime.display}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="shrink-0 size-10 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b px-6" style={{ borderColor: 'var(--border-primary)' }}>
          {[
            { key: 'details', label: 'Details', icon: 'description' },
            { key: 'comments', label: 'Comments', icon: 'chat', count: comments.length },
            { key: 'attachments', label: 'Attachments', icon: 'attach_file', count: attachments.length },
            { key: 'related', label: 'Related', icon: 'link', count: children.length + links.length + (parent ? 1 : 0) },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors
                ${activeTab === tab.key
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              style={{ color: activeTab === tab.key ? undefined : 'var(--text-secondary)' }}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-700">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex flex-col lg:flex-row">
          {/* Main Content */}
          <div className="flex-1 p-6 min-w-0">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Escalation Info Banner */}
                {ticketIsEscalated && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-2xl text-red-600 dark:text-red-400">priority_high</span>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-red-700 dark:text-red-300 mb-1">
                          Escalated Ticket
                        </h3>
                        {ticket.escalationReason && (
                          <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                            <span className="font-medium">Reason:</span> {escalationReasonLabels[ticket.escalationReason] || ticket.escalationReason}
                          </p>
                        )}
                        {ticket.escalationNote && (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            <span className="font-medium">Note:</span> {ticket.escalationNote}
                          </p>
                        )}
                        {ticket.pushedToSystechAt && (
                          <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                            Escalated on {new Date(ticket.pushedToSystechAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                    Description
                  </h3>
                  <div
                    className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {ticket.description || (
                      <span className="italic" style={{ color: 'var(--text-muted)' }}>No description provided</span>
                    )}
                  </div>
                </div>

                {/* Labels */}
                {ticket.labels && ticket.labels.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                      Labels
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {ticket.labels.map((label, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution */}
                {ticket.resolution && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      Resolution: {ticket.resolution}
                    </h3>
                    {ticket.resolutionNote && (
                      <p className="text-sm text-emerald-600 dark:text-emerald-300">{ticket.resolutionNote}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      <span className="material-symbols-outlined text-base">visibility_off</span>
                      Internal note (hidden from client)
                    </label>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-violet-700 transition-colors"
                    >
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-3 mt-6">
                  {comments.length === 0 ? (
                    <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined text-4xl mb-2">chat_bubble_outline</span>
                      <p>No comments yet</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-4 rounded-xl border ${comment.isInternal ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : ''}`}
                        style={!comment.isInternal ? { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' } : undefined}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                              {comment.authorName?.charAt(0) || '?'}
                            </div>
                            <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                              {comment.authorName}
                            </span>
                            {comment.isInternal && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                                Internal
                              </span>
                            )}
                          </div>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatDateTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {comment.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div>
                {attachments.length === 0 ? (
                  <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined text-4xl mb-2">folder_open</span>
                    <p>No attachments</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {attachments.map((att) => {
                      const isVideo = att.fileName.match(/\.(mp4|webm|mov|avi|wmv)$/i)
                      return (
                        <div
                          key={att.id}
                          className="group cursor-pointer"
                          onClick={() => !isVideo && setSelectedImage(att)}
                        >
                          <div className="aspect-square rounded-xl overflow-hidden border-2 transition-all hover:border-violet-400 hover:shadow-lg"
                            style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
                            {isVideo ? (
                              <video
                                src={att.fileUrl}
                                className="w-full h-full object-cover"
                                controls
                              />
                            ) : (
                              <img
                                src={att.fileUrl}
                                alt={att.fileName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            )}
                          </div>
                          <p className="mt-2 text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                            {att.fileName}
                          </p>
                          {att.fileSize && (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {formatFileSize(att.fileSize)}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'related' && (
              <div className="space-y-6">
                {/* Parent */}
                {parent && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined text-base">arrow_upward</span>
                      Parent
                    </h3>
                    <LinkedTicketCard ticket={parent} />
                  </div>
                )}

                {/* Children */}
                {children.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined text-base">arrow_downward</span>
                      Sub-tickets ({children.length})
                    </h3>
                    <div className="space-y-2">
                      {children.map((child) => (
                        <LinkedTicketCard key={child.id} ticket={child} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Links */}
                {links.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined text-base">link</span>
                      Links ({links.length})
                    </h3>
                    <div className="space-y-2">
                      {links.map((link) => link.ticket && (
                        <div key={link.id} className="flex items-center gap-3">
                          <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-700" style={{ color: 'var(--text-secondary)' }}>
                            {link.linkType.replace('_', ' ')}
                          </span>
                          <LinkedTicketCard ticket={link.ticket} compact />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!parent && children.length === 0 && links.length === 0 && (
                  <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined text-4xl mb-2">link_off</span>
                    <p>No related tickets</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l p-6 space-y-6"
            style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>

            {/* Status Selector */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                Status
              </h3>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              >
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {key.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                Actions
              </h3>
              <div className="space-y-2">
                {/* Create Dev Task Button - Primary action */}
                {ticket.status !== 'closed' && ticket.status !== 'resolved' && ticket.status !== 'cancelled' && onCreateDevTask && (
                  <button
                    onClick={handleCreateDevTask}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    <span className="material-symbols-outlined text-lg">add_task</span>
                    Create Dev Task
                  </button>
                )}

                {/* Mark as Rebuttal Button */}
                {ticket.status !== 'rebuttal' && ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                  <button
                    onClick={handleMarkAsRebuttal}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-300 dark:hover:border-rose-700"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                  >
                    <span className="material-symbols-outlined text-lg text-rose-500">reply</span>
                    Mark as Rebuttal
                  </button>
                )}

                {/* Reassign to Internal Button - Only for tickets with clientId */}
                {ticket.clientId && ticket.status !== 'pending_internal_review' && ticket.status !== 'closed' && (
                  <button
                    onClick={() => setShowReassignModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-700"
                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                  >
                    <span className="material-symbols-outlined text-lg text-orange-500">undo</span>
                    Reassign to Internal
                  </button>
                )}
              </div>
            </div>

            {/* Priority & Severity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                  Priority
                </h3>
                <div className="flex items-center gap-2">
                  <div className={`size-3 rounded-full ${priorityColors[priority]}`} />
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>P{priority}</span>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                  Severity
                </h3>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  S{ticket.internalSeverity || ticket.clientSeverity || 3}
                </span>
              </div>
            </div>

            {/* Assignee */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                Assignee
              </h3>
              {ticket.assigneeName ? (
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                    {ticket.assigneeName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ticket.assigneeName}</p>
                    {ticket.assigneeEmail && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{ticket.assigneeEmail}</p>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Unassigned</span>
              )}
            </div>

            {/* Reporter */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                Reporter
              </h3>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                  {(ticket.reporterName || ticket.creatorName || '?').charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {ticket.reporterName || ticket.creatorName}
                  </p>
                  {(ticket.reporterEmail || ticket.creatorEmail) && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {ticket.reporterEmail || ticket.creatorEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Story Points & Estimate */}
            {(ticket.storyPoints || ticket.estimate) && (
              <div className="grid grid-cols-2 gap-4">
                {ticket.storyPoints && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                      Story Points
                    </h3>
                    <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{ticket.storyPoints}</span>
                  </div>
                )}
                {ticket.estimate && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                      Estimate
                    </h3>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ticket.estimate}</span>
                  </div>
                )}
              </div>
            )}

            {/* Due Date */}
            {ticket.dueDate && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                  Due Date
                </h3>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg" style={{ color: 'var(--text-secondary)' }}>event</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatDate(ticket.dueDate)}
                  </span>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-primary)' }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>Created</span>
                <span style={{ color: 'var(--text-secondary)' }}>{formatDate(ticket.createdAt)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>Updated</span>
                <span style={{ color: 'var(--text-secondary)' }}>{formatDate(ticket.updatedAt)}</span>
              </div>
              {ticket.beadsId && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>Beads ID</span>
                  <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{ticket.beadsId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-slate-300"
            onClick={() => setSelectedImage(null)}
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          <img
            src={selectedImage.fileUrl}
            alt={selectedImage.fileName}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Reassign to Internal Modal */}
      {showReassignModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => {
            setShowReassignModal(false)
            setReassignComment('')
            setReassignError('')
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl animate-slide-up"
            style={{ backgroundColor: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-orange-600 dark:text-orange-400">undo</span>
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Reassign to Internal</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Send ticket back to client team</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowReassignModal(false)
                  setReassignComment('')
                  setReassignError('')
                }}
                className="size-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleReassignToInternal} className="p-6 space-y-4">
              {reassignError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {reassignError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Reason for reassignment <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reassignComment}
                  onChange={(e) => setReassignComment(e.target.value)}
                  placeholder="Explain why this ticket is being sent back to the client's internal team..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)',
                  }}
                  required
                />
                <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  This comment will be visible to the client and explains why the ticket requires their internal review.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReassignModal(false)
                    setReassignComment('')
                    setReassignError('')
                  }}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reassigning || !reassignComment.trim()}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {reassigning ? (
                    <>
                      <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                      Reassigning...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">undo</span>
                      Reassign Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

// Helper component for linked tickets
function LinkedTicketCard({ ticket, compact = false }: { ticket: LinkedTicket; compact?: boolean }) {
  const tConfig = typeConfig[ticket.type] || typeConfig.support
  const sConfig = statusConfig[ticket.status] || statusConfig.open

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors hover:border-violet-300 dark:hover:border-violet-600 cursor-pointer ${compact ? 'flex-1' : ''}`}
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
    >
      <span className={`material-symbols-outlined text-lg ${tConfig.color}`}>{tConfig.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-violet-600 dark:text-violet-400">
            {ticket.issueKey}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sConfig.bg} ${sConfig.color}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
        {!compact && (
          <p className="text-sm truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {ticket.title}
          </p>
        )}
      </div>
    </div>
  )
}
