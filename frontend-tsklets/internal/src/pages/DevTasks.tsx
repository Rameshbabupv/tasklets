import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import DevTaskDetailModal from '../components/DevTaskDetailModal'
import TicketModal from '../components/TicketModal'
import { useAuthStore } from '../store/auth'

interface DevTask {
  id: number
  issueKey: string | null
  title: string
  description: string | null
  type: 'task' | 'bug'
  status: 'todo' | 'in_progress' | 'review' | 'testing' | 'blocked' | 'done'
  priority: number
  storyPoints: number | null
  productId: number
  productName: string | null
  productCode: string | null
  implementorId: number | null
  developerId: number | null
  testerId: number | null
  implementorName: string | null
  developerName: string | null
  testerName: string | null
  moduleName: string | null
  componentName: string | null
  addonName: string | null
  supportTicketId: string | null
  supportTicket: { issueKey: string; title: string; status: string } | null
  severity: 'critical' | 'major' | 'minor' | 'trivial' | null
  labels: string[] | null
  createdAt: string
  updatedAt: string
}

interface Product {
  id: number
  name: string
  code: string | null
}

type RoleFilter = 'all' | 'my_implementations' | 'my_development' | 'my_testing'
type SortField = 'issueKey' | 'title' | 'status' | 'priority' | 'productName' | 'createdAt'
type SortDirection = 'asc' | 'desc'

