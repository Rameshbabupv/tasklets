import React from 'react'
import type { TicketStatus } from '@tsklets/types'

interface StatusBadgeProps {
  status: TicketStatus
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending_internal_review: {
    label: 'Pending Review',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
  },
  open: {
    label: 'Open',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  },
  waiting_for_customer: {
    label: 'Waiting',
    className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
  },
  rebuttal: {
    label: 'Rebuttal',
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  },
  review: {
    label: 'Review',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  },
  closed: {
    label: 'Closed',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
  },
  reopened: {
    label: 'Reopened',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-slate-100 text-slate-500 dark:bg-slate-600/20 dark:text-slate-400',
  },
}

const defaultConfig = {
  label: 'Unknown',
  className: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || defaultConfig

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
