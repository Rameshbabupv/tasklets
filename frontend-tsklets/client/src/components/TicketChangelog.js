import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/auth';
// Configuration for each change type
const changeConfig = {
    created: {
        icon: 'add_circle',
        label: 'Created',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        iconBg: 'bg-emerald-500',
    },
    status_changed: {
        icon: 'swap_horiz',
        label: 'Status',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        textColor: 'text-blue-700 dark:text-blue-300',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconBg: 'bg-blue-500',
    },
    priority_changed: {
        icon: 'priority_high',
        label: 'Priority',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        textColor: 'text-amber-700 dark:text-amber-300',
        borderColor: 'border-amber-200 dark:border-amber-800',
        iconBg: 'bg-amber-500',
    },
    severity_changed: {
        icon: 'warning',
        label: 'Severity',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        textColor: 'text-orange-700 dark:text-orange-300',
        borderColor: 'border-orange-200 dark:border-orange-800',
        iconBg: 'bg-orange-500',
    },
    comment_added: {
        icon: 'chat_bubble',
        label: 'Comment',
        bgColor: 'bg-slate-50 dark:bg-slate-800/50',
        textColor: 'text-slate-700 dark:text-slate-300',
        borderColor: 'border-slate-200 dark:border-slate-700',
        iconBg: 'bg-slate-500',
    },
    attachment_added: {
        icon: 'attach_file',
        label: 'Attachment',
        bgColor: 'bg-violet-50 dark:bg-violet-900/20',
        textColor: 'text-violet-700 dark:text-violet-300',
        borderColor: 'border-violet-200 dark:border-violet-800',
        iconBg: 'bg-violet-500',
    },
    watcher_added: {
        icon: 'visibility',
        label: 'Watcher Added',
        bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
        textColor: 'text-cyan-700 dark:text-cyan-300',
        borderColor: 'border-cyan-200 dark:border-cyan-800',
        iconBg: 'bg-cyan-500',
    },
    watcher_removed: {
        icon: 'visibility_off',
        label: 'Watcher Removed',
        bgColor: 'bg-slate-50 dark:bg-slate-800/50',
        textColor: 'text-slate-600 dark:text-slate-400',
        borderColor: 'border-slate-200 dark:border-slate-700',
        iconBg: 'bg-slate-400',
    },
    escalated: {
        icon: 'local_fire_department',
        label: 'Escalated',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        textColor: 'text-red-700 dark:text-red-300',
        borderColor: 'border-red-200 dark:border-red-800',
        iconBg: 'bg-gradient-to-br from-red-500 to-orange-500',
    },
    assigned: {
        icon: 'person_add',
        label: 'Assigned',
        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
        textColor: 'text-indigo-700 dark:text-indigo-300',
        borderColor: 'border-indigo-200 dark:border-indigo-800',
        iconBg: 'bg-indigo-500',
    },
    pushed_to_systech: {
        icon: 'send',
        label: 'Pushed to Systech',
        bgColor: 'bg-sky-50 dark:bg-sky-900/20',
        textColor: 'text-sky-700 dark:text-sky-300',
        borderColor: 'border-sky-200 dark:border-sky-800',
        iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600',
    },
    resolved: {
        icon: 'check_circle',
        label: 'Resolved',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        iconBg: 'bg-emerald-500',
    },
    reopened: {
        icon: 'refresh',
        label: 'Reopened',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        textColor: 'text-amber-700 dark:text-amber-300',
        borderColor: 'border-amber-200 dark:border-amber-800',
        iconBg: 'bg-amber-500',
    },
};
// Format status for display
function formatStatus(status) {
    return status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}
