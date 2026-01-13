import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/auth';
import { StatusBadge, PriorityPill } from '@tsklets/ui';
import { formatDate } from '@tsklets/utils';
import NewTicketModal from '../components/NewTicketModal';
import TicketDetailModal from '../components/TicketDetailModal';
// Compact stat card component
function StatCard({ icon, label, value, color, active, onClick }) {
    return (_jsxs(motion.div, { whileHover: { scale: 1.02, y: -2 }, whileTap: { scale: 0.98 }, onClick: onClick, className: `flex items-center gap-3 p-4 rounded-xl border backdrop-blur-sm cursor-pointer transition-all ${color} ${active ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900' : ''}`, style: { borderColor: active ? 'transparent' : 'var(--border-primary)' }, children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-white/50 dark:bg-black/20 flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-xl", children: icon }) }), _jsxs("div", { children: [_jsx("span", { className: "text-2xl font-bold", children: value }), _jsx("p", { className: "text-xs font-medium opacity-80 uppercase tracking-wide", children: label })] })] }));
}
// Get initials from name
function getInitials(name) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
// Generate consistent color from string
function stringToColor(str) {
    const colors = [
        'bg-rose-500', 'bg-pink-500', 'bg-fuchsia-500', 'bg-purple-500',
        'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500',
        'bg-teal-500', 'bg-emerald-500', 'bg-amber-500', 'bg-orange-500',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}
export default function Dashboard() {
    console.log('🚀 Dashboard component loaded - v2');
    const { user, token } = useAuthStore();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewTicketModal, setShowNewTicketModal] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    useEffect(() => {
        fetchTickets();
    }, []);
    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/tickets', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setTickets(data.tickets || []);
        }
        catch (err) {
            console.error('Failed to fetch tickets:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const stats = {
        pendingReview: tickets.filter((t) => t.status === 'pending_internal_review').length,
        open: tickets.filter((t) => t.status === 'open').length,
        inProgress: tickets.filter((t) => t.status === 'in_progress').length,
        resolved: tickets.filter((t) => t.status === 'resolved').length,
        closed: tickets.filter((t) => t.status === 'closed').length,
        totalActive: tickets.filter((t) => t.status !== 'closed' && t.status !== 'cancelled').length,
        total: tickets.length,
    };
    // Filter tickets based on selected status
    const filteredTickets = statusFilter === 'all'
        ? tickets
        : tickets.filter(t => t.status === statusFilter);
    const isCompanyAdmin = user?.role === 'company_admin';
    // Handle stat card click
    const handleStatClick = (filter) => {
        setStatusFilter(prev => prev === filter ? 'all' : filter);
    };
    return (_jsxs(_Fragment, { children: [_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-1", style: { color: 'var(--text-primary)' }, children: "Team Dashboard" }), _jsx("p", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: stats.pendingReview > 0
                            ? `${stats.pendingReview} ticket${stats.pendingReview > 1 ? 's' : ''} pending review • ${stats.totalActive} total active`
                            : stats.totalActive > 0
                                ? `Your team has ${stats.totalActive} active ticket${stats.totalActive > 1 ? 's' : ''}.`
                                : 'All caught up! No active tickets at the moment.' })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 }, className: "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6", children: [_jsx(StatCard, { icon: "inbox", label: "Pending Review", value: stats.pendingReview, color: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400", active: statusFilter === 'pending_internal_review', onClick: () => handleStatClick('pending_internal_review') }), _jsx(StatCard, { icon: "folder_open", label: "Open", value: stats.open, color: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400", active: statusFilter === 'open', onClick: () => handleStatClick('open') }), _jsx(StatCard, { icon: "pending", label: "In Progress", value: stats.inProgress, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400", active: statusFilter === 'in_progress', onClick: () => handleStatClick('in_progress') }), _jsx(StatCard, { icon: "check_circle", label: "Resolved", value: stats.resolved, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400", active: statusFilter === 'resolved', onClick: () => handleStatClick('resolved') }), _jsx(StatCard, { icon: "task_alt", label: "Closed", value: stats.closed, color: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400", active: statusFilter === 'closed', onClick: () => handleStatClick('closed') }), _jsx(StatCard, { icon: "confirmation_number", label: "Total Active", value: stats.totalActive, color: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400", active: statusFilter === 'all', onClick: () => handleStatClick('all') })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 }, className: "rounded-2xl border shadow-sm overflow-hidden", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "px-5 py-4 border-b flex items-center justify-between", style: { borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md", children: _jsx("span", { className: "material-symbols-outlined", children: "receipt_long" }) }), _jsxs("div", { children: [_jsx("h2", { className: "font-bold", style: { color: 'var(--text-primary)' }, children: statusFilter === 'all' ? 'Recent Tickets' : `${statusFilter.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Tickets` }), _jsx("p", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: statusFilter === 'all' ? `${stats.total} total tickets` : `${filteredTickets.length} of ${stats.total} tickets` })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [statusFilter !== 'all' && (_jsxs("button", { onClick: () => setStatusFilter('all'), className: "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "close" }), "Clear filter"] })), _jsxs(Link, { to: "/tickets", className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors", children: ["View all", _jsx("span", { className: "material-symbols-outlined text-lg", children: "arrow_forward" })] })] })] }), loading ? (_jsxs("div", { className: "p-12 flex flex-col items-center justify-center", children: [_jsx("div", { className: "w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" }), _jsx("p", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: "Loading tickets..." })] })) : tickets.length === 0 ? (_jsxs("div", { className: "p-12 text-center", children: [_jsx("div", { className: "w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-4xl text-blue-600 dark:text-blue-400", children: "confirmation_number" }) }), _jsx("h3", { className: "text-lg font-bold mb-2", style: { color: 'var(--text-primary)' }, children: "No tickets yet" }), _jsx("p", { className: "text-sm mb-6 max-w-sm mx-auto", style: { color: 'var(--text-secondary)' }, children: "Get started by creating your first support ticket. Our team is ready to help!" }), _jsxs(motion.button, { onClick: () => setShowNewTicketModal(true), whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, className: "inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow", children: [_jsx("span", { className: "material-symbols-outlined", children: "add" }), "Create your first ticket"] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "hidden md:block overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-left text-xs font-semibold uppercase tracking-wider", style: { borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }, children: [_jsx("th", { className: "px-5 py-3", children: "Ticket" }), _jsx("th", { className: "px-5 py-3", children: "Reporter" }), _jsx("th", { className: "px-5 py-3", children: "Status" }), _jsx("th", { className: "px-5 py-3", children: "Priority" }), _jsx("th", { className: "px-5 py-3 text-center", children: _jsx("span", { className: "material-symbols-outlined text-sm", children: "chat" }) }), _jsx("th", { className: "px-5 py-3 text-center", children: _jsx("span", { className: "material-symbols-outlined text-sm", children: "attach_file" }) }), _jsx("th", { className: "px-5 py-3", children: "Updated" })] }) }), _jsx("tbody", { className: "divide-y", style: { borderColor: 'var(--border-primary)' }, children: filteredTickets.slice(0, 8).map((ticket, index) => (_jsxs(motion.tr, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.3 + index * 0.03 }, onClick: () => {
                                                    console.log('🎯 CLICKED TICKET:', ticket.id, ticket.issueKey);
                                                    setSelectedTicketId(String(ticket.id));
                                                }, className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group", children: [_jsx("td", { className: "px-5 py-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-2 h-2 rounded-full shrink-0 ${ticket.status === 'open' ? 'bg-amber-500' :
                                                                        ticket.status === 'in_progress' ? 'bg-blue-500' :
                                                                            ticket.status === 'resolved' ? 'bg-emerald-500' :
                                                                                ticket.status === 'pending_internal_review' ? 'bg-orange-500' :
                                                                                    'bg-slate-400'}` }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-sm group-hover:text-blue-600 transition-colors", style: { color: 'var(--text-primary)' }, children: ticket.title }), _jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [_jsx("span", { className: "text-xs font-mono text-blue-600 dark:text-blue-400", children: ticket.issueKey }), _jsx("span", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: "\u2022" }), _jsx("span", { className: "text-xs capitalize", style: { color: 'var(--text-muted)' }, children: ticket.type?.replace('_', ' ') })] })] })] }) }), _jsx("td", { className: "px-5 py-4", children: (() => {
                                                            const name = ticket.reporterName || ticket.createdByName || 'Unknown';
                                                            return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-6 h-6 rounded-full ${stringToColor(name)} flex items-center justify-center text-white text-xs font-bold`, children: getInitials(name) }), _jsx("span", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: name })] }));
                                                        })() }), _jsx("td", { className: "px-5 py-4", children: _jsx(StatusBadge, { status: ticket.status }) }), _jsx("td", { className: "px-5 py-4", children: _jsx(PriorityPill, { priority: ticket.clientPriority }) }), _jsx("td", { className: "px-5 py-4 text-center", children: _jsx("span", { className: "inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700", style: { color: 'var(--text-secondary)' }, children: ticket.commentCount || 0 }) }), _jsx("td", { className: "px-5 py-4 text-center", children: _jsx("span", { className: "inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700", style: { color: 'var(--text-secondary)' }, children: ticket.attachmentCount || 0 }) }), _jsx("td", { className: "px-5 py-4", children: _jsx("span", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: formatDate(ticket.updatedAt) }) })] }, ticket.id))) })] }) }), _jsx("div", { className: "md:hidden divide-y", style: { borderColor: 'var(--border-primary)' }, children: filteredTickets.slice(0, 8).map((ticket, index) => (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 + index * 0.03 }, onClick: () => setSelectedTicketId(String(ticket.id)), className: "p-4 active:bg-slate-50 dark:active:bg-slate-800 cursor-pointer", children: [_jsxs("div", { className: "flex items-start justify-between gap-3 mb-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("div", { className: `w-2 h-2 rounded-full shrink-0 ${ticket.status === 'open' ? 'bg-amber-500' :
                                                                        ticket.status === 'in_progress' ? 'bg-blue-500' :
                                                                            ticket.status === 'resolved' ? 'bg-emerald-500' :
                                                                                ticket.status === 'pending_internal_review' ? 'bg-orange-500' :
                                                                                    'bg-slate-400'}` }), _jsx("span", { className: "text-xs font-mono text-blue-600 dark:text-blue-400", children: ticket.issueKey })] }), _jsx("h3", { className: "font-semibold text-sm truncate", style: { color: 'var(--text-primary)' }, children: ticket.title })] }), _jsx(StatusBadge, { status: ticket.status })] }), _jsx("div", { className: "flex items-center gap-2 mt-1 mb-2", children: (() => {
                                                const name = ticket.reporterName || ticket.createdByName || 'Unknown';
                                                return (_jsxs(_Fragment, { children: [_jsx("div", { className: `w-5 h-5 rounded-full ${stringToColor(name)} flex items-center justify-center text-white text-[10px] font-bold`, children: getInitials(name) }), _jsx("span", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: name })] }));
                                            })() }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(PriorityPill, { priority: ticket.clientPriority }), _jsxs("div", { className: "flex items-center gap-2 text-xs", style: { color: 'var(--text-muted)' }, children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-xs", children: "chat" }), ticket.commentCount || 0] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-xs", children: "attach_file" }), ticket.attachmentCount || 0] })] })] }), _jsx("span", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: formatDate(ticket.updatedAt) })] })] }, ticket.id))) })] }))] }), _jsx(NewTicketModal, { isOpen: showNewTicketModal, onClose: () => setShowNewTicketModal(false) }), _jsx(TicketDetailModal, { ticketId: selectedTicketId, onClose: () => setSelectedTicketId(null) })] }));
}
