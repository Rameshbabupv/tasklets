import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { useCreateHub } from '../../store/createHub';
const hierarchy = [
    {
        id: 'idea',
        label: 'Idea',
        icon: '💡',
        color: 'from-yellow-500 to-amber-500',
        description: 'Start with a spark',
        level: 0,
    },
    {
        id: 'requirement',
        label: 'Requirement',
        icon: '📝',
        color: 'from-blue-500 to-indigo-500',
        description: 'Plan with structure',
        level: 1,
    },
    {
        id: 'epic',
        label: 'Epic',
        icon: '🎯',
        color: 'from-purple-500 to-pink-500',
        description: 'Define initiatives',
        level: 2,
    },
    {
        id: 'feature',
        label: 'Feature',
        icon: '✨',
        color: 'from-cyan-500 to-blue-500',
        description: 'Build capabilities',
        level: 3,
    },
    {
        id: 'task',
        label: 'Task',
        icon: '✅',
        color: 'from-green-500 to-emerald-500',
        description: 'Execute work',
        level: 4,
    },
    {
        id: 'bug',
        label: 'Bug',
        icon: '🐛',
        color: 'from-red-500 to-rose-500',
        description: 'Fix issues',
        level: 4,
    },
    {
        id: 'ticket',
        label: 'Ticket',
        icon: '🎫',
        color: 'from-orange-500 to-amber-500',
        description: 'Support customers',
        level: 0,
        separate: true
    },
];
export default function FlowMode() {
    const { selectType } = useCreateHub();
    return (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, className: "p-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h3", { className: "text-2xl font-bold text-slate-900 dark:text-white mb-2", children: "Choose Your Starting Point" }), _jsx("p", { className: "text-slate-500 dark:text-slate-400", children: "Follow the natural flow from idea to implementation" })] }), _jsxs("div", { className: "relative", children: [_jsxs("svg", { className: "absolute inset-0 w-full h-full pointer-events-none", style: { zIndex: 0 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "flowGradient", x1: "0%", y1: "0%", x2: "100%", y2: "0%", children: [_jsx("stop", { offset: "0%", stopColor: "rgb(139, 92, 246)", stopOpacity: "0.3" }), _jsx("stop", { offset: "50%", stopColor: "rgb(217, 70, 239)", stopOpacity: "0.3" }), _jsx("stop", { offset: "100%", stopColor: "rgb(59, 130, 246)", stopOpacity: "0.3" })] }) }), _jsx(motion.path, { d: "M 150 80 Q 300 80 300 180 Q 300 280 450 280 Q 600 280 600 380 Q 600 480 750 480", stroke: "url(#flowGradient)", strokeWidth: "3", fill: "none", strokeDasharray: "8 4", initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 2, ease: 'easeInOut' } })] }), _jsxs("div", { className: "grid grid-cols-3 gap-6 relative z-10", children: [_jsx(motion.div, { className: "col-span-1", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 }, children: _jsx(NodeCard, { node: hierarchy[0], onSelect: selectType }) }), _jsx(motion.div, { className: "col-span-1", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 }, children: _jsx(NodeCard, { node: hierarchy[1], onSelect: selectType }) }), _jsx("div", { className: "col-span-1" }), _jsx("div", { className: "col-span-1" }), _jsx(motion.div, { className: "col-span-1", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 }, children: _jsx(NodeCard, { node: hierarchy[2], onSelect: selectType }) }), _jsx("div", { className: "col-span-1" }), _jsx("div", { className: "col-span-1" }), _jsx("div", { className: "col-span-1" }), _jsx(motion.div, { className: "col-span-1", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.4 }, children: _jsx(NodeCard, { node: hierarchy[3], onSelect: selectType }) }), _jsx("div", { className: "col-span-1" }), _jsx(motion.div, { className: "col-span-1", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.5 }, children: _jsx(NodeCard, { node: hierarchy[4], onSelect: selectType }) }), _jsx(motion.div, { className: "col-span-1", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.6 }, children: _jsx(NodeCard, { node: hierarchy[5], onSelect: selectType }) })] }), _jsxs(motion.div, { className: "mt-8 pt-6 border-t-2 border-dashed border-slate-300 dark:border-slate-700", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.7 }, children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" }), _jsx("span", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Support Flow (Independent)" }), _jsx("div", { className: "h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" })] }), _jsx("div", { className: "flex justify-center", children: _jsx(NodeCard, { node: hierarchy[6], onSelect: selectType, large: true }) })] })] })] }));
}
// Node card component
function NodeCard({ node, onSelect, large = false }) {
    return (_jsx(motion.button, { onClick: () => onSelect(node.id), className: "group relative w-full", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: _jsxs("div", { className: `relative ${large ? 'p-6' : 'p-4'} rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden transition-all group-hover:border-violet-400 dark:group-hover:border-violet-600 group-hover:shadow-2xl`, children: [_jsx(motion.div, { className: `absolute inset-0 bg-gradient-to-br ${node.color} opacity-0 group-hover:opacity-10 transition-opacity` }), _jsx("div", { className: "relative flex justify-center mb-3", children: _jsx("div", { className: `${large ? 'size-16 text-3xl' : 'size-12 text-2xl'} rounded-xl bg-gradient-to-br ${node.color} flex items-center justify-center shadow-lg`, children: node.icon }) }), _jsxs("div", { className: "relative text-center", children: [_jsx("div", { className: `${large ? 'text-lg' : 'text-base'} font-bold text-slate-900 dark:text-white mb-1`, children: node.label }), _jsx("div", { className: `${large ? 'text-sm' : 'text-xs'} text-slate-500 dark:text-slate-400`, children: node.description })] }), _jsx(motion.div, { className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100", animate: {
                        x: ['-200%', '200%']
                    }, transition: {
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: 'loop'
                    } })] }) }));
}
