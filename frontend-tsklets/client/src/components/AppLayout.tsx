import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'sonner'
import { useAuthStore } from '../store/auth'
import ThemeToggle from './ThemeToggle'
import NewTicketModal from './NewTicketModal'
import ChangePasswordModal from './ChangePasswordModal'

// Sidebar link component
function SidebarLink({
  icon,
  label,
  to,
  onClick,
  badge,
  badgeColor = 'bg-slate-500',
  collapsed = false,
  primary = false
}: {
  icon: string
  label: string
  to?: string
  onClick?: () => void
  badge?: number
  badgeColor?: string
  collapsed?: boolean
  primary?: boolean
}) {
  const location = useLocation()
  const isActive = to ? location.pathname === to : false

  const content = (
    <motion.div
      whileHover={{ x: collapsed ? 0 : 4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group
        ${primary
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
          : isActive
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
      title={collapsed ? label : undefined}
    >
      <span className={`material-symbols-outlined text-xl shrink-0 ${primary ? '' : isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'}`}>
        {icon}
      </span>
      {!collapsed && (
        <>
          <span className={`font-medium text-sm truncate ${primary ? 'text-white' : ''}`} style={primary ? {} : { color: 'var(--text-primary)' }}>
            {label}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className={`ml-auto min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-bold text-white ${badgeColor}`}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
      {collapsed && badge !== undefined && badge > 0 && (
        <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold text-white ${badgeColor}`}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </motion.div>
  )

  if (to) {
    return <Link to={to}>{content}</Link>
  }
  return <div onClick={onClick}>{content}</div>
}

export default function AppLayout() {
  const { user, token, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Sidebar is collapsed by default, expands on hover
  const [collapsed, setCollapsed] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [ticketStats, setTicketStats] = useState({ total: 0, pendingReview: 0 })

  // Check password change requirement
  useEffect(() => {
    if (user?.requirePasswordChange) {
      setShowChangePasswordModal(true)
    }
  }, [user?.requirePasswordChange])

  // Fetch ticket stats for badges
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/tickets', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        const tickets = data.tickets || []
        setTicketStats({
          total: tickets.length,
          pendingReview: tickets.filter((t: any) => t.status === 'pending_internal_review').length,
        })
      } catch (err) {
        console.error('Failed to fetch ticket stats:', err)
      }
    }
    fetchStats()
  }, [token, location.pathname]) // Refetch when route changes

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isCompanyAdmin = user?.role === 'company_admin' || user?.role === 'admin'
  const sidebarWidth = collapsed ? 'w-16' : 'w-60'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-40 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b flex items-center justify-between px-4"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        {/* Left: Menu toggle & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
              <span className="material-symbols-outlined text-lg">support_agent</span>
            </div>
            <span className="hidden sm:block font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Support Desk
            </span>
          </div>
        </div>

        {/* Right: Theme toggle & User */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2 pl-2 border-l" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="text-right">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
              <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{user?.role?.replace('_', ' ')}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar - Expands on hover */}
      <aside
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className={`hidden lg:flex flex-col fixed left-0 top-14 bottom-0 ${sidebarWidth} border-r p-3 transition-all duration-300 z-30`}
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
      >
        <div className="flex-1 space-y-1">
          <SidebarLink
            icon="add_circle"
            label="Create Ticket"
            onClick={() => setShowNewTicketModal(true)}
            collapsed={collapsed}
            primary
          />

          {!collapsed && (
            <div className="pt-4 pb-2">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Navigation
              </p>
            </div>
          )}
          {collapsed && <div className="h-4" />}

          <SidebarLink icon="home" label="Dashboard" to="/" collapsed={collapsed} />
          <SidebarLink
            icon="confirmation_number"
            label="Tickets"
            to="/tickets"
            badge={ticketStats.total}
            badgeColor="bg-slate-500"
            collapsed={collapsed}
          />
          {isCompanyAdmin && (
            <SidebarLink
              icon="inbox"
              label="Internal Triage"
              to="/triage"
              badge={ticketStats.pendingReview}
              badgeColor={ticketStats.pendingReview > 0 ? 'bg-orange-500' : 'bg-slate-400'}
              collapsed={collapsed}
            />
          )}

          {!collapsed && (
            <div className="pt-4 pb-2">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Resources
              </p>
            </div>
          )}
          {collapsed && <div className="h-4" />}

          <SidebarLink icon="menu_book" label="Knowledge Base" to="/help" collapsed={collapsed} />
          {isCompanyAdmin && (
            <SidebarLink icon="group" label="User Management" to="/users" collapsed={collapsed} />
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="mt-auto pt-4 space-y-3">
          {/* Build Info */}
          {collapsed ? (
            <div className="flex justify-center">
              <div className="relative group/build">
                <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center cursor-help">
                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    #{__BUILD_NUMBER__}
                  </span>
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-[10px] rounded-lg opacity-0 group-hover/build:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  <div className="font-semibold">v{__APP_VERSION__} • Build #{__BUILD_NUMBER__}</div>
                  <div className="text-slate-300 mt-0.5">
                    {new Date(__BUILD_DATE__).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {__GIT_HASH__}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    v{__APP_VERSION__} • Build #{__BUILD_NUMBER__}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {new Date(__BUILD_DATE__).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    {__GIT_HASH__}
                  </span>
                </div>
              </div>

              {/* Need Help Section */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border" style={{ borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">💡</span>
                  <p className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>Need Help?</p>
                </div>
                <p className="text-[11px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Browse our knowledge base.
                </p>
                <Link
                  to="/help"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View articles
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 p-4 lg:hidden overflow-y-auto"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                    <span className="material-symbols-outlined text-lg">support_agent</span>
                  </div>
                  <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Support Desk
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-1">
                <SidebarLink icon="add_circle" label="Create Ticket" onClick={() => { setShowNewTicketModal(true); setMobileOpen(false) }} primary />
                <SidebarLink icon="home" label="Dashboard" to="/" />
                <SidebarLink icon="confirmation_number" label="Tickets" to="/tickets" badge={ticketStats.total} badgeColor="bg-slate-500" />
                {isCompanyAdmin && <SidebarLink icon="inbox" label="Internal Triage" to="/triage" badge={ticketStats.pendingReview} badgeColor="bg-orange-500" />}
                <SidebarLink icon="menu_book" label="Knowledge Base" to="/help" />
                {isCompanyAdmin && <SidebarLink icon="group" label="User Management" to="/users" />}
              </div>

              {/* Mobile User Info */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                    <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{user?.role?.replace('_', ' ')}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                  >
                    <span className="material-symbols-outlined">logout</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main
        className={`pt-14 min-h-screen transition-all duration-300 ${collapsed ? 'lg:pl-16' : 'lg:pl-60'}`}
      >
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile FAB */}
      <motion.button
        onClick={() => setShowNewTicketModal(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed right-4 bottom-4 lg:hidden w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center z-30"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </motion.button>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        canDismiss={false}
        onSuccess={() => setShowChangePasswordModal(false)}
      />
      <NewTicketModal isOpen={showNewTicketModal} onClose={() => setShowNewTicketModal(false)} />
      <Toaster position="top-right" richColors />
    </div>
  )
}
