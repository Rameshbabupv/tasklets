import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { toast } from 'sonner';
// Status configuration
const statusConfig = {
    todo: { label: 'To Do', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', icon: 'radio_button_unchecked' },
    in_progress: { label: 'In Progress', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', icon: 'pending' },
    review: { label: 'Review', bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', icon: 'rate_review' },
    testing: { label: 'Testing', bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', icon: 'science' },
    blocked: { label: 'Blocked', bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', icon: 'block' },
    done: { label: 'Done', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', icon: 'check_circle' },
};
const priorityConfig = {
    1: { label: 'Critical', short: 'P1', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30' },
    2: { label: 'High', short: 'P2', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30' },
    3: { label: 'Medium', short: 'P3', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
    4: { label: 'Low', short: 'P4', color: 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800' },
};
export default function DevTaskDetailModal({ taskId, onClose, onStatusChange }) {
    const { token } = useAuthStore();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isClosing, setIsClosing] = useState(false);
    const [updating, setUpdating] = useState(false);
    useEffect(() => {
        fetchTask();
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
    }, [taskId]);
    const fetchTask = async () => {
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok)
                throw new Error('Failed to fetch task');
            const data = await res.json();
            setTask(data);
        }
        catch (err) {
            console.error('Failed to fetch task', err);
            toast.error('Failed to load task details');
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
        if (!task)
            return;
        setUpdating(true);
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok)
                throw new Error('Failed to update status');
            setTask({ ...task, status: newStatus });
            toast.success(`Status updated to ${statusConfig[newStatus]?.label || newStatus}`);
            onStatusChange?.();
        }
        catch (err) {
            console.error('Failed to update status', err);
            toast.error('Failed to update status');
        }
        finally {
            setUpdating(false);
        }
    };
    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    return (_jsxs("div", { className: `fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto
        ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`, onClick: handleClose, children: [_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm" }), _jsxs("div", { className: `relative w-full max-w-2xl my-8 rounded-2xl shadow-2xl overflow-hidden
          ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`, style: { backgroundColor: 'var(--bg-card)' }, onClick: (e) => e.stopPropagation(), children: [_jsx("div", { className: `h-1.5 w-full ${task?.type === 'bug'
                            ? 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500'
                            : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500'}` }), loading ? (_jsx("div", { className: "p-12 flex items-center justify-center", children: _jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx("span", { className: "material-symbols-outlined text-3xl animate-spin", style: { color: 'var(--text-muted)' }, children: "progress_activity" }), _jsx("p", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: "Loading task..." })] }) })) : task ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "px-6 py-4 border-b flex items-start justify-between gap-4", style: { borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-start gap-3 min-w-0", children: [_jsx("div", { className: `size-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${task.type === 'bug'
                                                    ? 'bg-gradient-to-br from-red-500 to-rose-500'
                                                    : 'bg-gradient-to-br from-emerald-500 to-teal-500'}`, children: _jsx("span", { className: "material-symbols-outlined text-xl text-white", children: task.type === 'bug' ? 'bug_report' : 'task_alt' }) }), _jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: `text-xs font-mono font-bold px-2 py-0.5 rounded ${task.type === 'bug' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`, children: task.issueKey || `#${task.id}` }), _jsx("span", { className: `text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${priorityConfig[task.priority]?.color || ''}`, children: priorityConfig[task.priority]?.short || `P${task.priority}` })] }), _jsx("h3", { className: "font-bold mt-1 text-lg", style: { color: 'var(--text-primary)' }, children: task.title }), task.productName && (_jsxs("p", { className: "text-xs mt-0.5", style: { color: 'var(--text-muted)' }, children: [task.productCode && _jsx("span", { className: "font-medium", children: task.productCode }), task.productCode && ' • ', task.productName] }))] })] }), _jsx("button", { onClick: handleClose, className: "size-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0", style: { color: 'var(--text-muted)' }, children: _jsx("span", { className: "material-symbols-outlined", children: "close" }) })] }), _jsxs("div", { className: "flex flex-col lg:flex-row", children: [_jsxs("div", { className: "flex-1 p-6 min-w-0 space-y-6", children: [task.description && (_jsxs("div", { children: [_jsx("h4", { className: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: 'var(--text-muted)' }, children: "Description" }), _jsx("p", { className: "text-sm whitespace-pre-wrap", style: { color: 'var(--text-secondary)' }, children: task.description })] })), (task.moduleName || task.componentName || task.addonName) && (_jsxs("div", { children: [_jsx("h4", { className: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: 'var(--text-muted)' }, children: "Location" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [task.moduleName && (_jsxs("span", { className: "text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800", children: [_jsx("span", { className: "material-symbols-outlined text-sm align-text-bottom mr-1", children: "folder" }), task.moduleName] })), task.componentName && (_jsxs("span", { className: "text-xs px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800", children: [_jsx("span", { className: "material-symbols-outlined text-sm align-text-bottom mr-1", children: "widgets" }), task.componentName] })), task.addonName && (_jsxs("span", { className: "text-xs px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800", children: [_jsx("span", { className: "material-symbols-outlined text-sm align-text-bottom mr-1", children: "extension" }), task.addonName] }))] })] })), task.type === 'bug' && (task.severity || task.environment) && (_jsxs("div", { children: [_jsx("h4", { className: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: 'var(--text-muted)' }, children: "Bug Details" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [task.severity && (_jsxs("span", { className: `text-xs px-2 py-1 rounded-lg border ${task.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' :
                                                                    task.severity === 'major' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' :
                                                                        'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`, children: ["Severity: ", task.severity] })), task.environment && (_jsxs("span", { className: "text-xs px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700", children: ["Env: ", task.environment] }))] })] })), task.supportTicket && (_jsxs("div", { children: [_jsx("h4", { className: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: 'var(--text-muted)' }, children: "Source Ticket" }), _jsxs("div", { className: "p-3 rounded-xl border flex items-center gap-3", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }, children: [_jsx("div", { className: "size-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 shrink-0", children: _jsx("span", { className: "material-symbols-outlined text-lg", children: "support_agent" }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-mono font-bold text-orange-600 dark:text-orange-400", children: task.supportTicket.issueKey }), _jsx("span", { className: `text-[10px] font-medium px-1.5 py-0.5 rounded uppercase ${task.supportTicket.status === 'resolved' || task.supportTicket.status === 'closed'
                                                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`, children: task.supportTicket.status.replace('_', ' ') })] }), _jsx("p", { className: "text-sm truncate", style: { color: 'var(--text-primary)' }, children: task.supportTicket.title })] })] })] })), task.status === 'blocked' && task.blockedReason && (_jsx("div", { className: "p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-red-500", children: "block" }), _jsxs("div", { children: [_jsx("h4", { className: "text-xs font-semibold text-red-700 dark:text-red-300 mb-1", children: "Blocked Reason" }), _jsx("p", { className: "text-sm text-red-600 dark:text-red-400", children: task.blockedReason })] })] }) }))] }), _jsxs("div", { className: "w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l p-6 space-y-5", style: { borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }, children: [_jsxs("div", { children: [_jsx("h4", { className: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: 'var(--text-muted)' }, children: "Status" }), _jsx("select", { value: task.status, onChange: (e) => handleStatusChange(e.target.value), disabled: updating, className: "w-full px-3 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }, children: Object.entries(statusConfig).map(([key, config]) => (_jsx("option", { value: key, children: config.label }, key))) })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-xs font-semibold uppercase tracking-wide mb-3", style: { color: 'var(--text-muted)' }, children: "Team" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "size-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0", children: _jsx("span", { className: "material-symbols-outlined text-sm", children: "architecture" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-[10px] uppercase font-medium", style: { color: 'var(--text-muted)' }, children: "Implementor" }), _jsx("p", { className: "text-xs font-medium truncate", style: { color: 'var(--text-primary)' }, children: task.implementorName || _jsx("span", { style: { color: 'var(--text-muted)' }, children: "Unassigned" }) })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "size-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0", children: _jsx("span", { className: "material-symbols-outlined text-sm", children: "code" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-[10px] uppercase font-medium", style: { color: 'var(--text-muted)' }, children: "Developer" }), _jsx("p", { className: "text-xs font-medium truncate", style: { color: 'var(--text-primary)' }, children: task.developerName || _jsx("span", { style: { color: 'var(--text-muted)' }, children: "Unassigned" }) })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "size-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0", children: _jsx("span", { className: "material-symbols-outlined text-sm", children: "bug_report" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-[10px] uppercase font-medium", style: { color: 'var(--text-muted)' }, children: "Tester" }), _jsx("p", { className: "text-xs font-medium truncate", style: { color: 'var(--text-primary)' }, children: task.testerName || _jsx("span", { style: { color: 'var(--text-muted)' }, children: "Unassigned" }) })] })] })] })] }), task.storyPoints !== null && (_jsxs("div", { children: [_jsx("h4", { className: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: 'var(--text-muted)' }, children: "Story Points" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-lg text-indigo-500", children: "speed" }), _jsx("span", { className: "text-sm font-semibold", style: { color: 'var(--text-primary)' }, children: task.storyPoints })] })] })), task.labels && task.labels.length > 0 && (_jsxs("div", { children: [_jsx("h4", { className: "text-xs font-semibold uppercase tracking-wide mb-2", style: { color: 'var(--text-muted)' }, children: "Labels" }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: task.labels.map((label, i) => (_jsx("span", { className: "text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700", style: { color: 'var(--text-secondary)' }, children: label }, i))) })] })), _jsx("div", { className: "pt-3 border-t", style: { borderColor: 'var(--border-primary)' }, children: _jsxs("div", { className: "space-y-1 text-xs", style: { color: 'var(--text-muted)' }, children: [_jsxs("p", { children: ["Created: ", formatDate(task.createdAt)] }), _jsxs("p", { children: ["Updated: ", formatDate(task.updatedAt)] })] }) })] })] })] })) : (_jsxs("div", { className: "p-12 text-center", children: [_jsx("span", { className: "material-symbols-outlined text-4xl mb-2", style: { color: 'var(--text-muted)' }, children: "error" }), _jsx("p", { style: { color: 'var(--text-muted)' }, children: "Task not found" })] }))] }), _jsx("style", { children: `
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
      ` })] }));
}
