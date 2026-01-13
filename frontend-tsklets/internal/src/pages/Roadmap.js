import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { RoadmapProgress } from '../components/charts/ProgressBar';
import { useAuthStore } from '../store/auth';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_COLORS = {
    backlog: '#94a3b8',
    planned: '#3b82f6',
    in_progress: '#f59e0b',
    completed: '#10b981',
    cancelled: '#ef4444',
};
const EPIC_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f97316', // Orange
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
];
export default function Roadmap() {
    const [epics, setEpics] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('timeline');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [expandedEpics, setExpandedEpics] = useState(new Set());
    const { token } = useAuthStore();
    useEffect(() => {
        fetchData();
    }, [selectedProduct]);
    const fetchData = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [roadmapRes, productsRes] = await Promise.all([
                fetch(`/api/executive/roadmap${selectedProduct ? `?productId=${selectedProduct}` : ''}`, { headers }),
                fetch('/api/products', { headers }),
            ]);
            const [roadmapData, productsData] = await Promise.all([
                roadmapRes.json(),
                productsRes.json(),
            ]);
            setEpics(roadmapData.roadmap || []);
            setProducts(productsData.products || []);
        }
        catch (err) {
            console.error('Failed to fetch roadmap data', err);
        }
        finally {
            setLoading(false);
        }
    };
    const toggleEpicExpanded = (epicId) => {
        setExpandedEpics(prev => {
            const next = new Set(prev);
            if (next.has(epicId)) {
                next.delete(epicId);
            }
            else {
                next.add(epicId);
            }
            return next;
        });
    };
    // Calculate timeline range
    const timelineRange = useMemo(() => {
        const now = new Date();
        const startMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endMonth = new Date(now.getFullYear(), now.getMonth() + 6, 1);
        const months = [];
        let current = new Date(startMonth);
        while (current <= endMonth) {
            months.push({
                date: new Date(current),
                label: `${MONTHS[current.getMonth()]} ${current.getFullYear().toString().slice(-2)}`,
                isCurrentMonth: current.getMonth() === now.getMonth() && current.getFullYear() === now.getFullYear(),
            });
            current.setMonth(current.getMonth() + 1);
        }
        return {
            start: startMonth,
            end: endMonth,
            months,
            totalDays: Math.ceil((endMonth.getTime() - startMonth.getTime()) / (1000 * 60 * 60 * 24)),
        };
    }, []);
    const getBarPosition = (startDate, targetDate) => {
        const start = startDate ? new Date(startDate) : new Date();
        const end = targetDate ? new Date(targetDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
        const rangeStart = timelineRange.start.getTime();
        const rangeEnd = timelineRange.end.getTime();
        const totalDuration = rangeEnd - rangeStart;
        const barStart = Math.max(0, (start.getTime() - rangeStart) / totalDuration) * 100;
        const barEnd = Math.min(100, (end.getTime() - rangeStart) / totalDuration) * 100;
        const barWidth = Math.max(2, barEnd - barStart);
        return { left: `${barStart}%`, width: `${barWidth}%` };
    };
    const getEpicColor = (epic, index) => {
        return epic.color || EPIC_COLORS[index % EPIC_COLORS.length];
    };
    if (loading) {
        return (_jsxs("div", { className: "h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-800 border-t-primary mx-auto" }), _jsx("span", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-primary text-xl", children: "map" }) })] }), _jsx("p", { className: "mt-4 text-slate-600 dark:text-slate-400 font-medium", children: "Loading Roadmap..." })] }) })] }));
    }
    return (_jsxs("div", { className: "h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950", children: [_jsx(Sidebar, {}), _jsxs("main", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsxs("header", { className: "h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0", children: [_jsx("div", { className: "flex items-center gap-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/25", children: _jsx("span", { className: "material-symbols-outlined text-[22px]", children: "map" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-bold text-slate-900 dark:text-white", children: "Roadmap" }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Product timeline and milestones" })] })] }) }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("select", { value: selectedProduct || '', onChange: (e) => setSelectedProduct(e.target.value ? parseInt(e.target.value) : null), className: "px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent", children: [_jsx("option", { value: "", children: "All Products" }), products.map((product) => (_jsx("option", { value: product.id, children: product.name }, product.id)))] }), _jsxs("div", { className: "flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5", children: [_jsxs("button", { onClick: () => setViewMode('timeline'), className: `flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'timeline'
                                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "view_timeline" }), "Timeline"] }), _jsxs("button", { onClick: () => setViewMode('list'), className: `flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'list'
                                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "list" }), "List"] })] })] })] }), _jsx("div", { className: "flex-1 overflow-auto", children: epics.length === 0 ? (_jsx("div", { className: "flex-1 flex items-center justify-center h-full", children: _jsxs("div", { className: "text-center text-slate-400 dark:text-slate-500", children: [_jsx("span", { className: "material-symbols-outlined text-6xl mb-4", children: "map" }), _jsx("h3", { className: "text-lg font-medium text-slate-900 dark:text-white mb-2", children: "No roadmap data" }), _jsx("p", { className: "text-sm", children: "Create epics with target dates to see them on the roadmap" })] }) })) : viewMode === 'timeline' ? (_jsxs("div", { className: "p-6", children: [_jsx("div", { className: "mb-4 ml-64 flex border-b border-slate-200 dark:border-slate-800", children: timelineRange.months.map((month, index) => (_jsx("div", { className: `flex-1 px-2 py-2 text-center text-xs font-medium border-l border-slate-200 dark:border-slate-800 first:border-l-0 ${month.isCurrentMonth
                                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                            : 'text-slate-500 dark:text-slate-400'}`, children: month.label }, index))) }), _jsx("div", { className: "space-y-2", children: epics.map((epic, epicIndex) => {
                                        const isExpanded = expandedEpics.has(epic.id);
                                        const epicColor = getEpicColor(epic, epicIndex);
                                        const barPosition = getBarPosition(epic.startDate, epic.targetDate);
                                        return (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: epicIndex * 0.05 }, children: [_jsxs("div", { className: "flex items-center group", children: [_jsx("div", { className: "w-64 shrink-0 pr-4", children: _jsxs("button", { onClick: () => toggleEpicExpanded(epic.id), className: "w-full text-left flex items-center gap-2 py-2 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 rounded-lg px-2 -ml-2 transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-[18px] transition-transform", style: { transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }, children: "chevron_right" }), _jsx("div", { className: "w-2 h-6 rounded-full shrink-0", style: { backgroundColor: epicColor } }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-mono text-[10px] text-slate-400", children: epic.issueKey }), _jsx("span", { className: `
                                  px-1.5 py-0.5 text-[9px] font-bold rounded uppercase
                                  ${epic.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                                  ${epic.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                                  ${epic.status === 'planned' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                                  ${epic.status === 'backlog' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : ''}
                                  ${epic.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                                `, children: epic.status.replace('_', ' ') })] }), _jsx("p", { className: "font-medium text-sm text-slate-900 dark:text-white truncate mt-0.5", children: epic.title }), _jsxs("p", { className: "text-[10px] text-slate-500 dark:text-slate-400", children: [epic.completedFeatures, "/", epic.featureCount, " features"] })] })] }) }), _jsxs("div", { className: "flex-1 h-12 relative", children: [_jsx("div", { className: "absolute inset-0 flex", children: timelineRange.months.map((month, index) => (_jsx("div", { className: `flex-1 border-l border-slate-100 dark:border-slate-800/50 first:border-l-0 ${month.isCurrentMonth ? 'bg-primary/5 dark:bg-primary/10' : ''}` }, index))) }), _jsxs("div", { className: "absolute top-1/2 -translate-y-1/2 h-6 rounded-full flex items-center overflow-hidden shadow-sm group/bar cursor-pointer", style: {
                                                                        left: barPosition.left,
                                                                        width: barPosition.width,
                                                                        backgroundColor: epicColor,
                                                                    }, children: [_jsx("div", { className: "absolute inset-y-0 left-0 bg-white/30 rounded-l-full", style: { width: `${epic.progress}%` } }), _jsxs("span", { className: "relative z-10 px-2 text-[10px] font-bold text-white truncate", children: [epic.progress, "%"] })] })] })] }), isExpanded && epic.features.length > 0 && (_jsx(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, className: "ml-8 border-l-2 border-slate-200 dark:border-slate-700 pl-4", children: epic.features.map((feature) => {
                                                        const featureBarPosition = getBarPosition(feature.startDate, feature.targetDate);
                                                        return (_jsxs("div", { className: "flex items-center py-1", children: [_jsxs("div", { className: "w-56 shrink-0 pr-4", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsx("span", { className: "font-mono text-[9px] text-slate-400", children: feature.issueKey }) }), _jsx("p", { className: "text-xs text-slate-700 dark:text-slate-300 truncate", children: feature.title }), _jsxs("p", { className: "text-[9px] text-slate-500 dark:text-slate-400", children: [feature.completedTasks, "/", feature.taskCount, " tasks"] })] }), _jsx("div", { className: "flex-1 h-6 relative", children: _jsx("div", { className: "absolute top-1/2 -translate-y-1/2 h-3 rounded-full overflow-hidden", style: {
                                                                            left: featureBarPosition.left,
                                                                            width: featureBarPosition.width,
                                                                            backgroundColor: `${epicColor}40`,
                                                                        }, children: _jsx("div", { className: "absolute inset-y-0 left-0 rounded-l-full", style: {
                                                                                width: `${feature.progress}%`,
                                                                                backgroundColor: epicColor,
                                                                            } }) }) })] }, feature.id));
                                                    }) }))] }, epic.id));
                                    }) }), _jsxs("div", { className: "mt-8 flex items-center justify-center gap-6 text-xs", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-3 rounded-full bg-slate-300 dark:bg-slate-600" }), _jsx("span", { className: "text-slate-500 dark:text-slate-400", children: "Backlog" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-3 rounded-full bg-blue-500" }), _jsx("span", { className: "text-slate-500 dark:text-slate-400", children: "Planned" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-3 rounded-full bg-amber-500" }), _jsx("span", { className: "text-slate-500 dark:text-slate-400", children: "In Progress" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-3 rounded-full bg-emerald-500" }), _jsx("span", { className: "text-slate-500 dark:text-slate-400", children: "Completed" })] })] })] })) : (
                        /* List View */
                        _jsx("div", { className: "p-6 max-w-4xl mx-auto space-y-6", children: epics.map((epic, epicIndex) => {
                                const epicColor = getEpicColor(epic, epicIndex);
                                const isExpanded = expandedEpics.has(epic.id);
                                return (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: epicIndex * 0.05 }, className: "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", children: [_jsx("button", { onClick: () => toggleEpicExpanded(epic.id), className: "w-full text-left p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-1.5 h-full min-h-[60px] rounded-full shrink-0", style: { backgroundColor: epicColor } }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "font-mono text-xs text-slate-400", children: epic.issueKey }), _jsx("span", { className: `
                              px-2 py-0.5 text-[10px] font-bold rounded uppercase
                              ${epic.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                              ${epic.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                              ${epic.status === 'planned' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                              ${epic.status === 'backlog' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : ''}
                            `, children: epic.status.replace('_', ' ') }), _jsx("span", { className: "text-xs text-slate-400", children: epic.productName })] }), _jsx("h3", { className: "font-bold text-lg text-slate-900 dark:text-white mb-2", children: epic.title }), epic.description && (_jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3", children: epic.description })), _jsx(RoadmapProgress, { title: "", progress: epic.progress, targetDate: epic.targetDate || undefined, color: epicColor }), _jsxs("div", { className: "flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400", children: [_jsxs("span", { children: [epic.featureCount, " features"] }), _jsxs("span", { children: [epic.completedFeatures, " completed"] }), epic.targetDate && (_jsxs("span", { children: ["Target: ", new Date(epic.targetDate).toLocaleDateString()] }))] })] }), _jsx("span", { className: "material-symbols-outlined text-slate-400 transition-transform shrink-0", style: { transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }, children: "expand_more" })] }) }), isExpanded && epic.features.length > 0 && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-5 space-y-3", children: epic.features.map((feature) => (_jsx(RoadmapProgress, { title: feature.title, issueKey: feature.issueKey, progress: feature.progress, targetDate: feature.targetDate || undefined, color: epicColor }, feature.id))) }))] }, epic.id));
                            }) })) })] })] }));
}
