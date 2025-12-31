import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAuthStore } from '../store/auth'
import { StatusBadge, PriorityPill } from '@tsklets/ui'
import ThemeToggle from '../components/ThemeToggle'
import TicketDetailModal from '../components/TicketDetailModal'
import type { Ticket } from '@tsklets/types'

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 border-green-300 dark:border-green-700',
  closed: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 border-slate-300 dark:border-slate-600',
}

const priorityLabels: Record<number, string> = {
  1: 'P1 - Critical',
  2: 'P2 - High',
  3: 'P3 - Medium',
  4: 'P4 - Low',
}

const ITEMS_PER_PAGE = 20

export default function MyTickets() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { token, user, logout } = useAuthStore()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)

  // Filter state from URL params
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'))

  // Debounced search
  const [searchInput, setSearchInput] = useState(searchQuery)

  useEffect(() => {
    fetchTickets()
  }, [])

  // Update URL params when filters change
  useEffect(() => {
    const params: Record<string, string> = {}
    if (statusFilter !== 'all') params.status = statusFilter
    if (priorityFilter !== 'all') params.priority = priorityFilter
    if (searchQuery) params.search = searchQuery
    if (currentPage > 1) params.page = currentPage.toString()
    setSearchParams(params)
  }, [statusFilter, priorityFilter, searchQuery, currentPage])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
      setCurrentPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

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

  // Filter and search logic
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Status filter
      if (statusFilter !== 'all' && ticket.status !== statusFilter) {
        return false
      }

      // Priority filter (convert string P1/P2/etc to number)
      if (priorityFilter !== 'all') {
        const priorityNum = parseInt(priorityFilter.replace('P', ''))
        if (ticket.clientPriority !== priorityNum) {
          return false
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchTitle = ticket.title?.toLowerCase().includes(query)
        const matchDescription = ticket.description?.toLowerCase().includes(query)
        const matchKey = ticket.issueKey?.toLowerCase().includes(query)
        const matchId = ticket.id.toString().includes(query)
        if (!matchTitle && !matchDescription && !matchKey && !matchId) {
          return false
        }
      }

      return true
    })
  }, [tickets, statusFilter, priorityFilter, searchQuery])

  // Pagination logic
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE)
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Active filter count
  const activeFilterCount = [
    statusFilter !== 'all',
    priorityFilter !== 'all',
    searchQuery !== ''
  ].filter(Boolean).length

  function clearFilters() {
    setStatusFilter('all')
    setPriorityFilter('all')
    setSearchInput('')
    setSearchQuery('')
    setCurrentPage(1)
  }

  function handlePageChange(page: number) {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-white to-purple-50/30 dark:from-slate-800 dark:to-purple-900/30 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg">
                  <span className="material-symbols-outlined text-xl">support_agent</span>
                </div>
                <div>
                  <span className="font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Support Desk</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Client Portal</p>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
                </div>
                <motion.button
                  onClick={logout}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-slate-400 hover:text-primary transition-colors p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg"
                  aria-label="Logout"
                >
                  <span className="material-symbols-outlined">logout</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header with Filters Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)'
            }}
          >
            <span className="material-symbols-outlined text-lg">tune</span>
            <span className="text-sm font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span className="size-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {(showFilters || window.innerWidth >= 768) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div
                className="p-4 rounded-lg border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
              >
                {/* Search Input */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Search
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search by key, subject, or description..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="pending_internal_review">Pending Review</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_for_customer">Waiting for Customer</option>
                    <option value="rebuttal">Rebuttal</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Priority
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1) }}
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="all">All Priorities</option>
                    <option value="P1">P1 - Critical</option>
                    <option value="P2">P2 - High</option>
                    <option value="P3">P3 - Medium</option>
                    <option value="P4">P4 - Low</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                {activeFilterCount > 0 && (
                  <div className="md:col-span-4 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* Empty State - No Tickets at All */}
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

        {/* Empty State - No Results After Filtering */}
        {!loading && tickets.length > 0 && filteredTickets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="size-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-slate-400">
                search_off
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No tickets match your filters
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Try adjusting your filters or search term
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border hover:border-primary transition-colors"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <span className="material-symbols-outlined text-lg">close</span>
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* Tickets List - Mobile: Cards, Desktop: Table */}
        {!loading && paginatedTickets.length > 0 && (
          <>
            {/* Mobile Cards (< 768px) */}
            <div className="block md:hidden space-y-3">
              {paginatedTickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="block w-full text-left rounded-lg border p-4 hover:border-primary/50 hover:shadow-lg transition-all"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-3">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {ticket.issueKey || `#${ticket.id}`}
                      </span>
                      <StatusBadge status={ticket.status} />
                    </div>

                    {/* Subject */}
                    <h3 className="font-semibold mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                      {ticket.title}
                    </h3>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                      <PriorityPill priority={ticket.clientPriority} />
                      <span>{formatDate(ticket.createdAt)}</span>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Desktop Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto mb-6">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-200">
                    <th className="py-3 px-4">Key</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Created By</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTickets.map((ticket, index) => (
                    <motion.tr
                      key={ticket.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      style={{ borderColor: 'var(--border-primary)' }}
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedTicketId(ticket.id)}
                          className="font-mono text-sm font-semibold text-primary hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
                        >
                          {ticket.issueKey || `#${ticket.id}`}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {ticket.title}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          ticket.type === 'feature_request'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                        }`}>
                          {ticket.type === 'feature_request' ? '✨ Feature' : '🎫 Support'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={ticket.status} />
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
                      <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(ticket.updatedAt)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                {/* Results Summary */}
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredTickets.length)} of {filteredTickets.length} tickets
                </p>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden material-symbols-outlined text-lg">chevron_left</span>
                  </button>

                  {/* Page Numbers (Desktop) */}
                  <div className="hidden md:flex items-center gap-2">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`size-10 rounded-lg border transition-colors ${
                            currentPage === pageNum
                              ? 'bg-primary text-white border-primary'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                          style={
                            currentPage !== pageNum
                              ? {
                                  backgroundColor: 'var(--bg-card)',
                                  borderColor: 'var(--border-primary)',
                                  color: 'var(--text-primary)'
                                }
                              : undefined
                          }
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  {/* Page Info (Mobile) */}
                  <div className="md:hidden px-3 py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Page {currentPage} of {totalPages}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />
    </div>
  )
}
