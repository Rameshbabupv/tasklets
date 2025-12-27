import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { path: '/dashboard', emoji: '📊', icon: 'dashboard', label: 'Dashboard', roles: ['admin', 'support', 'integrator', 'ceo', 'developer'] },
  { path: '/my-tasks', emoji: '✅', icon: 'task_alt', label: 'My Tasks', roles: ['developer'] },
  { path: '/sprints', emoji: '🏃', icon: 'sprint', label: 'Sprints', roles: ['admin', 'ceo', 'developer'] },
  { path: '/backlog', emoji: '📋', icon: 'list', label: 'Backlog', roles: ['admin', 'ceo', 'developer'] },
  { path: '/tickets', emoji: '🎫', icon: 'confirmation_number', label: 'Tickets', roles: ['admin', 'support', 'integrator', 'ceo'] },
  { path: '/ideas', emoji: '💡', icon: 'lightbulb', label: 'Ideas', roles: ['admin', 'support', 'integrator', 'ceo', 'developer'] },
  { path: '/clients', emoji: '🏢', icon: 'group', label: 'Clients', roles: ['admin', 'support', 'integrator', 'ceo'] },
  { path: '/products', emoji: '📦', icon: 'inventory_2', label: 'Products', roles: ['admin', 'support', 'integrator', 'ceo'] },
]

export default function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed.toString())
  }, [isCollapsed])

  const visibleNavItems = navItems.filter(item =>
    item.roles.includes(user?.role || '')
  )

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col shrink-0 relative"
    >
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 justify-center">
        <div className="size-10 rounded-xl bg-gradient-spark flex items-center justify-center shadow-lg shadow-primary/20 text-white shrink-0">
          <span className="material-symbols-outlined" aria-hidden="true">support_agent</span>
        </div>
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <h1 className="font-display font-bold text-lg tracking-tight bg-gradient-spark bg-clip-text text-transparent leading-none whitespace-nowrap">
                SupportDesk
              </h1>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Internal</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute -right-3 top-20 size-6 rounded-full bg-gradient-spark text-white shadow-lg hover:shadow-xl flex items-center justify-center z-10"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <motion.span
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.3 }}
          className="material-symbols-outlined text-[16px]"
          aria-hidden="true"
        >
          chevron_left
        </motion.span>
      </motion.button>

      {/* Nav */}
      <nav className="flex-1 px-4 flex flex-col gap-1" role="navigation" aria-label="Main navigation">
        {visibleNavItems.map((item, index) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative group/nav"
            >
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                  isActive
                    ? 'bg-gradient-spark text-white font-semibold shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-gradient-shimmer hover:border-primary/30'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <span className="text-xl shrink-0" aria-hidden="true">{item.emoji}</span>
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm flex-1 overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && !isCollapsed && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="size-1.5 rounded-full bg-white shrink-0"
                  />
                )}
                {isActive && isCollapsed && (
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 size-2 rounded-full bg-white" />
                )}
              </Link>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/nav:opacity-100 transition-opacity duration-200 z-50">
                  <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900"></div>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </nav>

      {/* Status Indicator */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="px-4 mb-4"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800">
            <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-green-700 dark:text-green-400">System Online</span>
          </div>
        </motion.div>
      )}

      {/* Theme Toggle */}
      <div className={`px-4 mb-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <ThemeToggle />
      </div>

      {/* User */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative group/user">
              <div className="size-10 rounded-full bg-gradient-spark flex items-center justify-center text-white text-sm font-bold shadow-md cursor-pointer">
                {user?.name?.charAt(0) || 'U'}
              </div>
              {/* User tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/user:opacity-100 transition-opacity duration-200 z-50">
                <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg">
                  <div className="font-semibold">{user?.name}</div>
                  <div className="text-xs text-slate-300 capitalize">{user?.role}</div>
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900"></div>
                </div>
              </div>
            </div>
            <div className="relative group/logout">
              <motion.button
                onClick={logout}
                className="text-slate-400 hover:text-primary transition-colors p-2 hover:bg-slate-100 rounded-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Logout"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">logout</span>
              </motion.button>
              {/* Logout tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/logout:opacity-100 transition-opacity duration-200 z-50">
                <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg">
                  Logout
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gradient-to-br from-slate-50 to-purple-50/30 dark:from-slate-700 dark:to-purple-900/30 border border-slate-200 dark:border-slate-600 hover:border-primary/30 transition-all">
            <div className="size-8 rounded-full bg-gradient-spark flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col overflow-hidden flex-1"
              >
                <span className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">{user?.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">{user?.role}</span>
              </motion.div>
            </AnimatePresence>
            <motion.button
              onClick={logout}
              className="text-slate-400 hover:text-primary transition-colors p-1 hover:bg-white rounded shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Logout"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">logout</span>
            </motion.button>
          </div>
        )}
      </div>
    </motion.aside>
  )
}
