import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAuthStore } from '../store/auth'
import ThemeToggle from '../components/ThemeToggle'

interface Ticket {
  id: number
  issueKey: string
  subject: string
  status: string
  priority: string
  severity: string
  createdAt: string
  clientId: number
  productId: number
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700',
  closed: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600',
}

const priorityColors: Record<string, string> = {
  P1: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700',
  P2: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700',
  P3: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  P4: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600',
}

export default function MyTickets() {
  const navigate = useNavigate()
  const { token, user, logout } = useAuthStore()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTickets()
  }, [])

  async function fetchTickets() {
    setLoading(true)
    try {
      const res = await fetch('/api/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Failed to fetch tickets')

      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Fetch tickets error:', error)
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <header
        className="border-b sticky top-0 z-10 backdrop-blur-sm bg-white/90 dark:bg-slate-900/90"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              >
                <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  T
                </div>
                <span className="hidden sm:block font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  Tsklets
                </span>
              </button>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                My Tickets
              </h1>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {user?.name}
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            View and manage all your support tickets
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Loading tickets...
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
            <div className="size-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-slate-400">
                inbox
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No tickets yet
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Create your first support ticket to get started
            </p>
            <Link
              to="/tickets/new"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Create Ticket
            </Link>
          </motion.div>
        )}

        {/* Tickets List - Mobile: Cards, Desktop: Table */}
        {!loading && tickets.length > 0 && (
          <>
            {/* Mobile Cards (< 768px) */}
            <div className="block md:hidden space-y-3">
              {tickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/tickets/${ticket.id}`}
                    className="block rounded-lg border p-4 hover:border-primary/50 hover:shadow-lg transition-all"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-3">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {ticket.issueKey}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusColors[ticket.status] || statusColors.open}`}>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    {/* Subject */}
                    <h3 className="font-semibold mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                      {ticket.subject}
                    </h3>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className={`px-2 py-0.5 rounded border ${priorityColors[ticket.priority] || priorityColors.P4}`}>
                        {ticket.priority}
                      </span>
                      <span>{formatDate(ticket.createdAt)}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Desktop Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Issue Key
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Subject
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Priority
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Created
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket, index) => (
                    <motion.tr
                      key={ticket.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      style={{ borderColor: 'var(--border-primary)' }}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm font-semibold text-primary">
                          {ticket.issueKey}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="font-medium hover:text-primary transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {ticket.subject}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[ticket.status] || statusColors.open}`}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${priorityColors[ticket.priority] || priorityColors.P4}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          View
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
