import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
export default function APIKeys() {
    const { token } = useAuthStore();
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKeyValue, setNewKeyValue] = useState(null);
    useEffect(() => {
        fetchApiKeys();
    }, []);
    async function fetchApiKeys() {
        try {
            const res = await fetch('/api/api-keys', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setApiKeys(data.apiKeys || []);
        }
        catch (error) {
            console.error('Fetch API keys error:', error);
            toast.error('Failed to load API keys');
        }
        finally {
            setLoading(false);
        }
    }
    async function handleRevoke(keyId) {
        if (!confirm('Revoke this API key? Any applications using it will stop working.'))
            return;
        try {
            const res = await fetch(`/api/api-keys/${keyId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setApiKeys(prev => prev.filter(k => k.id !== keyId));
                toast.success('API key revoked');
            }
            else {
                toast.error('Failed to revoke API key');
            }
        }
        catch (error) {
            toast.error('Failed to revoke API key');
        }
    }
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    }
    return (_jsxs("div", { className: "flex h-screen bg-background-light overflow-hidden", children: [_jsx(Toaster, { position: "top-right", richColors: true }), _jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-y-auto", children: _jsxs("div", { className: "max-w-4xl mx-auto p-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-4xl font-display font-bold bg-gradient-spark bg-clip-text text-transparent mb-2", children: [_jsx("span", { className: "inline-block animate-float", children: "\uD83D\uDD11" }), " API Keys"] }), _jsx("p", { className: "text-lg", style: { color: 'var(--text-secondary)' }, children: "Manage API keys for external access to AI configs" })] }), _jsxs(motion.button, { onClick: () => setShowCreateModal(true), className: "btn-primary flex items-center gap-2", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", children: "add" }), "New API Key"] })] }), _jsx("div", { className: "rounded-xl border p-4 bg-blue-50 border-blue-200 mb-6", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("span", { className: "material-symbols-outlined text-blue-600", children: "info" }), _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-semibold text-blue-800 mb-1", children: "External API Access" }), _jsxs("p", { className: "text-blue-700", children: ["Use API keys to access configs from external applications like Claude Code CLI. Include the key in the ", _jsx("code", { className: "px-1 py-0.5 bg-blue-100 rounded", children: "X-API-Key" }), " header."] }), _jsx("p", { className: "text-blue-600 mt-2 font-mono text-xs", children: "GET /api/v1/configs/your-config-slug" })] })] }) })] }), loading ? (_jsx("div", { className: "space-y-4", children: [1, 2, 3].map(i => (_jsxs("div", { className: "rounded-xl border p-4 animate-pulse", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("div", { className: "h-6 rounded w-1/3 mb-2", style: { backgroundColor: 'var(--bg-tertiary)' } }), _jsx("div", { className: "h-4 rounded w-1/4", style: { backgroundColor: 'var(--bg-tertiary)' } })] }, i))) })) : apiKeys.length === 0 ? (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, className: "text-center py-20 bg-gradient-to-br from-white to-amber-50/30 rounded-2xl border border-amber-100", children: [_jsx("div", { className: "text-8xl mb-6", children: "\uD83D\uDD11" }), _jsx("h3", { className: "text-2xl font-bold font-display mb-3", style: { color: 'var(--text-primary)' }, children: "No API keys yet" }), _jsx("p", { className: "mb-8 max-w-md mx-auto text-lg", style: { color: 'var(--text-secondary)' }, children: "Create an API key to access your AI configs from external applications" }), _jsx(motion.button, { onClick: () => setShowCreateModal(true), className: "btn-primary text-lg px-8 py-3", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: "Create Your First API Key" })] })) : (_jsx("div", { className: "space-y-4", children: _jsx(AnimatePresence, { children: apiKeys.map((key, i) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { delay: i * 0.05 }, className: "rounded-xl border p-6 card-hover", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("h3", { className: "font-bold text-lg", style: { color: 'var(--text-primary)' }, children: key.name }), _jsxs("code", { className: "px-2 py-1 rounded text-sm cursor-pointer hover:bg-slate-100", style: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }, onClick: () => copyToClipboard(`${key.keyPrefix}...`), title: "Click to copy prefix", children: [key.keyPrefix, "..."] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-4 text-sm", style: { color: 'var(--text-muted)' }, children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[16px]", children: "schedule" }), "Created ", new Date(key.createdAt).toLocaleDateString()] }), key.lastUsedAt && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[16px]", children: "history" }), "Last used ", new Date(key.lastUsedAt).toLocaleDateString()] })), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[16px]", children: "speed" }), key.rateLimit, " req/min"] })] }), _jsx("div", { className: "flex flex-wrap gap-2 mt-3", children: (key.scopes || []).map(scope => (_jsx("span", { className: "px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700", children: scope }, scope))) })] }), _jsx("button", { onClick: () => handleRevoke(key.id), className: "px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors", children: "Revoke" })] }) }, key.id))) }) }))] }) }), _jsx(AnimatePresence, { children: showCreateModal && (_jsx(CreateKeyModal, { onClose: () => {
                        setShowCreateModal(false);
                        setNewKeyValue(null);
                    }, onCreated: (keyValue) => {
                        setNewKeyValue(keyValue);
                        fetchApiKeys();
                    }, newKeyValue: newKeyValue })) })] }));
}
function CreateKeyModal({ onClose, onCreated, newKeyValue, }) {
    const { token } = useAuthStore();
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);
    async function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim())
            return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/api-keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, scopes: ['read'] })
            });
            if (res.ok) {
                const data = await res.json();
                onCreated(data.key);
                toast.success('API key created!');
            }
            else {
                const data = await res.json();
                toast.error(data.error || 'Failed to create API key');
            }
        }
        catch (error) {
            toast.error('Failed to create API key');
        }
        finally {
            setSubmitting(false);
        }
    }
    function copyKey() {
        if (newKeyValue) {
            navigator.clipboard.writeText(newKeyValue);
            setCopied(true);
            toast.success('API key copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        }
    }
    return (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4", onClick: onClose, children: _jsx(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "rounded-2xl shadow-2xl max-w-lg w-full", style: { backgroundColor: 'var(--bg-card)' }, onClick: (e) => e.stopPropagation(), children: newKeyValue ? (
            // Show the new key
            _jsxs(_Fragment, { children: [_jsx("div", { className: "p-6 border-b bg-green-50", style: { borderColor: 'var(--border-primary)' }, children: _jsxs("div", { className: "flex items-center gap-2 text-green-700", children: [_jsx("span", { className: "material-symbols-outlined", children: "check_circle" }), _jsx("h2", { className: "text-xl font-display font-bold", children: "API Key Created" })] }) }), _jsxs("div", { className: "p-6", children: [_jsx("div", { className: "rounded-xl border-2 border-amber-200 bg-amber-50 p-4 mb-6", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("span", { className: "material-symbols-outlined text-amber-600", children: "warning" }), _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-semibold text-amber-800 mb-1", children: "Save this key now!" }), _jsx("p", { className: "text-amber-700", children: "This is the only time you'll see this key. Copy it and store it securely." })] })] }) }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-semibold mb-2", style: { color: 'var(--text-secondary)' }, children: "Your API Key" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: newKeyValue, readOnly: true, className: "input-field font-mono text-sm flex-1" }), _jsx("button", { onClick: copyKey, className: `px-4 py-2 rounded-lg font-medium transition-all ${copied
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-primary text-white hover:bg-primary/90'}`, children: copied ? 'Copied!' : 'Copy' })] })] }), _jsxs("div", { className: "rounded-lg p-4", style: { backgroundColor: 'var(--bg-tertiary)' }, children: [_jsx("p", { className: "text-sm font-semibold mb-2", style: { color: 'var(--text-secondary)' }, children: "Usage Example" }), _jsx("pre", { className: "text-xs font-mono overflow-x-auto", style: { color: 'var(--text-primary)' }, children: `curl -H "X-API-Key: ${newKeyValue}" \\
  https://your-domain.com/api/v1/configs/your-slug` })] }), _jsx("button", { onClick: onClose, className: "btn-primary w-full mt-6", children: "Done" })] })] })) : (
            // Create form
            _jsxs(_Fragment, { children: [_jsx("div", { className: "p-6 border-b", style: { borderColor: 'var(--border-primary)' }, children: _jsx("h2", { className: "text-xl font-display font-bold", style: { color: 'var(--text-primary)' }, children: "Create API Key" }) }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-2", style: { color: 'var(--text-secondary)' }, children: "Key Name *" }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g., Claude Code CLI, Production App", className: "input-field", required: true, autoFocus: true }), _jsx("p", { className: "text-xs mt-1", style: { color: 'var(--text-muted)' }, children: "A descriptive name to help you identify this key" })] }), _jsxs("div", { className: "rounded-lg p-4", style: { backgroundColor: 'var(--bg-tertiary)' }, children: [_jsx("p", { className: "text-sm font-semibold mb-2", style: { color: 'var(--text-secondary)' }, children: "Permissions" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700", children: "read" }), _jsx("span", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: "Access to read your AI configs" })] })] }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "btn-secondary flex-1", children: "Cancel" }), _jsx(motion.button, { type: "submit", disabled: submitting || !name.trim(), className: "btn-primary flex-1 disabled:opacity-50", whileHover: !submitting && name.trim() ? { scale: 1.02 } : {}, whileTap: !submitting && name.trim() ? { scale: 0.98 } : {}, children: submitting ? 'Creating...' : 'Create API Key' })] })] })] })) }) }));
}
