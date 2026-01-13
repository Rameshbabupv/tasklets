import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/auth';
import { StatusBadge, PriorityPill } from '@tsklets/ui';
import { formatDateTime } from '@tsklets/utils';
import TicketChangelog from './TicketChangelog';
import TicketActions from './TicketActions';
// Get initials from name
function getInitials(name) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
// Generate consistent color from string
function stringToColor(str) {
    const colors = [
        'bg-rose-500', 'bg-pink-500', 'bg-fuchsia-500', 'bg-purple-500',
        'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500',
        'bg-teal-500', 'bg-emerald-500', 'bg-amber-500', 'bg-orange-500',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}
export default function TicketDetailModal({ ticketId, onClose }) {
    const { token, user } = useAuthStore();
    const [ticket, setTicket] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    useEffect(() => {
        if (ticketId) {
            fetchTicket();
            setActiveTab('details'); // Reset to details tab when opening new ticket
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
    const tabs = [
        { id: 'details', label: 'Details', icon: 'description' },
        { id: 'changelog', label: 'Changelog', icon: 'history' },
    ];
    return (_jsx(AnimatePresence, { mode: "wait", children: ticketId && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 }, className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick: onClose, children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 20 }, transition: { duration: 0.2 }, className: "bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-600 text-white", children: _jsx("span", { className: "material-symbols-outlined", children: "confirmation_number" }) }), _jsxs("div", { children: [_jsx("h2", { className: "font-bold text-slate-900 dark:text-slate-100", children: ticket?.issueKey || `Ticket #${ticketId}` }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "View ticket details" })] })] }), _jsx("button", { onClick: onClose, className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors", children: _jsx("span", { className: "material-symbols-outlined text-slate-500 dark:text-slate-400", children: "close" }) })] }), _jsx("div", { className: "flex gap-1 px-6 pt-4 border-b border-slate-200 dark:border-slate-700", children: tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `
                      relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all rounded-t-lg
                      ${isActive
                                    ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}
                    `, children: [_jsx("span", { className: `material-symbols-outlined text-lg ${isActive ? 'scale-110' : ''}`, children: tab.icon }), _jsx("span", { children: tab.label }), isActive && (_jsx(motion.div, { layoutId: "activeModalTab", className: "absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" }))] }, tab.id));
                        }) }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "inline-block size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) })) : !ticket ? (_jsx("div", { className: "text-center py-12 text-slate-500 dark:text-slate-400", children: "Ticket not found" })) : (_jsxs(_Fragment, { children: [activeTab === 'details' && (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4 mb-4", children: [_jsx("h3", { className: "text-xl font-bold text-slate-900 dark:text-slate-100 flex-1", children: ticket.title }), _jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [_jsx(StatusBadge, { status: ticket.status }), _jsx(PriorityPill, { priority: ticket.clientPriority })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-base", children: "schedule" }), formatDateTime(ticket.createdAt)] }), ticket.productName && (_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300", children: [_jsx("span", { className: "material-symbols-outlined text-base", children: "inventory_2" }), ticket.productName] })), ticket.type && (_jsx("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ticket.type === 'feature_request'
                                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'}`, children: ticket.type === 'feature_request' ? 'Feature Request' : 'Support' }))] }), ticket.description && (_jsx("div", { className: "bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4", children: _jsx("p", { className: "text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap", children: ticket.description }) })), _jsx("div", { className: "mt-4 pt-4 border-t border-slate-200 dark:border-slate-700", children: _jsx(TicketActions, { ticket: ticket, userRole: user?.role || 'user', onActionComplete: fetchTicket }) })] }), attachments.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "attach_file" }), "Attachments (", attachments.length, ")"] }), _jsx("div", { className: "flex flex-wrap gap-3", children: attachments.map((att) => (_jsxs("a", { href: att.fileUrl, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-base text-slate-500 dark:text-slate-400", children: "image" }), _jsx("span", { className: "text-sm text-slate-700 dark:text-slate-300 truncate max-w-[150px]", children: att.fileName })] }, att.id))) })] })), _jsxs("div", { children: [_jsxs("h4", { className: "font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "chat" }), "Comments (", comments.filter(c => !c.isInternal).length, ")"] }), _jsxs("div", { className: "space-y-4", children: [comments.filter(c => !c.isInternal).map((comment) => {
                                                            const userName = comment.userName || comment.userEmail || 'User';
                                                            return (_jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: `w-8 h-8 rounded-full ${stringToColor(userName)} text-white flex items-center justify-center text-sm font-medium flex-shrink-0`, children: getInitials(userName) }), _jsxs("div", { className: "flex-1 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-sm font-medium text-slate-900 dark:text-slate-100", children: userName }), _jsx("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: formatDateTime(comment.createdAt) })] }), _jsx("p", { className: "text-sm text-slate-700 dark:text-slate-300", children: comment.content })] })] }, comment.id));
                                                        }), comments.filter(c => !c.isInternal).length === 0 && (_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 text-center py-4", children: "No comments yet" }))] }), _jsx("form", { onSubmit: handleAddComment, className: "mt-4", children: _jsxs("div", { className: "flex gap-3", children: [_jsx("textarea", { value: newComment, onChange: (e) => setNewComment(e.target.value), placeholder: "Add a comment...", rows: 2, className: "flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none" }), _jsx("button", { type: "submit", disabled: !newComment.trim() || submitting, className: "self-end px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: submitting ? 'Sending...' : 'Send' })] }) })] })] })), activeTab === 'changelog' && (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, children: _jsx(TicketChangelog, { ticketId: ticketId }) }))] })) })] }, "modal-content") }, "modal-backdrop")) }));
}
