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
            if (!res.ok) {
                throw new Error(data.error || 'Sign in failed');
            }
            setAuth(data.user, data.token);
            navigate('/');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Sign in failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center px-4 py-12", style: { backgroundColor: 'var(--bg-primary)' }, children: [_jsxs("div", { className: "flex items-center gap-3 mb-8", children: [_jsx("div", { className: "flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white", children: _jsx("span", { className: "material-symbols-outlined text-2xl", children: "support_agent" }) }), _jsx("h2", { className: "text-2xl font-bold", style: { color: 'var(--text-primary)' }, children: "Support Desk" })] }), _jsxs("div", { className: "py-10 px-6 shadow-card rounded-xl w-full max-w-[480px] sm:px-10 border", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "mb-8 text-center", children: [_jsx("h1", { className: "text-[28px] font-bold pb-2", style: { color: 'var(--text-primary)' }, children: "Welcome back" }), _jsx("p", { style: { color: 'var(--text-secondary)' }, children: "Enter your credentials to access the portal." })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [error && (_jsx("div", { className: "px-4 py-3 rounded-lg text-sm", style: { backgroundColor: 'var(--error-bg)', color: 'var(--error-text)' }, children: error })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-secondary)' }, children: "Work Email" }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", style: { color: 'var(--text-muted)' }, children: _jsx("span", { className: "material-symbols-outlined text-[20px]", children: "mail" }) }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "name@company.com", required: true, className: "block w-full rounded-lg border-0 py-3 pl-10 ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-primary text-sm", style: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' } })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("label", { className: "block text-sm font-medium", style: { color: 'var(--text-secondary)' }, children: "Password" }), _jsx("a", { href: "#", className: "text-sm font-semibold text-primary hover:text-blue-500", children: "Forgot password?" })] }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", style: { color: 'var(--text-muted)' }, children: _jsx("span", { className: "material-symbols-outlined text-[20px]", children: "lock" }) }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, className: "block w-full rounded-lg border-0 py-3 pl-10 pr-10 ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-primary text-sm", style: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' } })] })] }), _jsx("button", { type: "submit", disabled: loading, className: "flex w-full justify-center rounded-lg bg-primary px-3 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50", children: loading ? 'Signing in...' : 'Sign In' })] }), _jsxs("p", { className: "mt-8 text-center text-sm", style: { color: 'var(--text-secondary)' }, children: ["Don't have an account?", ' ', _jsx("a", { href: "#", className: "font-semibold text-primary hover:text-blue-500", children: "Contact Admin" })] })] }), _jsx("p", { className: "mt-8 text-center text-xs", style: { color: 'var(--text-muted)' }, children: "\u00A9 2024 Support Desk Inc. All rights reserved." })] }));
}
