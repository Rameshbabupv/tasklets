import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import ModuleCard from '../components/ModuleCard';
import TenantCard from '../components/TenantCard';
import { useAuthStore } from '../store/auth';
export default function Dashboard() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useAuthStore();
    const fetchDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch core data in parallel
            const [tenantsRes, ticketsRes, productsRes] = await Promise.all([
                fetch('/api/clients', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch('/api/tickets/all', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch('/api/products', {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);
            if (!tenantsRes.ok || !ticketsRes.ok || !productsRes.ok) {
                throw new Error('Failed to fetch data');
            }
            const tenantsData = await tenantsRes.json();
            const tenants = tenantsData.tenants || [];
            const tickets = await ticketsRes.json();
            const products = await productsRes.json();
            // Fetch user counts for each tenant in parallel
            const userCountPromises = tenants.map(async (tenant) => {
                try {
                    const res = await fetch(`/api/users/tenant/${tenant.id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok)
                        return { tenantId: tenant.id, users: [] };
                    const users = await res.json();
                    return { tenantId: tenant.id, users };
                }
                catch (err) {
                    console.error(`Failed to fetch users for tenant ${tenant.id}`, err);
                    return { tenantId: tenant.id, users: [] };
                }
            });
            const userCounts = await Promise.all(userCountPromises);
            // Calculate metrics
            const totalTenants = tenants.length;
            const activeTenants = tenants.filter((t) => t.isActive).length;
            const allUsers = userCounts.flatMap((uc) => uc.users);
            const totalUsers = allUsers.length;
            const activeUsers = allUsers.filter((u) => u.isActive).length;
            const totalProducts = products.length;
            const ticketsByStatus = {
                open: tickets.filter((t) => t.status === 'open').length,
                in_progress: tickets.filter((t) => t.status === 'in_progress').length,
                resolved: tickets.filter((t) => t.status === 'resolved').length,
                closed: tickets.filter((t) => t.status === 'closed').length,
            };
            const openTickets = ticketsByStatus.open;
            // Calculate tickets by priority (P1-P5)
            const ticketsByPriority = [1, 2, 3, 4, 5].map((p) => ({
                priority: p,
                count: tickets.filter((t) => {
                    const priority = t.internalPriority || t.clientPriority;
                    return priority === p;
                }).length,
            }));
            // Create tenant cards with stats
            const tenantCards = tenants.map((tenant) => {
                const userCount = userCounts.find((uc) => uc.tenantId === tenant.id)?.users.length || 0;
                const ticketCount = tickets.filter((t) => t.tenantName === tenant.name).length;
                return {
                    id: tenant.id,
                    name: tenant.name,
                    tier: tenant.tier,
                    isActive: tenant.isActive,
                    userCount,
                    ticketCount,
                };
            });
            setMetrics({
                totalTenants,
                activeTenants,
                totalUsers,
                activeUsers,
                totalProducts,
                openTickets,
                ticketsByStatus,
                ticketsByPriority,
                tenantCards,
            });
        }
        catch (err) {
            console.error('Dashboard fetch error:', err);
            setError(err.message || 'Failed to load dashboard data');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchDashboardData();
    }, []);
    return (_jsxs("div", { className: "h-screen flex overflow-hidden", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsx(Sidebar, {}), _jsxs("main", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsxs(motion.header, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "h-16 px-6 border-b flex items-center justify-between shrink-0", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", "aria-hidden": "true", children: "\uD83D\uDCCA" }), _jsx("h2", { className: "text-xl font-display font-bold bg-gradient-spark bg-clip-text text-transparent", children: "Dashboard" })] }), _jsxs(motion.button, { onClick: fetchDashboardData, disabled: loading, whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, className: "flex items-center gap-2 px-4 py-2 bg-gradient-spark hover:opacity-90 text-white rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", "aria-hidden": "true", children: "refresh" }), "Refresh"] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6", children: [loading && !metrics && (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-block size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" }), _jsx("p", { style: { color: 'var(--text-secondary)' }, children: "Loading dashboard..." })] }) })), error && (_jsxs("div", { className: "rounded-lg p-4 mb-6", style: { backgroundColor: 'var(--error-bg)', borderWidth: '1px', borderColor: 'var(--error-text)' }, children: [_jsxs("div", { className: "flex items-center gap-2", style: { color: 'var(--error-text)' }, children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", children: "error" }), _jsx("p", { className: "text-sm font-medium", children: error })] }), _jsx("button", { onClick: fetchDashboardData, className: "mt-3 text-sm font-medium", style: { color: 'var(--error-text)' }, children: "Try again" })] })), metrics && (_jsxs("div", { className: "space-y-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 }, children: [_jsx("h3", { className: "text-lg font-display font-bold mb-4", style: { color: 'var(--text-primary)' }, children: "Quick Access" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(ModuleCard, { emoji: "\uD83C\uDFAB", title: "Tickets", description: "Manage customer support tickets and track resolution progress", count: metrics.openTickets, countLabel: "Open", to: "/tickets", badge: metrics.openTickets > 0 ? 'Active' : undefined, badgeColor: metrics.openTickets > 5 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700' }), _jsx(ModuleCard, { emoji: "\uD83D\uDCA1", title: "Ideas", description: "Browse and contribute to the SPARK innovation pipeline", to: "/ideas", badge: "SPARK", badgeColor: "bg-gradient-spark text-white" }), _jsx(ModuleCard, { emoji: "\uD83D\uDCE6", title: "Products", description: "View and manage product catalog and assignments", count: metrics.totalProducts, countLabel: "Total", to: "/products" }), _jsx(ModuleCard, { emoji: "\uD83C\uDFE2", title: "Clients", description: "Monitor client accounts and subscription tiers", count: metrics.activeTenants, countLabel: "Active", to: "/clients" })] })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 }, children: [_jsx("h3", { className: "text-lg font-display font-bold mb-4", style: { color: 'var(--text-primary)' }, children: "Key Metrics" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(StatCard, { icon: "group_work", emoji: "\uD83C\uDFE2", label: "Total Clients", value: metrics.totalTenants, color: "bg-blue-50 text-blue-600" }), _jsx(StatCard, { icon: "group", emoji: "\uD83D\uDC65", label: "Active Users", value: metrics.activeUsers, color: "bg-emerald-50 text-emerald-600" }), _jsx(StatCard, { icon: "confirmation_number", emoji: "\uD83C\uDFAB", label: "Open Tickets", value: metrics.openTickets, color: "bg-amber-50 text-amber-600", trend: metrics.openTickets > 10 ? { value: -5, label: 'vs last week' } : undefined }), _jsx(StatCard, { icon: "inventory_2", emoji: "\uD83D\uDCE6", label: "Products", value: metrics.totalProducts, color: "bg-purple-50 text-purple-600" })] })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 }, className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "rounded-xl border p-6 hover:shadow-lg hover:border-primary/30 transition-all", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("span", { className: "text-xl", "aria-hidden": "true", children: "\uD83D\uDCC8" }), _jsx("h3", { className: "text-lg font-display font-bold", style: { color: 'var(--text-primary)' }, children: "Ticket Workload" })] }), _jsx("div", { className: "space-y-3", children: [
                                                            { status: 'open', label: 'Open', count: metrics.ticketsByStatus.open, color: 'bg-slate-200 text-slate-700' },
                                                            { status: 'in_progress', label: 'In Progress', count: metrics.ticketsByStatus.in_progress, color: 'bg-blue-100 text-blue-700' },
                                                            { status: 'resolved', label: 'Resolved', count: metrics.ticketsByStatus.resolved, color: 'bg-emerald-100 text-emerald-700' },
                                                            { status: 'closed', label: 'Closed', count: metrics.ticketsByStatus.closed, color: 'bg-slate-200 text-slate-700' },
                                                        ].map((item) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: `px-3 py-1.5 rounded-lg text-sm font-medium ${item.color}`, children: item.label }), _jsx("span", { className: "text-2xl font-bold", style: { color: 'var(--text-primary)' }, children: item.count })] }, item.status))) })] }), _jsxs("div", { className: "rounded-xl border p-6 hover:shadow-lg hover:border-primary/30 transition-all", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("span", { className: "text-xl", "aria-hidden": "true", children: "\uD83C\uDFAF" }), _jsx("h3", { className: "text-lg font-display font-bold", style: { color: 'var(--text-primary)' }, children: "Priority Distribution" })] }), _jsx("div", { className: "space-y-3", children: metrics.ticketsByPriority.map((item) => {
                                                            const priorityColors = [
                                                                'bg-red-50 text-red-600 border-red-100',
                                                                'bg-amber-50 text-amber-600 border-amber-100',
                                                                'bg-blue-50 text-blue-600 border-blue-100',
                                                                'bg-emerald-50 text-emerald-600 border-emerald-100',
                                                                'bg-slate-100 text-slate-600 border-slate-200',
                                                            ];
                                                            const color = priorityColors[item.priority - 1];
                                                            return (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: `px-3 py-1.5 rounded-lg text-sm font-medium border ${color}`, children: ["P", item.priority] }), _jsx("span", { className: "text-2xl font-bold", style: { color: 'var(--text-primary)' }, children: item.count })] }, item.priority));
                                                        }) })] })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.4 }, children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("span", { className: "text-xl", "aria-hidden": "true", children: "\uD83C\uDFE2" }), _jsx("h3", { className: "text-lg font-display font-bold", style: { color: 'var(--text-primary)' }, children: "Tenants Overview" })] }), metrics.tenantCards.length === 0 ? (_jsx("div", { className: "rounded-xl border p-12 text-center", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: _jsx("p", { style: { color: 'var(--text-muted)' }, children: "No tenants found" }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", children: metrics.tenantCards.map((tenant, index) => (_jsx(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 0.5 + index * 0.05 }, children: _jsx(TenantCard, { tenant: tenant }) }, tenant.id))) }))] })] }))] })] })] }));
}
