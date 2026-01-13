import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { useAuthStore } from '../store/auth';
import { StatusBadge, PriorityPill } from '@tsklets/ui';
import { formatDate } from '@tsklets/utils';
import TicketDetailModal from '../components/TicketDetailModal';
export default function InternalTriageQueue() {
    const { token, user } = useAuthStore();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const isCompanyAdmin = user?.role === 'company_admin';
    useEffect(() => {
        if (isCompanyAdmin) {
            fetchTriageTickets();
        }
    }, [isCompanyAdmin]);
    async function fetchTriageTickets() {
        setLoading(true);
        try {
            const res = await fetch('/api/tickets?status=pending_internal_review', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok)
                throw new Error('Failed to fetch tickets');
            const data = await res.json();
            setTickets(data.tickets || []);
        }
        catch (error) {
            console.error('Fetch triage tickets error:', error);
            toast.error('Failed to load triage queue');
        }
        finally {
            setLoading(false);
        }
    }
    // Check if user is company_admin
    if (!isCompanyAdmin) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", style: { backgroundColor: 'var(--bg-secondary)' }, children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold mb-2", style: { color: 'var(--text-primary)' }, children: "Access Denied" }), _jsx("p", { style: { color: 'var(--text-secondary)' }, children: "You must be a company admin to access the triage queue." }), _jsx(Link, { to: "/", className: "text-primary hover:underline mt-4 inline-block", children: "Go to Dashboard" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsxs("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8", children: [_jsxs("div", { className: "mb-6", children: [_jsxs("nav", { className: "text-sm mb-4", children: [_jsx(Link, { to: "/", className: "text-primary hover:text-orange-600", children: "Home" }), _jsx("span", { className: "mx-2", style: { color: 'var(--text-muted)' }, children: "/" }), _jsx("span", { style: { color: 'var(--text-secondary)' }, children: "Internal Triage Queue" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", style: { color: 'var(--text-primary)' }, children: "Internal Triage Queue" }), _jsxs("p", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: [tickets.length, " ", tickets.length === 1 ? 'ticket' : 'tickets', " awaiting internal review"] })] }), _jsxs("button", { onClick: fetchTriageTickets, className: "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors hover:bg-slate-50 dark:hover:bg-slate-800", style: {
                                            backgroundColor: 'var(--bg-card)',
                                            borderColor: 'var(--border-primary)',
                                            color: 'var(--text-primary)'
                                        }, children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "refresh" }), _jsx("span", { className: "text-sm font-medium hidden sm:inline", children: "Refresh" })] })] })] }), loading && (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" }), _jsx("span", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: "Loading triage queue..." })] }) })), !loading && tickets.length === 0 && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "text-center py-12", children: [_jsx("div", { className: "size-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-3xl text-green-600 dark:text-green-400", children: "check_circle" }) }), _jsx("h3", { className: "text-lg font-semibold mb-2", style: { color: 'var(--text-primary)' }, children: "All caught up!" }), _jsx("p", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: "There are no tickets pending internal review." })] })), !loading && tickets.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "hidden md:block overflow-x-auto mb-6", children: _jsx("div", { className: "rounded-xl border shadow-card overflow-hidden", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-slate-100 dark:bg-slate-700", children: _jsxs("tr", { className: "text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-200", children: [_jsx("th", { className: "py-3 px-4", children: "Key" }), _jsx("th", { className: "py-3 px-4", children: "Subject" }), _jsx("th", { className: "py-3 px-4", children: "Type" }), _jsx("th", { className: "py-3 px-4", children: "Priority" }), _jsx("th", { className: "py-3 px-4", children: "Created By" }), _jsx("th", { className: "py-3 px-4", children: "Created" }), _jsx("th", { className: "py-3 px-4", children: "Actions" })] }) }), _jsx("tbody", { children: tickets.map((ticket, index) => (_jsxs(motion.tr, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: index * 0.03 }, className: "border-b hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("td", { className: "py-3 px-4", children: _jsx("button", { onClick: () => setSelectedTicketId(String(ticket.id)), className: "font-mono text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 hover:underline transition-colors", children: ticket.issueKey || `#${ticket.id}` }) }), _jsx("td", { className: "py-3 px-4", children: _jsx("span", { className: "font-medium", style: { color: 'var(--text-primary)' }, children: ticket.title }) }), _jsx("td", { className: "py-3 px-4", children: _jsx("span", { className: `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ticket.type === 'feature_request'
                                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'}`, children: ticket.type === 'feature_request' ? 'Feature' : 'Support' }) }), _jsx("td", { className: "py-3 px-4", children: _jsx(PriorityPill, { priority: ticket.clientPriority }) }), _jsx("td", { className: "py-3 px-4 text-sm", style: { color: 'var(--text-secondary)' }, children: ticket.createdByName || 'Unknown' }), _jsx("td", { className: "py-3 px-4 text-sm", style: { color: 'var(--text-secondary)' }, children: formatDate(ticket.createdAt) }), _jsx("td", { className: "py-3 px-4", children: _jsxs(Link, { to: `/tickets/${ticket.id}`, className: "inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "visibility" }), "Review"] }) })] }, ticket.id))) })] }) }) }), _jsx("div", { className: "block md:hidden space-y-3", children: tickets.map((ticket, index) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: index * 0.05 }, children: _jsxs("div", { className: "rounded-lg border p-4 hover:border-orange-500/50 hover:shadow-lg transition-all", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("span", { className: "font-mono text-xs font-semibold text-orange-600 dark:text-orange-400", children: ticket.issueKey || `#${ticket.id}` }), _jsx(StatusBadge, { status: ticket.status })] }), _jsx("h3", { className: "font-semibold mb-2 line-clamp-2", style: { color: 'var(--text-primary)' }, children: ticket.title }), _jsxs("div", { className: "flex items-center justify-between text-xs mb-3", style: { color: 'var(--text-muted)' }, children: [_jsx(PriorityPill, { priority: ticket.clientPriority }), _jsx("span", { children: formatDate(ticket.createdAt) })] }), _jsxs(Link, { to: `/tickets/${ticket.id}`, className: "w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "visibility" }), "Review Ticket"] })] }) }, ticket.id))) })] }))] }), _jsx(TicketDetailModal, { ticketId: selectedTicketId, onClose: () => setSelectedTicketId(null) }), _jsx(Toaster, { position: "top-right", richColors: true })] }));
}
