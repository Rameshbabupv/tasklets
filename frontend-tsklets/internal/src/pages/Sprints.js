import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/auth';
// Helper: Generate sprint name from date
function generateSprintName(startDate) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[startDate.getMonth()];
    const half = startDate.getDate() <= 15 ? 'I' : 'II';
    const year = String(startDate.getFullYear()).slice(-2);
    return `${month}-${half}-${year}`;
}
// Helper: Calculate end date (2 weeks from start)
function calculateEndDate(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 13);
    return endDate.toISOString().split('T')[0];
}
export default function Sprints() {
    const [sprints, setSprints] = useState([]);
    const [velocityData, setVelocityData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const { token } = useAuthStore();
    // Form state
    const [startDate, setStartDate] = useState('');
    const [sprintName, setSprintName] = useState('');
    const [goal, setGoal] = useState('');
    const [error, setError] = useState('');
    const surfaceStyles = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' };
    const textPrimary = { color: 'var(--text-primary)' };
    const textSecondary = { color: 'var(--text-secondary)' };
    const textMuted = { color: 'var(--text-muted)' };
    useEffect(() => {
        fetchSprints();
    }, []);
    // Auto-generate sprint name when start date changes
    useEffect(() => {
        if (startDate) {
            const date = new Date(startDate + 'T12:00:00'); // Avoid timezone issues
            setSprintName(generateSprintName(date));
        }
    }, [startDate]);
    const fetchSprints = async () => {
        try {
            const [sprintsRes, velocityRes] = await Promise.all([
                fetch('/api/sprints', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/sprints/metrics/velocity', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const sprintsData = await sprintsRes.json();
            const velocityDataRes = await velocityRes.json();
            setSprints(sprintsData.sprints || []);
            setVelocityData(velocityDataRes);
        }
        catch (err) {
            console.error('Failed to fetch sprints', err);
        }
        finally {
            setLoading(false);
        }
    };
    const resetForm = () => {
        setStartDate('');
        setSprintName('');
        setGoal('');
        setError('');
    };
    const openModal = () => {
        resetForm();
        // Default to next Monday
        const today = new Date();
        const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + daysUntilMonday);
        setStartDate(nextMonday.toISOString().split('T')[0]);
        setShowModal(true);
    };
    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            const res = await fetch('/api/sprints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: sprintName,
                    goal: goal || null,
                    startDate,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create sprint');
            }
            setShowModal(false);
            resetForm();
            fetchSprints();
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setSaving(false);
        }
    };
    const handleStart = async (sprintId) => {
        try {
            const res = await fetch(`/api/sprints/${sprintId}/start`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Failed to start sprint');
                return;
            }
            fetchSprints();
        }
        catch (err) {
            console.error('Failed to start sprint', err);
        }
    };
    const handleComplete = async (sprintId) => {
        if (!confirm('Complete this sprint? Incomplete tasks will be moved to backlog.'))
            return;
        try {
            const res = await fetch(`/api/sprints/${sprintId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ moveIncompleteTo: 'backlog' }),
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Failed to complete sprint');
                return;
            }
            fetchSprints();
        }
        catch (err) {
            console.error('Failed to complete sprint', err);
        }
    };
    const getStatusBadge = (status) => {
        const styles = {
            planning: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Planning' },
            active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Active' },
            completed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Completed' },
            cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Cancelled' },
        };
        const s = styles[status];
        return (_jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`, children: s.label }));
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
    return (_jsxs("div", { className: "h-screen flex overflow-hidden", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsx(Sidebar, {}), _jsxs("main", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsxs("header", { className: "h-16 px-6 border-b flex items-center justify-between shrink-0", style: surfaceStyles, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h2", { className: "text-lg font-bold", style: textPrimary, children: "Sprints" }), _jsx("span", { className: "text-sm px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium", children: sprints.filter(s => s.status === 'active').length > 0 ? '1 Active' : 'No Active Sprint' })] }), _jsxs("button", { onClick: openModal, className: "flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "add" }), "New Sprint"] })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: loading ? (_jsx("div", { className: "flex items-center justify-center h-full", style: textSecondary, children: "Loading..." })) : sprints.length === 0 ? (_jsx("div", { className: "text-center py-12", style: textMuted, children: "No sprints yet. Click \"New Sprint\" to create your first sprint." })) : (_jsxs("div", { className: "space-y-4", children: [sprints.filter(s => s.status === 'active').map((sprint) => (_jsxs("div", { className: "rounded-xl border-2 border-green-500 p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-12 rounded-xl bg-green-500 flex items-center justify-center text-white", children: _jsx("span", { className: "material-symbols-outlined text-[24px]", children: "sprint" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-lg", style: textPrimary, children: sprint.name }), _jsxs("p", { className: "text-sm", style: textSecondary, children: [formatDate(sprint.startDate), " - ", formatDate(sprint.endDate), _jsxs("span", { className: "ml-2 text-green-600 dark:text-green-400 font-medium", children: ["(", getDaysRemaining(sprint.endDate), " days left)"] })] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [getStatusBadge(sprint.status), _jsx(Link, { to: `/sprints/${sprint.id}`, className: "px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors", children: "Open Board" }), _jsx("button", { onClick: () => handleComplete(sprint.id), className: "px-3 py-1.5 border border-green-600 text-green-600 hover:bg-green-50 rounded-lg text-sm font-medium transition-colors", children: "Complete" })] })] }), sprint.goal && (_jsxs("p", { className: "text-sm mt-2 pl-15", style: textSecondary, children: [_jsx("span", { className: "font-medium", children: "Goal:" }), " ", sprint.goal] }))] }, sprint.id))), sprints.filter(s => s.status === 'planning').length > 0 && (_jsxs("div", { className: "mt-6", children: [_jsx("h3", { className: "text-sm font-semibold uppercase tracking-wider mb-3", style: textMuted, children: "Planning" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: sprints.filter(s => s.status === 'planning').map((sprint) => (_jsxs("div", { className: "rounded-xl border p-4 hover:shadow-md transition-all", style: surfaceStyles, children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("div", { className: "size-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600", children: _jsx("span", { className: "material-symbols-outlined", children: "edit_calendar" }) }), getStatusBadge(sprint.status)] }), _jsx("h4", { className: "font-semibold mb-1", style: textPrimary, children: sprint.name }), _jsxs("p", { className: "text-sm mb-3", style: textSecondary, children: [formatDate(sprint.startDate), " - ", formatDate(sprint.endDate)] }), sprint.goal && (_jsx("p", { className: "text-sm mb-3 line-clamp-2", style: textMuted, children: sprint.goal })), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => handleStart(sprint.id), className: "flex-1 px-3 py-1.5 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors", children: "Start Sprint" }), _jsx(Link, { to: `/sprints/${sprint.id}`, className: "px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors hover:bg-primary/10", style: { borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }, children: "Plan" })] })] }, sprint.id))) })] })), sprints.filter(s => s.status === 'completed').length > 0 && (_jsxs("div", { className: "mt-6", children: [_jsx("h3", { className: "text-sm font-semibold uppercase tracking-wider mb-3", style: textMuted, children: "Completed" }), _jsx("div", { className: "rounded-xl border overflow-hidden", style: surfaceStyles, children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("th", { className: "text-left px-4 py-3 text-sm font-semibold", style: textSecondary, children: "Sprint" }), _jsx("th", { className: "text-left px-4 py-3 text-sm font-semibold", style: textSecondary, children: "Dates" }), _jsx("th", { className: "text-center px-4 py-3 text-sm font-semibold", style: textSecondary, children: "Velocity" }), _jsx("th", { className: "text-right px-4 py-3 text-sm font-semibold", style: textSecondary, children: "Actions" })] }) }), _jsx("tbody", { children: sprints.filter(s => s.status === 'completed').map((sprint) => (_jsxs("tr", { className: "border-b last:border-b-0", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "font-medium", style: textPrimary, children: sprint.name }) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("span", { className: "text-sm", style: textSecondary, children: [formatDate(sprint.startDate), " - ", formatDate(sprint.endDate)] }) }), _jsx("td", { className: "px-4 py-3 text-center", children: _jsxs("span", { className: "px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold", children: [sprint.velocity ?? 0, " pts"] }) }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsx(Link, { to: `/sprints/${sprint.id}/retro`, className: "text-sm text-primary hover:underline", children: "View Retro" }) })] }, sprint.id))) })] }) })] })), velocityData?.sprints?.length > 0 && (_jsxs("div", { className: "mt-6", children: [_jsx("h3", { className: "text-sm font-semibold uppercase tracking-wider mb-3", style: textMuted, children: "Velocity Trend" }), _jsxs("div", { className: "rounded-xl border p-6", style: surfaceStyles, children: [_jsx("div", { className: "flex items-end justify-between gap-4 h-48", children: velocityData.sprints.map((sprint) => {
                                                        const maxVelocity = Math.max(...velocityData.sprints.map(s => s.velocity), 1);
                                                        const heightPercent = (sprint.velocity / maxVelocity) * 100;
                                                        const isAboveAvg = sprint.velocity >= velocityData.average;
                                                        return (_jsxs("div", { className: "flex-1 flex flex-col items-center gap-2", children: [_jsx("span", { className: "text-sm font-semibold", style: textPrimary, children: sprint.velocity }), _jsx("div", { className: `w-full rounded-t-lg transition-all ${isAboveAvg
                                                                        ? 'bg-gradient-to-t from-green-500 to-emerald-400'
                                                                        : 'bg-gradient-to-t from-blue-500 to-blue-400'}`, style: { height: `${heightPercent}%`, minHeight: '8px' } }), _jsx("span", { className: "text-xs", style: textMuted, children: sprint.name })] }, sprint.id));
                                                    }) }), _jsxs("div", { className: "mt-4 pt-4 border-t flex items-center justify-center gap-6", style: { borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 rounded bg-gradient-to-t from-green-500 to-emerald-400" }), _jsx("span", { className: "text-xs", style: textSecondary, children: "Above Average" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 rounded bg-gradient-to-t from-blue-500 to-blue-400" }), _jsx("span", { className: "text-xs", style: textSecondary, children: "Below Average" })] }), _jsxs("div", { className: "text-xs font-semibold", style: textPrimary, children: ["Avg: ", velocityData.average.toFixed(1), " pts/sprint"] })] })] })] }))] })) })] }), showModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "rounded-xl shadow-xl w-full max-w-md mx-4", style: surfaceStyles, children: [_jsxs("div", { className: "p-6 border-b", style: surfaceStyles, children: [_jsx("h3", { className: "text-lg font-bold", style: textPrimary, children: "New Sprint" }), _jsx("p", { className: "text-sm mt-1", style: textSecondary, children: "Create a new 2-week sprint" })] }), _jsxs("form", { onSubmit: handleCreate, className: "p-6 space-y-4", children: [error && (_jsx("div", { className: "p-3 border rounded-lg text-sm", style: {
                                        backgroundColor: 'var(--error-bg)',
                                        borderColor: 'var(--error-text)',
                                        color: 'var(--error-text)',
                                    }, children: error })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", style: textSecondary, children: "Start Date *" }), _jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "input-field text-sm py-2", style: {
                                                color: 'var(--text-primary)',
                                                backgroundColor: 'var(--bg-card)',
                                                borderColor: 'var(--border-primary)',
                                            }, required: true }), startDate && (_jsxs("p", { className: "text-xs mt-1", style: textMuted, children: ["Ends: ", calculateEndDate(new Date(startDate + 'T12:00:00'))] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", style: textSecondary, children: "Sprint Name" }), _jsx("input", { type: "text", value: sprintName, onChange: (e) => setSprintName(e.target.value), className: "input-field text-sm py-2", style: {
                                                color: 'var(--text-primary)',
                                                backgroundColor: 'var(--bg-card)',
                                                borderColor: 'var(--border-primary)',
                                            }, placeholder: "Auto-generated from date" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", style: textSecondary, children: "Sprint Goal (optional)" }), _jsx("textarea", { value: goal, onChange: (e) => setGoal(e.target.value), className: "input-field text-sm py-2 resize-none", style: {
                                                color: 'var(--text-primary)',
                                                backgroundColor: 'var(--bg-card)',
                                                borderColor: 'var(--border-primary)',
                                            }, rows: 3, placeholder: "What do you want to achieve this sprint?" })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t", style: surfaceStyles, children: [_jsx("button", { type: "button", onClick: () => { setShowModal(false); resetForm(); }, className: "px-4 py-2 rounded-lg text-sm font-medium transition-colors", style: {
                                                color: 'var(--text-secondary)',
                                                backgroundColor: 'var(--bg-card)',
                                                border: '1px solid var(--border-primary)',
                                            }, children: "Cancel" }), _jsx("button", { type: "submit", disabled: saving || !startDate, className: "px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50", children: saving ? 'Creating...' : 'Create Sprint' })] })] })] }) }))] }));
}
