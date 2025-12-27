import React from 'react'
import type { TicketStatus } from '@tsklets/types'

interface StatusBadgeProps {
  status: TicketStatus
}

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  open: {
    label: 'Open',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  closed: {
    label: 'Closed',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
