import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/auth'
import type { Ticket } from '@tsklets/types'
import { StatusBadge, PriorityPill } from '@tsklets/ui'
import { formatDate } from '@tsklets/utils'
import NewTicketModal from '../components/NewTicketModal'

// Compact stat card component
function StatCard({ icon, label, value, color, active, onClick }: {
  icon: string
  label: string
  value: number
  color: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-sm cursor-pointer transition-all ${color} ${
        active ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900' : ''
      }`}
      style={{ borderColor: active ? 'transparent' : 'var(--border-primary)' }}
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

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'pending_internal_review'

export default function Dashboard() {
  console.log('🚀 Dashboard component loaded - v2')
  const { user, token } = useAuthStore()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

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

  // Filter tickets based on selected status
  const filteredTickets = statusFilter === 'all'
    ? tickets
    : tickets.filter(t => t.status === statusFilter)

  const isCompanyAdmin = user?.role === 'company_admin'

  // Handle stat card click
  const handleStatClick = (filter: StatusFilter) => {
    setStatusFilter(prev => prev === filter ? 'all' : filter)
  }

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
        <StatCard icon="folder_open" label="Open" value={stats.open} color="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" active={statusFilter === 'open'} onClick={() => handleStatClick('open')} />
        <StatCard icon="pending" label="In Progress" value={stats.inProgress} color="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" active={statusFilter === 'in_progress'} onClick={() => handleStatClick('in_progress')} />
        <StatCard icon="check_circle" label="Resolved" value={stats.resolved} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" active={statusFilter === 'resolved'} onClick={() => handleStatClick('resolved')} />
        {isCompanyAdmin ? (
          <StatCard icon="inbox" label="Triage" value={stats.pendingReview} color="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400" active={statusFilter === 'pending_internal_review'} onClick={() => handleStatClick('pending_internal_review')} />
        ) : (
          <StatCard icon="confirmation_number" label="Total" value={stats.total} color="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" active={statusFilter === 'all'} onClick={() => handleStatClick('all')} />
        )}
      </motion.div>

      {/* Tickets Table */}
      <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Recent Tickets</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center">No tickets yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
                <th className="px-4 py-2 text-left text-sm">Ticket</th>
                <th className="px-4 py-2 text-left text-sm">Reporter</th>
                <th className="px-4 py-2 text-left text-sm">Status</th>
                <th className="px-4 py-2 text-left text-sm">Priority</th>
                <th className="px-4 py-2 text-left text-sm">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.slice(0, 8).map((ticket) => (
                <tr key={ticket.id} className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{ticket.title}</div>
                    <div className="text-xs text-gray-500">{ticket.issueKey}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {(ticket as any).reporterName || (ticket as any).createdByName || 'Unknown'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityPill priority={ticket.clientPriority} />
                  </td>
                  <td className="px-4 py-3 text-sm">{formatDate(ticket.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <NewTicketModal isOpen={showNewTicketModal} onClose={() => setShowNewTicketModal(false)} />
    </>
  )
}
