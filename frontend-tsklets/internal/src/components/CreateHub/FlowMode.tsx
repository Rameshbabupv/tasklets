import { motion } from 'framer-motion'
import { useCreateHub, CreateType } from '../../store/createHub'

const hierarchy = [
  {
    id: 'idea' as CreateType,
    label: 'Idea',
    icon: '💡',
    color: 'from-yellow-500 to-amber-500',
    description: 'Start with a spark',
    level: 0,
  },
  {
    id: 'requirement' as CreateType,
    label: 'Requirement',
    icon: '📝',
    color: 'from-blue-500 to-indigo-500',
    description: 'Plan with structure',
    level: 1,
  },
  {
    id: 'epic' as CreateType,
    label: 'Epic',
    icon: '🎯',
    color: 'from-purple-500 to-pink-500',
    description: 'Define initiatives',
    level: 2,
  },
  {
    id: 'feature' as CreateType,
    label: 'Feature',
    icon: '✨',
    color: 'from-cyan-500 to-blue-500',
    description: 'Build capabilities',
    level: 3,
  },
  {
    id: 'task' as CreateType,
    label: 'Task',
    icon: '✅',
    color: 'from-green-500 to-emerald-500',
    description: 'Execute work',
    level: 4,
  },
  {
    id: 'bug' as CreateType,
    label: 'Bug',
    icon: '🐛',
    color: 'from-red-500 to-rose-500',
    description: 'Fix issues',
    level: 4,
  },
  {
    id: 'ticket' as CreateType,
    label: 'Ticket',
    icon: '🎫',
    color: 'from-orange-500 to-amber-500',
    description: 'Support customers',
    level: 0,
    separate: true
  },
]

export default function FlowMode() {
  const { selectType } = useCreateHub()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-8"
    >
      {/* Title */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Choose Your Starting Point
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          Follow the natural flow from idea to implementation
        </p>
      </div>

      {/* Flow diagram */}
      <div className="relative">
        {/* SVG connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="rgb(217, 70, 239)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Main flow path - visual connection line */}
          <motion.path
            d="M 150 80 Q 300 80 300 180 Q 300 280 450 280 Q 600 280 600 380 Q 600 480 750 480"
            stroke="url(#flowGradient)"
            strokeWidth="3"
            fill="none"
            strokeDasharray="8 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />
        </svg>

        {/* Node grid */}
        <div className="grid grid-cols-3 gap-6 relative z-10">
          {/* Row 1: Idea, Requirement */}
          <motion.div
            className="col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <NodeCard node={hierarchy[0]} onSelect={selectType} />
          </motion.div>

          <motion.div
            className="col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <NodeCard node={hierarchy[1]} onSelect={selectType} />
          </motion.div>

          <div className="col-span-1" />

          {/* Row 2: Epic */}
          <div className="col-span-1" />

          <motion.div
            className="col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <NodeCard node={hierarchy[2]} onSelect={selectType} />
          </motion.div>

          <div className="col-span-1" />

          {/* Row 3: Feature */}
          <div className="col-span-1" />
          <div className="col-span-1" />

          <motion.div
            className="col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <NodeCard node={hierarchy[3]} onSelect={selectType} />
          </motion.div>

          {/* Row 4: Task, Bug */}
          <div className="col-span-1" />

          <motion.div
            className="col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <NodeCard node={hierarchy[4]} onSelect={selectType} />
          </motion.div>

          <motion.div
            className="col-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <NodeCard node={hierarchy[5]} onSelect={selectType} />
          </motion.div>
        </div>

        {/* Separate: Ticket (support flow) */}
        <motion.div
          className="mt-8 pt-6 border-t-2 border-dashed border-slate-300 dark:border-slate-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Support Flow (Independent)
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
          </div>

          <div className="flex justify-center">
            <NodeCard node={hierarchy[6]} onSelect={selectType} large />
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Node card component
function NodeCard({
  node,
  onSelect,
  large = false
}: {
  node: typeof hierarchy[0],
  onSelect: (type: CreateType) => void,
  large?: boolean
}) {
  return (
    <motion.button
      onClick={() => onSelect(node.id)}
      className="group relative w-full"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className={`relative ${large ? 'p-6' : 'p-4'} rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden transition-all group-hover:border-violet-400 dark:group-hover:border-violet-600 group-hover:shadow-2xl`}>
        {/* Gradient overlay on hover */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${node.color} opacity-0 group-hover:opacity-10 transition-opacity`}
        />

        {/* Icon */}
        <div className="relative flex justify-center mb-3">
          <div className={`${large ? 'size-16 text-3xl' : 'size-12 text-2xl'} rounded-xl bg-gradient-to-br ${node.color} flex items-center justify-center shadow-lg`}>
            {node.icon}
          </div>
        </div>

        {/* Text */}
        <div className="relative text-center">
          <div className={`${large ? 'text-lg' : 'text-base'} font-bold text-slate-900 dark:text-white mb-1`}>
            {node.label}
          </div>
          <div className={`${large ? 'text-sm' : 'text-xs'} text-slate-500 dark:text-slate-400`}>
            {node.description}
          </div>
        </div>

        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
          animate={{
            x: ['-200%', '200%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'loop'
          }}
        />
      </div>
    </motion.button>
  )
}
