import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { useAuthStore } from '../store/auth';
import { StatusBadge, PriorityPill } from '@tsklets/ui';
import { formatDateTime } from '@tsklets/utils';
import ImageModal from '../components/ImageModal';
const ESCALATION_REASONS = [
    { value: 'executive_request', label: 'Executive Request', description: 'Requested by C-level or senior leadership' },
    { value: 'production_down', label: 'Production Down', description: 'Critical system outage affecting operations' },
    { value: 'compliance', label: 'Compliance', description: 'Regulatory or compliance requirement' },
    { value: 'customer_impact', label: 'Customer Impact', description: 'Significant customer-facing issue' },
    { value: 'other', label: 'Other', description: 'Other urgent reason' },
];
export default function TicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuthStore();
    const [ticket, setTicket] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [comments, setComments] = useState([]);
    const [watchers, setWatchers] = useState([]);
    const [companyUsers, setCompanyUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [modalImage, setModalImage] = useState(null);
    // Triage modal states
    const [showEscalateModal, setShowEscalateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showAddWatcherModal, setShowAddWatcherModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    // Escalation form
    const [escalationReason, setEscalationReason] = useState('customer_impact');
    const [escalationNote, setEscalationNote] = useState('');
    // Add watcher form
    const [watcherEmail, setWatcherEmail] = useState('');
    const [selectedWatcherUserId, setSelectedWatcherUserId] = useState(null);
    const isCompanyAdmin = user?.role === 'company_admin';
    const isPendingReview = ticket?.status === 'pending_internal_review';
    const isWatching = watchers.some(w => w.userId === user?.id);
    useEffect(() => {
        fetchTicket();
        fetchWatchers();
        if (isCompanyAdmin) {
            fetchCompanyUsers();
        }
    }, [id, isCompanyAdmin]);
    const fetchTicket = async () => {
        try {
            const res = await fetch(`/api/tickets/${id}`, {
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
    const fetchWatchers = async () => {
        try {
            const res = await fetch(`/api/tickets/${id}/watchers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setWatchers(data.watchers || []);
            }
        }
        catch (err) {
            console.error('Failed to fetch watchers:', err);
        }
    };
    const fetchCompanyUsers = async () => {
        try {
            const res = await fetch('/api/users/company', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setCompanyUsers(Array.isArray(data) ? data : []);
            }
        }
        catch (err) {
            console.error('Failed to fetch company users:', err);
        }
    };
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim())
            return;
        try {
            const res = await fetch(`/api/tickets/${id}/comments`, {
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
    };
    // Triage Actions
    const handlePushToSystech = async () => {
        if (!confirm('Push this ticket to Systech? This will start the SLA clock.'))
            return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/tickets/${id}/push-to-systech`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to push ticket');
            }
            toast.success('Ticket pushed to Systech successfully');
            fetchTicket();
        }
        catch (err) {
            toast.error(err.message || 'Failed to push ticket');
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleEscalate = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/tickets/${id}/escalate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ escalationReason, escalationNote: escalationNote || undefined }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to escalate ticket');
            }
            toast.success('Ticket escalated successfully');
            setShowEscalateModal(false);
            setEscalationNote('');
            fetchTicket();
        }
        catch (err) {
            toast.error(err.message || 'Failed to escalate ticket');
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleAssignInternal = async (assigneeId) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/tickets/${id}/assign-internal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ internalAssignedTo: assigneeId }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to assign ticket');
            }
            toast.success('Ticket assigned internally');
            setShowAssignModal(false);
            fetchTicket();
        }
        catch (err) {
            toast.error(err.message || 'Failed to assign ticket');
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleResolveInternally = async () => {
        if (!confirm('Resolve this ticket internally without Systech involvement?'))
            return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/tickets/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'resolved', resolution: 'resolved_internally' }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to resolve ticket');
            }
            toast.success('Ticket resolved internally');
            fetchTicket();
        }
        catch (err) {
            toast.error(err.message || 'Failed to resolve ticket');
        }
        finally {
            setActionLoading(false);
        }
    };
    // Watcher Actions
    const handleAddSelfAsWatcher = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/tickets/${id}/watchers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId: user?.id }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add watcher');
            }
            toast.success('You are now watching this ticket');
            fetchWatchers();
        }
        catch (err) {
            toast.error(err.message || 'Failed to add watcher');
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleAddWatcher = async () => {
        if (!selectedWatcherUserId && !watcherEmail) {
            toast.error('Please select a user or enter an email');
            return;
        }
        setActionLoading(true);
        try {
            const body = selectedWatcherUserId
                ? { userId: selectedWatcherUserId }
                : { email: watcherEmail };
            const res = await fetch(`/api/tickets/${id}/watchers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add watcher');
            }
            toast.success('Watcher added successfully');
            setShowAddWatcherModal(false);
            setWatcherEmail('');
            setSelectedWatcherUserId(null);
            fetchWatchers();
        }
        catch (err) {
            toast.error(err.message || 'Failed to add watcher');
        }
        finally {
            setActionLoading(false);
        }
    };
    const handleRemoveWatcher = async (watcherId) => {
        if (!confirm('Remove this watcher?'))
            return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/tickets/${id}/watchers/${watcherId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to remove watcher');
            }
            toast.success('Watcher removed');
            fetchWatchers();
        }
        catch (err) {
            toast.error(err.message || 'Failed to remove watcher');
        }
        finally {
            setActionLoading(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", style: { backgroundColor: 'var(--bg-secondary)' }, children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" }), _jsx("p", { style: { color: 'var(--text-secondary)' }, children: "Loading..." })] }) }));
    }
    if (!ticket) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", style: { backgroundColor: 'var(--bg-secondary)' }, children: _jsx("p", { style: { color: 'var(--text-secondary)' }, children: "Ticket not found" }) }));
    }
    return (_jsxs("div", { className: "min-h-screen", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsx("header", { className: "bg-gradient-to-r from-white to-purple-50/30 dark:from-slate-800 dark:to-purple-900/30 border-b border-slate-200 dark:border-slate-700", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "flex items-center h-16", children: _jsxs(Link, { to: "/", className: "flex items-center gap-3 hover:opacity-80 transition-opacity", children: [_jsx("div", { className: "flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg", children: _jsx("span", { className: "material-symbols-outlined text-xl", children: "support_agent" }) }), _jsxs("div", { children: [_jsx("span", { className: "font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent", children: "Support Desk" }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Client Portal" })] })] }) }) }) }), _jsxs("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("nav", { className: "mb-6 text-sm", children: [_jsx(Link, { to: "/", className: "text-primary hover:text-blue-600", children: "Home" }), _jsx("span", { className: "mx-2", style: { color: 'var(--text-muted)' }, children: "/" }), _jsx(Link, { to: "/tickets", className: "text-primary hover:text-blue-600", children: "Tickets" }), _jsx("span", { className: "mx-2", style: { color: 'var(--text-muted)' }, children: "/" }), _jsx("span", { style: { color: 'var(--text-secondary)' }, children: ticket.issueKey || `#${ticket.id}` })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs("div", { className: "rounded-xl shadow-card p-6", style: { backgroundColor: 'var(--bg-card)', borderWidth: '1px', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold mb-2", style: { color: 'var(--text-primary)' }, children: ticket.title }), _jsxs("p", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: ["Created on ", formatDateTime(ticket.createdAt), ticket.createdByName && ` by ${ticket.createdByName}`] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(StatusBadge, { status: ticket.status }), _jsx(PriorityPill, { priority: ticket.clientPriority })] })] }), ticket.description && (_jsx("p", { className: "whitespace-pre-wrap", style: { color: 'var(--text-secondary)' }, children: ticket.description })), ticket.escalationReason && (_jsxs("div", { className: "mt-4 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "material-symbols-outlined text-orange-600 dark:text-orange-400", children: "priority_high" }), _jsx("span", { className: "font-semibold text-orange-800 dark:text-orange-300", children: "Escalated" })] }), _jsxs("p", { className: "text-sm text-orange-700 dark:text-orange-300", children: [_jsx("strong", { children: "Reason:" }), " ", ESCALATION_REASONS.find(r => r.value === ticket.escalationReason)?.label || ticket.escalationReason] }), ticket.escalationNote && (_jsxs("p", { className: "text-sm text-orange-700 dark:text-orange-300 mt-1", children: [_jsx("strong", { children: "Note:" }), " ", ticket.escalationNote] }))] }))] }), isCompanyAdmin && isPendingReview && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "rounded-xl shadow-card p-6", style: { backgroundColor: 'var(--bg-card)', borderWidth: '1px', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("span", { className: "material-symbols-outlined text-orange-500", children: "assignment" }), _jsx("h2", { className: "font-semibold", style: { color: 'var(--text-primary)' }, children: "Internal Triage Actions" })] }), _jsx("p", { className: "text-sm mb-4", style: { color: 'var(--text-secondary)' }, children: "This ticket is pending internal review. Choose an action below:" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("button", { onClick: handlePushToSystech, disabled: actionLoading, className: "flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50", children: [_jsx("span", { className: "material-symbols-outlined", children: "send" }), "Push to Systech"] }), _jsxs("button", { onClick: () => setShowEscalateModal(true), disabled: actionLoading, className: "flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50", children: [_jsx("span", { className: "material-symbols-outlined", children: "priority_high" }), "Escalate"] }), _jsxs("button", { onClick: () => setShowAssignModal(true), disabled: actionLoading, className: "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all disabled:opacity-50", children: [_jsx("span", { className: "material-symbols-outlined", children: "person_add" }), "Assign Internally"] }), _jsxs("button", { onClick: handleResolveInternally, disabled: actionLoading, className: "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all disabled:opacity-50", children: [_jsx("span", { className: "material-symbols-outlined", children: "check_circle" }), "Resolve Internally"] })] })] })), _jsxs("div", { className: "rounded-xl shadow-card", style: { backgroundColor: 'var(--bg-card)', borderWidth: '1px', borderColor: 'var(--border-primary)' }, children: [_jsx("div", { className: "px-6 py-4", style: { borderBottomWidth: '1px', borderBottomColor: 'var(--border-primary)' }, children: _jsx("h2", { className: "font-semibold", style: { color: 'var(--text-primary)' }, children: "Comments" }) }), _jsxs("div", { style: { borderTopWidth: '0' }, children: [comments.filter(c => !c.isInternal).map((comment, idx) => (_jsxs("div", { className: "p-6", style: idx > 0 ? { borderTopWidth: '1px', borderTopColor: 'var(--border-primary)' } : {}, children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium", children: "U" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", style: { color: 'var(--text-primary)' }, children: "User" }), _jsx("p", { className: "text-xs", style: { color: 'var(--text-secondary)' }, children: formatDateTime(comment.createdAt) })] })] }), _jsx("p", { className: "ml-11", style: { color: 'var(--text-secondary)' }, children: comment.content })] }, comment.id))), comments.length === 0 && (_jsx("div", { className: "p-6 text-center", style: { color: 'var(--text-secondary)' }, children: "No comments yet" }))] }), _jsxs("form", { onSubmit: handleAddComment, className: "p-6", style: { borderTopWidth: '1px', borderTopColor: 'var(--border-primary)' }, children: [_jsx("textarea", { value: newComment, onChange: (e) => setNewComment(e.target.value), placeholder: "Type your reply here...", rows: 3, className: "block w-full rounded-lg border-0 py-3 px-4 ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-primary text-sm mb-4", style: {
                                                            color: 'var(--text-primary)',
                                                            backgroundColor: 'var(--bg-card)',
                                                            borderColor: 'var(--border-secondary)'
                                                        } }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { type: "submit", className: "inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors", children: "Send Reply" }) })] })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "rounded-xl shadow-card p-6", style: { backgroundColor: 'var(--bg-card)', borderWidth: '1px', borderColor: 'var(--border-primary)' }, children: [_jsx("h3", { className: "font-semibold mb-4", style: { color: 'var(--text-primary)' }, children: "Ticket Properties" }), _jsxs("dl", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: "Status" }), _jsx("dd", { className: "mt-1", children: _jsx(StatusBadge, { status: ticket.status }) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: "Priority" }), _jsx("dd", { className: "mt-1", children: _jsx(PriorityPill, { priority: ticket.clientPriority }) })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: "Severity" }), _jsx("dd", { className: "mt-1", children: _jsx(PriorityPill, { priority: ticket.clientSeverity }) })] }), ticket.pushedToSystechAt && (_jsxs("div", { children: [_jsx("dt", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: "Pushed to Systech" }), _jsx("dd", { className: "mt-1 text-sm", style: { color: 'var(--text-primary)' }, children: formatDateTime(ticket.pushedToSystechAt) })] }))] })] }), _jsxs("div", { className: "rounded-xl shadow-card p-6", style: { backgroundColor: 'var(--bg-card)', borderWidth: '1px', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "font-semibold", style: { color: 'var(--text-primary)' }, children: ["Watchers (", watchers.length, ")"] }), !isWatching && (_jsxs("button", { onClick: handleAddSelfAsWatcher, disabled: actionLoading, className: "text-xs flex items-center gap-1 text-primary hover:text-blue-600 font-medium disabled:opacity-50", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "visibility" }), "Watch"] }))] }), _jsxs("div", { className: "space-y-2", children: [watchers.map((watcher) => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded-lg", style: { backgroundColor: 'var(--bg-tertiary)' }, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium", children: watcher.user?.name?.charAt(0).toUpperCase() || 'U' }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm font-medium", style: { color: 'var(--text-primary)' }, children: [watcher.user?.name || 'Unknown', watcher.userId === user?.id && (_jsx("span", { className: "text-xs text-primary ml-1", children: "(you)" }))] }), _jsx("p", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: watcher.user?.email })] })] }), (isCompanyAdmin || watcher.userId === user?.id) && (_jsx("button", { onClick: () => handleRemoveWatcher(watcher.id), disabled: actionLoading, className: "text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50", title: "Remove watcher", children: _jsx("span", { className: "material-symbols-outlined text-lg", children: "close" }) }))] }, watcher.id))), watchers.length === 0 && (_jsx("p", { className: "text-sm text-center py-2", style: { color: 'var(--text-muted)' }, children: "No watchers yet" }))] }), isCompanyAdmin && (_jsxs("button", { onClick: () => setShowAddWatcherModal(true), className: "w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-dashed transition-colors hover:bg-slate-50 dark:hover:bg-slate-800", style: { borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }, children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "person_add" }), "Add Watcher"] }))] }), attachments.length > 0 && (_jsxs("div", { className: "rounded-xl shadow-card p-6", style: { backgroundColor: 'var(--bg-card)', borderWidth: '1px', borderColor: 'var(--border-primary)' }, children: [_jsxs("h3", { className: "font-semibold mb-4", style: { color: 'var(--text-primary)' }, children: ["Attachments (", attachments.length, ")"] }), _jsx("div", { className: "grid grid-cols-2 gap-4", children: attachments.map((att) => (_jsxs("div", { className: "group", children: [_jsx("div", { onClick: () => setModalImage({ url: att.fileUrl, name: att.fileName, size: att.fileSize }), className: "aspect-square rounded-lg overflow-hidden border-2 cursor-pointer hover:border-primary transition-colors", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }, children: _jsx("img", { src: att.fileUrl, alt: att.fileName, className: "w-full h-full object-cover" }) }), _jsxs("div", { className: "mt-2", children: [_jsx("p", { className: "text-xs truncate", style: { color: 'var(--text-secondary)' }, title: att.fileName, children: att.fileName }), att.fileSize && (_jsx("p", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: att.fileSize < 1024
                                                                        ? att.fileSize + ' B'
                                                                        : att.fileSize < 1024 * 1024
                                                                            ? (att.fileSize / 1024).toFixed(1) + ' KB'
                                                                            : (att.fileSize / (1024 * 1024)).toFixed(1) + ' MB' }))] })] }, att.id))) })] }))] })] })] }), modalImage && (_jsx(ImageModal, { imageUrl: modalImage.url, fileName: modalImage.name, fileSize: modalImage.size, onClose: () => setModalImage(null) })), _jsx(AnimatePresence, { children: showEscalateModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick: () => setShowEscalateModal(false), children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 20 }, className: "bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white", children: _jsx("span", { className: "material-symbols-outlined", children: "priority_high" }) }), _jsxs("div", { children: [_jsx("h2", { className: "font-bold text-slate-900 dark:text-slate-100", children: "Escalate Ticket" }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Escalate this ticket to Systech with priority" })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300", children: "Escalation Reason *" }), _jsx("div", { className: "space-y-2", children: ESCALATION_REASONS.map((reason) => (_jsxs("label", { className: `flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${escalationReason === reason.value
                                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'}`, children: [_jsx("input", { type: "radio", name: "escalationReason", value: reason.value, checked: escalationReason === reason.value, onChange: () => setEscalationReason(reason.value), className: "mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm text-slate-900 dark:text-slate-100", children: reason.label }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: reason.description })] })] }, reason.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300", children: "Additional Note (optional)" }), _jsx("textarea", { value: escalationNote, onChange: (e) => setEscalationNote(e.target.value), placeholder: "Provide additional context for the escalation...", rows: 3, className: "w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" })] })] }), _jsxs("div", { className: "flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700", children: [_jsx("button", { onClick: () => setShowEscalateModal(false), className: "px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100", children: "Cancel" }), _jsxs("button", { onClick: handleEscalate, disabled: actionLoading, className: "inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "priority_high" }), actionLoading ? 'Escalating...' : 'Escalate Ticket'] })] })] }) })) }), _jsx(AnimatePresence, { children: showAssignModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick: () => setShowAssignModal(false), children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 20 }, className: "bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white", children: _jsx("span", { className: "material-symbols-outlined", children: "person_add" }) }), _jsxs("div", { children: [_jsx("h2", { className: "font-bold text-slate-900 dark:text-slate-100", children: "Assign Internally" }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Select a team member to handle this ticket" })] })] }), _jsxs("div", { className: "space-y-2 max-h-80 overflow-y-auto", children: [companyUsers.filter(u => u.id !== user?.id).map((companyUser) => (_jsxs("button", { onClick: () => handleAssignInternal(companyUser.id), disabled: actionLoading, className: "w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left disabled:opacity-50", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-medium", children: companyUser.name.charAt(0).toUpperCase() }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm text-slate-900 dark:text-slate-100", children: companyUser.name }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: [companyUser.email, " - ", companyUser.role] })] })] }, companyUser.id))), companyUsers.length <= 1 && (_jsx("p", { className: "text-center py-4 text-slate-500 dark:text-slate-400", children: "No other team members available" }))] }), _jsx("div", { className: "flex items-center justify-end mt-6 pt-4 border-t border-slate-200 dark:border-slate-700", children: _jsx("button", { onClick: () => setShowAssignModal(false), className: "px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100", children: "Cancel" }) })] }) })) }), _jsx(AnimatePresence, { children: showAddWatcherModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick: () => setShowAddWatcherModal(false), children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 20 }, className: "bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-600 text-white", children: _jsx("span", { className: "material-symbols-outlined", children: "visibility" }) }), _jsxs("div", { children: [_jsx("h2", { className: "font-bold text-slate-900 dark:text-slate-100", children: "Add Watcher" }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Select a user or enter an email address" })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300", children: "Select Team Member" }), _jsxs("select", { value: selectedWatcherUserId || '', onChange: (e) => {
                                                    setSelectedWatcherUserId(e.target.value ? Number(e.target.value) : null);
                                                    setWatcherEmail('');
                                                }, className: "w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary focus:border-transparent", children: [_jsx("option", { value: "", children: "-- Select a user --" }), companyUsers
                                                        .filter(u => !watchers.some(w => w.userId === u.id))
                                                        .map((u) => (_jsxs("option", { value: u.id, children: [u.name, " (", u.email, ")"] }, u.id)))] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex-1 h-px bg-slate-200 dark:bg-slate-700" }), _jsx("span", { className: "text-xs text-slate-400", children: "or" }), _jsx("div", { className: "flex-1 h-px bg-slate-200 dark:bg-slate-700" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300", children: "Email Address" }), _jsx("input", { type: "email", value: watcherEmail, onChange: (e) => {
                                                    setWatcherEmail(e.target.value);
                                                    setSelectedWatcherUserId(null);
                                                }, placeholder: "user@company.com", className: "w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary focus:border-transparent" })] })] }), _jsxs("div", { className: "flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700", children: [_jsx("button", { onClick: () => setShowAddWatcherModal(false), className: "px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100", children: "Cancel" }), _jsxs("button", { onClick: handleAddWatcher, disabled: actionLoading || (!selectedWatcherUserId && !watcherEmail), className: "inline-flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "person_add" }), actionLoading ? 'Adding...' : 'Add Watcher'] })] })] }) })) }), _jsx(Toaster, { position: "top-right", richColors: true })] }));
}
