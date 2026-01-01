import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/auth'
import type { Ticket } from '@tsklets/types'
import { StatusBadge, PriorityPill } from '@tsklets/ui'
import { formatDate } from '@tsklets/utils'
import NewTicketModal from '../components/NewTicketModal'
import TicketDetailModal from '../components/TicketDetailModal'

// Compact stat card component
function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-sm ${color}`}
      style={{ borderColor: 'var(--border-primary)' }}
    >
      <div className="w-10 h-10 rounded-lg bg-white/50 dark:bg-black/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <div>
        <span className="text-2xl font-bold">{value}</span>
        <p className="text-xs font-medium opacity-80 uppercase tracking-wide">{label}</p>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const { user, token } = useAuthStore()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (err) {
      console.error('Failed to fetch tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    pendingReview: tickets.filter((t) => t.status === 'pending_internal_review').length,
  }

  const isCompanyAdmin = user?.role === 'company_admin'

  return (
    <>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Team Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {stats.open > 0
            ? `Your team has ${stats.open} open ticket${stats.open > 1 ? 's' : ''} requiring attention.`
            : 'All caught up! No open tickets at the moment.'
          }
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
      >
        <StatCard icon="folder_open" label="Open" value={stats.open} color="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" />
        <StatCard icon="pending" label="In Progress" value={stats.inProgress} color="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" />
        <StatCard icon="check_circle" label="Resolved" value={stats.resolved} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" />
        {isCompanyAdmin ? (
          <StatCard icon="inbox" label="Triage" value={stats.pendingReview} color="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400" />
        ) : (
          <StatCard icon="confirmation_number" label="Total" value={stats.total} color="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" />
        )}
      </motion.div>

      {/* Tickets Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border shadow-sm overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <div>
              <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Recent Tickets</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stats.total} total tickets</p>
            </div>
          </div>
          <Link
            to="/tickets"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            View all
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-blue-600 dark:text-blue-400">confirmation_number</span>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No tickets yet</h3>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Get started by creating your first support ticket. Our team is ready to help!
            </p>
            <motion.button
              onClick={() => setShowNewTicketModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              <span className="material-symbols-outlined">add</span>
              Create your first ticket
            </motion.button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }}>
                    <th className="px-5 py-3">Ticket</th>
                    <th className="px-5 py-3">Reporter</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3 text-center">
                      <span className="material-symbols-outlined text-sm">chat</span>
                    </th>
                    <th className="px-5 py-3 text-center">
                      <span className="material-symbols-outlined text-sm">attach_file</span>
                    </th>
                    <th className="px-5 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                  {tickets.slice(0, 8).map((ticket, index) => (
                    <motion.tr
                      key={ticket.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.03 }}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            ticket.status === 'open' ? 'bg-amber-500' :
                            ticket.status === 'in_progress' ? 'bg-blue-500' :
                            ticket.status === 'resolved' ? 'bg-emerald-500' :
                            ticket.status === 'pending_internal_review' ? 'bg-orange-500' :
                            'bg-slate-400'
                          }`} />
                          <div>
                            <p className="font-semibold text-sm group-hover:text-blue-600 transition-colors" style={{ color: 'var(--text-primary)' }}>
                              {ticket.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{ticket.issueKey}</span>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>•</span>
                              <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                                {ticket.type?.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {(ticket as any).reporterName || (ticket as any).createdByName || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-5 py-4">
                        <PriorityPill priority={ticket.clientPriority} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700" style={{ color: 'var(--text-secondary)' }}>
                          {(ticket as any).commentCount || 0}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700" style={{ color: 'var(--text-secondary)' }}>
                          {(ticket as any).attachmentCount || 0}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(ticket.updatedAt)}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden divide-y" style={{ borderColor: 'var(--border-primary)' }}>
              {tickets.slice(0, 8).map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.03 }}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className="p-4 active:bg-slate-50 dark:active:bg-slate-800 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          ticket.status === 'open' ? 'bg-amber-500' :
                          ticket.status === 'in_progress' ? 'bg-blue-500' :
                          ticket.status === 'resolved' ? 'bg-emerald-500' :
                          ticket.status === 'pending_internal_review' ? 'bg-orange-500' :
                          'bg-slate-400'
                        }`} />
                        <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{ticket.issueKey}</span>
                      </div>
                      <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {ticket.title}
                      </h3>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 mb-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      by {(ticket as any).reporterName || (ticket as any).createdByName || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <PriorityPill priority={ticket.clientPriority} />
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">chat</span>
                          {(ticket as any).commentCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">attach_file</span>
                          {(ticket as any).attachmentCount || 0}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(ticket.updatedAt)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Modals */}
      <NewTicketModal isOpen={showNewTicketModal} onClose={() => setShowNewTicketModal(false)} />
      <TicketDetailModal
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />
    </>
  )
}
