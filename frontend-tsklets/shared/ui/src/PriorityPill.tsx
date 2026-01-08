import React from 'react'

interface PriorityPillProps {
  priority: number
}

const priorityConfig: Record<number, { label: string; className: string }> = {
  1: {
    label: 'P1 - Critical',
    className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
  },
  2: {
    label: 'P2 - High',
    className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
  },
  3: {
    label: 'P3 - Medium',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30',
  },
  4: {
    label: 'P4 - Low',
    className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30',
  },
}

export function PriorityPill({ priority }: PriorityPillProps) {
  const config = priorityConfig[priority] || priorityConfig[3]

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
