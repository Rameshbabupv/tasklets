import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/auth';
import { StatusBadge, PriorityPill } from '@tsklets/ui';
import { formatDateTime } from '@tsklets/utils';
export default function TicketDetailModal({ ticketId, onClose }) {
    const { token } = useAuthStore();
    const [ticket, setTicket] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => {
        if (ticketId) {
            fetchTicket();
        }
    }, [ticketId]);
    const fetchTicket = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tickets/${ticketId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setTicket(data.ticket);
            setAttachments(data.attachments || []);
            setComments(data.comments || []);
        }
        catch (err) {
            console.error('Failed to fetch ticket:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || submitting)
            return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/tickets/${ticketId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content: newComment, isInternal: false }),
            });
            if (res.ok) {
                const data = await res.json();
                setComments([...comments, data.comment]);
                setNewComment('');
            }
        }
        catch (err) {
            console.error('Failed to add comment:', err);
        }
        finally {
            setSubmitting(false);
        }
    };
    if (!ticketId)
        return null;
    return (_jsx(AnimatePresence, { children: _jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick: onClose, children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 20 }, transition: { duration: 0.2 }, className: "bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-600 text-white", children: _jsx("span", { className: "material-symbols-outlined", children: "confirmation_number" }) }), _jsxs("div", { children: [_jsx("h2", { className: "font-bold text-slate-900 dark:text-slate-100", children: ticket?.issueKey || `Ticket #${ticketId}` }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "View ticket details" })] })] }), _jsx("button", { onClick: onClose, className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors", children: _jsx("span", { className: "material-symbols-outlined text-slate-500 dark:text-slate-400", children: "close" }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "inline-block size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) })) : !ticket ? (_jsx("div", { className: "text-center py-12 text-slate-500 dark:text-slate-400", children: "Ticket not found" })) : (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4 mb-4", children: [_jsx("h3", { className: "text-xl font-bold text-slate-900 dark:text-slate-100 flex-1", children: ticket.title }), _jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [_jsx(StatusBadge, { status: ticket.status }), _jsx(PriorityPill, { priority: ticket.clientPriority })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-base", children: "schedule" }), formatDateTime(ticket.createdAt)] }), ticket.type && (_jsx("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ticket.type === 'feature_request'
                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'}`, children: ticket.type === 'feature_request' ? 'Feature Request' : 'Support' }))] }), ticket.description && (_jsx("div", { className: "bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4", children: _jsx("p", { className: "text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap", children: ticket.description }) }))] }), attachments.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "attach_file" }), "Attachments (", attachments.length, ")"] }), _jsx("div", { className: "flex flex-wrap gap-3", children: attachments.map((att) => (_jsxs("a", { href: att.fileUrl, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-base text-slate-500 dark:text-slate-400", children: "image" }), _jsx("span", { className: "text-sm text-slate-700 dark:text-slate-300 truncate max-w-[150px]", children: att.fileName })] }, att.id))) })] })), _jsxs("div", { children: [_jsxs("h4", { className: "font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "chat" }), "Comments (", comments.filter(c => !c.isInternal).length, ")"] }), _jsxs("div", { className: "space-y-4", children: [comments.filter(c => !c.isInternal).map((comment) => (_jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium flex-shrink-0", children: "U" }), _jsxs("div", { className: "flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-sm font-medium text-slate-900 dark:text-slate-100", children: "User" }), _jsx("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: formatDateTime(comment.createdAt) })] }), _jsx("p", { className: "text-sm text-slate-700 dark:text-slate-300", children: comment.content })] })] }, comment.id))), comments.filter(c => !c.isInternal).length === 0 && (_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 text-center py-4", children: "No comments yet" }))] }), _jsx("form", { onSubmit: handleAddComment, className: "mt-4", children: _jsxs("div", { className: "flex gap-3", children: [_jsx("textarea", { value: newComment, onChange: (e) => setNewComment(e.target.value), placeholder: "Add a comment...", rows: 2, className: "flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none" }), _jsx("button", { type: "submit", disabled: !newComment.trim() || submitting, className: "self-end px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: submitting ? 'Sending...' : 'Send' })] }) })] })] })) })] }) }) }));
}
