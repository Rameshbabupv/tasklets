import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { useCreateHub } from '../../store/createHub';
const createTypes = [
    {
        id: 'idea',
        label: 'Idea',
        description: 'Quick brainstorm or feature concept',
        icon: '💡',
        color: 'from-yellow-500 to-amber-500',
        keywords: ['spark', 'brainstorm', 'thought']
    },
    {
        id: 'requirement',
        label: 'Requirement',
        description: 'Structured planning with Claude',
        icon: '📝',
        color: 'from-blue-500 to-indigo-500',
        keywords: ['spec', 'plan', 'document']
    },
    {
        id: 'epic',
        label: 'Epic',
        description: 'High-level initiative or theme',
        icon: '🎯',
        color: 'from-purple-500 to-pink-500',
        keywords: ['initiative', 'theme', 'goal']
    },
    {
        id: 'feature',
        label: 'Feature',
        description: 'User-facing functionality',
        icon: '✨',
        color: 'from-cyan-500 to-blue-500',
        keywords: ['functionality', 'capability']
    },
    {
        id: 'task',
        label: 'Task',
        description: 'Development work item',
        icon: '✅',
        color: 'from-green-500 to-emerald-500',
        keywords: ['todo', 'work', 'story']
    },
    {
        id: 'bug',
        label: 'Bug',
        description: 'Defect or issue to fix',
        icon: '🐛',
        color: 'from-red-500 to-rose-500',
        keywords: ['defect', 'issue', 'problem', 'fix']
    },
    {
        id: 'ticket',
        label: 'Ticket',
        description: 'Customer support request',
        icon: '🎫',
        color: 'from-orange-500 to-amber-500',
        keywords: ['support', 'customer', 'help']
    },
];
export default function QuickMode() {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { selectType, context, close } = useCreateHub();
    const filtered = useMemo(() => {
        if (!search)
            return createTypes;
        const query = search.toLowerCase();
        return createTypes.filter(type => type.label.toLowerCase().includes(query) ||
            type.description.toLowerCase().includes(query) ||
            type.keywords.some(k => k.includes(query)));
    }, [search]);
    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            }
            else if (e.key === 'Enter' && filtered[selectedIndex]) {
                e.preventDefault();
                selectType(filtered[selectedIndex].id);
            }
            else if (e.key === 'Escape') {
                e.preventDefault();
                close();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filtered, selectedIndex, selectType, close]);
    return (_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "p-6", children: [_jsxs("div", { className: "relative mb-4", children: [_jsx("div", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400", children: _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("path", { d: "m21 21-4.35-4.35", strokeLinecap: "round" })] }) }), _jsx("input", { type: "text", value: search, onChange: (e) => {
                            setSearch(e.target.value);
                            setSelectedIndex(0);
                        }, placeholder: "Search creation types...", autoFocus: true, className: "w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-900 dark:text-white placeholder:text-slate-400" })] }), context.suggestedType && (_jsx(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, className: "mb-4 px-4 py-3 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl", children: _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("span", { className: "text-violet-600 dark:text-violet-400", children: "\uD83D\uDCA1 Suggested:" }), _jsxs("span", { className: "font-medium text-violet-900 dark:text-violet-200", children: ["Create ", context.suggestedType, " based on current view"] })] }) })), _jsx("div", { className: "space-y-2 max-h-[400px] overflow-y-auto", children: filtered.map((type, index) => (_jsxs(motion.button, { onClick: () => selectType(type.id), onMouseEnter: () => setSelectedIndex(index), className: `w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${index === selectedIndex
                        ? 'bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/50 dark:to-fuchsia-950/50 border-2 border-violet-300 dark:border-violet-700 shadow-lg scale-[1.02]'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-800'}`, initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: index * 0.05 }, children: [_jsx("div", { className: `size-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center text-2xl shadow-lg shrink-0`, children: type.icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "font-semibold text-slate-900 dark:text-white", children: type.label }), _jsx("div", { className: "text-sm text-slate-500 dark:text-slate-400 truncate", children: type.description })] }), index === selectedIndex && (_jsx(motion.div, { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, className: "flex items-center gap-1 text-xs font-mono text-slate-400", children: _jsx("kbd", { className: "px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded", children: "\u21B5" }) }))] }, type.id))) }), _jsxs("div", { className: "mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded", children: "\u2191" }), _jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded", children: "\u2193" }), "navigate"] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded", children: "\u21B5" }), "select"] })] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded", children: "esc" }), "close"] })] })] }));
}
