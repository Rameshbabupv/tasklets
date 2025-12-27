import { motion } from 'framer-motion'

interface StatCardProps {
  icon: string
  label: string
  value: string | number
  color?: string
  emoji?: string
  trend?: {
    value: number
    label: string
  }
}

export default function StatCard({
  icon,
  label,
  value,
  color = 'bg-blue-50 text-blue-600',
  emoji,
  trend
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border p-6 hover:shadow-lg hover:shadow-slate-200/50 hover:border-primary/30 transition-all group relative overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-primary)'
      }}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          {/* Label */}
          <div className="flex items-center gap-2 mb-2">
            {emoji && <span className="text-lg" aria-hidden="true">{emoji}</span>}
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          </div>

          {/* Value */}
          <p className="text-3xl font-display font-bold bg-gradient-spark bg-clip-text text-transparent">
            {value}
          </p>

          {/* Trend */}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-medium ${trend.value > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend.value > 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{trend.label}</span>
            </div>
          )}
        </div>

        {/* Icon */}
        <motion.div
          className={`size-12 rounded-xl ${color} flex items-center justify-center shadow-md`}
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          <span className="material-symbols-outlined text-[28px]" aria-hidden="true">{icon}</span>
        </motion.div>
      </div>
    </motion.div>
  )
}
