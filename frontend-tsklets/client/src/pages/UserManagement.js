import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/auth';
export default function UserManagement() {
    const { token, user: currentUser } = useAuthStore();
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const isCompanyAdmin = currentUser?.role === 'company_admin';
    useEffect(() => {
        if (isCompanyAdmin) {
            fetchUsers();
            fetchProducts();
        }
    }, [isCompanyAdmin]);
    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users/company', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setUsers(data);
            }
            else {
                console.error('Failed to fetch users:', data.error || 'Unknown error');
                setUsers([]);
            }
        }
        catch (err) {
            console.error('Failed to fetch users:', err);
            setUsers([]);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchProducts = async () => {
        if (!currentUser?.id)
            return;
        try {
            const res = await fetch(`/api/users/${currentUser.id}/products`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setProducts(data);
        }
        catch (err) {
            console.error('Failed to fetch products:', err);
        }
    };
    const handleResetPassword = async (userId, userName) => {
        if (!confirm(`Reset password for ${userName}? They will receive the default password: Systech@123`)) {
            return;
        }
        try {
            const res = await fetch(`/api/users/${userId}/reset-password`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok)
                throw new Error('Failed to reset password');
            const data = await res.json();
            alert(data.message);
            fetchUsers(); // Refresh list
        }
        catch (err) {
            alert(err.message);
        }
    };
    // Check if user is company_admin (after all hooks)
    if (!isCompanyAdmin) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", style: { backgroundColor: 'var(--bg-secondary)' }, children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold mb-2", style: { color: 'var(--text-primary)' }, children: "Access Denied" }), _jsx("p", { style: { color: 'var(--text-secondary)' }, children: "You must be a company admin to access this page." }), _jsx(Link, { to: "/", className: "text-primary hover:underline mt-4 inline-block", children: "Go to Dashboard" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsxs("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", style: { color: 'var(--text-primary)' }, children: "User Management" }), _jsx("p", { style: { color: 'var(--text-secondary)' }, children: "Manage users in your organization" })] }), _jsxs(motion.button, { onClick: () => setShowCreateModal(true), whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, className: "inline-flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-md", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "add" }), _jsx("span", { className: "hidden sm:inline", children: "Create User" })] })] }), loading ? (_jsx("div", { className: "flex justify-center items-center py-12", children: _jsx("div", { className: "inline-block size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" }) })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "hidden md:block rounded-xl border shadow-card overflow-hidden", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { style: { backgroundColor: 'var(--bg-tertiary)' }, children: _jsxs("tr", { className: "text-left text-xs font-bold uppercase tracking-wider", style: { color: 'var(--text-secondary)' }, children: [_jsx("th", { className: "px-6 py-4", children: "Name" }), _jsx("th", { className: "px-6 py-4", children: "Email" }), _jsx("th", { className: "px-6 py-4", children: "Role" }), _jsx("th", { className: "px-6 py-4", children: "Products" }), _jsx("th", { className: "px-6 py-4", children: "Status" }), _jsx("th", { className: "px-6 py-4", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y", style: { borderColor: 'var(--border-primary)' }, children: users.map((user) => (_jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [_jsx("td", { className: "px-6 py-4", children: _jsxs("div", { children: [_jsx("button", { onClick: () => setEditingUser(user), className: "font-semibold text-sm text-primary hover:text-purple-600 hover:underline text-left", children: user.name }), user.requirePasswordChange && (_jsx("span", { className: "block text-xs text-yellow-600 dark:text-yellow-400", children: "Password change required" }))] }) }), _jsx("td", { className: "px-6 py-4 text-sm", style: { color: 'var(--text-secondary)' }, children: user.email }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'company_admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`, children: user.role }) }), _jsx("td", { className: "px-6 py-4", children: user.products.length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-1", children: user.products.map((product) => (_jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs", style: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }, children: product.name }, product.id))) })) : (_jsx("span", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: "No products" })) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`, children: user.isActive ? 'Active' : 'Inactive' }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("button", { onClick: () => handleResetPassword(user.id, user.name), className: "text-sm text-primary hover:text-purple-600 font-medium", children: "Reset Password" }) })] }, user.id))) })] }) }), _jsx("div", { className: "md:hidden space-y-4", children: users.map((user) => (_jsxs("div", { className: "rounded-lg border p-4", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("button", { onClick: () => setEditingUser(user), className: "font-semibold text-primary hover:text-purple-600 hover:underline text-left", children: user.name }), _jsx("p", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: user.email })] }), _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`, children: user.isActive ? 'Active' : 'Inactive' })] }), _jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'company_admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`, children: user.role }), user.requirePasswordChange && (_jsx("span", { className: "text-xs text-yellow-600 dark:text-yellow-400", children: "Password change required" }))] }), user.products.length > 0 && (_jsxs("div", { className: "mb-3", children: [_jsx("p", { className: "text-xs font-medium mb-1", style: { color: 'var(--text-secondary)' }, children: "Products:" }), _jsx("div", { className: "flex flex-wrap gap-1", children: user.products.map((product) => (_jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs", style: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }, children: product.name }, product.id))) })] })), _jsxs("button", { onClick: () => handleResetPassword(user.id, user.name), className: "w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "lock_reset" }), "Reset Password"] })] }, user.id))) })] }))] }), showCreateModal && (_jsx(CreateUserModal, { products: products, onClose: () => setShowCreateModal(false), onSuccess: () => {
                    setShowCreateModal(false);
                    fetchUsers();
                }, token: token })), editingUser && (_jsx(EditUserModal, { user: editingUser, products: products, onClose: () => setEditingUser(null), onSuccess: () => {
                    setEditingUser(null);
                    fetchUsers();
                }, token: token }))] }));
}
function CreateUserModal({ products, onClose, onSuccess, token }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        email: '',
        name: '',
        role: 'user',
        productIds: [],
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/users/company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to create user');
            }
            alert(`User created successfully! Default password: Systech@123\n\nPlease share this password with ${form.name}.`);
            onSuccess();
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const handleProductToggle = (productId) => {
        if (form.productIds.includes(productId)) {
            setForm({ ...form, productIds: form.productIds.filter(id => id !== productId) });
        }
        else {
            setForm({ ...form, productIds: [...form.productIds, productId] });
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick: onClose, children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-slate-100", children: "Create New User" }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300", children: _jsx("span", { className: "material-symbols-outlined", children: "close" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Email *" }), _jsx("input", { type: "email", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), required: true, className: "w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary", placeholder: "user@example.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Name *" }), _jsx("input", { type: "text", value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), required: true, className: "w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary", placeholder: "John Doe" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Role *" }), _jsxs("select", { value: form.role, onChange: (e) => setForm({ ...form, role: e.target.value }), className: "w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary", children: [_jsx("option", { value: "user", children: "User" }), _jsx("option", { value: "company_admin", children: "Company Admin" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Products (Optional)" }), _jsx("div", { className: "space-y-2 max-h-48 overflow-y-auto", children: products.map((product) => (_jsxs("label", { className: "flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: form.productIds.includes(product.id), onChange: () => handleProductToggle(product.id), className: "rounded border-slate-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-slate-700 dark:text-slate-300", children: product.name })] }, product.id))) })] }), error && (_jsx("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3", children: _jsx("p", { className: "text-sm text-red-600 dark:text-red-400", children: error }) })), _jsxs("div", { className: "flex items-center justify-end gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100", children: "Cancel" }), _jsxs("button", { type: "submit", disabled: loading, className: "inline-flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "add" }), loading ? 'Creating...' : 'Create User'] })] })] })] }) }));
}
function EditUserModal({ user, products, onClose, onSuccess, token }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        productIds: user.products.map(p => p.id),
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`/api/users/company/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update user');
            }
            onSuccess();
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const handleProductToggle = (productId) => {
        if (form.productIds.includes(productId)) {
            setForm({ ...form, productIds: form.productIds.filter(id => id !== productId) });
        }
        else {
            setForm({ ...form, productIds: [...form.productIds, productId] });
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick: onClose, children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-slate-100", children: "Edit User" }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300", children: _jsx("span", { className: "material-symbols-outlined", children: "close" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Email" }), _jsx("input", { type: "email", value: user.email, disabled: true, className: "w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed" }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Email cannot be changed" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Name *" }), _jsx("input", { type: "text", value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), required: true, className: "w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Role *" }), _jsxs("select", { value: form.role, onChange: (e) => setForm({ ...form, role: e.target.value }), className: "w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary", children: [_jsx("option", { value: "user", children: "User" }), _jsx("option", { value: "company_admin", children: "Company Admin" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Status" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { type: "button", onClick: () => setForm({ ...form, isActive: true }), className: `flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.isActive
                                                ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400'
                                                : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`, children: "Active" }), _jsx("button", { type: "button", onClick: () => setForm({ ...form, isActive: false }), className: `flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${!form.isActive
                                                ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-400'
                                                : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`, children: "Inactive" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Products" }), _jsx("div", { className: "space-y-2 max-h-48 overflow-y-auto", children: products.map((product) => (_jsxs("label", { className: "flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: form.productIds.includes(product.id), onChange: () => handleProductToggle(product.id), className: "rounded border-slate-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-slate-700 dark:text-slate-300", children: product.name })] }, product.id))) })] }), error && (_jsx("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3", children: _jsx("p", { className: "text-sm text-red-600 dark:text-red-400", children: error }) })), _jsxs("div", { className: "flex items-center justify-end gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100", children: "Cancel" }), _jsxs("button", { type: "submit", disabled: loading, className: "inline-flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "save" }), loading ? 'Saving...' : 'Save Changes'] })] })] })] }) }));
}