// Status configuration
const statusConfig: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  todo: { label: 'To Do', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', icon: 'radio_button_unchecked' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', icon: 'pending' },
  review: { label: 'Review', bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', icon: 'rate_review' },
  testing: { label: 'Testing', bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', icon: 'science' },
  blocked: { label: 'Blocked', bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', icon: 'block' },
  done: { label: 'Done', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', icon: 'check_circle' },
}

const priorityConfig: Record<number, { label: string; short: string; color: string }> = {
  1: { label: 'Critical', short: 'P1', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' },
  2: { label: 'High', short: 'P2', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800' },
  3: { label: 'Medium', short: 'P3', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  4: { label: 'Low', short: 'P4', color: 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
}

const roleTabConfig: Record<RoleFilter, { label: string; icon: string; description: string }> = {
  all: { label: 'All Tasks', icon: 'view_list', description: 'View all development tasks' },
  my_implementations: { label: 'My Implementations', icon: 'architecture', description: 'Tasks where you are the implementor' },
  my_development: { label: 'My Development', icon: 'code', description: 'Tasks assigned to you for development' },
  my_testing: { label: 'My Testing', icon: 'bug_report', description: 'Tasks assigned to you for testing' },
}

const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export default function DevTasks() {
  const { token, user } = useAuthStore()
  const [tasks, setTasks] = useState<DevTask[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [selectedTicketIssueKey, setSelectedTicketIssueKey] = useState<string | null>(null)

  // Filters
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [productFilter, setProductFilter] = useState<number | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'task' | 'bug'>('all')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<number[]>([])

  // Sorting
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [tasksRes, productsRes] = await Promise.all([
        fetch('/api/tasks/all', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const tasksData = await tasksRes.json()
      const productsData = await productsRes.json()
      setTasks(tasksData.tasks || [])
      setCurrentUserId(tasksData.currentUserId)
      setProducts(productsData || [])
    } catch (err) {
      console.error('Failed to fetch data', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks]

    // Role filter
    if (roleFilter === 'my_implementations' && currentUserId) {
      result = result.filter(t => t.implementorId === currentUserId)
    } else if (roleFilter === 'my_development' && currentUserId) {
      result = result.filter(t => t.developerId === currentUserId)
    } else if (roleFilter === 'my_testing' && currentUserId) {
      result = result.filter(t => t.testerId === currentUserId)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.issueKey?.toLowerCase().includes(query) ||
        t.supportTicket?.issueKey?.toLowerCase().includes(query)
      )
    }

    // Product filter
    if (productFilter) {
      result = result.filter(t => t.productId === productFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter)
    }

    // Status filter
    if (statusFilter.length > 0) {
      result = result.filter(t => statusFilter.includes(t.status))
    }

    // Priority filter
    if (priorityFilter.length > 0) {
      result = result.filter(t => priorityFilter.includes(t.priority))
    }

    // Sorting
    result.sort((a, b) => {
      let aVal: any, bVal: any
      switch (sortField) {
        case 'issueKey':
          aVal = a.issueKey || ''; bVal = b.issueKey || ''
          break
        case 'title':
          aVal = a.title; bVal = b.title
          break
        case 'status':
          const statusOrder = ['todo', 'in_progress', 'review', 'testing', 'blocked', 'done']
          aVal = statusOrder.indexOf(a.status); bVal = statusOrder.indexOf(b.status)
          break
        case 'priority':
          aVal = a.priority; bVal = b.priority
          break
        case 'productName':
          aVal = a.productName || ''; bVal = b.productName || ''
          break
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime()
          break
        default:
          aVal = a.createdAt; bVal = b.createdAt
      }
      if (sortDirection === 'asc') return aVal > bVal ? 1 : -1
      return aVal < bVal ? 1 : -1
    })

    return result
  }, [tasks, roleFilter, searchQuery, productFilter, typeFilter, statusFilter, priorityFilter, sortField, sortDirection, currentUserId])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

  const togglePriorityFilter = (priority: number) => {
    setPriorityFilter(prev =>
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setProductFilter(null)
    setTypeFilter('all')
    setStatusFilter([])
    setPriorityFilter([])
  }

  const hasActiveFilters = searchQuery || productFilter || typeFilter !== 'all' || statusFilter.length > 0 || priorityFilter.length > 0

  // Stats for role tabs
  const roleStats = useMemo(() => {
    if (!currentUserId) return { all: tasks.length, my_implementations: 0, my_development: 0, my_testing: 0 }
    return {
      all: tasks.length,
      my_implementations: tasks.filter(t => t.implementorId === currentUserId).length,
      my_development: tasks.filter(t => t.developerId === currentUserId).length,
      my_testing: tasks.filter(t => t.testerId === currentUserId).length,
    }
  }, [tasks, currentUserId])

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors group"
    >
      {children}
      <span className={`material-symbols-outlined text-[14px] transition-transform ${sortField === field ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
        {sortField === field && sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward'}
      </span>
    </button>
  )

  if (loading) {
    return (
      <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Loading dev tasks...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Role Tabs */}
        <header className="shrink-0 border-b" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
          {/* Title Bar */}
          <div className="px-6 pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="material-symbols-outlined text-white text-xl">developer_board</span>
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Development Tasks</h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {filteredTasks.length} {hasActiveFilters ? `of ${tasks.length} ` : ''}tasks
                </p>
              </div>
            </div>
          </div>

          {/* Role Tabs */}
          <div className="px-6 flex gap-1">
            {(Object.keys(roleTabConfig) as RoleFilter[]).map(role => {
              const config = roleTabConfig[role]
              const count = roleStats[role]
              const isActive = roleFilter === role
              return (
                <motion.button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative px-4 py-2.5 rounded-t-lg flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-gradient-to-b from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 shadow-sm'
                      : 'hover:bg-slate-100/50 dark:hover:bg-slate-700/50'
                  }`}
                  style={isActive ? { borderColor: 'var(--border-primary)' } : {}}
                >
                  <span className={`material-symbols-outlined text-lg ${isActive ? 'text-primary' : ''}`} style={!isActive ? { color: 'var(--text-muted)' } : {}}>
                    {config.icon}
                  </span>
                  <span className={`text-sm font-medium ${isActive ? '' : ''}`} style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {config.label}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    isActive ? 'bg-primary/10 text-primary' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                  }`}>
                    {count}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </header>

        {/* Filters Bar */}
        <div className="px-6 py-3 border-b flex items-center gap-3 flex-wrap" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: 'var(--text-muted)' }}>search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or issue key..."
              className="pl-9 pr-3 py-1.5 rounded-lg border text-sm w-64 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Product Filter */}
          <select
            value={productFilter || ''}
            onChange={(e) => setProductFilter(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-1.5 rounded-lg border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
          >
            <option value="">All Products</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.code ? `${p.code} - ${p.name}` : p.name}</option>
            ))}
          </select>

          {/* Type Toggle */}
          <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border-primary)' }}>
            {(['all', 'task', 'bug'] as const).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
                  typeFilter === type ? 'bg-primary text-white' : ''
                }`}
                style={typeFilter !== type ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' } : {}}
              >
                {type === 'bug' && <span className="material-symbols-outlined text-[14px]">bug_report</span>}
                {type === 'task' && <span className="material-symbols-outlined text-[14px]">task_alt</span>}
                {type === 'all' ? 'All' : type === 'task' ? 'Tasks' : 'Bugs'}
              </button>
            ))}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1">
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all border ${
                  statusFilter.includes(status)
                    ? `${config.bg} ${config.text} ring-2 ring-primary/30`
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                style={!statusFilter.includes(status) ? { color: 'var(--text-muted)' } : {}}
              >
                {config.label}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map(p => (
              <button
                key={p}
                onClick={() => togglePriorityFilter(p)}
                className={`px-2 py-1 rounded text-xs font-bold border transition-all ${
                  priorityFilter.includes(p)
                    ? `${priorityConfig[p].color} ring-2 ring-primary/30`
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                P{p}
              </button>
            ))}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <tr className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                <th className="px-6 py-3 text-left">
                  <SortHeader field="issueKey">Issue Key</SortHeader>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader field="title">Title</SortHeader>
                </th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">
                  <SortHeader field="status">Status</SortHeader>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader field="priority">Priority</SortHeader>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader field="productName">Product</SortHeader>
                </th>
                <th className="px-4 py-3 text-left">Team</th>
                <th className="px-4 py-3 text-left">Support Ticket</th>
                <th className="px-4 py-3 text-left">
                  <SortHeader field="createdAt">Created</SortHeader>
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div style={{ color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined text-4xl mb-3 block opacity-50">search_off</span>
                        <p>No tasks match your filters</p>
                        {hasActiveFilters && (
                          <button onClick={clearFilters} className="text-primary hover:underline mt-2">
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task, index) => {
                    const statusCfg = statusConfig[task.status] || statusConfig.todo
                    const priorityCfg = priorityConfig[task.priority] || priorityConfig[3]

                    return (
                      <motion.tr
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.02 }}
                        className="group border-b hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                        style={{ borderColor: 'var(--border-secondary)' }}
                      >
                        {/* Issue Key */}
                        <td className="px-6 py-3">
                          <button
                            onClick={() => setSelectedTaskId(task.id)}
                            className="font-mono text-sm font-semibold text-primary hover:underline cursor-pointer"
                          >
                            {task.issueKey || `#${task.id}`}
                          </button>
                        </td>

                        {/* Title */}
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {task.title}
                          </p>
                          {(task.moduleName || task.componentName) && (
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                              {[task.moduleName, task.componentName].filter(Boolean).join(' / ')}
                            </p>
                          )}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3">
                          <span className={`material-symbols-outlined text-lg ${
                            task.type === 'bug' ? 'text-red-500' : 'text-emerald-500'
                          }`}>
                            {task.type === 'bug' ? 'bug_report' : 'task_alt'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                            <span className="material-symbols-outlined text-[14px]">{statusCfg.icon}</span>
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${priorityCfg.color}`}>
                            {priorityCfg.short}
                          </span>
                        </td>

                        {/* Product */}
                        <td className="px-4 py-3">
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {task.productCode ? (
                              <span className="font-medium">{task.productCode}</span>
                            ) : task.productName || '-'}
                          </span>
                        </td>

                        {/* Team */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5 text-xs">
                            {task.implementorName && (
                              <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                                <span className="material-symbols-outlined text-[12px] text-indigo-500">architecture</span>
                                {task.implementorName}
                              </span>
                            )}
                            {task.developerName && (
                              <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                                <span className="material-symbols-outlined text-[12px] text-emerald-500">code</span>
                                {task.developerName}
                              </span>
                            )}
                            {task.testerName && (
                              <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                                <span className="material-symbols-outlined text-[12px] text-amber-500">bug_report</span>
                                {task.testerName}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Support Ticket */}
                        <td className="px-4 py-3">
                          {task.supportTicket ? (
                            <button
                              onClick={() => setSelectedTicketIssueKey(task.supportTicket!.issueKey)}
                              className="text-xs font-mono font-medium text-primary hover:underline flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">confirmation_number</span>
                              {task.supportTicket.issueKey}
                            </button>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>

                        {/* Created */}
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(task.createdAt)}
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </main>

      {/* Dev Task Detail Modal */}
      {selectedTaskId && (
        <DevTaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onStatusChange={() => {
            fetchData() // Refresh the list when status changes
          }}
        />
      )}

      {/* Support Ticket Modal */}
      {selectedTicketIssueKey && (
        <TicketModal
          issueKey={selectedTicketIssueKey}
          onClose={() => setSelectedTicketIssueKey(null)}
          onStatusChange={() => {
            fetchData() // Refresh the list when ticket status changes
          }}
        />
      )}
    </div>
  )
}
