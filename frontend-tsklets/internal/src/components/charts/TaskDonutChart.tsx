interface TaskDistribution {
  label: string
  value: number
  color: string
  darkColor?: string
}

interface TaskDonutChartProps {
  data: TaskDistribution[]
  size?: number
  strokeWidth?: number
  centerLabel?: string
  centerValue?: string | number
}

export default function TaskDonutChart({
  data,
  size = 180,
  strokeWidth = 24,
  centerLabel,
  centerValue,
}: TaskDonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-400 dark:text-slate-500"
        style={{ width: size, height: size }}
      >
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl mb-2">pie_chart</span>
          <p className="text-sm">No task data</p>
        </div>
      </div>
    )
  }

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  // Calculate segments
  let cumulativeOffset = 0
  const segments = data
    .filter(item => item.value > 0)
    .map((item) => {
      const percentage = (item.value / total) * 100
      const strokeDasharray = (percentage / 100) * circumference
      const strokeDashoffset = -cumulativeOffset
      cumulativeOffset += strokeDasharray
      return {
        ...item,
        percentage,
        strokeDasharray,
        strokeDashoffset,
      }
    })

  return (
    <div className="relative inline-block">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
        />

        {/* Data Segments */}
        {segments.map((segment, index) => (
          <circle
            key={index}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segment.strokeDasharray} ${circumference}`}
            strokeDashoffset={segment.strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out dark:opacity-90"
            style={{
              animation: `donut-segment-${index} 0.8s ease-out forwards`,
              animationDelay: `${index * 0.1}s`,
            }}
          />
        ))}
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {centerValue !== undefined && (
          <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {centerValue}
          </span>
        )}
        {centerLabel && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">
            {centerLabel}
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        {segments.map((segment, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-3 text-sm group cursor-default"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-900 shadow-sm"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-slate-600 dark:text-slate-400 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {segment.label}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                {segment.value}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums w-10 text-right">
                {segment.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes donut-segment-0 { from { stroke-dasharray: 0 ${circumference}; } }
        @keyframes donut-segment-1 { from { stroke-dasharray: 0 ${circumference}; } }
        @keyframes donut-segment-2 { from { stroke-dasharray: 0 ${circumference}; } }
        @keyframes donut-segment-3 { from { stroke-dasharray: 0 ${circumference}; } }
        @keyframes donut-segment-4 { from { stroke-dasharray: 0 ${circumference}; } }
      `}</style>
    </div>
  )
}
