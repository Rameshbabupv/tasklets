import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import ModuleCard from '../components/ModuleCard'
import TenantCard from '../components/TenantCard'
import { useAuthStore } from '../store/auth'

interface Tenant {
  id: number
  name: string
  subdomain: string | null
  tier: 'enterprise' | 'business' | 'starter'
  isActive: boolean
  createdAt: string
}

interface Ticket {
  id: number
  title: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  clientPriority: number
  clientSeverity: number
  internalPriority: number | null
  internalSeverity: number | null
  tenantName: string
  createdAt: string
}

interface Product {
  id: number
  name: string
  description: string | null
}

interface User {
  id: number
  email: string
  name: string
  role: string
  isActive: boolean
}

interface TenantWithStats {
  id: number
  name: string
  tier: 'enterprise' | 'business' | 'starter'
  isActive: boolean
  userCount: number
  ticketCount: number
}

interface DashboardMetrics {
  totalTenants: number
  activeTenants: number
  totalUsers: number
  activeUsers: number
  totalProducts: number
  openTickets: number
  ticketsByStatus: {
    open: number
    in_progress: number
    resolved: number
    closed: number
  }
  ticketsByPriority: { priority: number; count: number }[]
  tenantCards: TenantWithStats[]
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { token } = useAuthStore()

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')

