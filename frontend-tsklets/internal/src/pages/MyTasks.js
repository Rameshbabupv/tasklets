import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ItemDetailModal from '../components/ItemDetailModal';
import { useAuthStore } from '../store/auth';
const columns = [
    { key: 'todo', label: 'To Do', color: 'slate', icon: 'radio_button_unchecked' },
    { key: 'in_progress', label: 'In Progress', color: 'blue', icon: 'pending' },
    { key: 'review', label: 'Review', color: 'amber', icon: 'rate_review' },
    { key: 'done', label: 'Done', color: 'emerald', icon: 'check_circle' },
];
const priorityConfig = {
    1: { label: 'P1', className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
    2: { label: 'P2', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
    3: { label: 'P3', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
    4: { label: 'P4', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' },
};
export default function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const { token } = useAuthStore();
    useEffect(() => {
        fetchMyTasks();
    }, []);
    const fetchMyTasks = async () => {
        try {
            const res = await fetch('/api/tasks/my-tasks', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setTasks(data.tasks || []);
        }
        catch (err) {
            console.error('Failed to fetch my tasks', err);
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
            fetchMyTasks();
        }
        catch (err) {
            console.error('Failed to update task', err);
        }
    };
    const getColumnTasks = (status) => tasks.filter((t) => t.status === status);
    const getColumnColor = (color) => {
        switch (color) {
            case 'blue': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
            case 'amber': return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
            case 'emerald': return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
            default: return 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700';
        }
    };
    const getCountColor = (color) => {
        switch (color) {
            case 'blue': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
            case 'amber': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
            case 'emerald': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
            default: return 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "h-screen flex overflow-hidden bg-background-light", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" }), _jsx("p", { className: "mt-4 text-slate-600", children: "Loading your tasks..." })] }) })] }));
    }
    return (_jsxs("div", { className: "h-screen flex overflow-hidden bg-background-light", children: [_jsx(Sidebar, {}), _jsxs("main", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsx("header", { className: "h-16 px-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20", children: _jsx("span", { className: "material-symbols-outlined text-[20px]", children: "task_alt" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-bold text-slate-900 dark:text-white", children: "My Tasks" }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Your assigned development work" })] })] }), _jsx("div", { className: "h-8 w-px bg-slate-200 dark:bg-slate-700" }), _jsx("div", { className: "flex items-center gap-2", children: _jsxs("span", { className: "text-sm text-slate-600 dark:text-slate-300 font-medium", children: [tasks.length, " total tasks"] }) })] }) }), _jsx("div", { className: "flex-1 overflow-auto p-6", children: _jsx("div", { className: "flex gap-6 h-full", children: columns.map((column) => {
                                const columnTasks = getColumnTasks(column.key);
                                return (_jsxs("div", { className: "flex-1 flex flex-col min-w-80", children: [_jsxs("div", { className: `px-4 py-3 rounded-t-xl border-2 ${getColumnColor(column.color)} flex items-center justify-between`, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-[20px] text-slate-700 dark:text-slate-300", children: column.icon }), _jsx("span", { className: "font-bold text-sm text-slate-900 dark:text-white", children: column.label })] }), _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-bold ${getCountColor(column.color)}`, children: columnTasks.length })] }), _jsxs("div", { className: `flex-1 border-2 border-t-0 rounded-b-xl p-3 ${getColumnColor(column.color)} space-y-3 overflow-y-auto`, children: [columnTasks.map((task) => {
                                                    const pConfig = priorityConfig[task.priority] || priorityConfig[3];
                                                    return (_jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-slate-900/50 transition-shadow cursor-pointer group", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2 flex-1", children: [task.type === 'bug' && (_jsx("span", { className: "material-symbols-outlined text-red-500 dark:text-red-400 text-[18px]", children: "bug_report" })), _jsx("button", { onClick: (e) => { e.stopPropagation(); setSelectedTask(task); }, className: "font-semibold text-sm text-slate-900 dark:text-white line-clamp-2 text-left hover:text-primary dark:hover:text-blue-400 hover:underline transition-colors", children: task.title })] }), _jsx("span", { className: `px-2 py-1 rounded text-xs font-bold border ${pConfig.className} shrink-0 ml-2`, children: pConfig.label })] }), task.description && (_jsx("p", { className: "text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3", children: task.description })), _jsxs("div", { className: "flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity", children: [column.key !== 'todo' && (_jsxs("button", { onClick: () => {
                                                                            const currentIndex = columns.findIndex(c => c.key === column.key);
                                                                            if (currentIndex > 0) {
                                                                                updateTaskStatus(task.id, columns[currentIndex - 1].key);
                                                                            }
                                                                        }, className: "flex-1 px-2 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[16px]", children: "chevron_left" }), "Move Back"] })), column.key !== 'done' && (_jsxs("button", { onClick: () => {
                                                                            const currentIndex = columns.findIndex(c => c.key === column.key);
                                                                            if (currentIndex < columns.length - 1) {
                                                                                updateTaskStatus(task.id, columns[currentIndex + 1].key);
                                                                            }
                                                                        }, className: "flex-1 px-2 py-1.5 text-xs font-medium bg-primary hover:bg-primary/90 rounded text-white flex items-center justify-center gap-1", children: ["Move Forward", _jsx("span", { className: "material-symbols-outlined text-[16px]", children: "chevron_right" })] }))] })] }, task.id));
                                                }), columnTasks.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-slate-400", children: [_jsx("span", { className: "material-symbols-outlined text-4xl", children: column.icon }), _jsx("p", { className: "text-sm mt-2", children: "No tasks" })] }))] })] }, column.key));
                            }) }) })] }), selectedTask && (_jsx(ItemDetailModal, { item: selectedTask, itemType: "task", onClose: () => setSelectedTask(null) }))] }));
}
