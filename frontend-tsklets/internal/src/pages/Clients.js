import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/auth';
import { UserManagementModal, ProductSelector } from '@tsklets/ui';
const tierColors = {
    enterprise: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
    business: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    starter: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600',
};
const typeConfig = {
    owner: { label: 'Owner', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400', icon: 'star' },
    customer: { label: 'Customer', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400', icon: 'business' },
    partner: { label: 'Partner', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400', icon: 'handshake' },
};
export default function Clients() {
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [userModalClient, setUserModalClient] = useState(null);
    const { token } = useAuthStore();
    // Form state
    const [companyName, setCompanyName] = useState('');
    const [domain, setDomain] = useState('');
    const [clientType, setClientType] = useState('customer');
    const [tier, setTier] = useState('starter');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [adminEmail, setAdminEmail] = useState('');
    const [adminName, setAdminName] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
        fetchClients();
        fetchProducts();
    }, []);
    const fetchClients = async () => {
        try {
            const res = await fetch('/api/clients', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setClients(data.clients || []);
        }
        catch (err) {
            console.error('Failed to fetch clients', err);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setProducts(data);
        }
        catch (err) {
            console.error('Failed to fetch products', err);
        }
    };
    const fetchClientProducts = async (clientId) => {
        try {
            const res = await fetch(`/api/products/client/${clientId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setSelectedProducts(data.map((p) => p.id));
        }
        catch (err) {
            console.error('Failed to fetch client products', err);
        }
    };
    const resetForm = () => {
        setCompanyName('');
        setDomain('');
        setClientType('customer');
        setTier('starter');
        setSelectedProducts([]);
        setAdminEmail('');
        setAdminName('');
        setError('');
        setEditingClient(null);
    };
    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };
    const openEditModal = async (client) => {
        setEditingClient(client);
        setCompanyName(client.name);
        setDomain(client.domain || '');
        setClientType(client.type || 'customer');
        setTier(client.tier);
        await fetchClientProducts(client.id);
        setShowModal(true);
    };
    const openUserModal = (client) => {
        setUserModalClient(client);
        setShowUserModal(true);
    };
    const toggleClientActive = async (client) => {
        try {
            const res = await fetch(`/api/clients/${client.id}/toggle`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                fetchClients();
            }
        }
        catch (err) {
            console.error('Toggle client error:', err);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            if (editingClient) {
                // Update existing client
                const clientRes = await fetch(`/api/clients/${editingClient.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name: companyName, domain: domain || null, type: clientType, tier }),
                });
                if (!clientRes.ok) {
                    const data = await clientRes.json();
                    throw new Error(data.error || 'Failed to update client');
                }
                // Update product assignments
                await fetch(`/api/products/client/${editingClient.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ productIds: selectedProducts }),
                });
            }
            else {
                // Create new client
                const clientRes = await fetch('/api/clients', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name: companyName, domain: domain || null, type: clientType, tier }),
                });
                if (!clientRes.ok) {
                    const data = await clientRes.json();
                    throw new Error(data.error || 'Failed to create client');
                }
                const { client } = await clientRes.json();
                // Assign products
                if (selectedProducts.length > 0) {
                    await fetch('/api/products/assign', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            clientId: client.id,
                            productIds: selectedProducts,
                        }),
                    });
                }
                // Create admin user
                const userRes = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        email: adminEmail,
                        name: adminName,
                        role: 'company_admin',
                        clientId: client.id,
                    }),
                });
                if (!userRes.ok) {
                    const data = await userRes.json();
                    throw new Error(data.error || 'Failed to create admin user');
                }
            }
            // Success
            setShowModal(false);
            resetForm();
            fetchClients();
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { className: "h-screen flex overflow-hidden bg-background-light", children: [_jsx(Sidebar, {}), _jsxs("main", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsxs("header", { className: "h-16 px-6 border-b flex items-center justify-between shrink-0", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("h2", { className: "text-lg font-bold", style: { color: 'var(--text-primary)' }, children: "Clients" }), _jsxs("button", { onClick: openAddModal, className: "flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "add" }), "Add Client"] })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: loading ? (_jsx("div", { className: "flex items-center justify-center h-full", style: { color: 'var(--text-secondary)' }, children: "Loading..." })) : (_jsxs("div", { className: "rounded-xl border overflow-hidden", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "border-b", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }, children: _jsxs("tr", { children: [_jsx("th", { className: "text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide", style: { color: 'var(--text-secondary)' }, children: "Name" }), _jsx("th", { className: "text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide", style: { color: 'var(--text-secondary)' }, children: "Type" }), _jsx("th", { className: "text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide", style: { color: 'var(--text-secondary)' }, children: "Domain" }), _jsx("th", { className: "text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide", style: { color: 'var(--text-secondary)' }, children: "Tier" }), _jsx("th", { className: "text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide", style: { color: 'var(--text-secondary)' }, children: "Products" }), _jsx("th", { className: "text-center px-6 py-4 text-xs font-semibold uppercase tracking-wide", style: { color: 'var(--text-secondary)' }, children: "Status" }), _jsx("th", { className: "text-right px-6 py-4 text-xs font-semibold uppercase tracking-wide", style: { color: 'var(--text-secondary)' }, children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y", style: { borderColor: 'var(--border-secondary)' }, children: clients.map((client) => (_jsxs("tr", { className: `hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!client.isActive ? 'opacity-50' : ''}`, style: !client.isActive ? { backgroundColor: 'var(--bg-tertiary)' } : undefined, children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-9 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold text-sm", children: client.name.charAt(0) }), _jsx("button", { onClick: () => openEditModal(client), className: "font-medium text-primary hover:text-blue-700 hover:underline", children: client.name })] }) }), _jsx("td", { className: "px-6 py-4", children: (() => {
                                                            const cfg = typeConfig[client.type] || typeConfig.customer;
                                                            return (_jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border ${cfg.className}`, children: [_jsx("span", { className: "material-symbols-outlined text-[14px]", children: cfg.icon }), cfg.label] }));
                                                        })() }), _jsx("td", { className: "px-6 py-4 text-sm", style: { color: 'var(--text-secondary)' }, children: client.domain || _jsx("span", { style: { color: 'var(--text-muted)' }, children: "-" }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `px-2 py-1 rounded text-xs font-semibold border ${tierColors[client.tier]}`, children: client.tier }) }), _jsx("td", { className: "px-6 py-4", children: client.products && client.products.length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-1 max-w-xs", children: client.products.map((product) => (_jsx("span", { className: "px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300", children: product.name }, product.id))) })) : (_jsx("span", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: "No products" })) }), _jsx("td", { className: "px-6 py-4 text-center", children: _jsx("button", { onClick: () => toggleClientActive(client), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${client.isActive ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`, title: client.isActive ? 'Active - Click to deactivate' : 'Inactive - Click to activate', children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${client.isActive ? 'translate-x-6' : 'translate-x-1'}` }) }) }), _jsx("td", { className: "px-6 py-4 text-right", children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("button", { onClick: () => openUserModal(client), className: "text-slate-500 dark:text-slate-400 hover:text-primary", title: "Manage Users", children: _jsx("span", { className: "material-symbols-outlined", children: "group" }) }), _jsx("button", { onClick: () => openEditModal(client), className: "text-slate-500 dark:text-slate-400 hover:text-primary", title: "Edit Client", children: _jsx("span", { className: "material-symbols-outlined", children: "edit" }) })] }) })] }, client.id))) })] }), clients.length === 0 && (_jsx("div", { className: "text-center py-12", style: { color: 'var(--text-muted)' }, children: "No clients found" }))] })) })] }), showModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto", style: { backgroundColor: 'var(--bg-card)' }, children: [_jsxs("div", { className: "p-6 border-b", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("h3", { className: "text-lg font-bold", style: { color: 'var(--text-primary)' }, children: editingClient ? 'Edit Client' : 'Add New Client' }), _jsx("p", { className: "text-sm mt-1", style: { color: 'var(--text-secondary)' }, children: editingClient
                                        ? `Client ID: ${editingClient.id}`
                                        : 'Onboard a new client company' })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-5", children: [error && (_jsx("div", { className: "p-3 border rounded-lg text-sm", style: { backgroundColor: 'var(--error-bg)', borderColor: 'var(--error-bg)', color: 'var(--error-text)' }, children: error })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-6", children: [_jsxs("div", { className: "lg:col-span-3 space-y-4", children: [_jsxs("h4", { className: "text-sm font-semibold flex items-center gap-2", style: { color: 'var(--text-secondary)' }, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "business" }), "Company Information"] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: `block text-sm font-medium mb-1 ${companyName ? 'text-green-600' : 'text-red-500'}`, children: "Company Name *" }), _jsx("input", { type: "text", value: companyName, onChange: (e) => setCompanyName(e.target.value), className: "w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20", style: { borderColor: 'var(--border-primary)' }, required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", style: { color: 'var(--text-secondary)' }, children: "Domain" }), _jsx("input", { type: "text", value: domain, onChange: (e) => setDomain(e.target.value), className: "w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20", style: { borderColor: 'var(--border-primary)' }, placeholder: "e.g., acme.com" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", style: { color: 'var(--text-secondary)' }, children: "Client Type" }), _jsxs("select", { value: clientType, onChange: (e) => setClientType(e.target.value), className: "w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("option", { value: "customer", children: "Customer" }), _jsx("option", { value: "partner", children: "Partner" }), _jsx("option", { value: "owner", children: "Owner" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", style: { color: 'var(--text-secondary)' }, children: "Tier" }), _jsxs("select", { value: tier, onChange: (e) => setTier(e.target.value), className: "w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("option", { value: "starter", children: "Starter" }), _jsx("option", { value: "business", children: "Business" }), _jsx("option", { value: "enterprise", children: "Enterprise" })] })] })] })] }), _jsxs("div", { className: "lg:col-span-2", children: [_jsxs("h4", { className: "text-sm font-semibold flex items-center gap-2 mb-4", style: { color: 'var(--text-secondary)' }, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "inventory_2" }), "Products"] }), _jsx(ProductSelector, { products: products, selectedIds: selectedProducts, onChange: setSelectedProducts, placeholder: "Select products..." })] })] }), !editingClient && (_jsxs("div", { className: "space-y-4", children: [_jsxs("h4", { className: "text-sm font-semibold flex items-center gap-2", style: { color: 'var(--text-secondary)' }, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "person" }), "Admin User"] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: `block text-sm font-medium mb-1 ${adminName ? 'text-green-600' : 'text-red-500'}`, children: "Admin Name *" }), _jsx("input", { type: "text", value: adminName, onChange: (e) => setAdminName(e.target.value), className: "w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20", style: { borderColor: 'var(--border-primary)' }, required: true }), _jsx("p", { className: "text-xs mt-1", style: { color: 'var(--text-muted)' }, children: "Company admin name" })] }), _jsxs("div", { children: [_jsx("label", { className: `block text-sm font-medium mb-1 ${adminEmail ? 'text-green-600' : 'text-red-500'}`, children: "Admin Email *" }), _jsx("input", { type: "email", value: adminEmail, onChange: (e) => setAdminEmail(e.target.value), className: "w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20", style: { borderColor: 'var(--border-primary)' }, required: true }), _jsx("p", { className: "text-xs mt-1", style: { color: 'var(--text-muted)' }, children: "Client admin email ID" })] })] }), _jsx("div", { className: "p-3 bg-blue-50 border border-blue-100 rounded-lg", children: _jsxs("p", { className: "text-xs text-blue-700", children: [_jsx("span", { className: "font-medium", children: "Note:" }), " An email will be sent to verify this email address. Default password: ", _jsx("span", { className: "font-mono font-medium", children: "Systech@123" })] }) })] })), _jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("button", { type: "button", onClick: () => { setShowModal(false); resetForm(); }, className: "px-4 py-2 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors", style: { color: 'var(--text-secondary)' }, children: "Cancel" }), _jsx("button", { type: "submit", disabled: saving, className: "px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50", children: saving ? 'Saving...' : (editingClient ? 'Save Changes' : 'Create Client') })] })] })] }) })), userModalClient && (_jsx(UserManagementModal, { isOpen: showUserModal, onClose: () => setShowUserModal(false), client: userModalClient, token: token, showResetPassword: true, isInternal: true, maxProducts: 2 }))] }));
}
