import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ItemDetailModal from '../components/ItemDetailModal';
import { useAuthStore } from '../store/auth';
const priorityConfig = {
    1: { label: 'P1 - Critical', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', bg: 'border-l-red-500' },
    2: { label: 'P2 - High', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', bg: 'border-l-amber-500' },
    3: { label: 'P3 - Medium', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', bg: 'border-l-blue-500' },
    4: { label: 'P4 - Low', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', bg: 'border-l-slate-400' },
};
const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13];
export default function Backlog() {
    const [tasks, setTasks] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPoints, setEditingPoints] = useState(null);
    const [addingToSprint, setAddingToSprint] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterPoints, setFilterPoints] = useState('all');
    const [filterPriority, setFilterPriority] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const { token } = useAuthStore();
    const surfaceStyles = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' };
    const textPrimary = { color: 'var(--text-primary)' };
    const textSecondary = { color: 'var(--text-secondary)' };
    const textMuted = { color: 'var(--text-muted)' };
    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        try {
            const [backlogRes, sprintsRes] = await Promise.all([
                fetch('/api/sprints/backlog/tasks', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch('/api/sprints?status=planning', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);
            const backlogData = await backlogRes.json();
            const sprintsData = await sprintsRes.json();
            setTasks(backlogData.tasks || []);
            // Get planning + active sprints for assignment
            const allSprintsRes = await fetch('/api/sprints', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const allSprintsData = await allSprintsRes.json();
            const availableSprints = (allSprintsData.sprints || []).filter((s) => s.status === 'planning' || s.status === 'active');
            setSprints(availableSprints);
        }
        catch (err) {
            console.error('Failed to fetch backlog', err);
        }
        finally {
            setLoading(false);
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
            fetchData();
        }
        catch (err) {
            console.error('Failed to update points', err);
        }
    };
    const addToSprint = async (taskId, sprintId) => {
        try {
            await fetch(`/api/tasks/${taskId}/sprint`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ sprintId }),
            });
            setAddingToSprint(null);
            fetchData();
        }
        catch (err) {
            console.error('Failed to add to sprint', err);
        }
    };
    // Filter tasks
    const filteredTasks = tasks.filter((task) => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesTitle = task.title.toLowerCase().includes(query);
            const matchesDesc = task.description?.toLowerCase().includes(query);
            if (!matchesTitle && !matchesDesc)
                return false;
        }
        // Type filter
        if (filterType !== 'all' && task.type !== filterType)
            return false;
        // Points filter
        if (filterPoints === 'estimated' && !task.storyPoints)
            return false;
        if (filterPoints === 'unestimated' && task.storyPoints)
            return false;
        // Priority filter
        if (filterPriority !== null && task.priority !== filterPriority)
            return false;
        return true;
    });
    // Group filtered tasks by priority
    const groupedTasks = filteredTasks.reduce((acc, task) => {
        const priority = task.priority || 3;
        if (!acc[priority])
            acc[priority] = [];
        acc[priority].push(task);
        return acc;
    }, {});
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const unestimatedCount = tasks.filter(t => !t.storyPoints).length;
    const hasActiveFilters = searchQuery || filterType !== 'all' || filterPoints !== 'all' || filterPriority !== null;
    const clearFilters = () => {
        setSearchQuery('');
        setFilterType('all');
        setFilterPoints('all');
        setFilterPriority(null);
    };
    if (loading) {
        return (_jsxs("div", { className: "h-screen flex overflow-hidden", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" }), _jsx("p", { className: "mt-4", style: textSecondary, children: "Loading backlog..." })] }) })] }));
    }
    return (_jsxs("div", { className: "h-screen flex overflow-hidden", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsx(Sidebar, {}), _jsxs("main", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsxs("header", { className: "px-6 py-4 border-b shrink-0", style: surfaceStyles, children: [_jsx("div", { className: "flex items-center justify-between mb-3", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("h2", { className: "text-lg font-bold", style: textPrimary, children: "Product Backlog" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { className: "text-sm px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium", children: [filteredTasks.length, hasActiveFilters ? `/${tasks.length}` : '', " items"] }), _jsxs("span", { className: "text-sm px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-medium", children: [totalPoints, " pts"] }), unestimatedCount > 0 && (_jsxs("span", { className: "text-sm px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium", children: [unestimatedCount, " unestimated"] }))] })] }) }), _jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsxs("div", { className: "relative", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]", style: textMuted, children: "search" }), _jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search tasks...", className: "pl-9 pr-3 py-1.5 rounded-lg border text-sm w-64", style: {
                                                    backgroundColor: 'var(--bg-secondary)',
                                                    borderColor: 'var(--border-primary)',
                                                    color: 'var(--text-primary)',
                                                } })] }), _jsx("div", { className: "flex items-center rounded-lg border overflow-hidden", style: { borderColor: 'var(--border-primary)' }, children: ['all', 'task', 'bug'].map((type) => (_jsx("button", { onClick: () => setFilterType(type), className: `px-3 py-1.5 text-xs font-medium transition-colors ${filterType === type
                                                ? 'bg-primary text-white'
                                                : ''}`, style: filterType !== type ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' } : {}, children: type === 'all' ? 'All' : type === 'task' ? 'Tasks' : 'Bugs' }, type))) }), _jsx("div", { className: "flex items-center rounded-lg border overflow-hidden", style: { borderColor: 'var(--border-primary)' }, children: ['all', 'estimated', 'unestimated'].map((pts) => (_jsx("button", { onClick: () => setFilterPoints(pts), className: `px-3 py-1.5 text-xs font-medium transition-colors ${filterPoints === pts
                                                ? 'bg-primary text-white'
                                                : ''}`, style: filterPoints !== pts ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' } : {}, children: pts === 'all' ? 'All Points' : pts === 'estimated' ? 'Estimated' : 'Unestimated' }, pts))) }), _jsx("div", { className: "flex items-center gap-1", children: [1, 2, 3, 4].map((p) => (_jsxs("button", { onClick: () => setFilterPriority(filterPriority === p ? null : p), className: `px-2 py-1 rounded text-xs font-bold transition-colors ${filterPriority === p
                                                ? priorityConfig[p].className + ' ring-2 ring-primary'
                                                : priorityConfig[p].className + ' opacity-50 hover:opacity-100'}`, children: ["P", p] }, p))) }), hasActiveFilters && (_jsxs("button", { onClick: clearFilters, className: "px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[16px]", children: "close" }), "Clear"] }))] })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: tasks.length === 0 ? (_jsx("div", { className: "text-center py-12", style: textMuted, children: "Backlog is empty. All tasks are assigned to sprints." })) : filteredTasks.length === 0 ? (_jsxs("div", { className: "text-center py-12", style: textMuted, children: [_jsx("span", { className: "material-symbols-outlined text-4xl mb-2 block opacity-50", children: "filter_list_off" }), "No tasks match your filters.", _jsx("button", { onClick: clearFilters, className: "text-primary hover:underline ml-1", children: "Clear filters" })] })) : (_jsx("div", { className: "space-y-6", children: [1, 2, 3, 4].map((priority) => {
                                const priorityTasks = groupedTasks[priority] || [];
                                if (priorityTasks.length === 0)
                                    return null;
                                const pConfig = priorityConfig[priority];
                                const priorityPoints = priorityTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
                                return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("span", { className: `px-3 py-1 rounded-lg text-sm font-semibold ${pConfig.className}`, children: pConfig.label }), _jsxs("span", { className: "text-sm", style: textSecondary, children: [priorityTasks.length, " tasks \u00B7 ", priorityPoints, " pts"] })] }), _jsx("div", { className: "space-y-2", children: priorityTasks.map((task) => (_jsx("div", { className: `rounded-lg border-l-4 ${pConfig.bg} p-4 hover:shadow-md transition-shadow group`, style: surfaceStyles, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [task.type === 'bug' && (_jsx("span", { className: "material-symbols-outlined text-red-500 text-[18px]", children: "bug_report" })), _jsx("button", { onClick: () => setSelectedTask(task), className: "font-semibold text-sm truncate text-left hover:text-primary hover:underline transition-colors", style: textPrimary, children: task.title })] }), task.description && (_jsx("p", { className: "text-xs line-clamp-1", style: textSecondary, children: task.description }))] }), _jsxs("div", { className: "flex items-center gap-2 ml-4 shrink-0", children: [editingPoints === task.id ? (_jsxs("div", { className: "flex gap-1", children: [FIBONACCI_POINTS.map(p => (_jsx("button", { onClick: () => updateStoryPoints(task.id, p), className: `w-7 h-7 rounded text-xs font-bold transition-colors ${task.storyPoints === p
                                                                                ? 'bg-primary text-white'
                                                                                : 'bg-slate-100 dark:bg-slate-700 hover:bg-primary/20'}`, style: task.storyPoints !== p ? textSecondary : {}, children: p }, p))), _jsx("button", { onClick: () => setEditingPoints(null), className: "w-7 h-7 rounded text-xs hover:bg-red-100 dark:hover:bg-red-900/30", style: textSecondary, children: "\u2715" })] })) : (_jsx("button", { onClick: () => setEditingPoints(task.id), className: `px-3 py-1 rounded text-xs font-bold transition-colors ${task.storyPoints
                                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'} hover:opacity-80`, children: task.storyPoints ? `${task.storyPoints} pts` : '? pts' })), addingToSprint === task.id ? (_jsxs("div", { className: "flex items-center gap-1", children: [sprints.length === 0 ? (_jsx("span", { className: "text-xs", style: textMuted, children: "No sprints available" })) : (sprints.map(sprint => (_jsx("button", { onClick: () => addToSprint(task.id, sprint.id), className: `px-2 py-1 rounded text-xs font-medium transition-colors ${sprint.status === 'active'
                                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                                                                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200'}`, children: sprint.name }, sprint.id)))), _jsx("button", { onClick: () => setAddingToSprint(null), className: "w-6 h-6 rounded text-xs hover:bg-red-100 dark:hover:bg-red-900/30", style: textSecondary, children: "\u2715" })] })) : (_jsx("button", { onClick: () => setAddingToSprint(task.id), className: "px-3 py-1 rounded text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors opacity-0 group-hover:opacity-100", children: "+ Sprint" }))] })] }) }, task.id))) })] }, priority));
                            }) })) })] }), selectedTask && (_jsx(ItemDetailModal, { item: selectedTask, itemType: "task", onClose: () => setSelectedTask(null) }))] }));
}
