import { motion } from 'framer-motion'
import { useState, useMemo, useEffect } from 'react'
import { useCreateHub, CreateType } from '../../store/createHub'

const createTypes = [
  {
    id: 'idea' as CreateType,
    label: 'Idea',
    description: 'Quick brainstorm or feature concept',
    icon: '💡',
    color: 'from-yellow-500 to-amber-500',
    keywords: ['spark', 'brainstorm', 'thought']
  },
  {
    id: 'requirement' as CreateType,
    label: 'Requirement',
    description: 'Structured planning with Claude',
    icon: '📝',
    color: 'from-blue-500 to-indigo-500',
    keywords: ['spec', 'plan', 'document']
  },
  {
    id: 'epic' as CreateType,
    label: 'Epic',
    description: 'High-level initiative or theme',
    icon: '🎯',
    color: 'from-purple-500 to-pink-500',
    keywords: ['initiative', 'theme', 'goal']
  },
  {
    id: 'feature' as CreateType,
    label: 'Feature',
    description: 'User-facing functionality',
    icon: '✨',
    color: 'from-cyan-500 to-blue-500',
    keywords: ['functionality', 'capability']
  },
  {
    id: 'task' as CreateType,
    label: 'Task',
    description: 'Development work item',
    icon: '✅',
    color: 'from-green-500 to-emerald-500',
    keywords: ['todo', 'work', 'story']
  },
  {
    id: 'bug' as CreateType,
    label: 'Bug',
    description: 'Defect or issue to fix',
    icon: '🐛',
    color: 'from-red-500 to-rose-500',
    keywords: ['defect', 'issue', 'problem', 'fix']
  },
  {
    id: 'ticket' as CreateType,
    label: 'Ticket',
    description: 'Customer support request',
    icon: '🎫',
    color: 'from-orange-500 to-amber-500',
    keywords: ['support', 'customer', 'help']
  },
]

export default function QuickMode() {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { selectType, context, close } = useCreateHub()

  const filtered = useMemo(() => {
    if (!search) return createTypes
    const query = search.toLowerCase()
    return createTypes.filter(type =>
      type.label.toLowerCase().includes(query) ||
      type.description.toLowerCase().includes(query) ||
      type.keywords.some(k => k.includes(query))
    )
  }, [search])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault()
        selectType(filtered[selectedIndex].id)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filtered, selectedIndex, selectType, close])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-6"
    >
      {/* Search input */}
      <div className="relative mb-4">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setSelectedIndex(0)
          }}
          placeholder="Search creation types..."
          autoFocus
          className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-900 dark:text-white placeholder:text-slate-400"
        />
      </div>

      {/* Context hint */}
      {context.suggestedType && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 px-4 py-3 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl"
        >
          <div className="flex items-center gap-2 text-sm">
            <span className="text-violet-600 dark:text-violet-400">💡 Suggested:</span>
            <span className="font-medium text-violet-900 dark:text-violet-200">
              Create {context.suggestedType} based on current view
            </span>
          </div>
        </motion.div>
      )}

      {/* Command list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filtered.map((type, index) => (
          <motion.button
            key={type.id}
            onClick={() => selectType(type.id)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
              index === selectedIndex
                ? 'bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/50 dark:to-fuchsia-950/50 border-2 border-violet-300 dark:border-violet-700 shadow-lg scale-[1.02]'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-800'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {/* Icon with gradient background */}
            <div className={`size-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center text-2xl shadow-lg shrink-0`}>
              {type.icon}
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 dark:text-white">
                {type.label}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                {type.description}
              </div>
            </div>

            {/* Keyboard hint */}
            {index === selectedIndex && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 text-xs font-mono text-slate-400"
              >
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">↵</kbd>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Keyboard shortcuts legend */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">↵</kbd>
            select
          </span>
        </div>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">esc</kbd>
          close
        </span>
      </div>
    </motion.div>
  )
}
