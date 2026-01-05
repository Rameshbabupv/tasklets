import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '../store/auth';
import { StatusBadge, PriorityPill } from '@tsklets/ui';
import TicketDetailModal from '../components/TicketDetailModal';
const statusColors = {
    open: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
    resolved: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 border-green-300 dark:border-green-700',
    closed: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 border-slate-300 dark:border-slate-600',
};
const priorityLabels = {
    1: 'P1 - Critical',
    2: 'P2 - High',
    3: 'P3 - Medium',
    4: 'P4 - Low',
};
const ITEMS_PER_PAGE = 20;
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
export default function AllTickets() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { token } = useAuthStore();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    // Filter state from URL params
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all');
    const [reporterFilter, setReporterFilter] = useState(searchParams.get('reporter') || 'all');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
    // Debounced search
    const [searchInput, setSearchInput] = useState(searchQuery);
    useEffect(() => {
        fetchTickets();
    }, []);
    // Update URL params when filters change
    useEffect(() => {
        const params = {};
        if (statusFilter !== 'all')
            params.status = statusFilter;
        if (priorityFilter !== 'all')
            params.priority = priorityFilter;
        if (reporterFilter !== 'all')
            params.reporter = reporterFilter;
        if (searchQuery)
            params.search = searchQuery;
        if (currentPage > 1)
            params.page = currentPage.toString();
        setSearchParams(params);
    }, [statusFilter, priorityFilter, reporterFilter, searchQuery, currentPage]);
    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
            setCurrentPage(1); // Reset to first page on search
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);
    async function fetchTickets() {
        setLoading(true);
        try {
            const res = await fetch('/api/tickets', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok)
                throw new Error('Failed to fetch tickets');
            const data = await res.json();
            setTickets(data.tickets || []);
        }
        catch (error) {
            console.error('Fetch tickets error:', error);
            toast.error('Failed to load tickets');
        }
        finally {
            setLoading(false);
        }
    }
    // Get unique reporters for filter dropdown
    const uniqueReporters = useMemo(() => {
        const reporters = new Map();
        tickets.forEach(ticket => {
            const name = ticket.reporterName || ticket.createdByName || 'Unknown';
            if (!reporters.has(name)) {
                reporters.set(name, name);
            }
        });
        return Array.from(reporters.values()).sort();
    }, [tickets]);
    // Filter and search logic
    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            // Status filter
            if (statusFilter !== 'all' && ticket.status !== statusFilter) {
                return false;
            }
            // Priority filter (convert string P1/P2/etc to number)
            if (priorityFilter !== 'all') {
                const priorityNum = parseInt(priorityFilter.replace('P', ''));
                if (ticket.clientPriority !== priorityNum) {
                    return false;
                }
            }
            // Reporter filter
            if (reporterFilter !== 'all') {
                const reporterName = ticket.reporterName || ticket.createdByName || 'Unknown';
                if (reporterName !== reporterFilter) {
                    return false;
                }
            }
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchTitle = ticket.title?.toLowerCase().includes(query);
                const matchDescription = ticket.description?.toLowerCase().includes(query);
                const matchKey = ticket.issueKey?.toLowerCase().includes(query);
                const matchId = ticket.id.toString().includes(query);
                if (!matchTitle && !matchDescription && !matchKey && !matchId) {
                    return false;
                }
            }
            return true;
        });
    }, [tickets, statusFilter, priorityFilter, reporterFilter, searchQuery]);
    // Pagination logic
    const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
    const paginatedTickets = filteredTickets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    // Active filter count
    const activeFilterCount = [
        statusFilter !== 'all',
        priorityFilter !== 'all',
        reporterFilter !== 'all',
        searchQuery !== ''
    ].filter(Boolean).length;
    function clearFilters() {
        setStatusFilter('all');
        setPriorityFilter('all');
        setReporterFilter('all');
        setSearchInput('');
        setSearchQuery('');
        setCurrentPage(1);
    }
    function handlePageChange(page) {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "mb-6 flex items-center justify-between", children: [_jsx("div", { children: _jsxs("p", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: [filteredTickets.length, " ", filteredTickets.length === 1 ? 'ticket' : 'tickets', searchQuery && ` matching "${searchQuery}"`] }) }), _jsxs("button", { onClick: () => setShowFilters(!showFilters), className: "md:hidden flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors", style: {
                            backgroundColor: 'var(--bg-card)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                        }, children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "tune" }), _jsx("span", { className: "text-sm font-medium", children: "Filters" }), activeFilterCount > 0 && (_jsx("span", { className: "size-5 rounded-full bg-primary text-white text-xs flex items-center justify-center", children: activeFilterCount }))] })] }), _jsx(AnimatePresence, { children: (showFilters || window.innerWidth >= 768) && (_jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, className: "mb-6 overflow-hidden", children: _jsxs("div", { className: "p-4 rounded-lg border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-xs font-medium mb-2", style: { color: 'var(--text-secondary)' }, children: "Search" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg", children: "search" }), _jsx("input", { type: "text", value: searchInput, onChange: (e) => setSearchInput(e.target.value), placeholder: "Search by key, subject, or description...", className: "w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50", style: {
                                                    backgroundColor: 'var(--bg-primary)',
                                                    borderColor: 'var(--border-primary)',
                                                    color: 'var(--text-primary)'
                                                } })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium mb-2", style: { color: 'var(--text-secondary)' }, children: "Status" }), _jsxs("select", { value: statusFilter, onChange: (e) => { setStatusFilter(e.target.value); setCurrentPage(1); }, className: "w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50", style: {
                                            backgroundColor: 'var(--bg-primary)',
                                            borderColor: 'var(--border-primary)',
                                            color: 'var(--text-primary)'
                                        }, children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "pending_internal_review", children: "Pending Review" }), _jsx("option", { value: "open", children: "Open" }), _jsx("option", { value: "in_progress", children: "In Progress" }), _jsx("option", { value: "waiting_for_customer", children: "Waiting for Customer" }), _jsx("option", { value: "rebuttal", children: "Rebuttal" }), _jsx("option", { value: "resolved", children: "Resolved" }), _jsx("option", { value: "closed", children: "Closed" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium mb-2", style: { color: 'var(--text-secondary)' }, children: "Priority" }), _jsxs("select", { value: priorityFilter, onChange: (e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }, className: "w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50", style: {
                                            backgroundColor: 'var(--bg-primary)',
                                            borderColor: 'var(--border-primary)',
                                            color: 'var(--text-primary)'
                                        }, children: [_jsx("option", { value: "all", children: "All Priorities" }), _jsx("option", { value: "P1", children: "P1 - Critical" }), _jsx("option", { value: "P2", children: "P2 - High" }), _jsx("option", { value: "P3", children: "P3 - Medium" }), _jsx("option", { value: "P4", children: "P4 - Low" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium mb-2", style: { color: 'var(--text-secondary)' }, children: "Reporter" }), _jsxs("select", { value: reporterFilter, onChange: (e) => { setReporterFilter(e.target.value); setCurrentPage(1); }, className: "w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50", style: {
                                            backgroundColor: 'var(--bg-primary)',
                                            borderColor: 'var(--border-primary)',
                                            color: 'var(--text-primary)'
                                        }, children: [_jsx("option", { value: "all", children: "All Reporters" }), uniqueReporters.map(reporter => (_jsx("option", { value: reporter, children: reporter }, reporter)))] })] }), activeFilterCount > 0 && (_jsx("div", { className: "md:col-span-5 flex justify-end", children: _jsxs("button", { onClick: clearFilters, className: "flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "close" }), "Clear All Filters"] }) }))] }) })) }), loading && (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" }), _jsx("span", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: "Loading tickets..." })] }) })), !loading && tickets.length === 0 && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "text-center py-12", children: [_jsx("div", { className: "size-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-3xl text-slate-400", children: "inbox" }) }), _jsx("h3", { className: "text-lg font-semibold mb-2", style: { color: 'var(--text-primary)' }, children: "No tickets yet" }), _jsx("p", { className: "text-sm mb-6", style: { color: 'var(--text-secondary)' }, children: "Create your first support ticket to get started" }), _jsxs(Link, { to: "/tickets/new", className: "inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "add" }), "Create Ticket"] })] })), !loading && tickets.length > 0 && filteredTickets.length === 0 && (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "text-center py-12", children: [_jsx("div", { className: "size-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-3xl text-slate-400", children: "search_off" }) }), _jsx("h3", { className: "text-lg font-semibold mb-2", style: { color: 'var(--text-primary)' }, children: "No tickets match your filters" }), _jsx("p", { className: "text-sm mb-6", style: { color: 'var(--text-secondary)' }, children: "Try adjusting your filters or search term" }), _jsxs("button", { onClick: clearFilters, className: "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border hover:border-primary transition-colors", style: {
                            backgroundColor: 'var(--bg-card)',
                            borderColor: 'var(--border-primary)',
                            color: 'var(--text-primary)'
                        }, children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "close" }), "Clear Filters"] })] })), !loading && paginatedTickets.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "block md:hidden space-y-3", children: paginatedTickets.map((ticket, index) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: index * 0.05 }, children: _jsxs("button", { onClick: () => setSelectedTicketId(String(ticket.id)), className: "block w-full text-left rounded-lg border p-4 hover:border-primary/50 hover:shadow-lg transition-all", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("span", { className: "font-mono text-xs font-semibold text-primary", children: ticket.issueKey || `#${ticket.id}` }), _jsx(StatusBadge, { status: ticket.status })] }), _jsx("h3", { className: "font-semibold mb-2 line-clamp-2", style: { color: 'var(--text-primary)' }, children: ticket.title }), _jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("div", { className: `size-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${stringToColor(ticket.reporterName || ticket.createdByName || 'Unknown')}`, children: getInitials(ticket.reporterName || ticket.createdByName || 'U') }), _jsx("span", { className: "text-xs", style: { color: 'var(--text-secondary)' }, children: ticket.reporterName || ticket.createdByName || 'Unknown' })] }), _jsxs("div", { className: "flex items-center justify-between text-xs", style: { color: 'var(--text-muted)' }, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(PriorityPill, { priority: ticket.clientPriority }), _jsxs("span", { className: "flex items-center gap-1", children: ["\uD83D\uDCAC ", ticket.commentCount || 0] }), _jsxs("span", { className: "flex items-center gap-1", children: ["\uD83D\uDCCE ", ticket.attachmentCount || 0] })] }), _jsx("span", { children: formatDate(ticket.updatedAt) })] })] }) }, ticket.id))) }), _jsx("div", { className: "hidden md:block overflow-x-auto mb-6", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-slate-100 dark:bg-slate-700", children: _jsxs("tr", { className: "text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-200", children: [_jsx("th", { className: "py-3 px-4", children: "Key" }), _jsx("th", { className: "py-3 px-4", children: "Subject" }), _jsx("th", { className: "py-3 px-4", children: "Reporter" }), _jsx("th", { className: "py-3 px-4", children: "Type" }), _jsx("th", { className: "py-3 px-4", children: "Status" }), _jsx("th", { className: "py-3 px-4", children: "Priority" }), _jsx("th", { className: "py-3 px-4 text-center", title: "Comments", children: "\uD83D\uDCAC" }), _jsx("th", { className: "py-3 px-4 text-center", title: "Attachments", children: "\uD83D\uDCCE" }), _jsx("th", { className: "py-3 px-4", children: "Updated" })] }) }), _jsx("tbody", { children: paginatedTickets.map((ticket, index) => (_jsxs(motion.tr, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: index * 0.03 }, className: "border-b hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("td", { className: "py-3 px-4", children: _jsx("button", { onClick: () => setSelectedTicketId(String(ticket.id)), className: "font-mono text-sm font-semibold text-primary hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors", children: ticket.issueKey || `#${ticket.id}` }) }), _jsx("td", { className: "py-3 px-4", children: _jsx("span", { className: "font-medium", style: { color: 'var(--text-primary)' }, children: ticket.title }) }), _jsx("td", { className: "py-3 px-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `size-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${stringToColor(ticket.reporterName || ticket.createdByName || 'Unknown')}`, title: ticket.reporterName || ticket.createdByName || 'Unknown', children: getInitials(ticket.reporterName || ticket.createdByName || 'U') }), _jsx("span", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: ticket.reporterName || ticket.createdByName || 'Unknown' })] }) }), _jsx("td", { className: "py-3 px-4", children: _jsx("span", { className: `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ticket.type === 'feature_request'
                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'}`, children: ticket.type === 'feature_request' ? '✨ Feature' : '🎫 Support' }) }), _jsx("td", { className: "py-3 px-4", children: _jsx(StatusBadge, { status: ticket.status }) }), _jsx("td", { className: "py-3 px-4", children: _jsx(PriorityPill, { priority: ticket.clientPriority }) }), _jsx("td", { className: "py-3 px-4 text-center text-sm", style: { color: 'var(--text-secondary)' }, children: ticket.commentCount || 0 }), _jsx("td", { className: "py-3 px-4 text-center text-sm", style: { color: 'var(--text-secondary)' }, children: ticket.attachmentCount || 0 }), _jsx("td", { className: "py-3 px-4 text-sm", style: { color: 'var(--text-secondary)' }, children: formatDate(ticket.updatedAt) })] }, ticket.id))) })] }) }), totalPages > 1 && (_jsxs("div", { className: "mt-6 flex items-center justify-between", children: [_jsxs("p", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: ["Showing ", ((currentPage - 1) * ITEMS_PER_PAGE) + 1, " to ", Math.min(currentPage * ITEMS_PER_PAGE, filteredTickets.length), " of ", filteredTickets.length, " tickets"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: () => handlePageChange(currentPage - 1), disabled: currentPage === 1, className: "px-3 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors", style: {
                                            backgroundColor: 'var(--bg-card)',
                                            borderColor: 'var(--border-primary)',
                                            color: 'var(--text-primary)'
                                        }, children: [_jsx("span", { className: "hidden sm:inline", children: "Previous" }), _jsx("span", { className: "sm:hidden material-symbols-outlined text-lg", children: "chevron_left" })] }), _jsx("div", { className: "hidden md:flex items-center gap-2", children: Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            }
                                            else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            }
                                            else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            }
                                            else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            return (_jsx("button", { onClick: () => handlePageChange(pageNum), className: `size-10 rounded-lg border transition-colors ${currentPage === pageNum
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`, style: currentPage !== pageNum
                                                    ? {
                                                        backgroundColor: 'var(--bg-card)',
                                                        borderColor: 'var(--border-primary)',
                                                        color: 'var(--text-primary)'
                                                    }
                                                    : undefined, children: pageNum }, pageNum));
                                        }) }), _jsxs("div", { className: "md:hidden px-3 py-2 text-sm", style: { color: 'var(--text-secondary)' }, children: ["Page ", currentPage, " of ", totalPages] }), _jsxs("button", { onClick: () => handlePageChange(currentPage + 1), disabled: currentPage === totalPages, className: "px-3 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors", style: {
                                            backgroundColor: 'var(--bg-card)',
                                            borderColor: 'var(--border-primary)',
                                            color: 'var(--text-primary)'
                                        }, children: [_jsx("span", { className: "hidden sm:inline", children: "Next" }), _jsx("span", { className: "sm:hidden material-symbols-outlined text-lg", children: "chevron_right" })] })] })] }))] })), _jsx(TicketDetailModal, { ticketId: selectedTicketId, onClose: () => setSelectedTicketId(null) })] }));
}
