import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import ThemeToggle from './ThemeToggle'

// Navigation structure with sections
interface NavItem {
  path: string
  emoji: string
  icon: string
  label: string
  roles: string[]
}

interface NavSection {
  id: string
  title?: string // undefined = no header
  items: NavItem[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}

const navStructure: NavSection[] = [
  {
    id: 'main',
    items: [
      { path: '/dashboard', emoji: '📊', icon: 'dashboard', label: 'Dashboard', roles: ['admin', 'support', 'integrator', 'ceo', 'developer'] },
    ],
  },
  {
    id: 'admin',
    title: 'Admin',
    items: [
      { path: '/products', emoji: '📦', icon: 'inventory_2', label: 'Products', roles: ['admin', 'support', 'integrator', 'ceo'] },
      { path: '/clients', emoji: '🏢', icon: 'group', label: 'Clients', roles: ['admin', 'support', 'integrator', 'ceo'] },
    ],
  },
  {
    id: 'tickets',
    title: 'Tickets',
    items: [
      { path: '/tickets', emoji: '🎫', icon: 'confirmation_number', label: 'Support Queue', roles: ['admin', 'support', 'integrator', 'ceo'] },
      { path: '/dev-tasks', emoji: '🛠️', icon: 'developer_board', label: 'Dev Tasks', roles: ['admin', 'ceo', 'developer'] },
    ],
  },
  {
    id: 'wip',
    title: 'Under Development',
    collapsible: true,
    defaultCollapsed: true,
    items: [
      { path: '/executive', emoji: '🎯', icon: 'monitoring', label: 'Executive', roles: ['ceo', 'admin'] },
      { path: '/roadmap', emoji: '🗺️', icon: 'map', label: 'Roadmap', roles: ['ceo', 'admin'] },
      { path: '/requirements', emoji: '📝', icon: 'description', label: 'Requirements', roles: ['admin', 'ceo', 'support'] },
      { path: '/my-tasks', emoji: '✅', icon: 'task_alt', label: 'My Tasks', roles: ['developer'] },
      { path: '/sprints', emoji: '🏃', icon: 'sprint', label: 'Sprints', roles: ['admin', 'ceo', 'developer'] },
      { path: '/backlog', emoji: '📋', icon: 'list', label: 'Backlog', roles: ['admin', 'ceo', 'developer'] },
      { path: '/ideas', emoji: '💡', icon: 'lightbulb', label: 'Ideas', roles: ['admin', 'support', 'integrator', 'ceo', 'developer'] },
    ],
  },
]

export default function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved === 'true'
  })

  const [wipExpanded, setWipExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar-wip-expanded')
    return saved === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed.toString())
  }, [isCollapsed])

  useEffect(() => {
    localStorage.setItem('sidebar-wip-expanded', wipExpanded.toString())
  }, [wipExpanded])

  // Filter sections and items based on user role
  const visibleSections = useMemo(() => {
    return navStructure
      .map(section => ({
        ...section,
        items: section.items.filter(item => item.roles.includes(user?.role || '')),
      }))
      .filter(section => section.items.length > 0)
  }, [user?.role])

  const renderNavItem = (item: NavItem, index: number, sectionId: string) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    const isWip = sectionId === 'wip'

    return (
      <motion.div
        key={item.path}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="relative group/nav"
      >
        <Link
          to={item.path}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group relative ${
            isActive
              ? 'bg-gradient-spark text-white font-semibold shadow-md'
              : isWip
                ? 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-200'
                : 'text-slate-600 dark:text-slate-300 hover:bg-gradient-shimmer hover:border-primary/30'
          } ${isCollapsed ? 'justify-center' : ''}`}
        >
          <span className={`text-lg shrink-0 ${isWip && !isActive ? 'opacity-70' : ''}`} aria-hidden="true">
            {item.emoji}
          </span>
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
              {isWip && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">WIP</span>}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900"></div>
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  const renderSection = (section: NavSection, sectionIndex: number) => {
    const isWip = section.id === 'wip'
    const showSection = !isWip || wipExpanded || isCollapsed

    return (
      <div key={section.id} className="relative">
        {/* Section separator */}
        {sectionIndex > 0 && (
          <div className="mx-3 my-3 border-t border-slate-200 dark:border-slate-700" />
        )}

        {/* Section header */}
        {section.title && !isCollapsed && (
          <div className="px-3 mb-2">
            {section.collapsible ? (
              <button
                onClick={() => setWipExpanded(!wipExpanded)}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {section.title}
                  </span>
                  {isWip && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded font-semibold">
                      BETA
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!wipExpanded && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {section.items.length}
                    </span>
                  )}
                  <motion.span
                    animate={{ rotate: wipExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="material-symbols-outlined text-[14px] text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"
                  >
                    expand_more
                  </motion.span>
                </div>
              </button>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {section.title}
              </span>
            )}
          </div>
        )}

        {/* Collapsed sidebar - show WIP indicator */}
        {section.title && isCollapsed && sectionIndex > 0 && (
          <div className="flex justify-center mb-2">
            {isWip ? (
              <button
                onClick={() => setWipExpanded(!wipExpanded)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group/wip relative"
                title={wipExpanded ? 'Collapse WIP section' : `Expand WIP section (${section.items.length} items)`}
              >
                <span className="material-symbols-outlined text-[14px] text-amber-500">
                  {wipExpanded ? 'expand_less' : 'construction'}
                </span>
                {/* Tooltip */}
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/wip:opacity-100 transition-opacity duration-200 z-50">
                  <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg">
                    {wipExpanded ? 'Collapse' : `${section.items.length} WIP features`}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900"></div>
                  </div>
                </div>
              </button>
            ) : (
              <div className="w-8 h-px bg-slate-200 dark:bg-slate-700 rounded" />
            )}
          </div>
        )}

        {/* Section items */}
        <AnimatePresence mode="wait">
          {showSection && (
            <motion.div
              initial={section.collapsible ? { height: 0, opacity: 0 } : false}
              animate={{ height: 'auto', opacity: 1 }}
              exit={section.collapsible ? { height: 0, opacity: 0 } : undefined}
              transition={{ duration: 0.2 }}
              className={`flex flex-col gap-0.5 overflow-hidden ${isWip ? 'opacity-90' : ''}`}
            >
              {section.items.map((item, index) => renderNavItem(item, index, section.id))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

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
      <nav className="flex-1 px-3 flex flex-col overflow-y-auto" role="navigation" aria-label="Main navigation">
        {visibleSections.map((section, index) => renderSection(section, index))}
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

      {/* Build Info */}
      <div className={`px-4 mb-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isCollapsed ? (
          <div className="relative group/build">
            <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center cursor-help">
              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                #{__BUILD_NUMBER__}
              </span>
            </div>
            {/* Tooltip */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/build:opacity-100 transition-opacity duration-200 z-50">
              <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-lg">
                <div className="font-semibold">v{__APP_VERSION__} • Build #{__BUILD_NUMBER__}</div>
                <div className="text-slate-400 mt-1">
                  {new Date(__BUILD_DATE__).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-slate-500 font-mono">{__GIT_HASH__}</div>
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900"></div>
              </div>
            </div>
          </div>
        ) : (
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
        )}
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
