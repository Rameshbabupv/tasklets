import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/auth';
import TicketModal from '../components/TicketModal';
import DevTaskModal from '../components/DevTaskModal';
// Status configuration (excluding pending_internal_review for internal portal)
const statusConfig = {
    open: { label: 'Open', color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
    in_progress: { label: 'In Progress', color: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
    rebuttal: { label: 'Rebuttal', color: 'bg-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
    resolved: { label: 'Resolved', color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
    closed: { label: 'Closed', color: 'bg-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' },
};
const boardColumns = ['open', 'in_progress', 'rebuttal', 'resolved', 'closed'];
const priorityConfig = {
    1: { label: 'Critical', short: 'P1', bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
    2: { label: 'High', short: 'P2', bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
    3: { label: 'Medium', short: 'P3', bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
    4: { label: 'Low', short: 'P4', bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' },
    5: { label: 'Trivial', short: 'P5', bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-500', border: 'border-slate-200 dark:border-slate-700' },
};
const typeConfig = {
    support: { icon: 'support_agent', color: 'text-orange-500' },
    bug: { icon: 'bug_report', color: 'text-red-500' },
    task: { icon: 'task_alt', color: 'text-green-500' },
    feature: { icon: 'auto_awesome', color: 'text-cyan-500' },
    feature_request: { icon: 'lightbulb', color: 'text-yellow-500' },
};
// Helper functions
const isEscalated = (ticket) => ticket.labels?.includes('escalated');
const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const formatDateTime = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
export default function SupportQueue() {
    const { token } = useAuthStore();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('board');
    const [selectedTicketKey, setSelectedTicketKey] = useState(null);
    // Dev Task Modal state
    const [devTaskTicket, setDevTaskTicket] = useState(null);
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState([]);
    const [priorityFilter, setPriorityFilter] = useState([]);
    const [clientFilter, setClientFilter] = useState('');
    const [showEscalatedOnly, setShowEscalatedOnly] = useState(false);
    // Sorting (for list view)
    const [sortField, setSortField] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');
    // Drag state for board view
    const [draggedTicket, setDraggedTicket] = useState(null);
    useEffect(() => {
        fetchTickets();
    }, []);
    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/tickets/all', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setTickets(data);
        }
        catch (err) {
            console.error('Failed to fetch tickets', err);
        }
        finally {
            setLoading(false);
        }
    };
    const updateStatus = async (ticketId, newStatus) => {
        try {
            await fetch(`/api/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            fetchTickets();
        }
        catch (err) {
            console.error('Failed to update ticket', err);
        }
    };
    // Filter and sort tickets
    const filteredTickets = useMemo(() => {
        let result = tickets.filter(t => 
        // Exclude pending_internal_review and cancelled for internal portal
        t.status !== 'pending_internal_review' && t.status !== 'cancelled' && t.status !== 'waiting_for_customer');
        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t => t.title.toLowerCase().includes(query) ||
                t.issueKey.toLowerCase().includes(query) ||
                t.clientName?.toLowerCase().includes(query) ||
                t.creatorName?.toLowerCase().includes(query));
        }
        // Status filter
        if (statusFilter.length > 0) {
            result = result.filter(t => statusFilter.includes(t.status));
        }
        // Priority filter
        if (priorityFilter.length > 0) {
            result = result.filter(t => {
                const priority = t.internalPriority || t.clientPriority || 3;
                return priorityFilter.includes(priority);
            });
        }
        // Client filter
        if (clientFilter) {
            result = result.filter(t => t.clientName === clientFilter);
        }
        // Escalated filter
        if (showEscalatedOnly) {
            result = result.filter(t => isEscalated(t));
        }
        // Sort (for list view)
        if (viewMode === 'list') {
            result.sort((a, b) => {
                let aVal, bVal;
                switch (sortField) {
                    case 'issueKey':
                        aVal = a.issueKey;
                        bVal = b.issueKey;
                        break;
                    case 'title':
                        aVal = a.title.toLowerCase();
                        bVal = b.title.toLowerCase();
                        break;
                    case 'status':
                        aVal = a.status;
                        bVal = b.status;
                        break;
                    case 'priority':
                        aVal = a.internalPriority || a.clientPriority || 5;
                        bVal = b.internalPriority || b.clientPriority || 5;
                        break;
                    case 'clientName':
                        aVal = a.clientName || '';
                        bVal = b.clientName || '';
                        break;
                    case 'createdAt':
                        aVal = new Date(a.createdAt).getTime();
                        bVal = new Date(b.createdAt).getTime();
                        break;
                    case 'updatedAt':
                        aVal = new Date(a.updatedAt).getTime();
                        bVal = new Date(b.updatedAt).getTime();
                        break;
                    default:
                        return 0;
                }
                if (aVal < bVal)
                    return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal)
                    return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [tickets, searchQuery, statusFilter, priorityFilter, clientFilter, showEscalatedOnly, sortField, sortDirection, viewMode]);
    // Get unique clients for filter dropdown
    const uniqueClients = useMemo(() => {
        const clients = tickets
            .map(t => t.clientName)
            .filter((name) => !!name);
        return [...new Set(clients)].sort();
    }, [tickets]);
    // Count escalated tickets
    const escalatedCount = useMemo(() => tickets.filter(t => isEscalated(t)).length, [tickets]);
    const getColumnTickets = (status) => filteredTickets.filter(t => t.status === status);
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortField(field);
            setSortDirection('asc');
        }
    };
    const toggleStatusFilter = (status) => {
        setStatusFilter(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
    };
    const togglePriorityFilter = (priority) => {
        setPriorityFilter(prev => prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]);
    };
    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter([]);
        setPriorityFilter([]);
        setClientFilter('');
        setShowEscalatedOnly(false);
    };
    const hasActiveFilters = searchQuery || statusFilter.length > 0 || priorityFilter.length > 0 || clientFilter || showEscalatedOnly;
    // Drag handlers for board view
    const handleDragStart = (ticket) => {
        setDraggedTicket(ticket);
    };
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    const handleDrop = (status) => {
        if (draggedTicket && draggedTicket.status !== status) {
            updateStatus(draggedTicket.id, status);
        }
        setDraggedTicket(null);
    };
    return (_jsxs("div", { className: "h-screen flex overflow-hidden", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsx(Sidebar, {}), _jsxs("main", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsxs("header", { className: "shrink-0 px-6 py-4 border-b", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("h1", { className: "text-xl font-bold", style: { color: 'var(--text-primary)' }, children: "Support Queue" }), _jsxs("span", { className: "text-sm px-2.5 py-1 rounded-full", style: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }, children: [filteredTickets.length, " tickets"] })] }), _jsxs("div", { className: "flex items-center gap-1 p-1 rounded-lg", style: { backgroundColor: 'var(--bg-tertiary)' }, children: [_jsxs("button", { onClick: () => setViewMode('list'), className: `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list'
                                                    ? 'bg-white dark:bg-slate-700 shadow-sm'
                                                    : 'hover:bg-white/50 dark:hover:bg-slate-600/50'}`, style: { color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)' }, children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "view_list" }), "List"] }), _jsxs("button", { onClick: () => setViewMode('board'), className: `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'board'
                                                    ? 'bg-white dark:bg-slate-700 shadow-sm'
                                                    : 'hover:bg-white/50 dark:hover:bg-slate-600/50'}`, style: { color: viewMode === 'board' ? 'var(--text-primary)' : 'var(--text-muted)' }, children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "view_kanban" }), "Board"] })] })] }), _jsxs("div", { className: "flex items-center gap-4 flex-wrap", children: [_jsxs("div", { className: "relative", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg", style: { color: 'var(--text-muted)' }, children: "search" }), _jsx("input", { type: "text", placeholder: "Search tickets...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-10 pr-4 py-2 w-64 rounded-lg text-sm border-none focus:ring-2 focus:ring-violet-500/30", style: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' } })] }), _jsx("div", { className: "h-6 w-px", style: { backgroundColor: 'var(--border-primary)' } }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-medium", style: { color: 'var(--text-muted)' }, children: "Status:" }), _jsx("div", { className: "flex gap-1.5", children: boardColumns.map(status => {
                                                    const config = statusConfig[status];
                                                    const isActive = statusFilter.includes(status);
                                                    return (_jsx("button", { onClick: () => toggleStatusFilter(status), className: `px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${isActive
                                                            ? `${config.bg} ${config.text} ${config.border}`
                                                            : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`, style: !isActive ? { color: 'var(--text-muted)' } : undefined, children: config.label }, status));
                                                }) })] }), _jsx("div", { className: "h-6 w-px", style: { backgroundColor: 'var(--border-primary)' } }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-medium", style: { color: 'var(--text-muted)' }, children: "Priority:" }), _jsx("div", { className: "flex gap-1", children: [1, 2, 3, 4].map(priority => {
                                                    const config = priorityConfig[priority];
                                                    const isActive = priorityFilter.includes(priority);
                                                    return (_jsx("button", { onClick: () => togglePriorityFilter(priority), className: `px-2 py-1 rounded text-xs font-bold transition-all border ${isActive
                                                            ? `${config.bg} ${config.text} ${config.border}`
                                                            : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`, style: !isActive ? { color: 'var(--text-muted)' } : undefined, children: config.short }, priority));
                                                }) })] }), _jsx("div", { className: "h-6 w-px", style: { backgroundColor: 'var(--border-primary)' } }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-medium", style: { color: 'var(--text-muted)' }, children: "Client:" }), _jsxs("select", { value: clientFilter, onChange: (e) => setClientFilter(e.target.value), className: "px-2.5 py-1 rounded-md text-xs font-medium border-none focus:ring-2 focus:ring-violet-500/30", style: { backgroundColor: 'var(--bg-tertiary)', color: clientFilter ? 'var(--text-primary)' : 'var(--text-muted)' }, children: [_jsx("option", { value: "", children: "All Clients" }), uniqueClients.map(client => (_jsx("option", { value: client, children: client }, client)))] })] }), _jsx("div", { className: "h-6 w-px", style: { backgroundColor: 'var(--border-primary)' } }), _jsxs("button", { onClick: () => setShowEscalatedOnly(!showEscalatedOnly), className: `flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${showEscalatedOnly
                                            ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                                            : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`, style: !showEscalatedOnly ? { color: 'var(--text-muted)' } : undefined, children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "priority_high" }), "Escalated", escalatedCount > 0 && (_jsx("span", { className: `px-1.5 py-0.5 rounded-full text-[10px] font-bold ${showEscalatedOnly ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200' : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'}`, children: escalatedCount }))] }), hasActiveFilters && (_jsxs("button", { onClick: clearFilters, className: "flex items-center gap-1 px-2 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "close" }), "Clear filters"] })), _jsx("button", { onClick: fetchTickets, className: "ml-auto p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors", style: { color: 'var(--text-muted)' }, children: _jsx("span", { className: "material-symbols-outlined", children: "refresh" }) })] })] }), _jsx("div", { className: "flex-1 overflow-hidden", children: loading ? (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" }), _jsx("span", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: "Loading tickets..." })] }) })) : (_jsx(AnimatePresence, { mode: "wait", children: viewMode === 'board' ? (_jsx(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, transition: { duration: 0.2 }, className: "h-full p-6 overflow-x-auto", children: _jsx("div", { className: "flex gap-4 h-full min-w-max", children: boardColumns.map(status => {
                                        const config = statusConfig[status];
                                        const columnTickets = getColumnTickets(status);
                                        return (_jsxs("div", { onDragOver: handleDragOver, onDrop: () => handleDrop(status), className: `flex flex-col w-72 rounded-xl border transition-all ${draggedTicket && draggedTicket.status !== status
                                                ? 'ring-2 ring-violet-400 ring-opacity-50'
                                                : ''}`, style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "p-4 border-b flex items-center justify-between shrink-0", style: { borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: `w-2.5 h-2.5 rounded-full ${config.color}` }), _jsx("span", { className: "font-semibold text-sm", style: { color: 'var(--text-primary)' }, children: config.label })] }), _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs font-bold ${config.bg} ${config.text}`, children: columnTickets.length })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-3 space-y-3", children: [columnTickets.map(ticket => {
                                                            const priority = ticket.internalPriority || ticket.clientPriority || 3;
                                                            const pConfig = priorityConfig[priority];
                                                            const tConfig = typeConfig[ticket.type] || typeConfig.support;
                                                            const ticketIsEscalated = isEscalated(ticket);
                                                            return (_jsxs(motion.div, { layout: true, initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, draggable: true, onDragStart: () => handleDragStart(ticket), onClick: () => setSelectedTicketKey(ticket.issueKey), className: `group p-3.5 rounded-lg border cursor-pointer transition-all hover:shadow-md ${ticketIsEscalated
                                                                    ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
                                                                    : 'hover:border-violet-300 dark:hover:border-violet-700'} ${draggedTicket?.id === ticket.id ? 'opacity-50' : ''}`, style: {
                                                                    backgroundColor: ticketIsEscalated ? undefined : 'var(--bg-card)',
                                                                    borderColor: ticketIsEscalated ? undefined : 'var(--border-primary)'
                                                                }, children: [priority <= 2 && (_jsx("div", { className: `absolute left-0 top-2 bottom-2 w-1 rounded-full ${priority === 1 ? 'bg-red-500' : 'bg-orange-400'}` })), ticketIsEscalated && (_jsx("div", { className: "flex items-center gap-1 mb-2", children: _jsxs("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 flex items-center gap-0.5", children: [_jsx("span", { className: "material-symbols-outlined text-xs", children: "priority_high" }), "ESCALATED"] }) })), _jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: `material-symbols-outlined text-base ${tConfig.color}`, children: tConfig.icon }), _jsx("span", { className: "text-xs font-mono font-semibold text-violet-600 dark:text-violet-400", children: ticket.issueKey })] }), _jsx("span", { className: `px-1.5 py-0.5 rounded text-[10px] font-bold ${pConfig.bg} ${pConfig.text}`, children: pConfig.short })] }), _jsx("h4", { className: "text-sm font-medium leading-snug line-clamp-2 mb-3", style: { color: 'var(--text-primary)' }, children: ticket.title }), _jsxs("div", { className: "flex items-center justify-between text-xs", style: { color: 'var(--text-muted)' }, children: [_jsx("span", { className: "truncate max-w-[120px]", children: ticket.clientName || 'No client' }), _jsx("span", { children: formatDate(ticket.createdAt) })] })] }, ticket.id));
                                                        }), columnTickets.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center py-8 text-center", children: [_jsx("span", { className: "material-symbols-outlined text-3xl mb-2", style: { color: 'var(--text-muted)' }, children: "inbox" }), _jsx("span", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: "No tickets" })] }))] })] }, status));
                                    }) }) }, "board")) : (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 }, transition: { duration: 0.2 }, className: "h-full overflow-auto", children: [_jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "sticky top-0 z-10", style: { backgroundColor: 'var(--bg-tertiary)' }, children: _jsx("tr", { children: [
                                                        { key: 'issueKey', label: 'Issue', width: 'w-28' },
                                                        { key: 'title', label: 'Title', width: 'flex-1' },
                                                        { key: 'status', label: 'Status', width: 'w-32' },
                                                        { key: 'priority', label: 'Priority', width: 'w-24' },
                                                        { key: 'clientName', label: 'Client', width: 'w-36' },
                                                        { key: 'createdAt', label: 'Created', width: 'w-28' },
                                                        { key: 'updatedAt', label: 'Updated', width: 'w-28' },
                                                    ].map(col => (_jsx("th", { onClick: () => handleSort(col.key), className: `px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-600/50 transition-colors ${col.width}`, style: { color: 'var(--text-muted)' }, children: _jsxs("div", { className: "flex items-center gap-1", children: [col.label, sortField === col.key && (_jsx("span", { className: "material-symbols-outlined text-sm text-violet-500", children: sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }))] }) }, col.key))) }) }), _jsx("tbody", { className: "divide-y", style: { borderColor: 'var(--border-primary)' }, children: filteredTickets.map((ticket, index) => {
                                                    const priority = ticket.internalPriority || ticket.clientPriority || 3;
                                                    const pConfig = priorityConfig[priority];
                                                    const sConfig = statusConfig[ticket.status];
                                                    const tConfig = typeConfig[ticket.type] || typeConfig.support;
                                                    const ticketIsEscalated = isEscalated(ticket);
                                                    return (_jsxs(motion.tr, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: index * 0.02 }, onClick: () => setSelectedTicketKey(ticket.issueKey), className: `cursor-pointer transition-colors group ${ticketIsEscalated
                                                            ? 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`, style: { backgroundColor: ticketIsEscalated ? undefined : 'var(--bg-card)' }, children: [_jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `material-symbols-outlined text-base ${tConfig.color}`, children: tConfig.icon }), _jsx("span", { className: "font-mono text-sm font-semibold text-violet-600 dark:text-violet-400", children: ticket.issueKey }), ticketIsEscalated && (_jsx("span", { className: "material-symbols-outlined text-sm text-red-500", children: "priority_high" }))] }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "text-sm font-medium line-clamp-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors", style: { color: 'var(--text-primary)' }, children: ticket.title }) }), _jsx("td", { className: "px-4 py-3", children: sConfig && (_jsxs("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sConfig.bg} ${sConfig.text}`, children: [_jsx("span", { className: `w-1.5 h-1.5 rounded-full ${sConfig.color}` }), sConfig.label] })) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `px-2 py-1 rounded text-xs font-bold ${pConfig.bg} ${pConfig.text}`, children: pConfig.short }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "text-sm truncate max-w-[140px] block", style: { color: 'var(--text-secondary)' }, children: ticket.clientName || '-' }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: formatDate(ticket.createdAt) }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: formatDate(ticket.updatedAt) }) })] }, ticket.id));
                                                }) })] }), filteredTickets.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center py-16", children: [_jsx("span", { className: "material-symbols-outlined text-5xl mb-3", style: { color: 'var(--text-muted)' }, children: "search_off" }), _jsx("span", { className: "text-lg font-medium mb-1", style: { color: 'var(--text-secondary)' }, children: "No tickets found" }), _jsx("span", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: "Try adjusting your filters" })] }))] }, "list")) })) })] }), selectedTicketKey && (_jsx(TicketModal, { issueKey: selectedTicketKey, onClose: () => setSelectedTicketKey(null), onStatusChange: fetchTickets, onCreateDevTask: (ticket) => {
                    // Close ticket modal and open dev task modal
                    setSelectedTicketKey(null);
                    setDevTaskTicket(ticket);
                } })), devTaskTicket && (_jsx(DevTaskModal, { ticket: devTaskTicket, onClose: () => setDevTaskTicket(null), onSuccess: (issueKey) => {
                    setDevTaskTicket(null);
                    fetchTickets();
                } }))] }));
}
