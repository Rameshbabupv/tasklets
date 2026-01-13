import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/auth';
import DevTaskDetailModal from './DevTaskDetailModal';
// Escalation reason labels
const escalationReasonLabels = {
    executive_request: 'Executive Request',
    production_down: 'Production Down',
    compliance: 'Compliance',
    customer_impact: 'Customer Impact',
    other: 'Other',
};
// Helper to check if ticket is escalated
const isEscalated = (ticket) => ticket.labels?.includes('escalated');
// Helper to check if ticket was created by Systech
const isCreatedBySystech = (ticket) => ticket.labels?.includes('created_by_systech');
// Helper to calculate SLA time since escalation
const getSlaTime = (pushedToSystechAt) => {
    if (!pushedToSystechAt)
        return { hours: 0, display: '-', urgency: 'normal' };
    const pushed = new Date(pushedToSystechAt);
    const now = new Date();
    const diffMs = now.getTime() - pushed.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    let urgency = 'normal';
    if (hours >= 24)
        urgency = 'critical';
    else if (hours >= 8)
        urgency = 'warning';
    let display = '';
    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        display = `${days}d ${hours % 24}h`;
    }
    else if (hours > 0) {
        display = `${hours}h ${minutes}m`;
    }
    else {
        display = `${minutes}m`;
    }
    return { hours, display, urgency };
};
// Type configuration
const typeConfig = {
    support: { icon: 'support_agent', color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Support' },
    bug: { icon: 'bug_report', color: 'text-red-500', bg: 'bg-red-500/10', label: 'Bug' },
    task: { icon: 'task_alt', color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Task' },
    feature: { icon: 'auto_awesome', color: 'text-cyan-500', bg: 'bg-cyan-500/10', label: 'Feature' },
    feature_request: { icon: 'lightbulb', color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Request' },
    epic: { icon: 'bolt', color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Epic' },
    spike: { icon: 'science', color: 'text-indigo-500', bg: 'bg-indigo-500/10', label: 'Spike' },
    note: { icon: 'note', color: 'text-slate-500', bg: 'bg-slate-500/10', label: 'Note' },
};
// Status configuration
const statusConfig = {
    pending_internal_review: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/50', icon: 'hourglass_empty' },
    open: { color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-700', icon: 'radio_button_unchecked' },
    in_progress: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/50', icon: 'pending' },
    waiting_for_customer: { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/50', icon: 'schedule' },
    rebuttal: { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/50', icon: 'reply' },
    review: { color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/50', icon: 'rate_review' },
    blocked: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/50', icon: 'block' },
    resolved: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/50', icon: 'check_circle' },
    closed: { color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-200 dark:bg-slate-800', icon: 'cancel' },
    cancelled: { color: 'text-slate-400 dark:text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', icon: 'do_not_disturb_on' },
};
// Priority colors
const priorityColors = {
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-blue-500',
    4: 'bg-emerald-500',
    5: 'bg-slate-400',
};
export default function TicketModal({ issueKey, onClose, onStatusChange, onCreateDevTask }) {
    const { token } = useAuthStore();
    const [ticket, setTicket] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [comments, setComments] = useState([]);
    const [parent, setParent] = useState(null);
    const [children, setChildren] = useState([]);
    const [links, setLinks] = useState([]);
    const [devTasks, setDevTasks] = useState([]);
    const [selectedDevTaskId, setSelectedDevTaskId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details');
    const [isClosing, setIsClosing] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isInternalComment, setIsInternalComment] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const modalRef = useRef(null);
    // Reassign to internal modal state
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [reassignComment, setReassignComment] = useState('');
    const [reassigning, setReassigning] = useState(false);
    const [reassignError, setReassignError] = useState('');
    useEffect(() => {
        fetchTicket();
        document.body.style.overflow = 'hidden';
        const handleEscape = (e) => {
            if (e.key === 'Escape')
                handleClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleEscape);
        };
    }, [issueKey]);
    const fetchTicket = async () => {
        try {
            const res = await fetch(`/api/tickets/${issueKey}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setTicket(data.ticket);
            setAttachments(data.attachments || []);
            setComments(data.comments || []);
            setParent(data.parent || null);
            setChildren(data.children || []);
            setLinks(data.links || []);
            setDevTasks(data.devTasks || []);
        }
        catch (err) {
            console.error('Failed to fetch ticket', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => onClose(), 200);
    };
    const handleStatusChange = async (newStatus) => {
        try {
            await fetch(`/api/tickets/${issueKey}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            fetchTicket();
            onStatusChange?.();
        }
        catch (err) {
            console.error('Failed to update status', err);
        }
    };
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim())
            return;
        setSubmittingComment(true);
        try {
            await fetch(`/api/tickets/${ticket?.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    content: newComment,
                    isInternal: isInternalComment,
                }),
            });
            setNewComment('');
            fetchTicket();
        }
        catch (err) {
            console.error('Failed to add comment', err);
        }
        finally {
            setSubmittingComment(false);
        }
    };
    // Handle reassign to internal
    const handleReassignToInternal = async (e) => {
        e.preventDefault();
        if (!reassignComment.trim()) {
            setReassignError('A comment explaining the reassignment reason is required');
            return;
        }
        setReassigning(true);
        setReassignError('');
        try {
            const res = await fetch(`/api/tickets/${ticket?.id}/reassign-to-internal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ comment: reassignComment }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to reassign ticket');
            }
            setShowReassignModal(false);
            setReassignComment('');
            fetchTicket();
            onStatusChange?.();
        }
        catch (err) {
            setReassignError(err.message);
        }
        finally {
            setReassigning(false);
        }
    };
    // Handle mark as rebuttal
    const handleMarkAsRebuttal = async () => {
        try {
            await fetch(`/api/tickets/${issueKey}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'rebuttal' }),
            });
            fetchTicket();
            onStatusChange?.();
        }
        catch (err) {
            console.error('Failed to mark as rebuttal', err);
        }
    };
    // Handle create dev task - close this modal and trigger callback
    const handleCreateDevTask = () => {
        if (!ticket)
            return;
        // Close this modal first
        setIsClosing(true);
        // After close animation, trigger the callback with ticket data
        setTimeout(() => {
            onCreateDevTask?.({
                id: ticket.id,
                issueKey: ticket.issueKey,
                title: ticket.title,
                description: ticket.description,
                productId: ticket.productId,
                productName: ticket.productName,
                productCode: ticket.productCode,
            });
        }, 200);
    };
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };
    const formatDateTime = (date) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };
    const formatFileSize = (bytes) => {
        if (!bytes)
            return '';
        if (bytes < 1024)
            return bytes + ' B';
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    if (loading) {
        return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm", children: _jsxs("div", { className: "flex items-center gap-3 text-white", children: [_jsx("span", { className: "material-symbols-outlined animate-spin", children: "progress_activity" }), _jsx("span", { children: "Loading ticket..." })] }) }));
    }
    if (!ticket) {
        return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm", children: _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl p-8 text-center", children: [_jsx("span", { className: "material-symbols-outlined text-5xl text-slate-300 mb-4", children: "error" }), _jsx("p", { className: "text-slate-600 dark:text-slate-300", children: "Ticket not found" }), _jsx("button", { onClick: onClose, className: "mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg", children: "Close" })] }) }));
    }
    const tConfig = typeConfig[ticket.type] || typeConfig.support;
    const sConfig = statusConfig[ticket.status] || statusConfig.open;
    const priority = ticket.internalPriority || ticket.clientPriority || 3;
    const ticketIsEscalated = isEscalated(ticket);
    const ticketIsCreatedBySystech = isCreatedBySystech(ticket);
    const slaTime = getSlaTime(ticket.pushedToSystechAt);
    return (_jsxs("div", { className: `fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8 overflow-y-auto
        ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`, onClick: handleClose, children: [_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm" }), _jsxs("div", { ref: modalRef, onClick: (e) => e.stopPropagation(), className: `relative w-full max-w-5xl mt-8 mb-8 rounded-2xl shadow-2xl overflow-hidden ${ticketIsEscalated ? 'ring-2 ring-red-500' : ''}
          ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`, style: { backgroundColor: 'var(--bg-card)' }, children: [_jsx("div", { className: `h-1.5 w-full ${ticketIsEscalated
                            ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-500'
                            : 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500'}` }), _jsx("div", { className: "px-6 py-5 border-b", style: { borderColor: 'var(--border-primary)' }, children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex items-start gap-4 min-w-0", children: [_jsx("div", { className: `shrink-0 size-12 rounded-xl ${tConfig.bg} flex items-center justify-center`, children: _jsx("span", { className: `material-symbols-outlined text-2xl ${tConfig.color}`, children: tConfig.icon }) }), _jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex items-center gap-3 mb-1 flex-wrap", children: [_jsx("span", { className: "text-sm font-mono font-bold text-violet-600 dark:text-violet-400", children: ticket.issueKey }), _jsxs("span", { className: `px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${sConfig.bg} ${sConfig.color}`, children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: sConfig.icon }), ticket.status.replace(/_/g, ' ')] }), ticketIsEscalated && (_jsxs("span", { className: "px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 flex items-center gap-1.5 animate-pulse", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "priority_high" }), "ESCALATED"] })), ticketIsCreatedBySystech && (_jsxs("span", { className: "px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 flex items-center gap-1.5", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "business" }), "CREATED BY SYSTECH"] }))] }), _jsx("h2", { className: "text-xl font-bold leading-tight", style: { color: 'var(--text-primary)' }, children: ticket.title }), _jsxs("div", { className: "flex items-center gap-3 mt-2 text-sm flex-wrap", style: { color: 'var(--text-muted)' }, children: [ticket.productName && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-base", children: "inventory_2" }), ticket.productName] })), ticket.clientName && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-base", children: "business" }), ticket.clientName] })), ticket.pushedToSystechAt && (_jsxs("span", { className: `flex items-center gap-1.5 font-medium ${slaTime.urgency === 'critical'
                                                                ? 'text-red-600 dark:text-red-400'
                                                                : slaTime.urgency === 'warning'
                                                                    ? 'text-orange-600 dark:text-orange-400'
                                                                    : 'text-slate-600 dark:text-slate-400'}`, children: [_jsx("span", { className: "material-symbols-outlined text-base", children: "timer" }), "SLA: ", slaTime.display] }))] })] })] }), _jsx("button", { onClick: handleClose, className: "shrink-0 size-10 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-700", style: { color: 'var(--text-muted)' }, children: _jsx("span", { className: "material-symbols-outlined", children: "close" }) })] }) }), _jsx("div", { className: "flex border-b px-6", style: { borderColor: 'var(--border-primary)' }, children: [
                            { key: 'details', label: 'Details', icon: 'description' },
                            { key: 'comments', label: 'Comments', icon: 'chat', count: comments.length },
                            { key: 'attachments', label: 'Attachments', icon: 'attach_file', count: attachments.length },
                            { key: 'related', label: 'Related', icon: 'link', count: children.length + links.length + devTasks.length + (parent ? 1 : 0) },
                        ].map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab.key), className: `flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors
                ${activeTab === tab.key
                                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                                : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`, style: { color: activeTab === tab.key ? undefined : 'var(--text-secondary)' }, children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: tab.icon }), tab.label, tab.count !== undefined && tab.count > 0 && (_jsx("span", { className: "px-1.5 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-700", children: tab.count }))] }, tab.key))) }), _jsxs("div", { className: "flex flex-col lg:flex-row", children: [_jsxs("div", { className: "flex-1 p-6 min-w-0", children: [activeTab === 'details' && (_jsxs("div", { className: "space-y-6", children: [ticketIsEscalated && (_jsx("div", { className: "p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("span", { className: "material-symbols-outlined text-2xl text-red-600 dark:text-red-400", children: "priority_high" }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-sm font-bold text-red-700 dark:text-red-300 mb-1", children: "Escalated Ticket" }), ticket.escalationReason && (_jsxs("p", { className: "text-sm text-red-600 dark:text-red-400 mb-2", children: [_jsx("span", { className: "font-medium", children: "Reason:" }), " ", escalationReasonLabels[ticket.escalationReason] || ticket.escalationReason] })), ticket.escalationNote && (_jsxs("p", { className: "text-sm text-red-600 dark:text-red-400", children: [_jsx("span", { className: "font-medium", children: "Note:" }), " ", ticket.escalationNote] })), ticket.pushedToSystechAt && (_jsxs("p", { className: "text-xs text-red-500 dark:text-red-400 mt-2", children: ["Escalated on ", new Date(ticket.pushedToSystechAt).toLocaleString()] }))] })] }) })), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold uppercase tracking-wide mb-3", style: { color: 'var(--text-muted)' }, children: "Description" }), _jsx("div", { className: "prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed", style: { color: 'var(--text-secondary)' }, children: ticket.description || (_jsx("span", { className: "italic", style: { color: 'var(--text-muted)' }, children: "No description provided" })) })] }), ticket.labels && ticket.labels.length > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold uppercase tracking-wide mb-3", style: { color: 'var(--text-muted)' }, children: "Labels" }), _jsx("div", { className: "flex flex-wrap gap-2", children: ticket.labels.map((label, i) => (_jsx("span", { className: "px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300", children: label }, i))) })] })), ticket.resolution && (_jsxs("div", { className: "p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800", children: [_jsxs("h3", { className: "text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "check_circle" }), "Resolution: ", ticket.resolution] }), ticket.resolutionNote && (_jsx("p", { className: "text-sm text-emerald-600 dark:text-emerald-300", children: ticket.resolutionNote }))] }))] })), activeTab === 'comments' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("form", { onSubmit: handleAddComment, className: "space-y-3", children: [_jsx("textarea", { value: newComment, onChange: (e) => setNewComment(e.target.value), placeholder: "Add a comment...", rows: 3, className: "w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30", style: {
                                                            backgroundColor: 'var(--bg-tertiary)',
                                                            borderColor: 'var(--border-primary)',
                                                            color: 'var(--text-primary)',
                                                        } }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm cursor-pointer", style: { color: 'var(--text-secondary)' }, children: [_jsx("input", { type: "checkbox", checked: isInternalComment, onChange: (e) => setIsInternalComment(e.target.checked), className: "rounded border-slate-300" }), _jsx("span", { className: "material-symbols-outlined text-base", children: "visibility_off" }), "Internal note (hidden from client)"] }), _jsx("button", { type: "submit", disabled: !newComment.trim() || submittingComment, className: "px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-violet-700 transition-colors", children: submittingComment ? 'Posting...' : 'Post Comment' })] })] }), _jsx("div", { className: "space-y-3 mt-6", children: comments.length === 0 ? (_jsxs("div", { className: "text-center py-12", style: { color: 'var(--text-muted)' }, children: [_jsx("span", { className: "material-symbols-outlined text-4xl mb-2", children: "chat_bubble_outline" }), _jsx("p", { children: "No comments yet" })] })) : (comments.map((comment) => (_jsxs("div", { className: `p-4 rounded-xl border ${comment.isInternal ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : ''}`, style: !comment.isInternal ? { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' } : undefined, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "size-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold", children: comment.authorName?.charAt(0) || '?' }), _jsx("span", { className: "font-medium text-sm", style: { color: 'var(--text-primary)' }, children: comment.authorName }), comment.isInternal && (_jsx("span", { className: "px-2 py-0.5 rounded text-xs font-medium bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200", children: "Internal" }))] }), _jsx("span", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: formatDateTime(comment.createdAt) })] }), _jsx("p", { className: "text-sm leading-relaxed", style: { color: 'var(--text-secondary)' }, children: comment.content })] }, comment.id)))) })] })), activeTab === 'attachments' && (_jsx("div", { children: attachments.length === 0 ? (_jsxs("div", { className: "text-center py-12", style: { color: 'var(--text-muted)' }, children: [_jsx("span", { className: "material-symbols-outlined text-4xl mb-2", children: "folder_open" }), _jsx("p", { children: "No attachments" })] })) : (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4", children: attachments.map((att) => {
                                                const isVideo = att.fileName.match(/\.(mp4|webm|mov|avi|wmv)$/i);
                                                return (_jsxs("div", { className: "group cursor-pointer", onClick: () => !isVideo && setSelectedImage(att), children: [_jsx("div", { className: "aspect-square rounded-xl overflow-hidden border-2 transition-all hover:border-violet-400 hover:shadow-lg", style: { borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }, children: isVideo ? (_jsx("video", { src: att.fileUrl, className: "w-full h-full object-cover", controls: true })) : (_jsx("img", { src: att.fileUrl, alt: att.fileName, className: "w-full h-full object-cover group-hover:scale-105 transition-transform" })) }), _jsx("p", { className: "mt-2 text-xs truncate", style: { color: 'var(--text-secondary)' }, children: att.fileName }), att.fileSize && (_jsx("p", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: formatFileSize(att.fileSize) }))] }, att.id));
                                            }) })) })), activeTab === 'related' && (_jsxs("div", { className: "space-y-6", children: [parent && (_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2", style: { color: 'var(--text-muted)' }, children: [_jsx("span", { className: "material-symbols-outlined text-base", children: "arrow_upward" }), "Parent"] }), _jsx(LinkedTicketCard, { ticket: parent })] })), children.length > 0 && (_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2", style: { color: 'var(--text-muted)' }, children: [_jsx("span", { className: "material-symbols-outlined text-base", children: "arrow_downward" }), "Sub-tickets (", children.length, ")"] }), _jsx("div", { className: "space-y-2", children: children.map((child) => (_jsx(LinkedTicketCard, { ticket: child }, child.id))) })] })), links.length > 0 && (_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2", style: { color: 'var(--text-muted)' }, children: [_jsx("span", { className: "material-symbols-outlined text-base", children: "link" }), "Links (", links.length, ")"] }), _jsx("div", { className: "space-y-2", children: links.map((link) => link.ticket && (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-xs font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-700", style: { color: 'var(--text-secondary)' }, children: link.linkType.replace('_', ' ') }), _jsx(LinkedTicketCard, { ticket: link.ticket, compact: true })] }, link.id))) })] })), devTasks.length > 0 && (_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2", style: { color: 'var(--text-muted)' }, children: [_jsx("span", { className: "material-symbols-outlined text-base", children: "code" }), "Dev Tasks (", devTasks.length, ")"] }), _jsx("div", { className: "space-y-2", children: devTasks.map((task) => (_jsxs("div", { className: "flex items-center gap-3 p-3 rounded-xl border hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer group", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }, onClick: () => setSelectedDevTaskId(task.id), children: [_jsx("div", { className: `size-8 rounded-lg flex items-center justify-center shrink-0 ${task.type === 'bug' ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500'}`, children: _jsx("span", { className: "material-symbols-outlined text-lg", children: task.type === 'bug' ? 'bug_report' : 'task_alt' }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline", children: task.issueKey }), _jsx("span", { className: `text-[10px] font-medium px-1.5 py-0.5 rounded uppercase ${task.status === 'done' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                                                                        task.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                                                                            'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`, children: task.status.replace('_', ' ') })] }), _jsx("p", { className: "text-sm truncate", style: { color: 'var(--text-primary)' }, children: task.title })] }), _jsx("span", { className: "material-symbols-outlined text-lg opacity-0 group-hover:opacity-100 transition-opacity", style: { color: 'var(--text-muted)' }, children: "open_in_new" })] }, task.id))) })] })), !parent && children.length === 0 && links.length === 0 && devTasks.length === 0 && (_jsxs("div", { className: "text-center py-12", style: { color: 'var(--text-muted)' }, children: [_jsx("span", { className: "material-symbols-outlined text-4xl mb-2", children: "link_off" }), _jsx("p", { children: "No related tickets" })] }))] }))] }), _jsxs("div", { className: "w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l p-6 space-y-6", style: { borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }, children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: 'var(--text-muted)' }, children: "Status" }), _jsx("select", { value: ticket.status, onChange: (e) => handleStatusChange(e.target.value), className: "w-full px-3 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }, children: Object.entries(statusConfig).map(([key, config]) => (_jsx("option", { value: key, children: key.replace(/_/g, ' ').toUpperCase() }, key))) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide mb-3", style: { color: 'var(--text-muted)' }, children: "Actions" }), _jsxs("div", { className: "space-y-2", children: [ticket.status !== 'closed' && ticket.status !== 'resolved' && ticket.status !== 'cancelled' && onCreateDevTask && (_jsxs("button", { onClick: handleCreateDevTask, className: "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "add_task" }), "Create Dev Task"] })), ticket.status !== 'rebuttal' && ticket.status !== 'closed' && ticket.status !== 'resolved' && (_jsxs("button", { onClick: handleMarkAsRebuttal, className: "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-300 dark:hover:border-rose-700", style: { borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }, children: [_jsx("span", { className: "material-symbols-outlined text-lg text-rose-500", children: "reply" }), "Mark as Rebuttal"] })), ticket.clientId && ticket.status !== 'pending_internal_review' && ticket.status !== 'closed' && (_jsxs("button", { onClick: () => setShowReassignModal(true), className: "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-700", style: { borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }, children: [_jsx("span", { className: "material-symbols-outlined text-lg text-orange-500", children: "undo" }), "Reassign to Internal"] }))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: 'var(--text-muted)' }, children: "Priority" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `size-3 rounded-full ${priorityColors[priority]}` }), _jsxs("span", { className: "font-semibold", style: { color: 'var(--text-primary)' }, children: ["P", priority] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: 'var(--text-muted)' }, children: "Severity" }), _jsxs("span", { className: "font-semibold", style: { color: 'var(--text-primary)' }, children: ["S", ticket.internalSeverity || ticket.clientSeverity || 3] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: 'var(--text-muted)' }, children: "Assignee" }), ticket.assigneeName ? (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold", children: ticket.assigneeName.charAt(0) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", style: { color: 'var(--text-primary)' }, children: ticket.assigneeName }), ticket.assigneeEmail && (_jsx("p", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: ticket.assigneeEmail }))] })] })) : (_jsx("span", { className: "text-sm italic", style: { color: 'var(--text-muted)' }, children: "Unassigned" }))] }), _jsxs("div", { children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: 'var(--text-muted)' }, children: "Reporter" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold", children: (ticket.reporterName || ticket.creatorName || '?').charAt(0) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", style: { color: 'var(--text-primary)' }, children: ticket.reporterName || ticket.creatorName }), (ticket.reporterEmail || ticket.creatorEmail) && (_jsx("p", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: ticket.reporterEmail || ticket.creatorEmail }))] })] })] }), (ticket.storyPoints || ticket.estimate) && (_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [ticket.storyPoints && (_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: 'var(--text-muted)' }, children: "Story Points" }), _jsx("span", { className: "text-lg font-bold", style: { color: 'var(--text-primary)' }, children: ticket.storyPoints })] })), ticket.estimate && (_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: 'var(--text-muted)' }, children: "Estimate" }), _jsx("span", { className: "text-sm font-medium", style: { color: 'var(--text-primary)' }, children: ticket.estimate })] }))] })), ticket.dueDate && (_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: 'var(--text-muted)' }, children: "Due Date" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-lg", style: { color: 'var(--text-secondary)' }, children: "event" }), _jsx("span", { className: "text-sm font-medium", style: { color: 'var(--text-primary)' }, children: formatDate(ticket.dueDate) })] })] })), _jsxs("div", { className: "pt-4 border-t space-y-3", style: { borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex justify-between text-xs", children: [_jsx("span", { style: { color: 'var(--text-muted)' }, children: "Created" }), _jsx("span", { style: { color: 'var(--text-secondary)' }, children: formatDate(ticket.createdAt) })] }), _jsxs("div", { className: "flex justify-between text-xs", children: [_jsx("span", { style: { color: 'var(--text-muted)' }, children: "Updated" }), _jsx("span", { style: { color: 'var(--text-secondary)' }, children: formatDate(ticket.updatedAt) })] }), ticket.beadsId && (_jsxs("div", { className: "flex justify-between text-xs", children: [_jsx("span", { style: { color: 'var(--text-muted)' }, children: "Beads ID" }), _jsx("span", { className: "font-mono", style: { color: 'var(--text-secondary)' }, children: ticket.beadsId })] }))] })] })] })] }), selectedImage && (_jsxs("div", { className: "fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4", onClick: () => setSelectedImage(null), children: [_jsx("button", { className: "absolute top-4 right-4 text-white hover:text-slate-300", onClick: () => setSelectedImage(null), children: _jsx("span", { className: "material-symbols-outlined text-3xl", children: "close" }) }), _jsx("img", { src: selectedImage.fileUrl, alt: selectedImage.fileName, className: "max-w-full max-h-[90vh] object-contain rounded-lg", onClick: (e) => e.stopPropagation() })] })), showReassignModal && (_jsx("div", { className: "fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", onClick: () => {
                    setShowReassignModal(false);
                    setReassignComment('');
                    setReassignError('');
                }, children: _jsxs("div", { className: "w-full max-w-md rounded-2xl shadow-2xl animate-slide-up", style: { backgroundColor: 'var(--bg-card)' }, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "px-6 py-4 border-b flex items-center justify-between", style: { borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-xl text-orange-600 dark:text-orange-400", children: "undo" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold", style: { color: 'var(--text-primary)' }, children: "Reassign to Internal" }), _jsx("p", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: "Send ticket back to client team" })] })] }), _jsx("button", { onClick: () => {
                                        setShowReassignModal(false);
                                        setReassignComment('');
                                        setReassignError('');
                                    }, className: "size-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700", style: { color: 'var(--text-muted)' }, children: _jsx("span", { className: "material-symbols-outlined", children: "close" }) })] }), _jsxs("form", { onSubmit: handleReassignToInternal, className: "p-6 space-y-4", children: [reassignError && (_jsxs("div", { className: "p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "error" }), reassignError] })), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: ["Reason for reassignment ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("textarea", { value: reassignComment, onChange: (e) => setReassignComment(e.target.value), placeholder: "Explain why this ticket is being sent back to the client's internal team...", rows: 4, className: "w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/30", style: {
                                                backgroundColor: 'var(--bg-tertiary)',
                                                borderColor: 'var(--border-primary)',
                                                color: 'var(--text-primary)',
                                            }, required: true }), _jsx("p", { className: "mt-2 text-xs", style: { color: 'var(--text-muted)' }, children: "This comment will be visible to the client and explains why the ticket requires their internal review." })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [_jsx("button", { type: "button", onClick: () => {
                                                setShowReassignModal(false);
                                                setReassignComment('');
                                                setReassignError('');
                                            }, className: "px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700", style: { color: 'var(--text-secondary)' }, children: "Cancel" }), _jsx("button", { type: "submit", disabled: reassigning || !reassignComment.trim(), className: "px-4 py-2.5 rounded-lg text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2", children: reassigning ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "material-symbols-outlined text-lg animate-spin", children: "progress_activity" }), "Reassigning..."] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "undo" }), "Reassign Ticket"] })) })] })] })] }) })), _jsx("style", { children: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(20px) scale(0.98); }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .animate-fade-out { animation: fadeOut 0.2s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        .animate-slide-down { animation: slideDown 0.2s ease-out forwards; }
      ` }), selectedDevTaskId && (_jsx(DevTaskDetailModal, { taskId: selectedDevTaskId, onClose: () => setSelectedDevTaskId(null), onStatusChange: () => {
                    fetchTicket(); // Refresh ticket data to update dev task status in list
                } }))] }));
}
// Helper component for linked tickets
function LinkedTicketCard({ ticket, compact = false }) {
    const tConfig = typeConfig[ticket.type] || typeConfig.support;
    const sConfig = statusConfig[ticket.status] || statusConfig.open;
    return (_jsxs("div", { className: `flex items-center gap-3 p-3 rounded-xl border transition-colors hover:border-violet-300 dark:hover:border-violet-600 cursor-pointer ${compact ? 'flex-1' : ''}`, style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("span", { className: `material-symbols-outlined text-lg ${tConfig.color}`, children: tConfig.icon }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-mono font-semibold text-violet-600 dark:text-violet-400", children: ticket.issueKey }), _jsx("span", { className: `px-1.5 py-0.5 rounded text-[10px] font-medium ${sConfig.bg} ${sConfig.color}`, children: ticket.status.replace('_', ' ') })] }), !compact && (_jsx("p", { className: "text-sm truncate mt-0.5", style: { color: 'var(--text-secondary)' }, children: ticket.title }))] })] }));
}
