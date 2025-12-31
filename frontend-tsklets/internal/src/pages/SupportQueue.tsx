import { useEffect, useState, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/auth'
import TicketModal from '../components/TicketModal'

interface Ticket {
  id: string
  issueKey: string
  title: string
  description: string
  type: string
  status: 'pending_internal_review' | 'open' | 'in_progress' | 'waiting_for_customer' | 'rebuttal' | 'resolved' | 'closed' | 'cancelled'
  clientPriority: number
  internalPriority: number | null
  clientName: string | null
  clientId: number | null
  productName: string | null
  creatorName: string | null
  createdAt: string
  // Escalation fields
  escalationReason: string | null
  escalationNote: string | null
  pushedToSystechAt: string | null
  labels: string[] | null
}

// Type icons and colors
const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
  support: { icon: 'support_agent', color: 'text-orange-600', bg: 'bg-orange-50' },
  bug: { icon: 'bug_report', color: 'text-red-600', bg: 'bg-red-50' },
  task: { icon: 'task_alt', color: 'text-green-600', bg: 'bg-green-50' },
  feature: { icon: 'auto_awesome', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  feature_request: { icon: 'lightbulb', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  epic: { icon: 'bolt', color: 'text-purple-600', bg: 'bg-purple-50' },
  spike: { icon: 'science', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  note: { icon: 'note', color: 'text-slate-600', bg: 'bg-slate-50' },
}

const columns = [
  { key: 'pending_internal_review', label: 'Pending Review', color: 'orange' },
  { key: 'open', label: 'Open', color: 'slate' },
  { key: 'in_progress', label: 'In Progress', color: 'blue' },
  { key: 'rebuttal', label: 'Rebuttal', color: 'rose' },
  { key: 'resolved', label: 'Resolved', color: 'emerald' },
  { key: 'closed', label: 'Closed', color: 'gray' },
]

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

const priorityConfig: Record<number, { label: string; className: string; stripe: string }> = {
  1: { label: 'P1 - Critical', className: 'bg-red-50 text-red-600 border-red-100', stripe: 'bg-red-500' },
  2: { label: 'P2 - High', className: 'bg-amber-50 text-amber-600 border-amber-100', stripe: 'bg-amber-400' },
  3: { label: 'P3 - Medium', className: 'bg-blue-50 text-blue-600 border-blue-100', stripe: 'bg-blue-400' },
  4: { label: 'P4 - Low', className: 'bg-emerald-50 text-emerald-600 border-emerald-100', stripe: 'bg-emerald-400' },
  5: { label: 'P5 - Trivial', className: 'bg-slate-100 text-slate-600 border-slate-200', stripe: 'bg-slate-300' },
}

type FilterType = 'all' | 'escalated' | 'created_by_systech'
type SortType = 'created' | 'escalation' | 'priority'

export default function SupportQueue() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicketKey, setSelectedTicketKey] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('created')
  const [searchQuery, setSearchQuery] = useState('')
  const { token } = useAuthStore()

  // Apply filters and sorting
  const filteredTickets = useMemo(() => {
    let result = [...tickets]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.issueKey.toLowerCase().includes(query) ||
        t.clientName?.toLowerCase().includes(query) ||
        t.creatorName?.toLowerCase().includes(query)
      )
    }

    // Apply type filter
    if (filter === 'escalated') {
      result = result.filter(t => isEscalated(t))
    } else if (filter === 'created_by_systech') {
      result = result.filter(t => isCreatedBySystech(t))
    }

    // Apply sorting
    if (sortBy === 'escalation') {
      result.sort((a, b) => {
        if (!a.pushedToSystechAt && !b.pushedToSystechAt) return 0
        if (!a.pushedToSystechAt) return 1
        if (!b.pushedToSystechAt) return -1
        return new Date(a.pushedToSystechAt).getTime() - new Date(b.pushedToSystechAt).getTime()
      })
    } else if (sortBy === 'priority') {
      result.sort((a, b) => {
        const aPriority = a.internalPriority || a.clientPriority || 5
        const bPriority = b.internalPriority || b.clientPriority || 5
        return aPriority - bPriority
      })
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return result
  }, [tickets, filter, sortBy, searchQuery])

  // Count escalated tickets
  const escalatedCount = useMemo(() => tickets.filter(t => isEscalated(t)).length, [tickets])

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets/all', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setTickets(data)
    } catch (err) {
      console.error('Failed to fetch tickets', err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (ticketId: number, newStatus: string) => {
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchTickets()
    } catch (err) {
      console.error('Failed to update ticket', err)
    }
  }

  const getColumnTickets = (status: string) => filteredTickets.filter((t) => t.status === status)

  const getCountColor = (status: string) => {
    switch (status) {
      case 'pending_internal_review': return 'bg-orange-100 text-orange-700'
      case 'open': return 'bg-slate-200 text-slate-600'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'rebuttal': return 'bg-rose-100 text-rose-700'
      case 'resolved': return 'bg-emerald-100 text-emerald-700'
      case 'closed': return 'bg-slate-200 text-slate-600'
      default: return 'bg-slate-200 text-slate-600'
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background-light">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-auto min-h-16 px-6 py-3 border-b flex flex-col gap-3 shrink-0" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Support Queue</h2>
              {escalatedCount > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 flex items-center gap-1.5 animate-pulse">
                  <span className="material-symbols-outlined text-sm">priority_high</span>
                  {escalatedCount} Escalated
                </span>
              )}
              <div className="h-6 w-px mx-2" style={{ backgroundColor: 'var(--border-primary)' }} />
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: 'var(--text-muted)' }}>search</span>
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchTickets}
                className="size-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-4">
            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Filter:</span>
              <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-primary)' }}>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                  style={filter !== 'all' ? { color: 'var(--text-secondary)' } : undefined}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('escalated')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors border-l flex items-center gap-1 ${
                    filter === 'escalated'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                  style={{ borderColor: 'var(--border-primary)', ...(filter !== 'escalated' ? { color: 'var(--text-secondary)' } : {}) }}
                >
                  <span className="material-symbols-outlined text-sm">priority_high</span>
                  Escalated
                </button>
                <button
                  onClick={() => setFilter('created_by_systech')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors border-l flex items-center gap-1 ${
                    filter === 'created_by_systech'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                  style={{ borderColor: 'var(--border-primary)', ...(filter !== 'created_by_systech' ? { color: 'var(--text-secondary)' } : {}) }}
                >
                  <span className="material-symbols-outlined text-sm">business</span>
                  Internal
                </button>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border focus:ring-2 focus:ring-primary/20"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
              >
                <option value="created">Created Date</option>
                <option value="escalation">Escalation Time (SLA)</option>
                <option value="priority">Priority</option>
              </select>
            </div>

            {/* Results Count */}
            <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
              Showing {filteredTickets.length} of {tickets.length} tickets
            </span>
          </div>
        </header>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
          ) : (
            <div className="flex h-full gap-4">
              {columns.map((col) => {
                const colTickets = getColumnTickets(col.key)
                return (
                  <div
                    key={col.key}
                    className="flex flex-col flex-1 min-w-[280px] max-w-[350px] rounded-xl border"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
                  >
                    {/* Column Header */}
                    <div className="p-4 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{col.label}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getCountColor(col.key)}`}>
                          {colTickets.length}
                        </span>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-3">
                      {colTickets.map((ticket) => {
                        const priority = ticket.internalPriority || ticket.clientPriority || 3
                        const pConfig = priorityConfig[priority] || priorityConfig[3]
                        const tConfig = typeConfig[ticket.type] || typeConfig.support
                        const ticketIsEscalated = isEscalated(ticket)
                        const ticketIsCreatedBySystech = isCreatedBySystech(ticket)
                        const slaTime = getSlaTime(ticket.pushedToSystechAt)

                        return (
                          <div
                            key={ticket.id}
                            onClick={() => setSelectedTicketKey(ticket.issueKey)}
                            className={`group p-4 rounded-lg shadow-sm border hover:shadow-md transition-all relative overflow-hidden cursor-pointer ${
                              ticketIsEscalated
                                ? 'border-red-300 dark:border-red-700 hover:border-red-400 ring-1 ring-red-100 dark:ring-red-900/30'
                                : 'hover:border-violet-300'
                            }`}
                            style={{ backgroundColor: 'var(--bg-card)', ...(ticketIsEscalated ? {} : { borderColor: 'var(--border-primary)' }) }}
                          >
                            {/* Priority stripe or escalation stripe */}
                            {ticketIsEscalated ? (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg" />
                            ) : priority <= 2 ? (
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${pConfig.stripe} rounded-l-lg`} />
                            ) : null}

                            {/* Escalated Badge Row */}
                            {(ticketIsEscalated || ticketIsCreatedBySystech) && (
                              <div className="flex items-center gap-2 mb-2">
                                {ticketIsEscalated && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">priority_high</span>
                                    ESCALATED
                                  </span>
                                )}
                                {ticketIsCreatedBySystech && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">business</span>
                                    INTERNAL
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`material-symbols-outlined text-[16px] ${tConfig.color}`}>{tConfig.icon}</span>
                                <span className="text-xs font-mono font-semibold text-violet-600 dark:text-violet-400">{ticket.issueKey}</span>
                              </div>
                              <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${pConfig.className}`}>
                                P{priority}
                              </div>
                            </div>
                            <h4 className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>{ticket.title}</h4>

                            {/* SLA Timer for escalated tickets */}
                            {ticket.pushedToSystechAt && (
                              <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${
                                slaTime.urgency === 'critical'
                                  ? 'text-red-600 dark:text-red-400'
                                  : slaTime.urgency === 'warning'
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}>
                                <span className="material-symbols-outlined text-sm">timer</span>
                                <span>SLA: {slaTime.display}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between border-t pt-3 mt-3" style={{ borderColor: 'var(--border-secondary)' }}>
                              <div className="flex items-center gap-2">
                                {ticket.clientName && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">{ticket.clientName}</span>
                                )}
                                {ticket.creatorName && (
                                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{ticket.creatorName}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {colTickets.length === 0 && (
                        <div className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>No tickets</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Ticket Detail Modal */}
      {selectedTicketKey && (
        <TicketModal
          issueKey={selectedTicketKey}
          onClose={() => setSelectedTicketKey(null)}
          onStatusChange={fetchTickets}
        />
      )}
    </div>
  )
}
