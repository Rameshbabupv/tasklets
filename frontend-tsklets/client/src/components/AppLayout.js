import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { useAuthStore } from '../store/auth';
import ThemeToggle from './ThemeToggle';
import NewTicketModal from './NewTicketModal';
import ChangePasswordModal from './ChangePasswordModal';
// Sidebar link component
function SidebarLink({ icon, label, to, onClick, badge, badgeColor = 'bg-slate-500', collapsed = false, primary = false }) {
    const location = useLocation();
    const isActive = to ? location.pathname === to : false;
    const content = (_jsxs(motion.div, { whileHover: { x: collapsed ? 0 : 4 }, whileTap: { scale: 0.98 }, className: `
        relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group
        ${primary
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
            : isActive
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'}
        ${collapsed ? 'justify-center' : ''}
      `, title: collapsed ? label : undefined, children: [_jsx("span", { className: `material-symbols-outlined text-xl shrink-0 ${primary ? '' : isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'}`, children: icon }), !collapsed && (_jsxs(_Fragment, { children: [_jsx("span", { className: `font-medium text-sm truncate ${primary ? 'text-white' : ''}`, style: primary ? {} : { color: 'var(--text-primary)' }, children: label }), badge !== undefined && badge > 0 && (_jsx("span", { className: `ml-auto min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-bold text-white ${badgeColor}`, children: badge > 99 ? '99+' : badge }))] })), collapsed && badge !== undefined && badge > 0 && (_jsx("span", { className: `absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold text-white ${badgeColor}`, children: badge > 9 ? '9+' : badge }))] }));
    if (to) {
        return _jsx(Link, { to: to, children: content });
    }
    return _jsx("div", { onClick: onClick, children: content });
}
export default function AppLayout() {
    const { user, token, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    // Sidebar is collapsed by default, expands on hover
    const [collapsed, setCollapsed] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showNewTicketModal, setShowNewTicketModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [ticketStats, setTicketStats] = useState({ total: 0, pendingReview: 0 });
    // Check password change requirement
    useEffect(() => {
        if (user?.requirePasswordChange) {
            setShowChangePasswordModal(true);
        }
    }, [user?.requirePasswordChange]);
    // Fetch ticket stats for badges
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/tickets', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                const tickets = data.tickets || [];
                setTicketStats({
                    total: tickets.length,
                    pendingReview: tickets.filter((t) => t.status === 'pending_internal_review').length,
                });
            }
            catch (err) {
                console.error('Failed to fetch ticket stats:', err);
            }
        };
        fetchStats();
    }, [token, location.pathname]); // Refetch when route changes
    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const isCompanyAdmin = user?.role === 'company_admin' || user?.role === 'admin';
    const sidebarWidth = collapsed ? 'w-16' : 'w-60';
    return (_jsxs("div", { className: "min-h-screen bg-slate-50 dark:bg-slate-900", children: [_jsxs("header", { className: "fixed top-0 left-0 right-0 z-40 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b flex items-center justify-between px-4", style: { borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => setMobileOpen(!mobileOpen), className: "lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", children: _jsx("span", { className: "material-symbols-outlined", children: "menu" }) }), _jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: "flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md", children: _jsx("span", { className: "material-symbols-outlined text-lg", children: "support_agent" }) }), _jsx("span", { className: "hidden sm:block font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent", children: "Support Desk" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ThemeToggle, {}), _jsxs("div", { className: "hidden md:flex items-center gap-2 pl-2 border-l", style: { borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm font-semibold", style: { color: 'var(--text-primary)' }, children: user?.name }), _jsx("p", { className: "text-xs capitalize", style: { color: 'var(--text-muted)' }, children: user?.role?.replace('_', ' ') })] }), _jsx("button", { onClick: handleLogout, className: "p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition-colors", title: "Logout", children: _jsx("span", { className: "material-symbols-outlined", children: "logout" }) })] })] })] }), _jsxs("aside", { onMouseEnter: () => setCollapsed(false), onMouseLeave: () => setCollapsed(true), className: `hidden lg:flex flex-col fixed left-0 top-14 bottom-0 ${sidebarWidth} border-r p-3 transition-all duration-300 z-30`, style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex-1 space-y-1", children: [_jsx(SidebarLink, { icon: "add_circle", label: "Create Ticket", onClick: () => setShowNewTicketModal(true), collapsed: collapsed, primary: true }), !collapsed && (_jsx("div", { className: "pt-4 pb-2", children: _jsx("p", { className: "px-3 text-[10px] font-semibold uppercase tracking-wider", style: { color: 'var(--text-muted)' }, children: "Navigation" }) })), collapsed && _jsx("div", { className: "h-4" }), _jsx(SidebarLink, { icon: "home", label: "Dashboard", to: "/", collapsed: collapsed }), _jsx(SidebarLink, { icon: "confirmation_number", label: "Tickets", to: "/tickets", badge: ticketStats.total, badgeColor: "bg-slate-500", collapsed: collapsed }), isCompanyAdmin && (_jsx(SidebarLink, { icon: "inbox", label: "Internal Triage", to: "/triage", badge: ticketStats.pendingReview, badgeColor: ticketStats.pendingReview > 0 ? 'bg-orange-500' : 'bg-slate-400', collapsed: collapsed })), !collapsed && (_jsx("div", { className: "pt-4 pb-2", children: _jsx("p", { className: "px-3 text-[10px] font-semibold uppercase tracking-wider", style: { color: 'var(--text-muted)' }, children: "Resources" }) })), collapsed && _jsx("div", { className: "h-4" }), _jsx(SidebarLink, { icon: "menu_book", label: "Knowledge Base", to: "/help", collapsed: collapsed }), isCompanyAdmin && (_jsx(SidebarLink, { icon: "group", label: "User Management", to: "/users", collapsed: collapsed }))] }), _jsx("div", { className: "mt-auto pt-4 space-y-3", children: collapsed ? (_jsx("div", { className: "flex justify-center", children: _jsxs("div", { className: "relative group/build", children: [_jsx("div", { className: "size-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center cursor-help", children: _jsxs("span", { className: "text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400", children: ["#", __BUILD_NUMBER__] }) }), _jsxs("div", { className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover/build:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50", children: [_jsxs("div", { className: "font-semibold", children: ["v", __APP_VERSION__, " \u2022 Build #", __BUILD_NUMBER__] }), _jsxs("div", { className: "text-slate-300 mt-0.5 text-[10px]", children: [new Date(__BUILD_DATE__).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), " \u2022 ", __GIT_HASH__] }), _jsx("div", { className: "absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" })] })] }) })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border", style: { borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center gap-2 mb-1.5", children: [_jsx("span", { className: "text-lg", children: "\uD83D\uDCA1" }), _jsx("p", { className: "font-semibold text-xs", style: { color: 'var(--text-primary)' }, children: "Need Help?" })] }), _jsx("p", { className: "text-[11px] mb-2", style: { color: 'var(--text-secondary)' }, children: "Browse our knowledge base." }), _jsxs(Link, { to: "/help", className: "inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline", children: ["View articles", _jsx("span", { className: "material-symbols-outlined text-xs", children: "arrow_forward" })] })] }), _jsxs("div", { className: "px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("span", { className: "text-xs font-semibold text-slate-600 dark:text-slate-300", children: ["v", __APP_VERSION__, " \u2022 Build #", __BUILD_NUMBER__] }) }), _jsxs("div", { className: "flex items-center justify-between mt-1", children: [_jsx("span", { className: "text-[11px] text-slate-400 dark:text-slate-500", children: new Date(__BUILD_DATE__).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }), _jsx("span", { className: "text-[10px] font-mono text-slate-400 dark:text-slate-500", children: __GIT_HASH__ })] })] })] })) })] }), _jsx(AnimatePresence, { children: mobileOpen && (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: () => setMobileOpen(false), className: "fixed inset-0 bg-black/50 z-40 lg:hidden" }), _jsxs(motion.aside, { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' }, transition: { type: 'spring', damping: 25, stiffness: 300 }, className: "fixed left-0 top-0 bottom-0 w-72 z-50 p-4 lg:hidden overflow-y-auto", style: { backgroundColor: 'var(--bg-card)' }, children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: "flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white", children: _jsx("span", { className: "material-symbols-outlined text-lg", children: "support_agent" }) }), _jsx("span", { className: "font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent", children: "Support Desk" })] }), _jsx("button", { onClick: () => setMobileOpen(false), className: "p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800", children: _jsx("span", { className: "material-symbols-outlined", children: "close" }) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(SidebarLink, { icon: "add_circle", label: "Create Ticket", onClick: () => { setShowNewTicketModal(true); setMobileOpen(false); }, primary: true }), _jsx(SidebarLink, { icon: "home", label: "Dashboard", to: "/" }), _jsx(SidebarLink, { icon: "confirmation_number", label: "Tickets", to: "/tickets", badge: ticketStats.total, badgeColor: "bg-slate-500" }), isCompanyAdmin && _jsx(SidebarLink, { icon: "inbox", label: "Internal Triage", to: "/triage", badge: ticketStats.pendingReview, badgeColor: "bg-orange-500" }), _jsx(SidebarLink, { icon: "menu_book", label: "Knowledge Base", to: "/help" }), isCompanyAdmin && _jsx(SidebarLink, { icon: "group", label: "User Management", to: "/users" })] }), _jsx("div", { className: "absolute bottom-4 left-4 right-4", children: _jsxs("div", { className: "flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-sm", style: { color: 'var(--text-primary)' }, children: user?.name }), _jsx("p", { className: "text-xs capitalize", style: { color: 'var(--text-muted)' }, children: user?.role?.replace('_', ' ') })] }), _jsx("button", { onClick: handleLogout, className: "p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600", children: _jsx("span", { className: "material-symbols-outlined", children: "logout" }) })] }) })] })] })) }), _jsx("main", { className: `pt-14 min-h-screen transition-all duration-300 ${collapsed ? 'lg:pl-16' : 'lg:pl-60'}`, children: _jsx("div", { className: "p-4 lg:p-6", children: _jsx(Outlet, {}) }) }), _jsx(motion.button, { onClick: () => setShowNewTicketModal(true), whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, className: "fixed right-4 bottom-4 lg:hidden w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center z-30", children: _jsx("span", { className: "material-symbols-outlined text-2xl", children: "add" }) }), _jsx(ChangePasswordModal, { isOpen: showChangePasswordModal, canDismiss: false, onSuccess: () => setShowChangePasswordModal(false) }), _jsx(NewTicketModal, { isOpen: showNewTicketModal, onClose: () => setShowNewTicketModal(false) }), _jsx(Toaster, { position: "top-right", richColors: true })] }));
}