// Format priority for display
function formatPriority(priority) {
    const p = typeof priority === 'string' ? parseInt(priority) : priority;
    const labels = {
        1: 'P1 - Critical',
        2: 'P2 - High',
        3: 'P3 - Medium',
        4: 'P4 - Low',
    };
    return labels[p] || `P${p}`;
}
// Relative time formatting
function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    if (diffSecs < 60)
        return 'Just now';
    if (diffMins < 60)
        return `${diffMins}m ago`;
    if (diffHours < 24)
        return `${diffHours}h ago`;
    if (diffDays < 7)
        return `${diffDays}d ago`;
    if (diffWeeks < 4)
        return `${diffWeeks}w ago`;
    return `${diffMonths}mo ago`;
}
// Full date formatting
function getFullDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
// Get initials from name
function getInitials(name) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
// Generate a consistent color from a string (for avatars)
function stringToColor(str) {
    const colors = [
        'bg-rose-500',
        'bg-pink-500',
        'bg-fuchsia-500',
        'bg-purple-500',
        'bg-violet-500',
        'bg-indigo-500',
        'bg-blue-500',
        'bg-sky-500',
        'bg-cyan-500',
        'bg-teal-500',
        'bg-emerald-500',
        'bg-green-500',
        'bg-lime-500',
        'bg-amber-500',
        'bg-orange-500',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}
// Build the change description
function getChangeDescription(entry) {
    const config = changeConfig[entry.changeType];
    switch (entry.changeType) {
        case 'created':
            return _jsx("span", { children: "created this ticket" });
        case 'status_changed':
            return (_jsxs("span", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { children: "changed status from" }), _jsx("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-xs font-medium line-through opacity-70", children: formatStatus(entry.oldValue || '') }), _jsx("span", { className: "material-symbols-outlined text-sm text-slate-400", children: "arrow_forward" }), _jsx("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold", children: formatStatus(entry.newValue || '') })] }));
        case 'priority_changed':
            return (_jsxs("span", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { children: "changed priority from" }), _jsx("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-xs font-medium line-through opacity-70", children: formatPriority(entry.oldValue || '') }), _jsx("span", { className: "material-symbols-outlined text-sm text-slate-400", children: "arrow_forward" }), _jsx("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-semibold", children: formatPriority(entry.newValue || '') })] }));
        case 'severity_changed':
            return (_jsxs("span", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { children: "changed severity from" }), _jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-xs font-medium line-through opacity-70", children: ["S", entry.oldValue] }), _jsx("span", { className: "material-symbols-outlined text-sm text-slate-400", children: "arrow_forward" }), _jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-xs font-semibold", children: ["S", entry.newValue] })] }));
        case 'comment_added':
            return (_jsxs("span", { className: "flex flex-col gap-1", children: [_jsx("span", { children: "added a comment" }), entry.metadata?.preview && (_jsxs("span", { className: "text-xs text-slate-500 dark:text-slate-400 italic truncate max-w-xs", children: ["\"", entry.metadata.preview, "\""] }))] }));
        case 'attachment_added':
            return (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("span", { children: "added an attachment" }), entry.metadata?.fileName && (_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-medium", children: [_jsx("span", { className: "material-symbols-outlined text-xs", children: "description" }), entry.metadata.fileName] }))] }));
        case 'watcher_added':
            return (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("span", { children: "added" }), _jsx("span", { className: "font-semibold", children: entry.newValue }), _jsx("span", { children: "as a watcher" })] }));
        case 'watcher_removed':
            return (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("span", { children: "removed" }), _jsx("span", { className: "font-semibold", children: entry.oldValue }), _jsx("span", { children: "from watchers" })] }));
        case 'escalated':
            return (_jsxs("span", { className: "flex flex-col gap-1", children: [_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("span", { children: "escalated this ticket" }), entry.metadata?.reason && (_jsx("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold", children: entry.metadata.reason.replace(/_/g, ' ') }))] }), entry.metadata?.note && (_jsxs("span", { className: "text-xs text-slate-500 dark:text-slate-400 italic", children: ["Note: ", entry.metadata.note] }))] }));
        case 'assigned':
            return (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("span", { children: "assigned ticket to" }), _jsx("span", { className: "font-semibold", children: entry.newValue })] }));
        case 'pushed_to_systech':
            return _jsx("span", { children: "pushed this ticket to Systech" });
        case 'resolved':
            return (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("span", { children: "resolved this ticket" }), entry.metadata?.resolution && (_jsx("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium", children: entry.metadata.resolution.replace(/_/g, ' ') }))] }));
        case 'reopened':
            return _jsx("span", { children: "reopened this ticket" });
        default:
            return _jsx("span", { children: "made a change" });
    }
}
export default function TicketChangelog({ ticketId, className = '' }) {
    const { token } = useAuthStore();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hideComments, setHideComments] = useState(true);
    useEffect(() => {
        fetchChangelog();
    }, [ticketId]);
    const fetchChangelog = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/tickets/${ticketId}/changelog`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok)
                throw new Error('Failed to fetch changelog');
            const data = await res.json();
            setEntries(data.changelog || []);
        }
        catch (err) {
            setError(err.message || 'Failed to load changelog');
            // For demo, set mock data
            setEntries(getMockData());
        }
        finally {
            setLoading(false);
        }
    };
    // Filter entries based on hideComments checkbox
    const filteredEntries = hideComments
        ? entries.filter(e => e.changeType !== 'comment_added')
        : entries;
    const commentCount = entries.filter(e => e.changeType === 'comment_added').length;
    if (loading) {
        return (_jsx("div", { className: `flex items-center justify-center py-16 ${className}`, children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-12 h-12 border-4 border-slate-200 dark:border-slate-700 rounded-full" }), _jsx("div", { className: "absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" })] }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Loading changelog..." })] }) }));
    }
    if (error && entries.length === 0) {
        return (_jsx("div", { className: `flex items-center justify-center py-16 ${className}`, children: _jsxs("div", { className: "flex flex-col items-center gap-4 text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-3xl text-red-500", children: "error" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-900 dark:text-slate-100", children: "Failed to load changelog" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: error })] }), _jsxs("button", { onClick: fetchChangelog, className: "flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "refresh" }), "Try Again"] })] }) }));
    }
    return (_jsxs("div", { className: className, children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800", children: _jsx("span", { className: "material-symbols-outlined text-xl text-slate-600 dark:text-slate-300", children: "history" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-slate-900 dark:text-slate-100", children: "Activity Log" }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: [filteredEntries.length, " ", filteredEntries.length === 1 ? 'entry' : 'entries', hideComments && commentCount > 0 && ` • ${commentCount} comment${commentCount > 1 ? 's' : ''} hidden`] })] })] }), commentCount > 0 && (_jsxs("label", { className: "flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors", children: [_jsx("input", { type: "checkbox", checked: hideComments, onChange: (e) => setHideComments(e.target.checked), className: "w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500/50 cursor-pointer" }), _jsx("span", { className: "text-sm font-medium text-slate-700 dark:text-slate-300 select-none", children: "Hide comments" })] }))] }), filteredEntries.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-center", children: [_jsx("div", { className: "w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4", children: _jsx("span", { className: "material-symbols-outlined text-4xl text-slate-400", children: "inbox" }) }), _jsx("p", { className: "font-semibold text-slate-900 dark:text-slate-100", children: "No activity yet" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: "Changes to this ticket will appear here" })] })) : (_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-slate-300 via-slate-200 to-transparent dark:from-slate-600 dark:via-slate-700" }), _jsx("div", { className: "space-y-1", children: _jsx(AnimatePresence, { mode: "popLayout", children: filteredEntries.map((entry, index) => {
                                const config = changeConfig[entry.changeType];
                                const isFirst = index === 0;
                                const isLast = index === filteredEntries.length - 1;
                                return (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 }, transition: { delay: index * 0.03 }, className: "relative group", children: [_jsx("div", { className: "absolute left-0 top-4 z-10", children: _jsx("div", { className: `w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-slate-900 transition-transform group-hover:scale-110`, children: _jsx("span", { className: "material-symbols-outlined text-lg text-white", children: config.icon }) }) }), _jsxs("div", { className: `ml-14 p-4 rounded-xl border ${config.borderColor} ${config.bgColor} transition-all group-hover:shadow-md`, children: [_jsxs("div", { className: "flex items-start justify-between gap-4 mb-2", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("div", { className: `shrink-0 w-7 h-7 rounded-full ${stringToColor(entry.userName)} flex items-center justify-center text-white text-xs font-bold shadow-sm`, children: getInitials(entry.userName) }), _jsx("span", { className: "font-semibold text-sm text-slate-900 dark:text-slate-100 truncate", children: entry.userName })] }), _jsxs("div", { className: "shrink-0 relative group/time", children: [_jsx("span", { className: "text-xs text-slate-500 dark:text-slate-400 font-medium tabular-nums", children: getRelativeTime(entry.createdAt) }), _jsxs("div", { className: "absolute right-0 top-full mt-1 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover/time:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-xl", children: [getFullDate(entry.createdAt), _jsx("div", { className: "absolute -top-1 right-3 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45" })] })] })] }), _jsx("div", { className: `text-sm ${config.textColor}`, children: getChangeDescription(entry) })] })] }, entry.id));
                            }) }) }), _jsx("div", { className: "relative mt-4 ml-2", children: _jsx("div", { className: "w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center", children: _jsx("div", { className: "w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" }) }) })] }))] }));
}
// Mock data for demo/development
function getMockData() {
    const now = new Date();
    return [
        {
            id: 1,
            ticketId: 'demo',
            changeType: 'created',
            userId: 1,
            userName: 'John Smith',
            createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 2,
            ticketId: 'demo',
            changeType: 'status_changed',
            userId: 2,
            userName: 'Sarah Connor',
            oldValue: 'open',
            newValue: 'in_progress',
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 3,
            ticketId: 'demo',
            changeType: 'attachment_added',
            userId: 1,
            userName: 'John Smith',
            metadata: { fileName: 'screenshot.png' },
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
        },
        {
            id: 4,
            ticketId: 'demo',
            changeType: 'priority_changed',
            userId: 3,
            userName: 'Mike Johnson',
            oldValue: '3',
            newValue: '1',
            createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 5,
            ticketId: 'demo',
            changeType: 'escalated',
            userId: 3,
            userName: 'Mike Johnson',
            metadata: { reason: 'production_down', note: 'Customer operations affected' },
            createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 1800000).toISOString(),
        },
        {
            id: 6,
            ticketId: 'demo',
            changeType: 'comment_added',
            userId: 2,
            userName: 'Sarah Connor',
            metadata: { preview: 'Looking into this issue now...' },
            createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 7,
            ticketId: 'demo',
            changeType: 'watcher_added',
            userId: 3,
            userName: 'Mike Johnson',
            newValue: 'Alice Brown',
            createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 8,
            ticketId: 'demo',
            changeType: 'assigned',
            userId: 2,
            userName: 'Sarah Connor',
            newValue: 'Dev Team Alpha',
            createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 9,
            ticketId: 'demo',
            changeType: 'status_changed',
            userId: 4,
            userName: 'Dev Team Alpha',
            oldValue: 'in_progress',
            newValue: 'resolved',
            createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        },
    ];
}
