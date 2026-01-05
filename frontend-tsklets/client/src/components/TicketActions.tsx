import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Ticket, UserRole } from '@tsklets/types'
import CancelTicketModal from './CancelTicketModal'
import ReopenTicketModal from './ReopenTicketModal'
import CloseTicketDialog from './CloseTicketDialog'

interface TicketActionsProps {
  ticket: Ticket
  userRole: UserRole
  onActionComplete: () => void
}

interface ActionButton {
  id: string
  label: string
  icon: string
  color: string
  hoverColor: string
  onClick: () => void
}

export default function TicketActions({
  ticket,
  userRole,
  onActionComplete,
}: TicketActionsProps) {
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [reopenModalOpen, setReopenModalOpen] = useState(false)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)

  // Determine which actions are available based on ticket status and user role
  const actions: ActionButton[] = []

  const isAdmin = userRole === 'admin' || userRole === 'company_admin'

  switch (ticket.status) {
    case 'pending_internal_review':
      // Admin can cancel or push to systech
      if (isAdmin) {
        actions.push({
          id: 'cancel',
          label: 'Cancel',
          icon: 'cancel',
          color: 'bg-red-600',
          hoverColor: 'hover:bg-red-700',
          onClick: () => setCancelModalOpen(true),
        })
      }
      break

    case 'open':
    case 'in_progress':
      // Can cancel
      actions.push({
        id: 'cancel',
        label: 'Cancel',
        icon: 'cancel',
        color: 'bg-red-600',
        hoverColor: 'hover:bg-red-700',
        onClick: () => setCancelModalOpen(true),
      })
      break

    case 'resolved':
    case 'reopened':
      // Can cancel and close
      actions.push({
        id: 'cancel',
        label: 'Cancel',
        icon: 'cancel',
        color: 'bg-red-600',
        hoverColor: 'hover:bg-red-700',
        onClick: () => setCancelModalOpen(true),
      })

      // Only reporter or admin can close
      if (isAdmin) {
        actions.push({
          id: 'close',
          label: 'Close',
          icon: 'check_circle',
          color: 'bg-green-600',
          hoverColor: 'hover:bg-green-700',
          onClick: () => setCloseDialogOpen(true),
        })
      }

      // Can reopen if resolved
      if (ticket.status === 'resolved') {
        actions.push({
          id: 'reopen',
          label: 'Reopen',
          icon: 'undo',
          color: 'bg-blue-600',
          hoverColor: 'hover:bg-blue-700',
          onClick: () => setReopenModalOpen(true),
        })
      }
      break

    case 'closed':
      // Can reopen
      actions.push({
        id: 'reopen',
        label: 'Reopen',
        icon: 'undo',
        color: 'bg-blue-600',
        hoverColor: 'hover:bg-blue-700',
        onClick: () => setReopenModalOpen(true),
      })
      break

    case 'cancelled':
      // No actions available
      break

    case 'waiting_for_customer':
      // Can cancel
      actions.push({
        id: 'cancel',
        label: 'Cancel',
        icon: 'cancel',
        color: 'bg-red-600',
        hoverColor: 'hover:bg-red-700',
        onClick: () => setCancelModalOpen(true),
      })
      break

    case 'rebuttal':
      // Can cancel
      actions.push({
        id: 'cancel',
        label: 'Cancel',
        icon: 'cancel',
        color: 'bg-red-600',
        hoverColor: 'hover:bg-red-700',
        onClick: () => setCancelModalOpen(true),
      })
      break
  }

  if (actions.length === 0) {
    return null
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {actions.map((action) => (
          <motion.button
            key={action.id}
            onClick={action.onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`inline-flex items-center gap-2 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors ${action.color} ${action.hoverColor}`}
            title={action.label}
          >
            <span className="material-symbols-outlined text-lg">
              {action.icon}
            </span>
            <span>{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Modals */}
      <CancelTicketModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        ticketId={ticket.id}
        onSuccess={onActionComplete}
      />

      <ReopenTicketModal
        isOpen={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
        ticketId={ticket.id}
        onSuccess={onActionComplete}
      />

      <CloseTicketDialog
        isOpen={closeDialogOpen}
        onClose={() => setCloseDialogOpen(false)}
        ticketId={ticket.id}
        onSuccess={onActionComplete}
      />
    </>
  )
}
