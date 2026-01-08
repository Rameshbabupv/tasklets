import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import { useAuthStore } from '../store/auth'
import { StatusBadge, PriorityPill } from '@tsklets/ui'
import { formatDate } from '@tsklets/utils'
import TicketDetailModal from '../components/TicketDetailModal'
import type { Ticket } from '@tsklets/types'

export default function InternalTriageQueue() {
  const { token, user } = useAuthStore()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  const isCompanyAdmin = user?.role === 'company_admin'

  useEffect(() => {
    if (isCompanyAdmin) {
      fetchTriageTickets()
    }
  }, [isCompanyAdmin])

  async function fetchTriageTickets() {
    setLoading(true)
    try {
      const res = await fetch('/api/tickets?status=pending_internal_review', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Failed to fetch tickets')

      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Fetch triage tickets error:', error)
      toast.error('Failed to load triage queue')
    } finally {
      setLoading(false)
    }
  }

  // Check if user is company_admin
  if (!isCompanyAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Access Denied</h1>
          <p style={{ color: 'var(--text-secondary)' }}>You must be a company admin to access the triage queue.</p>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">Go to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6">
          <nav className="text-sm mb-4">
            <Link to="/" className="text-primary hover:text-orange-600">Home</Link>
            <span className="mx-2" style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-secondary)' }}>Internal Triage Queue</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Internal Triage Queue
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'} awaiting internal review
              </p>
            </div>
            <button
              onClick={fetchTriageTickets}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              <span className="text-sm font-medium hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="size-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Loading triage queue...
              </span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && tickets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="size-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-400">
                check_circle
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              All caught up!
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              There are no tickets pending internal review.
            </p>
          </motion.div>
        )}

        {/* Tickets List */}
        {!loading && tickets.length > 0 && (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto mb-6">
              <div
                className="rounded-xl border shadow-card overflow-hidden"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
              >
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-700">
                    <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-200">
                      <th className="py-3 px-4">Key</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Created By</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket, index) => (
                      <motion.tr
                        key={ticket.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors"
                        style={{ borderColor: 'var(--border-primary)' }}
                      >
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedTicketId(String(ticket.id))}
                            className="font-mono text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 hover:underline transition-colors"
                          >
                            {ticket.issueKey || `#${ticket.id}`}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {ticket.title}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            ticket.type === 'feature_request'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                          }`}>
                            {ticket.type === 'feature_request' ? 'Feature' : 'Support'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <PriorityPill priority={ticket.clientPriority} />
                        </td>
                        <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {ticket.createdByName || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {formatDate(ticket.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            to={`/tickets/${ticket.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            Review
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden space-y-3">
              {tickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div
                    className="rounded-lg border p-4 hover:border-orange-500/50 hover:shadow-lg transition-all"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-3">
                      <span className="font-mono text-xs font-semibold text-orange-600 dark:text-orange-400">
                        {ticket.issueKey || `#${ticket.id}`}
                      </span>
                      <StatusBadge status={ticket.status} />
                    </div>

                    {/* Subject */}
                    <h3 className="font-semibold mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                      {ticket.title}
                    </h3>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                      <PriorityPill priority={ticket.clientPriority} />
                      <span>{formatDate(ticket.createdAt)}</span>
                    </div>

                    {/* Action Button */}
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">visibility</span>
                      Review Ticket
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />
    </div>
  )
}
