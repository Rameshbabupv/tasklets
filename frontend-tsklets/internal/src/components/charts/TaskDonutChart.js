import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function TaskDonutChart({ data, size = 180, strokeWidth = 24, centerLabel, centerValue, }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
        return (_jsx("div", { className: "flex items-center justify-center text-slate-400 dark:text-slate-500", style: { width: size, height: size }, children: _jsxs("div", { className: "text-center", children: [_jsx("span", { className: "material-symbols-outlined text-4xl mb-2", children: "pie_chart" }), _jsx("p", { className: "text-sm", children: "No task data" })] }) }));
    }
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;
    // Calculate segments
    let cumulativeOffset = 0;
    const segments = data
        .filter(item => item.value > 0)
        .map((item) => {
        const percentage = (item.value / total) * 100;
        const strokeDasharray = (percentage / 100) * circumference;
        const strokeDashoffset = -cumulativeOffset;
        cumulativeOffset += strokeDasharray;
        return {
            ...item,
            percentage,
            strokeDasharray,
            strokeDashoffset,
        };
    });
    return (_jsxs("div", { className: "relative inline-block", children: [_jsxs("svg", { width: size, height: size, className: "transform -rotate-90", children: [_jsx("circle", { cx: center, cy: center, r: radius, fill: "none", stroke: "currentColor", strokeWidth: strokeWidth, className: "text-slate-100 dark:text-slate-800" }), segments.map((segment, index) => (_jsx("circle", { cx: center, cy: center, r: radius, fill: "none", stroke: segment.color, strokeWidth: strokeWidth, strokeDasharray: `${segment.strokeDasharray} ${circumference}`, strokeDashoffset: segment.strokeDashoffset, strokeLinecap: "round", className: "transition-all duration-700 ease-out dark:opacity-90", style: {
                            animation: `donut-segment-${index} 0.8s ease-out forwards`,
                            animationDelay: `${index * 0.1}s`,
                        } }, index)))] }), _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [centerValue !== undefined && (_jsx("span", { className: "text-3xl font-bold text-slate-900 dark:text-white tracking-tight", children: centerValue })), centerLabel && (_jsx("span", { className: "text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide", children: centerLabel }))] }), _jsx("div", { className: "mt-4 space-y-2", children: segments.map((segment, index) => (_jsxs("div", { className: "flex items-center justify-between gap-3 text-sm group cursor-default", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("div", { className: "w-3 h-3 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-900 shadow-sm", style: { backgroundColor: segment.color } }), _jsx("span", { className: "text-slate-600 dark:text-slate-400 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors", children: segment.label })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [_jsx("span", { className: "font-semibold text-slate-900 dark:text-white tabular-nums", children: segment.value }), _jsxs("span", { className: "text-xs text-slate-400 dark:text-slate-500 tabular-nums w-10 text-right", children: [segment.percentage.toFixed(0), "%"] })] })] }, index))) }), _jsx("style", { children: `
        @keyframes donut-segment-0 { from { stroke-dasharray: 0 ${circumference}; } }
        @keyframes donut-segment-1 { from { stroke-dasharray: 0 ${circumference}; } }
        @keyframes donut-segment-2 { from { stroke-dasharray: 0 ${circumference}; } }
        @keyframes donut-segment-3 { from { stroke-dasharray: 0 ${circumference}; } }
        @keyframes donut-segment-4 { from { stroke-dasharray: 0 ${circumference}; } }
      ` })] }));
}
