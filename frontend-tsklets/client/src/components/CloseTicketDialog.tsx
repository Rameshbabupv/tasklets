import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAuthStore } from '../store/auth'

interface CloseTicketDialogProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string | number
  onSuccess: () => void
}

export default function CloseTicketDialog({
  isOpen,
  onClose,
  ticketId,
  onSuccess,
}: CloseTicketDialogProps) {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)

    try {
      const res = await fetch(`/api/tickets/${ticketId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to close ticket')
      }

      toast.success('Ticket closed successfully')
      onClose()
      onSuccess()
    } catch (err: any) {
      console.error('Failed to close ticket:', err)
      toast.error(err.message || 'Failed to close ticket')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <div
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30">
                    <span className="material-symbols-outlined text-2xl text-green-600 dark:text-green-400">
                      check_circle
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      Close Ticket
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Mark this ticket as closed
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirmation Message */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Are you sure you want to close this ticket? You can reopen it later if needed.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  {loading ? 'Closing...' : 'Close Ticket'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
