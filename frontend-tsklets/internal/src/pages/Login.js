import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || 'Login failed');
            if (!data.user.isInternal)
                throw new Error('Access denied. Internal team only.');
            setAuth(data.token, data.user);
            navigate('/');
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center px-4", style: { backgroundColor: 'var(--bg-primary)' }, children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs("div", { className: "flex flex-col items-center mb-8", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg text-white", children: _jsx("span", { className: "material-symbols-outlined", children: "support_agent" }) }), _jsx("h2", { className: "text-2xl font-bold", style: { color: 'var(--text-primary)' }, children: "Support Desk" })] }), _jsx("span", { className: "text-sm mt-1", style: { color: 'var(--text-secondary)' }, children: "Internal Portal" })] }), _jsxs("div", { className: "py-10 px-8 shadow-sm rounded-xl border", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "mb-8 text-center", children: [_jsx("h1", { className: "text-2xl font-bold mb-2", style: { color: 'var(--text-primary)' }, children: "Team Login" }), _jsx("p", { style: { color: 'var(--text-secondary)' }, children: "Access the support management dashboard" })] }), error && (_jsx("div", { className: "mb-4 p-3 border rounded-lg text-sm", style: { backgroundColor: 'var(--error-bg)', borderColor: 'var(--error-text)', color: 'var(--error-text)' }, children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-secondary)' }, children: "Email" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]", style: { color: 'var(--text-muted)' }, children: "mail" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@company.com", className: "w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }, required: true })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-secondary)' }, children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]", style: { color: 'var(--text-muted)' }, children: "lock" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Enter password", className: "w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }, required: true })] })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full py-3 bg-primary hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50", children: loading ? 'Signing in...' : 'Sign In' })] })] })] }) }));
}
