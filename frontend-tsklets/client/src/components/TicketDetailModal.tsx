import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/auth'
import type { Ticket, Attachment, TicketComment } from '@tsklets/types'
import { StatusBadge, PriorityPill } from '@tsklets/ui'
import { formatDateTime } from '@tsklets/utils'

interface TicketDetailModalProps {
  ticketId: number | null
  onClose: () => void
}

export default function TicketDetailModal({ ticketId, onClose }: TicketDetailModalProps) {
  const { token } = useAuthStore()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [comments, setComments] = useState<TicketComment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
    }
  }, [ticketId])

  const fetchTicket = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
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
    } finally {
      setSubmitting(false)
    }
  }

  if (!ticketId) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-600 text-white">
                <span className="material-symbols-outlined">confirmation_number</span>
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">
                  Ticket #{ticketId}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">View ticket details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : !ticket ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                Ticket not found
              </div>
            ) : (
              <div className="space-y-6">
                {/* Ticket Info */}
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex-1">
                      {ticket.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={ticket.status} />
                      <PriorityPill priority={ticket.clientPriority} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">schedule</span>
                      {formatDateTime(ticket.createdAt)}
                    </span>
                    {(ticket as any).type && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        (ticket as any).type === 'feature_request'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                      }`}>
                        {(ticket as any).type === 'feature_request' ? 'Feature Request' : 'Support'}
                      </span>
                    )}
                  </div>

                  {ticket.description && (
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {ticket.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">attach_file</span>
                      Attachments ({attachments.length})
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base text-slate-500 dark:text-slate-400">image</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                            {att.fileName}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">chat</span>
                    Comments ({comments.filter(c => !c.isInternal).length})
                  </h4>

                  <div className="space-y-4">
                    {comments.filter(c => !c.isInternal).map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                          U
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">User</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDateTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{comment.content}</p>
                        </div>
                      </div>
                    ))}

                    {comments.filter(c => !c.isInternal).length === 0 && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                        No comments yet
                      </p>
                    )}
                  </div>

                  {/* Add Comment */}
                  <form onSubmit={handleAddComment} className="mt-4">
                    <div className="flex gap-3">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={2}
                        className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim() || submitting}
                        className="self-end px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
