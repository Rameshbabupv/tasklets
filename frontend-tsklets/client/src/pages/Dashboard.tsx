import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/auth'
import { useTheme } from '../hooks/useTheme'
import type { Ticket } from '@tsklets/types'
import { StatusBadge, PriorityPill } from '@tsklets/ui'
import { formatDate } from '@tsklets/utils'

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'pending_internal_review'

// Helper function to get initials
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Generate consistent color from string
function stringToColor(str: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function Dashboard() {
  const { user, token } = useAuthStore()
  const { theme } = useTheme()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
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
  }

  const filteredTickets = statusFilter === 'all'
    ? tickets
    : tickets.filter(t => t.status === statusFilter)

  const isDark = theme === 'dark'

  return (
    <div className="dashboard-container" data-theme={theme}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .dashboard-container {
          min-height: 100vh;
          padding: 2rem 2rem 4rem;
          position: relative;
          transition: background-color 0.3s ease;
        }

        .dashboard-container[data-theme="light"] {
          background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
        }

        .dashboard-container[data-theme="dark"] {
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
        }

        .content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .hero-section {
          margin-bottom: 2rem;
          animation: fadeInUp 0.6s ease-out;
        }

        .hero-title {
          font-family: 'Inter', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          transition: color 0.3s ease;
        }

        [data-theme="light"] .hero-title {
          color: #0F172A;
        }

        [data-theme="dark"] .hero-title {
          color: #F1F5F9;
        }

        .hero-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          font-weight: 400;
          transition: color 0.3s ease;
        }

        [data-theme="light"] .hero-subtitle {
          color: #64748B;
        }

        [data-theme="dark"] .hero-subtitle {
          color: #94A3B8;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          border-radius: 12px;
          padding: 1.25rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          animation: fadeInUp 0.6s ease-out backwards;
          border: 1px solid transparent;
        }

        [data-theme="light"] .stat-card {
          background: rgba(255, 255, 255, 0.8);
          border-color: rgba(148, 163, 184, 0.1);
        }

        [data-theme="dark"] .stat-card {
          background: rgba(30, 41, 59, 0.6);
          border-color: rgba(148, 163, 184, 0.05);
        }

        .stat-card:nth-child(1) { animation-delay: 0.05s; }
        .stat-card:nth-child(2) { animation-delay: 0.1s; }
        .stat-card:nth-child(3) { animation-delay: 0.15s; }
        .stat-card:nth-child(4) { animation-delay: 0.2s; }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        [data-theme="light"] .stat-card:hover {
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
          border-color: rgba(59, 130, 246, 0.3);
        }

        [data-theme="dark"] .stat-card:hover {
          background: rgba(51, 65, 85, 0.6);
          border-color: rgba(59, 130, 246, 0.4);
        }

        .stat-card.active {
          border-width: 2px;
        }

        [data-theme="light"] .stat-card.active {
          background: rgba(59, 130, 246, 0.05);
          border-color: #3B82F6;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
        }

        [data-theme="dark"] .stat-card.active {
          background: rgba(59, 130, 246, 0.1);
          border-color: #3B82F6;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
        }

        .stat-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .stat-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
        }

        .stat-label {
          font-family: 'Inter', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: color 0.3s ease;
        }

        [data-theme="light"] .stat-label {
          color: #64748B;
        }

        [data-theme="dark"] .stat-label {
          color: #94A3B8;
        }

        .stat-value {
          font-family: 'Inter', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 0.25rem;
          transition: color 0.3s ease;
        }

        [data-theme="light"] .stat-value {
          color: #0F172A;
        }

        [data-theme="dark"] .stat-value {
          color: #F1F5F9;
        }

        .stat-description {
          font-family: 'Inter', sans-serif;
          font-size: 0.75rem;
          font-weight: 400;
          transition: color 0.3s ease;
        }

        [data-theme="light"] .stat-description {
          color: #94A3B8;
        }

        [data-theme="dark"] .stat-description {
          color: #64748B;
        }

        .tickets-section {
          animation: fadeInUp 0.6s ease-out 0.25s backwards;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-title-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .section-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
          transition: background-color 0.3s ease;
        }

        [data-theme="light"] .section-icon {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          color: white;
        }

        [data-theme="dark"] .section-icon {
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
          color: white;
        }

        .section-title {
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        [data-theme="light"] .section-title {
          color: #0F172A;
        }

        [data-theme="dark"] .section-title {
          color: #F1F5F9;
        }

        .section-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 0.75rem;
          font-weight: 400;
          transition: color 0.3s ease;
        }

        [data-theme="light"] .section-subtitle {
          color: #94A3B8;
        }

        [data-theme="dark"] .section-subtitle {
          color: #64748B;
        }

        .view-all-link {
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        [data-theme="light"] .view-all-link {
          color: #3B82F6;
          background: rgba(59, 130, 246, 0.05);
        }

        [data-theme="light"] .view-all-link:hover {
          background: rgba(59, 130, 246, 0.1);
        }

        [data-theme="dark"] .view-all-link {
          color: #60A5FA;
          background: rgba(59, 130, 246, 0.1);
        }

        [data-theme="dark"] .view-all-link:hover {
          background: rgba(59, 130, 246, 0.15);
        }

        .tickets-table-wrapper {
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }

        [data-theme="light"] .tickets-table-wrapper {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(148, 163, 184, 0.1);
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
        }

        [data-theme="dark"] .tickets-table-wrapper {
          background: rgba(30, 41, 59, 0.4);
          border-color: rgba(148, 163, 184, 0.05);
        }

        .tickets-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .tickets-table thead th {
          font-family: 'Inter', sans-serif;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 1rem 1.25rem;
          text-align: left;
          transition: all 0.3s ease;
        }

        [data-theme="light"] .tickets-table thead th {
          color: #64748B;
          background: rgba(248, 250, 252, 0.8);
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
        }

        [data-theme="dark"] .tickets-table thead th {
          color: #94A3B8;
          background: rgba(15, 23, 42, 0.4);
          border-bottom: 1px solid rgba(51, 65, 85, 0.5);
        }

        .tickets-table tbody td {
          font-family: 'Inter', sans-serif;
          padding: 1rem 1.25rem;
          transition: all 0.3s ease;
        }

        [data-theme="light"] .tickets-table tbody td {
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
        }

        [data-theme="dark"] .tickets-table tbody td {
          border-bottom: 1px solid rgba(51, 65, 85, 0.3);
        }

        .tickets-table tbody tr:last-child td {
          border-bottom: none;
        }

        .ticket-title-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .ticket-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .ticket-title {
          font-weight: 500;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
          transition: color 0.3s ease;
        }

        [data-theme="light"] .ticket-title {
          color: #0F172A;
        }

        [data-theme="dark"] .ticket-title {
          color: #F1F5F9;
        }

        .ticket-key {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 0.75rem;
          font-weight: 500;
          transition: color 0.3s ease;
        }

        [data-theme="light"] .ticket-key {
          color: #3B82F6;
        }

        [data-theme="dark"] .ticket-key {
          color: #60A5FA;
        }

        .ticket-type {
          font-size: 0.6875rem;
          transition: color 0.3s ease;
        }

        [data-theme="light"] .ticket-type {
          color: #94A3B8;
        }

        [data-theme="dark"] .ticket-type {
          color: #64748B;
        }

        .reporter-wrapper {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .reporter-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 600;
          color: white;
          flex-shrink: 0;
        }

        .reporter-name {
          font-size: 0.8125rem;
          font-weight: 400;
          transition: color 0.3s ease;
        }

        [data-theme="light"] .reporter-name {
          color: #475569;
        }

        [data-theme="dark"] .reporter-name {
          color: #CBD5E1;
        }

        .count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 24px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        [data-theme="light"] .count-badge {
          background: rgba(148, 163, 184, 0.1);
          color: #64748B;
        }

        [data-theme="dark"] .count-badge {
          background: rgba(51, 65, 85, 0.5);
          color: #94A3B8;
        }

        .ticket-date {
          font-size: 0.8125rem;
          font-weight: 400;
          transition: color 0.3s ease;
        }

        [data-theme="light"] .ticket-date {
          color: #64748B;
        }

        [data-theme="dark"] .ticket-date {
          color: #94A3B8;
        }

        .loading-state,
        .empty-state {
          padding: 3rem 2rem;
          text-align: center;
        }

        .loading-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem;
        }

        [data-theme="light"] .loading-spinner {
          border-color: rgba(59, 130, 246, 0.1);
          border-top-color: #3B82F6;
        }

        [data-theme="dark"] .loading-spinner {
          border-color: rgba(59, 130, 246, 0.2);
          border-top-color: #60A5FA;
        }

        .loading-text,
        .empty-text {
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          font-weight: 400;
          transition: color 0.3s ease;
        }

        [data-theme="light"] .loading-text,
        [data-theme="light"] .empty-text {
          color: #64748B;
        }

        [data-theme="dark"] .loading-text,
        [data-theme="dark"] .empty-text {
          color: #94A3B8;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-title {
          font-family: 'Inter', sans-serif;
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          transition: color 0.3s ease;
        }

        [data-theme="light"] .empty-title {
          color: #0F172A;
        }

        [data-theme="dark"] .empty-title {
          color: #F1F5F9;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1.5rem 1rem 3rem;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }

          .stat-card {
            padding: 1rem;
          }

          .stat-value {
            font-size: 1.5rem;
          }

          .tickets-table-wrapper {
            overflow-x: auto;
          }

          .tickets-table thead th,
          .tickets-table tbody td {
            padding: 0.875rem 1rem;
            font-size: 0.8125rem;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
        }
      `}</style>

      <div className="content-wrapper">
        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="hero-title">Team Dashboard</h1>
          <p className="hero-subtitle">
            Your team has {stats.open} open ticket{stats.open !== 1 ? 's' : ''} requiring attention.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div
            className={`stat-card ${statusFilter === 'open' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')}
          >
            <div className="stat-header">
              <span className="stat-icon">📂</span>
              <span className="stat-label">Open</span>
            </div>
            <div className="stat-value">{stats.open}</div>
            <div className="stat-description">Awaiting response</div>
          </div>

          <div
            className={`stat-card ${statusFilter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
          >
            <div className="stat-header">
              <span className="stat-icon">⏳</span>
              <span className="stat-label">In Progress</span>
            </div>
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-description">Being worked on</div>
          </div>

          <div
            className={`stat-card ${statusFilter === 'resolved' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
          >
            <div className="stat-header">
              <span className="stat-icon">✅</span>
              <span className="stat-label">Resolved</span>
            </div>
            <div className="stat-value">{stats.resolved}</div>
            <div className="stat-description">Completed tickets</div>
          </div>

          <div
            className={`stat-card ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <div className="stat-header">
              <span className="stat-icon">🎫</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-description">All tickets</div>
          </div>
        </div>

        {/* Tickets Section */}
        <div className="tickets-section">
          <div className="section-header">
            <div className="section-title-wrapper">
              <div className="section-icon">📋</div>
              <div>
                <h2 className="section-title">Recent Tickets</h2>
                <p className="section-subtitle">
                  {statusFilter === 'all'
                    ? `${filteredTickets.length} tickets`
                    : `${filteredTickets.length} ${statusFilter.replace('_', ' ')} tickets`}
                </p>
              </div>
            </div>
            <a href="/tickets" className="view-all-link">
              View all →
            </a>
          </div>

          <div className="tickets-table-wrapper">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading your tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3 className="empty-title">No tickets found</h3>
                <p className="empty-text">
                  {statusFilter === 'all'
                    ? 'You haven\'t created any tickets yet'
                    : `No ${statusFilter.replace('_', ' ')} tickets`}
                </p>
              </div>
            ) : (
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>TICKET</th>
                    <th>REPORTER</th>
                    <th>STATUS</th>
                    <th>PRIORITY</th>
                    <th style={{ textAlign: 'center' }}>💬</th>
                    <th style={{ textAlign: 'center' }}>📎</th>
                    <th>UPDATED</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.slice(0, 10).map((ticket) => {
                    const reporterName = (ticket as any).reporterName || (ticket as any).createdByName || 'Unknown'
                    return (
                      <tr key={ticket.id}>
                        <td>
                          <div className="ticket-title-wrapper">
                            <span
                              className="ticket-indicator"
                              style={{
                                backgroundColor:
                                  ticket.status === 'open' ? '#F59E0B' :
                                  ticket.status === 'in_progress' ? '#3B82F6' :
                                  ticket.status === 'resolved' ? '#10B981' :
                                  '#6B7280'
                              }}
                            />
                            <div>
                              <div className="ticket-title">{ticket.title}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="ticket-key">{ticket.issueKey}</span>
                                {ticket.type && (
                                  <>
                                    <span className="ticket-type">•</span>
                                    <span className="ticket-type">
                                      {ticket.type === 'feature_request' ? 'Feature Request' : 'Support'}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="reporter-wrapper">
                            <div
                              className="reporter-avatar"
                              style={{ backgroundColor: stringToColor(reporterName) }}
                            >
                              {getInitials(reporterName)}
                            </div>
                            <span className="reporter-name">{reporterName}</span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td>
                          <PriorityPill priority={ticket.clientPriority} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="count-badge">
                            {(ticket as any).commentCount || 0}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="count-badge">
                            {(ticket as any).attachmentCount || 0}
                          </span>
                        </td>
                        <td>
                          <div className="ticket-date">{formatDate(ticket.updatedAt)}</div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
