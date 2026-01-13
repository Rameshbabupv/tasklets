import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/auth';
export default function SprintRetro() {
    const { id } = useParams();
    const [sprint, setSprint] = useState(null);
    const [retro, setRetro] = useState({ wentWell: '', improvements: '', actionItems: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const { token } = useAuthStore();
    const surfaceStyles = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' };
    const textPrimary = { color: 'var(--text-primary)' };
    const textSecondary = { color: 'var(--text-secondary)' };
    const textMuted = { color: 'var(--text-muted)' };
    useEffect(() => {
        if (id)
            fetchData();
    }, [id]);
    const fetchData = async () => {
        try {
            const [sprintRes, retroRes] = await Promise.all([
                fetch(`/api/sprints/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`/api/sprints/${id}/retro`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const sprintData = await sprintRes.json();
            const retroData = await retroRes.json();
            setSprint(sprintData.sprint);
            if (retroData.retro) {
                setRetro({
                    wentWell: retroData.retro.wentWell || '',
                    improvements: retroData.retro.improvements || '',
                    actionItems: retroData.retro.actionItems || '',
                });
            }
        }
        catch (err) {
            console.error('Failed to fetch retro', err);
        }
        finally {
            setLoading(false);
        }
    };
    const saveRetro = useCallback(async () => {
        if (!id)
            return;
        setSaving(true);
        try {
            await fetch(`/api/sprints/${id}/retro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(retro),
            });
            setLastSaved(new Date());
        }
        catch (err) {
            console.error('Failed to save retro', err);
        }
        finally {
            setSaving(false);
        }
    }, [id, retro, token]);
    const handleBlur = () => {
        saveRetro();
    };
    const columns = [
        {
            key: 'wentWell',
            title: 'What Went Well',
            icon: 'thumb_up',
            color: 'emerald',
            placeholder: 'What worked well this sprint?\n\n• Team collaboration\n• Technical decisions\n• Process improvements',
        },
        {
            key: 'improvements',
            title: 'What Could Improve',
            icon: 'construction',
            color: 'amber',
            placeholder: 'What could we do better?\n\n• Blockers encountered\n• Communication gaps\n• Technical debt',
        },
        {
            key: 'actionItems',
            title: 'Action Items',
            icon: 'task_alt',
            color: 'blue',
            placeholder: 'Concrete actions for next sprint:\n\n• [ ] Action item 1\n• [ ] Action item 2\n• [ ] Action item 3',
        },
    ];
    const getHeaderColor = (color) => {
        const colors = {
            emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        };
        return colors[color] || colors.blue;
    };
    const getBorderColor = (color) => {
        const colors = {
            emerald: 'border-emerald-200 dark:border-emerald-800',
            amber: 'border-amber-200 dark:border-amber-800',
            blue: 'border-blue-200 dark:border-blue-800',
        };
        return colors[color] || colors.blue;
    };
    if (loading) {
        return (_jsxs("div", { className: "h-screen flex overflow-hidden", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" }), _jsx("p", { className: "mt-4", style: textSecondary, children: "Loading retrospective..." })] }) })] }));
    }
    if (!sprint) {
        return (_jsxs("div", { className: "h-screen flex overflow-hidden", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { style: textSecondary, children: "Sprint not found" }), _jsx(Link, { to: "/sprints", className: "text-primary hover:underline mt-2 block", children: "Back to Sprints" })] }) })] }));
    }
    return (_jsxs("div", { className: "h-screen flex overflow-hidden", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsx(Sidebar, {}), _jsxs("main", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsx("header", { className: "px-6 py-4 border-b shrink-0", style: surfaceStyles, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Link, { to: "/sprints", className: "p-2 hover:bg-primary/10 rounded-lg transition-colors", style: textSecondary, children: _jsx("span", { className: "material-symbols-outlined", children: "arrow_back" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("h2", { className: "text-lg font-bold", style: textPrimary, children: [sprint.name, " Retrospective"] }), _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-medium ${sprint.status === 'completed'
                                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`, children: sprint.status })] }), _jsx("p", { className: "text-sm", style: textSecondary, children: "Reflect on what worked and what can be improved" })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [saving && (_jsxs("span", { className: "text-sm flex items-center gap-2", style: textMuted, children: [_jsx("span", { className: "material-symbols-outlined text-[18px] animate-spin", children: "sync" }), "Saving..."] })), !saving && lastSaved && (_jsxs("span", { className: "text-sm", style: textMuted, children: ["Saved ", lastSaved.toLocaleTimeString()] })), _jsxs("button", { onClick: saveRetro, disabled: saving, className: "px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "save" }), "Save"] })] })] }) }), _jsxs("div", { className: "flex-1 overflow-auto p-6", children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]", children: columns.map((column) => (_jsxs("div", { className: `flex flex-col rounded-xl border-2 ${getBorderColor(column.color)} overflow-hidden`, style: surfaceStyles, children: [_jsxs("div", { className: `px-4 py-3 ${getHeaderColor(column.color)} flex items-center gap-2`, children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", children: column.icon }), _jsx("h3", { className: "font-bold text-sm", children: column.title })] }), _jsx("div", { className: "flex-1 p-4", children: _jsx("textarea", { value: retro[column.key], onChange: (e) => setRetro({ ...retro, [column.key]: e.target.value }), onBlur: handleBlur, placeholder: column.placeholder, className: "w-full h-full min-h-[300px] resize-none border-0 focus:ring-0 focus:outline-none text-sm leading-relaxed", style: {
                                                    backgroundColor: 'transparent',
                                                    color: 'var(--text-primary)',
                                                } }) })] }, column.key))) }), _jsx("div", { className: "mt-6 rounded-xl border p-4", style: surfaceStyles, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("span", { className: "material-symbols-outlined text-primary", children: "tips_and_updates" }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-sm", style: textPrimary, children: "Retrospective Tips" }), _jsxs("ul", { className: "mt-2 text-sm space-y-1", style: textSecondary, children: [_jsx("li", { children: "Focus on specific, actionable feedback" }), _jsx("li", { children: "Keep action items measurable and assignable" }), _jsx("li", { children: "Changes auto-save when you click outside a text area" })] })] })] }) })] })] })] }));
}
