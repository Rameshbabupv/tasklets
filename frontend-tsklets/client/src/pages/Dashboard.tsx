import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import { useAuthStore } from '../store/auth'
import type { Ticket } from '@tsklets/types'
import { StatusBadge, PriorityPill } from '@tsklets/ui'
import { formatDate } from '@tsklets/utils'
import StatCard from '../components/StatCard'
import ModuleCard from '../components/ModuleCard'
import NewTicketModal from '../components/NewTicketModal'
import ChangePasswordModal from '../components/ChangePasswordModal'
import ThemeToggle from '../components/ThemeToggle'

export default function Dashboard() {
  const { user, token, logout } = useAuthStore()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const navigate = useNavigate()

  // Check if user needs to change password
  useEffect(() => {
    if (user?.requirePasswordChange) {
      setShowChangePasswordModal(true)
    }
  }, [user?.requirePasswordChange])

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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-white to-purple-50/30 dark:from-slate-800 dark:to-purple-900/30 border-b border-slate-200 dark:border-slate-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg">
                <span className="material-symbols-outlined text-xl">support_agent</span>
              </div>
              <div>
                <span className="font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Support Desk</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.tenant?.name || 'Client Portal'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <motion.button
                onClick={() => setShowNewTicketModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-purple-600 text-white min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">add</span>
                <span className="hidden sm:inline">New Ticket</span>
              </motion.button>
              <ThemeToggle />
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
                </div>
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-slate-400 hover:text-primary transition-colors p-2 hover:bg-white rounded-lg"
                  aria-label="Logout"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">logout</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl" aria-hidden="true">📊</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Dashboard</h1>
          </div>
        </motion.div>

        {/* Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div onClick={() => setShowNewTicketModal(true)} className="cursor-pointer">
              <ModuleCard
                emoji="🎫"
                title="Create Ticket"
                description="Submit a new support request for our team to assist you"
                to="#"
                badge="Start Here"
                badgeColor="bg-gradient-to-r from-primary to-purple-600 text-white"
              />
            </div>
            <ModuleCard
              emoji="📋"
              title="My Tickets"
              description="View and track all your support tickets in one place"
              count={stats.total}
              countLabel="Total"
              to="/tickets"
              badge={stats.open > 0 ? 'Active' : undefined}
              badgeColor={stats.open > 5 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}
            />
            <ModuleCard
              emoji="📚"
              title="Knowledge Base"
              description="Browse helpful articles and common solutions"
              to="/help"
              badge="Coming Soon"
              badgeColor="bg-purple-100 text-purple-700"
            />
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Ticket Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon="confirmation_number"
              emoji="🎫"
              label="Total Tickets"
              value={stats.total}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              icon="folder_open"
              emoji="📂"
              label="Open"
              value={stats.open}
              color="bg-amber-50 text-amber-600"
            />
            <StatCard
              icon="pending"
              emoji="⏳"
              label="In Progress"
              value={stats.inProgress}
              color="bg-purple-50 text-purple-600"
            />
            <StatCard
              icon="check_circle"
              emoji="✅"
              label="Resolved"
              value={stats.resolved}
              color="bg-green-50 text-green-600"
            />
          </div>
        </motion.div>

        {/* Tickets Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border shadow-lg hover:shadow-xl transition-shadow"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
        >
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">📋</span>
              <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Recent Tickets</h2>
            </div>
            <Link to="/tickets" className="text-sm text-primary hover:text-purple-600 flex items-center gap-1 font-semibold group">
              View all
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform" aria-hidden="true">arrow_forward</span>
            </Link>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <div className="inline-block size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p style={{ color: 'var(--text-secondary)' }}>Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🎫</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No tickets yet</h3>
              <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Get started by creating your first support ticket</p>
              <motion.button
                onClick={() => setShowNewTicketModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg"
              >
                <span className="material-symbols-outlined" aria-hidden="true">add</span>
                Create your first ticket
              </motion.button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <table className="w-full hidden md:table">
                <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <tr className="text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                  {tickets.slice(0, 5).map((ticket, index) => (
                    <motion.tr
                      key={ticket.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-purple-900/20 dark:hover:to-blue-900/20 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>#{ticket.id}</td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="text-sm font-semibold hover:text-primary transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {ticket.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-6 py-4">
                        <PriorityPill priority={ticket.clientPriority} />
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(ticket.createdAt)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                {tickets.slice(0, 5).map((ticket, index) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                  >
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="block p-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors min-h-[44px]"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
                            {ticket.title}
                          </h3>
                          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                            #{ticket.id}
                          </p>
                        </div>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <PriorityPill priority={ticket.clientPriority} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </main>

      {/* Change Password Modal (Required) */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        canDismiss={false}
        onSuccess={() => setShowChangePasswordModal(false)}
      />

      {/* New Ticket Modal */}
      <NewTicketModal isOpen={showNewTicketModal} onClose={() => setShowNewTicketModal(false)} />

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />
    </div>
  )
}
