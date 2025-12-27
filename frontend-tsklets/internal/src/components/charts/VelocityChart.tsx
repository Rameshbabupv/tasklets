interface VelocityData {
  sprintName: string
  velocity: number
  plannedPoints: number
  completedPoints: number
}

interface VelocityChartProps {
  data: VelocityData[]
  height?: number
}

export default function VelocityChart({ data, height = 200 }: VelocityChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-500">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl mb-2">bar_chart</span>
          <p className="text-sm">No sprint data available</p>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.flatMap(d => [d.plannedPoints, d.completedPoints, d.velocity]))
  const scale = maxValue > 0 ? (height - 40) / maxValue : 1

  return (
    <div className="w-full">
      {/* Chart Area */}
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-b border-slate-100 dark:border-slate-800/50" />
          ))}
        </div>

        {/* Y-axis Labels */}
        <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-[10px] text-slate-400 dark:text-slate-500">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue * 0.75)}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>{Math.round(maxValue * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Bars Container */}
        <div className="absolute left-10 right-0 top-0 bottom-8 flex items-end justify-around gap-2 px-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center group relative">
              {/* Bar Group */}
              <div className="flex items-end gap-0.5 h-full">
                {/* Planned Bar */}
                <div
                  className="w-3 bg-slate-200 dark:bg-slate-700 rounded-t transition-all duration-500 ease-out hover:bg-slate-300 dark:hover:bg-slate-600"
                  style={{
                    height: `${item.plannedPoints * scale}px`,
                    animationDelay: `${index * 100}ms`,
                  }}
                />
                {/* Completed Bar */}
                <div
                  className="w-3 bg-gradient-to-t from-emerald-500 to-emerald-400 dark:from-emerald-600 dark:to-emerald-500 rounded-t transition-all duration-500 ease-out shadow-sm hover:from-emerald-600 hover:to-emerald-500"
                  style={{
                    height: `${item.completedPoints * scale}px`,
                    animationDelay: `${index * 100 + 50}ms`,
                  }}
                />
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                  <div className="font-bold mb-1">{item.sprintName}</div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="inline-block w-2 h-2 rounded-full bg-slate-400" />
                    <span>Planned: {item.plannedPoints} pts</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Completed: {item.completedPoints} pts</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-400 mt-1 pt-1 border-t border-slate-700 dark:border-slate-600">
                    <span className="font-medium">Velocity: {item.velocity}</span>
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* X-axis Labels */}
        <div className="absolute left-10 right-0 bottom-0 h-8 flex justify-around text-[10px] text-slate-500 dark:text-slate-400 font-medium">
          {data.map((item, index) => (
            <div key={index} className="flex-1 text-center truncate px-1">
              {item.sprintName}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700" />
          <span className="text-slate-600 dark:text-slate-400">Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-emerald-500 to-emerald-400" />
          <span className="text-slate-600 dark:text-slate-400">Completed</span>
        </div>
      </div>
    </div>
  )
}
