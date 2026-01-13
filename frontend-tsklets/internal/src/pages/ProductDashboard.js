import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ItemDetailModal from '../components/ItemDetailModal';
import { useAuthStore } from '../store/auth';
export default function ProductDashboard() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedEpics, setExpandedEpics] = useState(new Set());
    const [expandedFeatures, setExpandedFeatures] = useState(new Set());
    const [developers, setDevelopers] = useState([]);
    // Modal states
    const [showEpicModal, setShowEpicModal] = useState(false);
    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedEpicId, setSelectedEpicId] = useState(null);
    const [selectedFeatureId, setSelectedFeatureId] = useState(null);
    // Form states
    const [epicTitle, setEpicTitle] = useState('');
    const [epicDescription, setEpicDescription] = useState('');
    const [epicPriority, setEpicPriority] = useState(3);
    // New epic fields
    const [epicTargetDate, setEpicTargetDate] = useState('');
    const [epicLabels, setEpicLabels] = useState('');
    const [epicColor, setEpicColor] = useState('');
    const [featureTitle, setFeatureTitle] = useState('');
    const [featureDescription, setFeatureDescription] = useState('');
    const [featurePriority, setFeaturePriority] = useState(3);
    // New feature fields
    const [featureTargetDate, setFeatureTargetDate] = useState('');
    const [featureLabels, setFeatureLabels] = useState('');
    const [featureAcceptanceCriteria, setFeatureAcceptanceCriteria] = useState('');
    const [featureEstimate, setFeatureEstimate] = useState('');
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskType, setTaskType] = useState('task');
    const [taskPriority, setTaskPriority] = useState(3);
    const [selectedDevelopers, setSelectedDevelopers] = useState([]);
    // New task fields
    const [taskEstimate, setTaskEstimate] = useState('');
    const [taskDueDate, setTaskDueDate] = useState('');
    const [taskLabels, setTaskLabels] = useState('');
    // Bug-specific fields
    const [taskSeverity, setTaskSeverity] = useState('major');
    const [taskEnvironment, setTaskEnvironment] = useState('production');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const { token } = useAuthStore();
    useEffect(() => {
        fetchDashboard();
        fetchDevelopers();
    }, [id]);
    const fetchDashboard = async () => {
        try {
            const res = await fetch(`/api/products/${id}/dashboard`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const dashboardData = await res.json();
            setData(dashboardData);
        }
        catch (err) {
            console.error('Failed to fetch dashboard', err);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchDevelopers = async () => {
        try {
            // Fetch users from owner tenant (tenantId=1, assuming SysTech is first)
            const res = await fetch('/api/users/tenant/1', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const users = await res.json();
            const devs = users.filter((u) => u.role === 'developer');
            setDevelopers(devs);
        }
        catch (err) {
            console.error('Failed to fetch developers', err);
        }
    };
    const createEpic = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        // Parse labels from comma-separated string
        const labelsArray = epicLabels.trim()
            ? epicLabels.split(',').map(l => l.trim()).filter(Boolean)
            : undefined;
        try {
            const res = await fetch('/api/epics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    productId: parseInt(id),
                    title: epicTitle,
                    description: epicDescription,
                    priority: epicPriority,
                    // New fields
                    targetDate: epicTargetDate || undefined,
                    labels: labelsArray,
                    color: epicColor || undefined,
                }),
            });
            if (!res.ok)
                throw new Error('Failed to create epic');
            setShowEpicModal(false);
            setEpicTitle('');
            setEpicDescription('');
            setEpicPriority(3);
            setEpicTargetDate('');
            setEpicLabels('');
            setEpicColor('');
            fetchDashboard();
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setSaving(false);
        }
    };
    const createFeature = async (e) => {
        e.preventDefault();
        if (!selectedEpicId)
            return;
        setError('');
        setSaving(true);
        // Parse labels from comma-separated string
        const labelsArray = featureLabels.trim()
            ? featureLabels.split(',').map(l => l.trim()).filter(Boolean)
            : undefined;
        try {
            const res = await fetch('/api/features', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    epicId: selectedEpicId,
                    title: featureTitle,
                    description: featureDescription,
                    priority: featurePriority,
                    // New fields
                    targetDate: featureTargetDate || undefined,
                    labels: labelsArray,
                    acceptanceCriteria: featureAcceptanceCriteria || undefined,
                    estimate: featureEstimate || undefined,
                }),
            });
            if (!res.ok)
                throw new Error('Failed to create feature');
            setShowFeatureModal(false);
            setFeatureTitle('');
            setFeatureDescription('');
            setFeaturePriority(3);
            setFeatureTargetDate('');
            setFeatureLabels('');
            setFeatureAcceptanceCriteria('');
            setFeatureEstimate('');
            setSelectedEpicId(null);
            fetchDashboard();
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setSaving(false);
        }
    };
    const createTask = async (e) => {
        e.preventDefault();
        if (!selectedFeatureId)
            return;
        setError('');
        setSaving(true);
        // Parse labels from comma-separated string
        const labelsArray = taskLabels.trim()
            ? taskLabels.split(',').map(l => l.trim()).filter(Boolean)
            : undefined;
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    featureId: selectedFeatureId,
                    title: taskTitle,
                    description: taskDescription,
                    type: taskType,
                    priority: taskPriority,
                    assignees: selectedDevelopers,
                    // New fields
                    estimate: taskEstimate || undefined,
                    dueDate: taskDueDate || undefined,
                    labels: labelsArray,
                    // Bug-specific
                    ...(taskType === 'bug' && {
                        severity: taskSeverity,
                        environment: taskEnvironment,
                    }),
                }),
            });
            if (!res.ok)
                throw new Error('Failed to create task');
            setShowTaskModal(false);
            setTaskTitle('');
            setTaskDescription('');
            setTaskType('task');
            setTaskPriority(3);
            setSelectedDevelopers([]);
            setTaskEstimate('');
            setTaskDueDate('');
            setTaskLabels('');
            setTaskSeverity('major');
            setTaskEnvironment('production');
            setSelectedFeatureId(null);
            fetchDashboard();
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setSaving(false);
        }
    };
    const openFeatureModal = (epicId) => {
        setSelectedEpicId(epicId);
        setShowFeatureModal(true);
    };
    const openTaskModal = (featureId) => {
        setSelectedFeatureId(featureId);
        setShowTaskModal(true);
    };
    const toggleDeveloper = (devId) => {
        if (selectedDevelopers.includes(devId)) {
            setSelectedDevelopers(selectedDevelopers.filter(id => id !== devId));
        }
        else {
            setSelectedDevelopers([...selectedDevelopers, devId]);
        }
    };
    const toggleEpic = (epicId) => {
        const newSet = new Set(expandedEpics);
        if (newSet.has(epicId)) {
            newSet.delete(epicId);
        }
        else {
            newSet.add(epicId);
        }
        setExpandedEpics(newSet);
    };
    const toggleFeature = (featureId) => {
        const newSet = new Set(expandedFeatures);
        if (newSet.has(featureId)) {
            newSet.delete(featureId);
        }
        else {
            newSet.add(featureId);
        }
        setExpandedFeatures(newSet);
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'backlog': return 'bg-slate-100 text-slate-700';
            case 'planned': return 'bg-blue-100 text-blue-700';
            case 'in_progress': return 'bg-indigo-100 text-indigo-700';
            case 'completed': return 'bg-emerald-100 text-emerald-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'todo': return 'bg-slate-100 text-slate-700';
            case 'review': return 'bg-amber-100 text-amber-700';
            case 'done': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "h-screen flex overflow-hidden bg-background-light", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" }), _jsx("p", { className: "mt-4 text-slate-600", children: "Loading dashboard..." })] }) })] }));
    }
    if (!data) {
        return (_jsxs("div", { className: "h-screen flex overflow-hidden bg-background-light", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsx("div", { className: "text-center text-slate-500", children: _jsx("p", { children: "Failed to load dashboard data" }) }) })] }));
    }
    const maxTasks = Math.max(...data.epicProgress.map(e => e.totalTasks), 1);
    return (_jsxs("div", { className: "h-screen flex overflow-hidden bg-background-light", children: [_jsx(Sidebar, {}), _jsxs("main", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsxs("header", { className: "h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Link, { to: "/products", className: "text-slate-400 hover:text-slate-600", children: _jsx("span", { className: "material-symbols-outlined", children: "arrow_back" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-bold text-slate-900", children: "Product Dashboard" }), _jsx("p", { className: "text-xs text-slate-500", children: "Development progress and metrics" })] })] }), _jsxs("button", { onClick: () => setShowEpicModal(true), className: "flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "add" }), "Create Epic"] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx("div", { className: "bg-white rounded-xl border border-slate-200 p-5", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "size-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600", children: _jsx("span", { className: "material-symbols-outlined text-[20px]", children: "library_books" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-slate-900", children: data.epics.length }), _jsx("p", { className: "text-xs text-slate-500", children: "Epics" })] })] }) }), _jsx("div", { className: "bg-white rounded-xl border border-slate-200 p-5", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "size-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600", children: _jsx("span", { className: "material-symbols-outlined text-[20px]", children: "extension" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-slate-900", children: data.features.length }), _jsx("p", { className: "text-xs text-slate-500", children: "Features" })] })] }) }), _jsx("div", { className: "bg-white rounded-xl border border-slate-200 p-5", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "size-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600", children: _jsx("span", { className: "material-symbols-outlined text-[20px]", children: "task_alt" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-slate-900", children: data.totalTasks }), _jsx("p", { className: "text-xs text-slate-500", children: "Total Tasks" })] })] }) }), _jsx("div", { className: "bg-white rounded-xl border border-slate-200 p-5", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "size-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600", children: _jsx("span", { className: "material-symbols-outlined text-[20px]", children: "check_circle" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-slate-900", children: data.taskStatusDistribution.done }), _jsx("p", { className: "text-xs text-slate-500", children: "Completed" })] })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-xl border border-slate-200 p-6", children: [_jsxs("h3", { className: "font-bold text-slate-900 mb-4 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-purple-600", children: "trending_up" }), "Epic Progress"] }), _jsxs("div", { className: "space-y-4", children: [data.epicProgress.map((epic) => (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-slate-700 truncate flex-1", children: epic.epicTitle }), _jsxs("span", { className: "text-xs text-slate-500 ml-2", children: [epic.completedTasks, "/", epic.totalTasks] }), _jsxs("span", { className: "text-xs font-bold text-emerald-600 ml-2", children: [epic.percentage, "%"] })] }), _jsx("div", { className: "w-full bg-slate-100 rounded-full h-2 overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500", style: { width: `${epic.percentage}%` } }) })] }, epic.epicId))), data.epicProgress.length === 0 && (_jsx("p", { className: "text-sm text-slate-400 text-center py-8", children: "No epics yet" }))] })] }), _jsxs("div", { className: "bg-white rounded-xl border border-slate-200 p-6", children: [_jsxs("h3", { className: "font-bold text-slate-900 mb-4 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-blue-600", children: "donut_small" }), "Task Status Distribution"] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "size-3 rounded-full bg-slate-400" }), _jsx("span", { className: "text-sm text-slate-700", children: "To Do" })] }), _jsx("span", { className: "text-sm font-bold text-slate-900", children: data.taskStatusDistribution.todo })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "size-3 rounded-full bg-blue-500" }), _jsx("span", { className: "text-sm text-slate-700", children: "In Progress" })] }), _jsx("span", { className: "text-sm font-bold text-slate-900", children: data.taskStatusDistribution.in_progress })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "size-3 rounded-full bg-amber-500" }), _jsx("span", { className: "text-sm text-slate-700", children: "Review" })] }), _jsx("span", { className: "text-sm font-bold text-slate-900", children: data.taskStatusDistribution.review })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "size-3 rounded-full bg-emerald-500" }), _jsx("span", { className: "text-sm text-slate-700", children: "Done" })] }), _jsx("span", { className: "text-sm font-bold text-slate-900", children: data.taskStatusDistribution.done })] }), data.totalTasks > 0 && (_jsx("div", { className: "mt-6", children: _jsxs("div", { className: "flex w-full h-8 rounded-lg overflow-hidden", children: [_jsx("div", { className: "bg-slate-400 flex items-center justify-center text-white text-xs font-bold", style: { width: `${(data.taskStatusDistribution.todo / data.totalTasks) * 100}%` }, children: data.taskStatusDistribution.todo > 0 && data.taskStatusDistribution.todo }), _jsx("div", { className: "bg-blue-500 flex items-center justify-center text-white text-xs font-bold", style: { width: `${(data.taskStatusDistribution.in_progress / data.totalTasks) * 100}%` }, children: data.taskStatusDistribution.in_progress > 0 && data.taskStatusDistribution.in_progress }), _jsx("div", { className: "bg-amber-500 flex items-center justify-center text-white text-xs font-bold", style: { width: `${(data.taskStatusDistribution.review / data.totalTasks) * 100}%` }, children: data.taskStatusDistribution.review > 0 && data.taskStatusDistribution.review }), _jsx("div", { className: "bg-emerald-500 flex items-center justify-center text-white text-xs font-bold", style: { width: `${(data.taskStatusDistribution.done / data.totalTasks) * 100}%` }, children: data.taskStatusDistribution.done > 0 && data.taskStatusDistribution.done })] }) }))] })] })] }), _jsxs("div", { className: "bg-white rounded-xl border border-slate-200 p-6", children: [_jsxs("h3", { className: "font-bold text-slate-900 mb-4 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-indigo-600", children: "account_tree" }), "Epic \u2192 Feature \u2192 Task Breakdown"] }), _jsxs("div", { className: "space-y-2", children: [data.epics.map((epic) => {
                                                const isExpanded = expandedEpics.has(epic.id);
                                                const epicFeatures = data.features.filter(f => f.epicId === epic.id);
                                                return (_jsxs("div", { className: "border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden", children: [_jsxs("div", { className: "flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors", children: [_jsx("span", { onClick: () => toggleEpic(epic.id), className: "material-symbols-outlined text-slate-600 cursor-pointer", children: isExpanded ? 'expand_more' : 'chevron_right' }), _jsx("span", { onClick: () => toggleEpic(epic.id), className: "material-symbols-outlined text-purple-600 cursor-pointer", children: "library_books" }), _jsxs("span", { className: "text-xs font-mono px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400", children: ["E-", epic.id] }), _jsx("button", { onClick: (e) => { e.stopPropagation(); setSelectedItem({ item: epic, type: 'epic' }); }, className: "font-semibold flex-1 text-left hover:text-primary hover:underline transition-colors", style: { color: 'var(--text-primary)' }, children: epic.title }), _jsxs("span", { className: `px-2 py-0.5 rounded text-xs font-bold ${epic.priority === 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                        epic.priority === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                                            epic.priority === 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`, children: ["P", epic.priority] }), _jsx("span", { className: `px-2 py-1 rounded text-xs font-medium ${getStatusColor(epic.status)}`, children: epic.status }), _jsxs("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: [epicFeatures.length, " features"] }), _jsxs("button", { onClick: (e) => {
                                                                        e.stopPropagation();
                                                                        openFeatureModal(epic.id);
                                                                    }, className: "px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[14px]", children: "add" }), "Feature"] })] }), isExpanded && (_jsxs("div", { className: "bg-white dark:bg-slate-800", children: [epicFeatures.map((feature) => {
                                                                    const isFeatureExpanded = expandedFeatures.has(feature.id);
                                                                    const featureTasks = data.tasks.filter(t => t.featureId === feature.id);
                                                                    return (_jsxs("div", { className: "border-t border-slate-200 dark:border-slate-700", children: [_jsxs("div", { className: "flex items-center gap-3 p-4 pl-12 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors", children: [_jsx("span", { onClick: () => toggleFeature(feature.id), className: "material-symbols-outlined text-slate-600 cursor-pointer", children: isFeatureExpanded ? 'expand_more' : 'chevron_right' }), _jsx("span", { onClick: () => toggleFeature(feature.id), className: "material-symbols-outlined text-blue-600 cursor-pointer", children: "extension" }), _jsxs("span", { className: "text-xs font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400", children: ["F-", feature.id] }), _jsx("button", { onClick: (e) => { e.stopPropagation(); setSelectedItem({ item: feature, type: 'feature' }); }, className: "font-medium flex-1 text-left hover:text-primary hover:underline transition-colors", style: { color: 'var(--text-primary)' }, children: feature.title }), _jsxs("span", { className: `px-2 py-0.5 rounded text-xs font-bold ${feature.priority === 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                                            feature.priority === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                                                                feature.priority === 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                                                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`, children: ["P", feature.priority] }), _jsx("span", { className: `px-2 py-1 rounded text-xs font-medium ${getStatusColor(feature.status)}`, children: feature.status }), _jsxs("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: [featureTasks.length, " tasks"] }), _jsxs("button", { onClick: (e) => {
                                                                                            e.stopPropagation();
                                                                                            openTaskModal(feature.id);
                                                                                        }, className: "px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-medium flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[14px]", children: "add" }), "Task"] })] }), isFeatureExpanded && (_jsxs("div", { className: "bg-slate-50 dark:bg-slate-900/50", children: [featureTasks.map((task) => (_jsxs("div", { className: "flex items-center gap-2 p-3 pl-20 border-t border-slate-200 dark:border-slate-700", children: [task.type === 'bug' ? (_jsx("span", { className: "material-symbols-outlined text-red-500 text-[18px]", children: "bug_report" })) : (_jsx("span", { className: "material-symbols-outlined text-slate-400 text-[18px]", children: "task" })), _jsxs("span", { className: "text-xs font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300", children: ["T-", task.id] }), _jsx("button", { onClick: (e) => { e.stopPropagation(); setSelectedItem({ item: task, type: 'task' }); }, className: "text-sm flex-1 text-left hover:text-primary hover:underline transition-colors", style: { color: 'var(--text-secondary)' }, children: task.title }), _jsxs("span", { className: `px-2 py-0.5 rounded text-xs font-bold ${task.priority === 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                                                    task.priority === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                                                                        task.priority === 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                                                            'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`, children: ["P", task.priority] }), _jsx("span", { className: `px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`, children: task.status })] }, task.id))), featureTasks.length === 0 && (_jsx("div", { className: "p-4 pl-20 text-sm text-slate-400", children: "No tasks yet" }))] }))] }, feature.id));
                                                                }), epicFeatures.length === 0 && (_jsx("div", { className: "p-4 pl-12 text-sm text-slate-400 border-t border-slate-200 dark:border-slate-700", children: "No features yet" }))] }))] }, epic.id));
                                            }), data.epics.length === 0 && (_jsxs("div", { className: "text-center py-12 text-slate-400", children: [_jsx("span", { className: "material-symbols-outlined text-4xl", children: "account_tree" }), _jsx("p", { className: "mt-2 text-sm", children: "No epics created yet" })] }))] })] })] })] }), showEpicModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "p-6 border-b border-slate-200 sticky top-0 bg-white", children: [_jsx("h3", { className: "text-lg font-bold text-slate-900", children: "Create New Epic" }), _jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Add a new epic to this product" })] }), _jsxs("form", { onSubmit: createEpic, className: "p-6 space-y-4", children: [error && (_jsx("div", { className: "p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm", children: error })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Title *" }), _jsx("input", { type: "text", value: epicTitle, onChange: (e) => setEpicTitle(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", placeholder: "e.g., User Authentication Module", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Description" }), _jsx("textarea", { value: epicDescription, onChange: (e) => setEpicDescription(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 resize-none", rows: 3, placeholder: "Brief description of the epic's scope and goals..." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Priority" }), _jsxs("select", { value: epicPriority, onChange: (e) => setEpicPriority(parseInt(e.target.value)), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", children: [_jsx("option", { value: 1, children: "P1 - Critical" }), _jsx("option", { value: 2, children: "P2 - High" }), _jsx("option", { value: 3, children: "P3 - Medium" }), _jsx("option", { value: 4, children: "P4 - Low" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Target Date" }), _jsx("input", { type: "date", value: epicTargetDate, onChange: (e) => setEpicTargetDate(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Labels" }), _jsx("input", { type: "text", value: epicLabels, onChange: (e) => setEpicLabels(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", placeholder: "q1-2025, mvp, core (comma-separated)" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Color (for roadmap)" }), _jsxs("div", { className: "flex gap-2", children: [['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'].map((color) => (_jsx("button", { type: "button", onClick: () => setEpicColor(color), className: `w-8 h-8 rounded-lg transition-transform ${epicColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`, style: { backgroundColor: color } }, color))), epicColor && (_jsx("button", { type: "button", onClick: () => setEpicColor(''), className: "px-2 py-1 text-xs text-slate-500 hover:text-slate-700", children: "Clear" }))] })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t border-slate-200", children: [_jsx("button", { type: "button", onClick: () => {
                                                setShowEpicModal(false);
                                                setEpicTargetDate('');
                                                setEpicLabels('');
                                                setEpicColor('');
                                                setError('');
                                            }, className: "px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium", children: "Cancel" }), _jsx("button", { type: "submit", disabled: saving, className: "px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50", children: saving ? 'Creating...' : 'Create Epic' })] })] })] }) })), showFeatureModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "p-6 border-b border-slate-200 sticky top-0 bg-white", children: [_jsx("h3", { className: "text-lg font-bold text-slate-900", children: "Create New Feature" }), _jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Add a feature to the selected epic" })] }), _jsxs("form", { onSubmit: createFeature, className: "p-6 space-y-4", children: [error && (_jsx("div", { className: "p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm", children: error })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Title *" }), _jsx("input", { type: "text", value: featureTitle, onChange: (e) => setFeatureTitle(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", placeholder: "e.g., Social Login Integration", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Description" }), _jsx("textarea", { value: featureDescription, onChange: (e) => setFeatureDescription(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 resize-none", rows: 3, placeholder: "Brief description of the feature..." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Priority" }), _jsxs("select", { value: featurePriority, onChange: (e) => setFeaturePriority(parseInt(e.target.value)), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", children: [_jsx("option", { value: 1, children: "P1 - Critical" }), _jsx("option", { value: 2, children: "P2 - High" }), _jsx("option", { value: 3, children: "P3 - Medium" }), _jsx("option", { value: 4, children: "P4 - Low" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Target Date" }), _jsx("input", { type: "date", value: featureTargetDate, onChange: (e) => setFeatureTargetDate(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Estimate (story points)" }), _jsx("input", { type: "number", value: featureEstimate, onChange: (e) => setFeatureEstimate(e.target.value ? parseInt(e.target.value) : ''), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", placeholder: "e.g., 13", min: 1 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Labels" }), _jsx("input", { type: "text", value: featureLabels, onChange: (e) => setFeatureLabels(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", placeholder: "frontend, api" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Acceptance Criteria" }), _jsx("textarea", { value: featureAcceptanceCriteria, onChange: (e) => setFeatureAcceptanceCriteria(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 resize-none", rows: 4, placeholder: "- Users can sign in with Google\n- Users can sign in with GitHub\n- Session persists across page refreshes" })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t border-slate-200", children: [_jsx("button", { type: "button", onClick: () => {
                                                setShowFeatureModal(false);
                                                setSelectedEpicId(null);
                                                setFeatureTargetDate('');
                                                setFeatureLabels('');
                                                setFeatureAcceptanceCriteria('');
                                                setFeatureEstimate('');
                                                setError('');
                                            }, className: "px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium", children: "Cancel" }), _jsx("button", { type: "submit", disabled: saving, className: "px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50", children: saving ? 'Creating...' : 'Create Feature' })] })] })] }) })), selectedItem && (_jsx(ItemDetailModal, { item: selectedItem.item, itemType: selectedItem.type, onClose: () => setSelectedItem(null) })), showTaskModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "p-6 border-b border-slate-200 sticky top-0 bg-white", children: [_jsxs("h3", { className: "text-lg font-bold text-slate-900", children: ["Create New ", taskType === 'bug' ? 'Bug' : 'Task'] }), _jsxs("p", { className: "text-sm text-slate-500 mt-1", children: ["Add a ", taskType, " to the selected feature"] })] }), _jsxs("form", { onSubmit: createTask, className: "p-6 space-y-4", children: [error && (_jsx("div", { className: "p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm", children: error })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Title *" }), _jsx("input", { type: "text", value: taskTitle, onChange: (e) => setTaskTitle(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", placeholder: taskType === 'bug' ? "e.g., Login fails on mobile Safari" : "e.g., Implement Google OAuth", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Description" }), _jsx("textarea", { value: taskDescription, onChange: (e) => setTaskDescription(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 resize-none", rows: 3, placeholder: taskType === 'bug' ? "Steps to reproduce, expected vs actual behavior..." : "Brief description of the task..." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Type" }), _jsxs("select", { value: taskType, onChange: (e) => setTaskType(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", children: [_jsx("option", { value: "task", children: "Task" }), _jsx("option", { value: "bug", children: "Bug" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Priority" }), _jsxs("select", { value: taskPriority, onChange: (e) => setTaskPriority(parseInt(e.target.value)), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", children: [_jsx("option", { value: 1, children: "P1 - Critical" }), _jsx("option", { value: 2, children: "P2 - High" }), _jsx("option", { value: 3, children: "P3 - Medium" }), _jsx("option", { value: 4, children: "P4 - Low" })] })] })] }), taskType === 'bug' && (_jsxs("div", { className: "grid grid-cols-2 gap-3 p-3 bg-red-50 border border-red-100 rounded-lg", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-red-700 mb-1", children: "Severity" }), _jsxs("select", { value: taskSeverity, onChange: (e) => setTaskSeverity(e.target.value), className: "w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-200 bg-white", children: [_jsx("option", { value: "critical", children: "Critical" }), _jsx("option", { value: "major", children: "Major" }), _jsx("option", { value: "minor", children: "Minor" }), _jsx("option", { value: "trivial", children: "Trivial" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-red-700 mb-1", children: "Environment" }), _jsxs("select", { value: taskEnvironment, onChange: (e) => setTaskEnvironment(e.target.value), className: "w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-200 bg-white", children: [_jsx("option", { value: "production", children: "Production" }), _jsx("option", { value: "staging", children: "Staging" }), _jsx("option", { value: "development", children: "Development" }), _jsx("option", { value: "local", children: "Local" })] })] })] })), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Estimate (hours)" }), _jsx("input", { type: "number", value: taskEstimate, onChange: (e) => setTaskEstimate(e.target.value ? parseInt(e.target.value) : ''), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", placeholder: "e.g., 4", min: 1 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Due Date" }), _jsx("input", { type: "date", value: taskDueDate, onChange: (e) => setTaskDueDate(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Labels" }), _jsx("input", { type: "text", value: taskLabels, onChange: (e) => setTaskLabels(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", placeholder: "frontend, api, urgent (comma-separated)" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: "Assign Developers" }), _jsxs("div", { className: "space-y-2 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-3", children: [developers.map((dev) => (_jsxs("label", { className: "flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded", children: [_jsx("input", { type: "checkbox", checked: selectedDevelopers.includes(dev.id), onChange: () => toggleDeveloper(dev.id), className: "rounded border-slate-300 text-primary focus:ring-primary/20" }), _jsx("span", { className: "text-sm text-slate-700", children: dev.name }), _jsxs("span", { className: "text-xs text-slate-400", children: ["(", dev.email, ")"] })] }, dev.id))), developers.length === 0 && (_jsx("p", { className: "text-sm text-slate-400 text-center py-2", children: "No developers available" }))] })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t border-slate-200", children: [_jsx("button", { type: "button", onClick: () => {
                                                setShowTaskModal(false);
                                                setSelectedFeatureId(null);
                                                setSelectedDevelopers([]);
                                                setTaskEstimate('');
                                                setTaskDueDate('');
                                                setTaskLabels('');
                                                setTaskSeverity('major');
                                                setTaskEnvironment('production');
                                                setError('');
                                            }, className: "px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium", children: "Cancel" }), _jsx("button", { type: "submit", disabled: saving, className: `px-4 py-2 text-white rounded-lg text-sm font-semibold disabled:opacity-50 ${taskType === 'bug'
                                                ? 'bg-red-500 hover:bg-red-600'
                                                : 'bg-primary hover:bg-blue-600'}`, children: saving ? 'Creating...' : `Create ${taskType === 'bug' ? 'Bug' : 'Task'}` })] })] })] }) }))] }));
}
