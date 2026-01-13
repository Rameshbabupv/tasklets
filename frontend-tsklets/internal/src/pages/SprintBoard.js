import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ItemDetailModal from '../components/ItemDetailModal';
import { useAuthStore } from '../store/auth';
const columns = [
    { key: 'todo', label: 'To Do', color: 'slate', icon: 'radio_button_unchecked' },
    { key: 'in_progress', label: 'In Progress', color: 'blue', icon: 'pending' },
    { key: 'blocked', label: 'Blocked', color: 'red', icon: 'block' },
    { key: 'review', label: 'Review', color: 'amber', icon: 'rate_review' },
    { key: 'done', label: 'Done', color: 'emerald', icon: 'check_circle' },
];
const severityConfig = {
    critical: { label: 'Critical', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    major: { label: 'Major', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    minor: { label: 'Minor', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    trivial: { label: 'Trivial', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
};
const priorityConfig = {
    1: { label: 'P1', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    2: { label: 'P2', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    3: { label: 'P3', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    4: { label: 'P4', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
};
const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13];
export default function SprintBoard() {
    const { id } = useParams();
    const [sprint, setSprint] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [burndownData, setBurndownData] = useState(null);
    const [showBurndown, setShowBurndown] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingPoints, setEditingPoints] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);
    const { token } = useAuthStore();
    const surfaceStyles = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' };
    const textPrimary = { color: 'var(--text-primary)' };
    const textSecondary = { color: 'var(--text-secondary)' };
    const textMuted = { color: 'var(--text-muted)' };
    useEffect(() => {
        if (id)
            fetchSprintData();
    }, [id]);
    const fetchSprintData = async () => {
        try {
            const [sprintRes, burndownRes] = await Promise.all([
                fetch(`/api/sprints/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`/api/sprints/${id}/burndown`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const data = await sprintRes.json();
            const burndown = await burndownRes.json();
            setSprint(data.sprint);
            setTasks(data.tasks || []);
            setAssignments(data.assignments || []);
            setBurndownData(burndown);
        }
        catch (err) {
            console.error('Failed to fetch sprint', err);
        }
        finally {
            setLoading(false);
        }
    };
    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            fetchSprintData();
        }
        catch (err) {
            console.error('Failed to update task', err);
        }
    };
    const updateStoryPoints = async (taskId, points) => {
        try {
            await fetch(`/api/tasks/${taskId}/points`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ storyPoints: points }),
            });
            setEditingPoints(null);
            fetchSprintData();
        }
        catch (err) {
            console.error('Failed to update points', err);
        }
    };
    const moveToBacklog = async (taskId) => {
        try {
            await fetch(`/api/tasks/${taskId}/sprint`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ sprintId: null }),
            });
            fetchSprintData();
        }
        catch (err) {
            console.error('Failed to move task', err);
        }
    };
    // Filter tasks by search
    const filteredTasks = searchQuery
        ? tasks.filter((t) => {
            const query = searchQuery.toLowerCase();
            return t.title.toLowerCase().includes(query) || t.description?.toLowerCase().includes(query);
        })
        : tasks;
    const getColumnTasks = (status) => filteredTasks.filter((t) => t.status === status);
    const getColumnColor = (color) => {
        const colors = {
            blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
            amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
            emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
            slate: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
            red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        };
        return colors[color] || colors.slate;
    };
    const getCountColor = (color) => {
        const colors = {
            blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
            amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
            emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
            slate: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
            red: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
        };
        return colors[color] || colors.slate;
    };
    const formatDate = (dateStr) => {
        const date = new Date(dateStr + 'T12:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const getDaysRemaining = (endDate) => {
        const end = new Date(endDate + 'T23:59:59');
        const today = new Date();
        const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };
    // Calculate stats
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const remainingPoints = totalPoints - completedPoints;
    if (loading) {
        return (_jsxs("div", { className: "h-screen flex overflow-hidden", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" }), _jsx("p", { className: "mt-4", style: textSecondary, children: "Loading sprint..." })] }) })] }));
    }
    if (!sprint) {
        return (_jsxs("div", { className: "h-screen flex overflow-hidden", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { style: textSecondary, children: "Sprint not found" }), _jsx(Link, { to: "/sprints", className: "text-primary hover:underline mt-2 block", children: "Back to Sprints" })] }) })] }));
    }
    return (_jsxs("div", { className: "h-screen flex overflow-hidden", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsx(Sidebar, {}), _jsxs("main", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsxs("header", { className: "px-6 py-4 border-b shrink-0", style: surfaceStyles, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Link, { to: "/sprints", className: "p-2 hover:bg-primary/10 rounded-lg transition-colors", style: textSecondary, children: _jsx("span", { className: "material-symbols-outlined", children: "arrow_back" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h2", { className: "text-lg font-bold", style: textPrimary, children: sprint.name }), _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${sprint.status === 'active'
                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                    : sprint.status === 'planning'
                                                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`, children: sprint.status })] }), _jsxs("p", { className: "text-sm", style: textSecondary, children: [formatDate(sprint.startDate), " - ", formatDate(sprint.endDate), sprint.status === 'active' && (_jsxs("span", { className: "ml-2 text-green-600 dark:text-green-400 font-medium", children: ["(", getDaysRemaining(sprint.endDate), " days left)"] }))] })] })] }), _jsxs("div", { className: "flex items-center gap-6", children: [_jsxs("div", { className: "relative", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]", style: textMuted, children: "search" }), _jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search tasks...", className: "pl-9 pr-3 py-1.5 rounded-lg border text-sm w-48", style: {
                                                            backgroundColor: 'var(--bg-secondary)',
                                                            borderColor: 'var(--border-primary)',
                                                            color: 'var(--text-primary)',
                                                        } }), searchQuery && (_jsx("button", { onClick: () => setSearchQuery(''), className: "absolute right-2 top-1/2 -translate-y-1/2 text-[16px] hover:text-red-500", style: textMuted, children: _jsx("span", { className: "material-symbols-outlined text-[16px]", children: "close" }) }))] }), _jsx("div", { className: "h-10 w-px", style: { backgroundColor: 'var(--border-primary)' } }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-primary", children: completedPoints }), _jsx("div", { className: "text-xs", style: textSecondary, children: "Completed" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold", style: textPrimary, children: remainingPoints }), _jsx("div", { className: "text-xs", style: textSecondary, children: "Remaining" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold", style: textSecondary, children: totalPoints }), _jsx("div", { className: "text-xs", style: textSecondary, children: "Total Points" })] }), _jsx("div", { className: "h-10 w-px", style: { backgroundColor: 'var(--border-primary)' } }), _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-2xl font-bold", style: textPrimary, children: [filteredTasks.length, searchQuery ? `/${tasks.length}` : ''] }), _jsx("div", { className: "text-xs", style: textSecondary, children: "Tasks" })] })] })] }), sprint.goal && (_jsxs("p", { className: "text-sm mt-2 pl-12", style: textSecondary, children: [_jsx("span", { className: "font-medium", children: "Goal:" }), " ", sprint.goal] })), sprint.status === 'active' && burndownData && burndownData.days.length > 0 && (_jsxs("button", { onClick: () => setShowBurndown(!showBurndown), className: "mt-3 ml-12 flex items-center gap-2 text-sm font-medium text-primary hover:underline", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: showBurndown ? 'expand_less' : 'trending_down' }), showBurndown ? 'Hide Burndown' : 'Show Burndown Chart'] }))] }), showBurndown && burndownData && burndownData.days.length > 0 && (_jsx("div", { className: "px-6 py-4 border-b", style: surfaceStyles, children: _jsxs("div", { className: "rounded-xl border p-4", style: surfaceStyles, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "font-semibold", style: textPrimary, children: "Sprint Burndown" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-0.5 bg-slate-400" }), _jsx("span", { className: "text-xs", style: textSecondary, children: "Ideal" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-1 bg-primary rounded" }), _jsx("span", { className: "text-xs", style: textSecondary, children: "Actual" })] })] })] }), _jsxs("div", { className: "relative h-40", children: [_jsxs("div", { className: "absolute left-0 top-0 h-full flex flex-col justify-between text-xs pr-2", style: textMuted, children: [_jsx("span", { children: burndownData.totalPoints }), _jsx("span", { children: Math.round(burndownData.totalPoints / 2) }), _jsx("span", { children: "0" })] }), _jsxs("div", { className: "ml-8 h-full relative border-l border-b", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("svg", { className: "absolute inset-0 w-full h-full", preserveAspectRatio: "none", children: _jsx("line", { x1: "0", y1: "0", x2: "100%", y2: "100%", stroke: "var(--text-muted)", strokeWidth: "2", strokeDasharray: "5,5" }) }), _jsx("svg", { className: "absolute inset-0 w-full h-full", preserveAspectRatio: "none", children: _jsx("polyline", { fill: "none", stroke: "var(--primary)", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", points: burndownData.days
                                                            .filter(d => d.actual !== null)
                                                            .map((d, i, arr) => {
                                                            const x = (i / Math.max(burndownData.days.length - 1, 1)) * 100;
                                                            const y = 100 - ((d.actual || 0) / Math.max(burndownData.totalPoints, 1)) * 100;
                                                            return `${x}%,${y}%`;
                                                        })
                                                            .join(' ') }) }), burndownData.days
                                                    .filter(d => d.actual !== null)
                                                    .map((d, i, arr) => {
                                                    const x = (i / Math.max(burndownData.days.length - 1, 1)) * 100;
                                                    const y = 100 - ((d.actual || 0) / Math.max(burndownData.totalPoints, 1)) * 100;
                                                    return (_jsx("div", { className: "absolute w-2.5 h-2.5 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 ring-2 ring-white dark:ring-slate-800", style: { left: `${x}%`, top: `${y}%` }, title: `Day ${d.day}: ${d.actual} pts remaining` }, d.day));
                                                })] })] }), _jsx("div", { className: "ml-8 mt-2 flex justify-between text-xs", style: textMuted, children: burndownData.days.filter((_, i) => i === 0 || i === burndownData.days.length - 1 || i % 3 === 0).map((d) => (_jsxs("span", { children: ["Day ", d.day] }, d.day))) })] }) })), _jsx("div", { className: "flex-1 overflow-auto p-6", children: _jsx("div", { className: "flex gap-4 h-full min-w-max", children: columns.map((column) => {
                                const columnTasks = getColumnTasks(column.key);
                                const columnPoints = columnTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
                                return (_jsxs("div", { className: "flex flex-col w-80 shrink-0", children: [_jsxs("div", { className: `px-4 py-3 rounded-t-xl border-2 ${getColumnColor(column.color)} flex items-center justify-between`, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", style: textPrimary, children: column.icon }), _jsx("span", { className: "font-bold text-sm", style: textPrimary, children: column.label })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-bold ${getCountColor(column.color)}`, children: columnTasks.length }), _jsxs("span", { className: "text-xs font-medium", style: textSecondary, children: [columnPoints, " pts"] })] })] }), _jsxs("div", { className: `flex-1 border-2 border-t-0 rounded-b-xl p-3 ${getColumnColor(column.color)} space-y-3 overflow-y-auto`, children: [columnTasks.map((task) => {
                                                    const pConfig = priorityConfig[task.priority] || priorityConfig[3];
                                                    return (_jsxs("div", { className: "rounded-lg border p-4 hover:shadow-md transition-shadow group", style: surfaceStyles, children: [_jsx("div", { className: "flex items-start justify-between mb-2", children: _jsxs("div", { className: "flex items-center gap-2 flex-1", children: [task.type === 'bug' && (_jsx("span", { className: "material-symbols-outlined text-red-500 text-[18px]", children: "bug_report" })), _jsx("button", { onClick: (e) => { e.stopPropagation(); setSelectedTask(task); }, className: "font-semibold text-sm line-clamp-2 text-left hover:text-primary hover:underline transition-colors", style: textPrimary, children: task.title })] }) }), task.description && (_jsx("p", { className: "text-xs line-clamp-2 mb-3", style: textSecondary, children: task.description })), _jsxs("div", { className: "flex items-center gap-2 flex-wrap mb-3", children: [_jsx("span", { className: `px-2 py-0.5 rounded text-xs font-bold ${pConfig.className}`, children: pConfig.label }), task.type === 'bug' && task.severity && (_jsx("span", { className: `px-2 py-0.5 rounded text-xs font-bold ${severityConfig[task.severity]?.className || ''}`, children: task.severity })), editingPoints === task.id ? (_jsxs("div", { className: "flex gap-1", children: [FIBONACCI_POINTS.map(p => (_jsx("button", { onClick: () => updateStoryPoints(task.id, p), className: `w-6 h-6 rounded text-xs font-bold transition-colors ${task.storyPoints === p
                                                                                    ? 'bg-primary text-white'
                                                                                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-primary/20'}`, style: task.storyPoints !== p ? textSecondary : {}, children: p }, p))), _jsx("button", { onClick: () => setEditingPoints(null), className: "w-6 h-6 rounded text-xs hover:bg-red-100 dark:hover:bg-red-900/30", style: textSecondary, children: "\u2715" })] })) : (_jsx("button", { onClick: () => setEditingPoints(task.id), className: "px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors", children: task.storyPoints ? `${task.storyPoints} pts` : '? pts' })), task.estimate && (_jsxs("span", { className: "px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300", children: [task.estimate, "h"] })), task.dueDate && (_jsxs("span", { className: `px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${new Date(task.dueDate) < new Date()
                                                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`, children: [_jsx("span", { className: "material-symbols-outlined text-[12px]", children: "event" }), new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] }))] }), task.labels && task.labels.length > 0 && (_jsxs("div", { className: "flex flex-wrap gap-1 mb-3", children: [task.labels.slice(0, 3).map((label) => (_jsx("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", children: label }, label))), task.labels.length > 3 && (_jsxs("span", { className: "text-[10px]", style: textMuted, children: ["+", task.labels.length - 3] }))] })), task.status === 'blocked' && task.blockedReason && (_jsx("div", { className: "mb-3 p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800", children: _jsx("p", { className: "text-xs text-red-600 dark:text-red-400 line-clamp-2", children: task.blockedReason }) })), _jsxs("div", { className: "flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [column.key !== 'todo' && (_jsx("button", { onClick: () => {
                                                                            const currentIndex = columns.findIndex(c => c.key === column.key);
                                                                            if (currentIndex > 0) {
                                                                                updateTaskStatus(task.id, columns[currentIndex - 1].key);
                                                                            }
                                                                        }, className: "flex-1 px-2 py-1.5 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors", style: { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }, children: _jsx("span", { className: "material-symbols-outlined text-[16px]", children: "chevron_left" }) })), column.key !== 'done' && (_jsx("button", { onClick: () => {
                                                                            const currentIndex = columns.findIndex(c => c.key === column.key);
                                                                            if (currentIndex < columns.length - 1) {
                                                                                updateTaskStatus(task.id, columns[currentIndex + 1].key);
                                                                            }
                                                                        }, className: "flex-1 px-2 py-1.5 text-xs font-medium bg-primary hover:bg-primary/90 rounded text-white flex items-center justify-center gap-1", children: _jsx("span", { className: "material-symbols-outlined text-[16px]", children: "chevron_right" }) })), _jsx("button", { onClick: () => moveToBacklog(task.id), className: "px-2 py-1.5 text-xs rounded transition-colors hover:bg-red-100 dark:hover:bg-red-900/30", style: textSecondary, title: "Move to Backlog", children: _jsx("span", { className: "material-symbols-outlined text-[16px]", children: "remove_circle_outline" }) })] })] }, task.id));
                                                }), columnTasks.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center py-12", style: textSecondary, children: [_jsx("span", { className: "material-symbols-outlined text-4xl opacity-50", children: column.icon }), _jsx("p", { className: "text-sm mt-2", children: "No tasks" })] }))] })] }, column.key));
                            }) }) })] }), selectedTask && (_jsx(ItemDetailModal, { item: selectedTask, itemType: "task", onClose: () => setSelectedTask(null) }))] }));
}
