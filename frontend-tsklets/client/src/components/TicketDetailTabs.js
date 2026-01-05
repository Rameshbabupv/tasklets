import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion } from 'framer-motion';
import TicketChangelog from './TicketChangelog';
export default function TicketDetailTabs({ ticketId, detailsContent, commentCount = 0, attachmentCount = 0, }) {
    const [activeTab, setActiveTab] = useState('details');
    const tabs = [
        {
            id: 'details',
            label: 'Details',
            icon: 'description',
            badge: commentCount + attachmentCount > 0 ? commentCount + attachmentCount : undefined,
        },
        {
            id: 'changelog',
            label: 'Changelog',
            icon: 'history',
        },
    ];
    return (_jsxs("div", { className: "rounded-xl border shadow-sm overflow-hidden", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "relative border-b", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50" }), _jsx("div", { className: "relative flex gap-1 p-1", children: tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `
                  relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}
                `, children: [isActive && (_jsx(motion.div, { layoutId: "activeTabBg", className: "absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm", style: { borderColor: 'var(--border-primary)' }, transition: { type: 'spring', bounce: 0.2, duration: 0.4 } })), _jsxs("span", { className: "relative flex items-center gap-2", children: [_jsx("span", { className: `material-symbols-outlined text-lg transition-transform ${isActive ? 'scale-110' : ''}`, children: tab.icon }), _jsx("span", { children: tab.label }), tab.badge !== undefined && tab.badge > 0 && (_jsx("span", { className: `
                      min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-bold
                      ${isActive
                                                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}
                    `, children: tab.badge > 99 ? '99+' : tab.badge }))] })] }, tab.id));
                        }) })] }), _jsxs("div", { className: "p-6", children: [activeTab === 'details' && (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 }, children: detailsContent })), activeTab === 'changelog' && (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 }, children: _jsx(TicketChangelog, { ticketId: ticketId }) }))] })] }));
}
