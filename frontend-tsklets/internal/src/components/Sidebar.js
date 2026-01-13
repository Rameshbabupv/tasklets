import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import ThemeToggle from './ThemeToggle';
const navStructure = [
    {
        id: 'main',
        items: [
            { path: '/dashboard', emoji: '📊', icon: 'dashboard', label: 'Dashboard', roles: ['admin', 'support', 'integrator', 'ceo', 'developer'] },
        ],
    },
    {
        id: 'admin',
        title: 'Admin',
        items: [
            { path: '/products', emoji: '📦', icon: 'inventory_2', label: 'Products', roles: ['admin', 'support', 'integrator', 'ceo'] },
            { path: '/clients', emoji: '🏢', icon: 'group', label: 'Clients', roles: ['admin', 'support', 'integrator', 'ceo'] },
        ],
    },
    {
        id: 'tickets',
        title: 'Tickets',
        items: [
            { path: '/tickets', emoji: '🎫', icon: 'confirmation_number', label: 'Support Queue', roles: ['admin', 'support', 'integrator', 'ceo'] },
            { path: '/dev-tasks', emoji: '🛠️', icon: 'developer_board', label: 'Dev Tasks', roles: ['admin', 'ceo', 'developer'] },
        ],
    },
    {
        id: 'wip',
        title: 'Under Development',
        collapsible: true,
        defaultCollapsed: true,
        items: [
            { path: '/executive', emoji: '🎯', icon: 'monitoring', label: 'Executive', roles: ['ceo', 'admin'] },
            { path: '/roadmap', emoji: '🗺️', icon: 'map', label: 'Roadmap', roles: ['ceo', 'admin'] },
            { path: '/requirements', emoji: '📝', icon: 'description', label: 'Requirements', roles: ['admin', 'ceo', 'support'] },
            { path: '/my-tasks', emoji: '✅', icon: 'task_alt', label: 'My Tasks', roles: ['developer'] },
            { path: '/sprints', emoji: '🏃', icon: 'sprint', label: 'Sprints', roles: ['admin', 'ceo', 'developer'] },
            { path: '/backlog', emoji: '📋', icon: 'list', label: 'Backlog', roles: ['admin', 'ceo', 'developer'] },
            { path: '/ideas', emoji: '💡', icon: 'lightbulb', label: 'Ideas', roles: ['admin', 'support', 'integrator', 'ceo', 'developer'] },
            { path: '/ai-configs', emoji: '🤖', icon: 'psychology', label: 'AI Configs', roles: ['admin', 'ceo', 'developer'] },
            { path: '/tags', emoji: '🏷️', icon: 'label', label: 'Tags', roles: ['admin', 'ceo', 'developer'] },
            { path: '/api-keys', emoji: '🔑', icon: 'key', label: 'API Keys', roles: ['admin', 'ceo', 'developer'] },
        ],
    },
];
export default function Sidebar() {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved === 'true';
    });
    const [wipExpanded, setWipExpanded] = useState(() => {
        const saved = localStorage.getItem('sidebar-wip-expanded');
        return saved === 'true';
    });
    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', isCollapsed.toString());
    }, [isCollapsed]);
    useEffect(() => {
        localStorage.setItem('sidebar-wip-expanded', wipExpanded.toString());
    }, [wipExpanded]);
    // Filter sections and items based on user role
    const visibleSections = useMemo(() => {
        return navStructure
            .map(section => ({
            ...section,
            items: section.items.filter(item => item.roles.includes(user?.role || '')),
        }))
            .filter(section => section.items.length > 0);
    }, [user?.role]);
    const renderNavItem = (item, index, sectionId) => {
        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
        const isWip = sectionId === 'wip';
        return (_jsxs(motion.div, { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, transition: { delay: index * 0.03 }, className: "relative group/nav", children: [_jsxs(Link, { to: item.path, className: `flex items-center gap-3 px-3 py-2 rounded-lg transition-all group relative ${isActive
                        ? 'bg-gradient-spark text-white font-semibold shadow-md'
                        : isWip
                            ? 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-200'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-gradient-shimmer hover:border-primary/30'} ${isCollapsed ? 'justify-center' : ''}`, children: [_jsx("span", { className: `text-lg shrink-0 ${isWip && !isActive ? 'opacity-70' : ''}`, "aria-hidden": "true", children: item.emoji }), _jsx(AnimatePresence, { mode: "wait", children: !isCollapsed && (_jsx(motion.span, { initial: { opacity: 0, width: 0 }, animate: { opacity: 1, width: 'auto' }, exit: { opacity: 0, width: 0 }, transition: { duration: 0.2 }, className: "text-sm flex-1 overflow-hidden whitespace-nowrap", children: item.label })) }), isActive && !isCollapsed && (_jsx(motion.div, { layoutId: "activeIndicator", className: "size-1.5 rounded-full bg-white shrink-0" })), isActive && isCollapsed && (_jsx("div", { className: "absolute -right-1 top-1/2 -translate-y-1/2 size-2 rounded-full bg-white" }))] }), isCollapsed && (_jsx("div", { className: "absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/nav:opacity-100 transition-opacity duration-200 z-50", children: _jsxs("div", { className: "bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg", children: [item.label, isWip && _jsx("span", { className: "ml-1.5 text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded", children: "WIP" }), _jsx("div", { className: "absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" })] }) }))] }, item.path));
    };
    const renderSection = (section, sectionIndex) => {
        const isWip = section.id === 'wip';
        const showSection = !isWip || wipExpanded || isCollapsed;
        return (_jsxs("div", { className: "relative", children: [sectionIndex > 0 && (_jsx("div", { className: "mx-3 my-3 border-t border-slate-200 dark:border-slate-700" })), section.title && !isCollapsed && (_jsx("div", { className: "px-3 mb-2", children: section.collapsible ? (_jsxs("button", { onClick: () => setWipExpanded(!wipExpanded), className: "w-full flex items-center justify-between group", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500", children: section.title }), isWip && (_jsx("span", { className: "text-[9px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded font-semibold", children: "BETA" }))] }), _jsxs("div", { className: "flex items-center gap-1", children: [!wipExpanded && (_jsx("span", { className: "text-[10px] text-slate-400 dark:text-slate-500", children: section.items.length })), _jsx(motion.span, { animate: { rotate: wipExpanded ? 180 : 0 }, transition: { duration: 0.2 }, className: "material-symbols-outlined text-[14px] text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors", children: "expand_more" })] })] })) : (_jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500", children: section.title })) })), section.title && isCollapsed && sectionIndex > 0 && (_jsx("div", { className: "flex justify-center mb-2", children: isWip ? (_jsxs("button", { onClick: () => setWipExpanded(!wipExpanded), className: "p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group/wip relative", title: wipExpanded ? 'Collapse WIP section' : `Expand WIP section (${section.items.length} items)`, children: [_jsx("span", { className: "material-symbols-outlined text-[14px] text-amber-500", children: wipExpanded ? 'expand_less' : 'construction' }), _jsx("div", { className: "absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/wip:opacity-100 transition-opacity duration-200 z-50", children: _jsxs("div", { className: "bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg", children: [wipExpanded ? 'Collapse' : `${section.items.length} WIP features`, _jsx("div", { className: "absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" })] }) })] })) : (_jsx("div", { className: "w-8 h-px bg-slate-200 dark:bg-slate-700 rounded" })) })), _jsx(AnimatePresence, { mode: "wait", children: showSection && (_jsx(motion.div, { initial: section.collapsible ? { height: 0, opacity: 0 } : false, animate: { height: 'auto', opacity: 1 }, exit: section.collapsible ? { height: 0, opacity: 0 } : undefined, transition: { duration: 0.2 }, className: `flex flex-col gap-0.5 overflow-hidden ${isWip ? 'opacity-90' : ''}`, children: section.items.map((item, index) => renderNavItem(item, index, section.id)) })) })] }, section.id));
    };
    return (_jsxs(motion.aside, { animate: { width: isCollapsed ? 80 : 256 }, transition: { duration: 0.3, ease: 'easeInOut' }, className: "bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col shrink-0 relative", children: [_jsxs("div", { className: "p-6 flex items-center gap-3 justify-center", children: [_jsx("div", { className: "size-10 rounded-xl bg-gradient-spark flex items-center justify-center shadow-lg shadow-primary/20 text-white shrink-0", children: _jsx("span", { className: "material-symbols-outlined", "aria-hidden": "true", children: "support_agent" }) }), _jsx(AnimatePresence, { mode: "wait", children: !isCollapsed && (_jsxs(motion.div, { initial: { opacity: 0, width: 0 }, animate: { opacity: 1, width: 'auto' }, exit: { opacity: 0, width: 0 }, transition: { duration: 0.2 }, className: "overflow-hidden", children: [_jsx("h1", { className: "font-display font-bold text-lg tracking-tight bg-gradient-spark bg-clip-text text-transparent leading-none whitespace-nowrap", children: "SupportDesk" }), _jsx("span", { className: "text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap", children: "Internal" })] })) })] }), _jsx(motion.button, { onClick: () => setIsCollapsed(!isCollapsed), whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 }, className: "absolute -right-3 top-20 size-6 rounded-full bg-gradient-spark text-white shadow-lg hover:shadow-xl flex items-center justify-center z-10", "aria-label": isCollapsed ? 'Expand sidebar' : 'Collapse sidebar', children: _jsx(motion.span, { animate: { rotate: isCollapsed ? 0 : 180 }, transition: { duration: 0.3 }, className: "material-symbols-outlined text-[16px]", "aria-hidden": "true", children: "chevron_left" }) }), _jsx("nav", { className: "flex-1 px-3 flex flex-col overflow-y-auto", role: "navigation", "aria-label": "Main navigation", children: visibleSections.map((section, index) => renderSection(section, index)) }), !isCollapsed && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "px-4 mb-4", children: _jsxs("div", { className: "flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800", children: [_jsx("div", { className: "size-2 rounded-full bg-green-500 animate-pulse" }), _jsx("span", { className: "text-xs font-medium text-green-700 dark:text-green-400", children: "System Online" })] }) })), _jsx("div", { className: `px-4 mb-4 ${isCollapsed ? 'flex justify-center' : ''}`, children: _jsx(ThemeToggle, {}) }), _jsx("div", { className: `px-4 mb-4 ${isCollapsed ? 'flex justify-center' : ''}`, children: isCollapsed ? (_jsxs("div", { className: "relative group/build", children: [_jsx("div", { className: "size-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center cursor-help", children: _jsxs("span", { className: "text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400", children: ["#", __BUILD_NUMBER__] }) }), _jsx("div", { className: "absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/build:opacity-100 transition-opacity duration-200 z-50", children: _jsxs("div", { className: "bg-slate-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-lg", children: [_jsxs("div", { className: "font-semibold", children: ["v", __APP_VERSION__, " \u2022 Build #", __BUILD_NUMBER__] }), _jsx("div", { className: "text-slate-400 mt-1", children: new Date(__BUILD_DATE__).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }), _jsx("div", { className: "text-slate-500 font-mono", children: __GIT_HASH__ }), _jsx("div", { className: "absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" })] }) })] })) : (_jsxs("div", { className: "px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("span", { className: "text-[10px] font-semibold text-slate-600 dark:text-slate-300", children: ["v", __APP_VERSION__, " \u2022 Build #", __BUILD_NUMBER__] }) }), _jsxs("div", { className: "flex items-center justify-between mt-0.5", children: [_jsx("span", { className: "text-[10px] text-slate-400 dark:text-slate-500", children: new Date(__BUILD_DATE__).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }), _jsx("span", { className: "text-[10px] font-mono text-slate-400 dark:text-slate-500", children: __GIT_HASH__ })] })] })) }), _jsx("div", { className: "p-4 border-t border-slate-200 dark:border-slate-700", children: isCollapsed ? (_jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsxs("div", { className: "relative group/user", children: [_jsx("div", { className: "size-10 rounded-full bg-gradient-spark flex items-center justify-center text-white text-sm font-bold shadow-md cursor-pointer", children: user?.name?.charAt(0) || 'U' }), _jsx("div", { className: "absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/user:opacity-100 transition-opacity duration-200 z-50", children: _jsxs("div", { className: "bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg", children: [_jsx("div", { className: "font-semibold", children: user?.name }), _jsx("div", { className: "text-xs text-slate-300 capitalize", children: user?.role }), _jsx("div", { className: "absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" })] }) })] }), _jsxs("div", { className: "relative group/logout", children: [_jsx(motion.button, { onClick: logout, className: "text-slate-400 hover:text-primary transition-colors p-2 hover:bg-slate-100 rounded-lg", whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 }, "aria-label": "Logout", children: _jsx("span", { className: "material-symbols-outlined text-[20px]", "aria-hidden": "true", children: "logout" }) }), _jsx("div", { className: "absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/logout:opacity-100 transition-opacity duration-200 z-50", children: _jsxs("div", { className: "bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg", children: ["Logout", _jsx("div", { className: "absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" })] }) })] })] })) : (_jsxs("div", { className: "flex items-center gap-3 px-3 py-2 rounded-lg bg-gradient-to-br from-slate-50 to-purple-50/30 dark:from-slate-700 dark:to-purple-900/30 border border-slate-200 dark:border-slate-600 hover:border-primary/30 transition-all", children: [_jsx("div", { className: "size-8 rounded-full bg-gradient-spark flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0", children: user?.name?.charAt(0) || 'U' }), _jsx(AnimatePresence, { mode: "wait", children: _jsxs(motion.div, { initial: { opacity: 0, width: 0 }, animate: { opacity: 1, width: 'auto' }, exit: { opacity: 0, width: 0 }, transition: { duration: 0.2 }, className: "flex flex-col overflow-hidden flex-1", children: [_jsx("span", { className: "text-sm font-semibold truncate text-slate-900 dark:text-slate-100", children: user?.name }), _jsx("span", { className: "text-xs text-slate-500 dark:text-slate-400 truncate capitalize", children: user?.role })] }) }), _jsx(motion.button, { onClick: logout, className: "text-slate-400 hover:text-primary transition-colors p-1 hover:bg-white rounded shrink-0", whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 }, "aria-label": "Logout", children: _jsx("span", { className: "material-symbols-outlined text-[20px]", "aria-hidden": "true", children: "logout" }) })] })) })] }));
}
