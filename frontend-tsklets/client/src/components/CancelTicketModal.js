import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '../store/auth';
export default function CancelTicketModal({ isOpen, onClose, ticketId, onSuccess, }) {
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            toast.error('Please provide a reason for cancellation');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/tickets/${ticketId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: reason.trim() }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to cancel ticket');
            }
            toast.success('Ticket cancelled successfully');
            setReason('');
            onClose();
            onSuccess();
        }
        catch (err) {
            console.error('Failed to cancel ticket:', err);
            toast.error(err.message || 'Failed to cancel ticket');
        }
        finally {
            setLoading(false);
        }
    };
    const handleClose = () => {
        if (!loading) {
            setReason('');
            onClose();
        }
    };
    return (_jsx(AnimatePresence, { children: isOpen && (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 }, className: "fixed inset-0 z-50 bg-black/60", onClick: handleClose }), _jsx(motion.div, { initial: { opacity: 0, scale: 0.95, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 20 }, transition: { duration: 0.2 }, className: "fixed inset-0 z-50 flex items-center justify-center p-4", onClick: handleClose, children: _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6", onClick: (e) => e.stopPropagation(), children: [_jsx("div", { className: "mb-6", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30", children: _jsx("span", { className: "material-symbols-outlined text-2xl text-red-600 dark:text-red-400", children: "cancel" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-slate-100", children: "Cancel Ticket" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: "This action cannot be undone" })] })] }) }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Reason for Cancellation *" }), _jsx("textarea", { value: reason, onChange: (e) => setReason(e.target.value), placeholder: "Please explain why you are cancelling this ticket...", rows: 4, disabled: loading, className: "w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed" }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400 mt-1", children: [reason.length, " / 1000 characters"] })] }), _jsxs("div", { className: "flex items-center justify-end gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: handleClose, disabled: loading, className: "px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: "Keep Ticket" }), _jsxs("button", { type: "submit", disabled: loading || !reason.trim(), className: "inline-flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "cancel" }), loading ? 'Cancelling...' : 'Cancel Ticket'] })] })] })] }) })] })) }));
}