    try {
      // Fetch core data in parallel
      const [tenantsRes, ticketsRes, productsRes] = await Promise.all([
        fetch('/api/clients', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/tickets/all', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/products', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (!tenantsRes.ok || !ticketsRes.ok || !productsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const tenantsData = await tenantsRes.json()
      const tenants: Tenant[] = tenantsData.tenants || []
      const tickets: Ticket[] = await ticketsRes.json()
      const products: Product[] = await productsRes.json()

      // Fetch user counts for each tenant in parallel
      const userCountPromises = tenants.map(async (tenant) => {
        try {
          const res = await fetch(`/api/users/tenant/${tenant.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) return { tenantId: tenant.id, users: [] }
          const users: User[] = await res.json()
          return { tenantId: tenant.id, users }
        } catch (err) {
          console.error(`Failed to fetch users for tenant ${tenant.id}`, err)
          return { tenantId: tenant.id, users: [] }
        }
      })

      const userCounts = await Promise.all(userCountPromises)

      // Calculate metrics
      const totalTenants = tenants.length
      const activeTenants = tenants.filter((t) => t.isActive).length

      const allUsers = userCounts.flatMap((uc) => uc.users)
      const totalUsers = allUsers.length
      const activeUsers = allUsers.filter((u) => u.isActive).length

      const totalProducts = products.length

      const ticketsByStatus = {
        open: tickets.filter((t) => t.status === 'open').length,
        in_progress: tickets.filter((t) => t.status === 'in_progress').length,
        resolved: tickets.filter((t) => t.status === 'resolved').length,
        closed: tickets.filter((t) => t.status === 'closed').length,
      }

      const openTickets = ticketsByStatus.open

      // Calculate tickets by priority (P1-P5)
      const ticketsByPriority = [1, 2, 3, 4, 5].map((p) => ({
        priority: p,
        count: tickets.filter((t) => {
          const priority = t.internalPriority || t.clientPriority
          return priority === p
        }).length,
      }))

      // Create tenant cards with stats
      const tenantCards: TenantWithStats[] = tenants.map((tenant) => {
        const userCount = userCounts.find((uc) => uc.tenantId === tenant.id)?.users.length || 0
        const ticketCount = tickets.filter((t) => t.tenantName === tenant.name).length

        return {
          id: tenant.id,
          name: tenant.name,
          tier: tenant.tier,
          isActive: tenant.isActive,
          userCount,
          ticketCount,
        }
      })

      setMetrics({
        totalTenants,
        activeTenants,
        totalUsers,
        activeUsers,
        totalProducts,
        openTickets,
        ticketsByStatus,
        ticketsByPriority,
        tenantCards,
      })
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-16 px-6 border-b flex items-center justify-between shrink-0"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">📊</span>
            <h2 className="text-xl font-display font-bold bg-gradient-spark bg-clip-text text-transparent">Dashboard</h2>
          </div>
          <motion.button
            onClick={fetchDashboardData}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-spark hover:opacity-90 text-white rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span>
            Refresh
          </motion.button>
        </motion.header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && !metrics && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'var(--error-bg)', borderWidth: '1px', borderColor: 'var(--error-text)' }}>
              <div className="flex items-center gap-2" style={{ color: 'var(--error-text)' }}>
                <span className="material-symbols-outlined text-[20px]">error</span>
                <p className="text-sm font-medium">{error}</p>
              </div>
              <button
                onClick={fetchDashboardData}
                className="mt-3 text-sm font-medium"
                style={{ color: 'var(--error-text)' }}
              >
                Try again
              </button>
            </div>
          )}

          {metrics && (
            <div className="space-y-8">
              {/* Quick Access */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-lg font-display font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Access</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <ModuleCard
                    emoji="🎫"
                    title="Tickets"
                    description="Manage customer support tickets and track resolution progress"
                    count={metrics.openTickets}
                    countLabel="Open"
                    to="/tickets"
                    badge={metrics.openTickets > 0 ? 'Active' : undefined}
                    badgeColor={metrics.openTickets > 5 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}
                  />
                  <ModuleCard
                    emoji="💡"
                    title="Ideas"
                    description="Browse and contribute to the SPARK innovation pipeline"
                    to="/ideas"
                    badge="SPARK"
                    badgeColor="bg-gradient-spark text-white"
                  />
                  <ModuleCard
                    emoji="📦"
                    title="Products"
                    description="View and manage product catalog and assignments"
                    count={metrics.totalProducts}
                    countLabel="Total"
                    to="/products"
                  />
                  <ModuleCard
                    emoji="🏢"
                    title="Clients"
                    description="Monitor client accounts and subscription tiers"
                    count={metrics.activeTenants}
                    countLabel="Active"
                    to="/clients"
                  />
                </div>
              </motion.div>

              {/* Overview Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-lg font-display font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Key Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    icon="group_work"
                    emoji="🏢"
                    label="Total Clients"
                    value={metrics.totalTenants}
                    color="bg-blue-50 text-blue-600"
                  />
                  <StatCard
                    icon="group"
                    emoji="👥"
                    label="Active Users"
                    value={metrics.activeUsers}
                    color="bg-emerald-50 text-emerald-600"
                  />
                  <StatCard
                    icon="confirmation_number"
                    emoji="🎫"
                    label="Open Tickets"
                    value={metrics.openTickets}
                    color="bg-amber-50 text-amber-600"
                    trend={metrics.openTickets > 10 ? { value: -5, label: 'vs last week' } : undefined}
                  />
                  <StatCard
                    icon="inventory_2"
                    emoji="📦"
                    label="Products"
                    value={metrics.totalProducts}
                    color="bg-purple-50 text-purple-600"
                  />
                </div>
              </motion.div>

              {/* Workload Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Ticket Workload by Status */}
                <div className="rounded-xl border p-6 hover:shadow-lg hover:border-primary/30 transition-all" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl" aria-hidden="true">📈</span>
                    <h3 className="text-lg font-display font-bold" style={{ color: 'var(--text-primary)' }}>Ticket Workload</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { status: 'open', label: 'Open', count: metrics.ticketsByStatus.open, color: 'bg-slate-200 text-slate-700' },
                      { status: 'in_progress', label: 'In Progress', count: metrics.ticketsByStatus.in_progress, color: 'bg-blue-100 text-blue-700' },
                      { status: 'resolved', label: 'Resolved', count: metrics.ticketsByStatus.resolved, color: 'bg-emerald-100 text-emerald-700' },
                      { status: 'closed', label: 'Closed', count: metrics.ticketsByStatus.closed, color: 'bg-slate-200 text-slate-700' },
                    ].map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${item.color}`}>
                          {item.label}
                        </span>
                        <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Distribution */}
                <div className="rounded-xl border p-6 hover:shadow-lg hover:border-primary/30 transition-all" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl" aria-hidden="true">🎯</span>
                    <h3 className="text-lg font-display font-bold" style={{ color: 'var(--text-primary)' }}>Priority Distribution</h3>
                  </div>
                  <div className="space-y-3">
                    {metrics.ticketsByPriority.map((item) => {
                      const priorityColors = [
                        'bg-red-50 text-red-600 border-red-100',
                        'bg-amber-50 text-amber-600 border-amber-100',
                        'bg-blue-50 text-blue-600 border-blue-100',
                        'bg-emerald-50 text-emerald-600 border-emerald-100',
                        'bg-slate-100 text-slate-600 border-slate-200',
                      ]
                      const color = priorityColors[item.priority - 1]

                      return (
                        <div key={item.priority} className="flex items-center justify-between">
                          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${color}`}>
                            P{item.priority}
                          </span>
                          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{item.count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Tenant Cards Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl" aria-hidden="true">🏢</span>
                  <h3 className="text-lg font-display font-bold" style={{ color: 'var(--text-primary)' }}>Tenants Overview</h3>
                </div>
                {metrics.tenantCards.length === 0 ? (
                  <div className="rounded-xl border p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No tenants found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {metrics.tenantCards.map((tenant, index) => (
                      <motion.div
                        key={tenant.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                      >
                        <TenantCard tenant={tenant} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
