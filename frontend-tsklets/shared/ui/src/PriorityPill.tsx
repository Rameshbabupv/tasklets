import React from 'react'

interface PriorityPillProps {
  priority: number
}

const priorityConfig: Record<number, { label: string; className: string }> = {
  1: {
    label: 'P1 - Critical',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  2: {
    label: 'P2 - High',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  3: {
    label: 'P3 - Medium',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  4: {
    label: 'P4 - Low',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
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
