import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
export default function ProgressBar({ progress, label, sublabel, showPercentage = true, size = 'md', status = 'default', color, animate = true, }) {
    const clampedProgress = Math.min(100, Math.max(0, progress));
    // Size configurations
    const sizeConfig = {
        sm: { height: 'h-1.5', text: 'text-xs', labelGap: 'gap-1' },
        md: { height: 'h-2.5', text: 'text-sm', labelGap: 'gap-1.5' },
        lg: { height: 'h-4', text: 'text-base', labelGap: 'gap-2' },
    };
    // Status-based colors
    const getStatusColor = () => {
        if (color)
            return color;
        switch (status) {
            case 'on-track':
                return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
            case 'at-risk':
                return 'bg-gradient-to-r from-amber-500 to-amber-400';
            case 'delayed':
                return 'bg-gradient-to-r from-red-500 to-red-400';
            case 'completed':
                return 'bg-gradient-to-r from-blue-500 to-blue-400';
            default:
                return 'bg-gradient-to-r from-slate-500 to-slate-400';
        }
    };
    const getStatusBgColor = () => {
        switch (status) {
            case 'on-track':
                return 'bg-emerald-100 dark:bg-emerald-900/30';
            case 'at-risk':
                return 'bg-amber-100 dark:bg-amber-900/30';
            case 'delayed':
                return 'bg-red-100 dark:bg-red-900/30';
            case 'completed':
                return 'bg-blue-100 dark:bg-blue-900/30';
            default:
                return 'bg-slate-100 dark:bg-slate-800';
        }
    };
    const getStatusTextColor = () => {
        switch (status) {
            case 'on-track':
                return 'text-emerald-600 dark:text-emerald-400';
            case 'at-risk':
                return 'text-amber-600 dark:text-amber-400';
            case 'delayed':
                return 'text-red-600 dark:text-red-400';
            case 'completed':
                return 'text-blue-600 dark:text-blue-400';
            default:
                return 'text-slate-600 dark:text-slate-400';
        }
    };
    const config = sizeConfig[size];
    return (_jsxs("div", { className: `w-full ${config.labelGap} flex flex-col`, children: [(label || showPercentage) && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-baseline gap-2 min-w-0", children: [label && (_jsx("span", { className: `${config.text} font-medium text-slate-900 dark:text-white truncate`, children: label })), sublabel && (_jsx("span", { className: "text-xs text-slate-500 dark:text-slate-400 truncate", children: sublabel }))] }), showPercentage && (_jsxs("span", { className: `${config.text} font-bold ${getStatusTextColor()} tabular-nums shrink-0`, children: [clampedProgress, "%"] }))] })), _jsxs("div", { className: `relative w-full ${config.height} ${getStatusBgColor()} rounded-full overflow-hidden`, children: [_jsx("div", { className: `
            absolute inset-y-0 left-0 rounded-full ${getStatusColor()}
            ${animate ? 'transition-all duration-700 ease-out' : ''}
          `, style: { width: `${clampedProgress}%` }, children: clampedProgress > 0 && clampedProgress < 100 && animate && (_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" })) }), size === 'lg' && (_jsxs(_Fragment, { children: [_jsx("div", { className: "absolute top-0 bottom-0 left-1/4 w-px bg-white/30" }), _jsx("div", { className: "absolute top-0 bottom-0 left-1/2 w-px bg-white/30" }), _jsx("div", { className: "absolute top-0 bottom-0 left-3/4 w-px bg-white/30" })] }))] }), _jsx("style", { children: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      ` })] }));
}
export function RoadmapProgress({ title, issueKey, progress, targetDate, status = 'default', color, children, onClick, }) {
    // Auto-determine status based on progress and target date
    const autoStatus = () => {
        if (progress >= 100)
            return 'completed';
        if (!targetDate)
            return status || 'default';
        const now = new Date();
        const target = new Date(targetDate);
        const daysRemaining = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        // If past due date
        if (daysRemaining < 0)
            return 'delayed';
        // If less than 7 days and less than 80% complete
        if (daysRemaining < 7 && progress < 80)
            return 'at-risk';
        // If less than 14 days and less than 60% complete
        if (daysRemaining < 14 && progress < 60)
            return 'at-risk';
        return 'on-track';
    };
    const finalStatus = status || autoStatus();
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    return (_jsxs("div", { className: `group ${onClick ? 'cursor-pointer' : ''}`, onClick: onClick, children: [_jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [color && (_jsx("div", { className: "w-1.5 h-4 rounded-full shrink-0", style: { backgroundColor: color } })), _jsx("span", { className: "font-medium text-sm text-slate-900 dark:text-white truncate group-hover:text-primary dark:group-hover:text-blue-400 transition-colors", children: title }), issueKey && (_jsx("span", { className: "text-xs text-slate-400 dark:text-slate-500 font-mono shrink-0", children: issueKey }))] }), _jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [targetDate && (_jsx("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: formatDate(targetDate) })), _jsxs("span", { className: `
            text-sm font-bold tabular-nums
            ${finalStatus === 'on-track' ? 'text-emerald-600 dark:text-emerald-400' : ''}
            ${finalStatus === 'at-risk' ? 'text-amber-600 dark:text-amber-400' : ''}
            ${finalStatus === 'delayed' ? 'text-red-600 dark:text-red-400' : ''}
            ${finalStatus === 'completed' ? 'text-blue-600 dark:text-blue-400' : ''}
            ${finalStatus === 'default' ? 'text-slate-600 dark:text-slate-400' : ''}
          `, children: [progress, "%"] })] })] }), _jsx(ProgressBar, { progress: progress, showPercentage: false, size: "sm", status: finalStatus, color: color }), children && (_jsx("div", { className: "ml-4 mt-2 space-y-2 border-l-2 border-slate-200 dark:border-slate-700 pl-3", children: children }))] }));
}
