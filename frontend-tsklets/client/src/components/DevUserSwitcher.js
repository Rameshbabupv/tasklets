import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuthStore } from '../store/auth';
const DEV_USERS = [
    // Acme Corp Users
    { email: 'john@acme.com', name: 'John', role: 'user', tenant: 'Acme Corp', password: 'Systech@123' },
    { email: 'jane@acme.com', name: 'Jane', role: 'user', tenant: 'Acme Corp', password: 'Systech@123' },
    { email: 'kumar@acme.com', name: 'Kumar', role: 'user', tenant: 'Acme Corp', password: 'Systech@123' },
    { email: 'latha@acme.com', name: 'Latha', role: 'company_admin', tenant: 'Acme Corp', password: 'Systech@123' },
    { email: 'deepa@acme.com', name: 'Deepa', role: 'company_admin', tenant: 'Acme Corp', password: 'Systech@123' },
    // TechCorp Users
    { email: 'alex@techcorp.com', name: 'Alex', role: 'user', tenant: 'TechCorp', password: 'Systech@123' },
    { email: 'sara@techcorp.com', name: 'Sara', role: 'user', tenant: 'TechCorp', password: 'Systech@123' },
    { email: 'mike@techcorp.com', name: 'Mike', role: 'company_admin', tenant: 'TechCorp', password: 'Systech@123' },
];
export default function DevUserSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const [switching, setSwitching] = useState(false);
    const { user, setAuth } = useAuthStore();
    // Only show in development
    if (import.meta.env.PROD)
        return null;
    const switchUser = async (devUser) => {
        setSwitching(true);
        try {
            console.log('[DevSwitcher] Switching to:', devUser.email);
            const res = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: devUser.email,
                    password: devUser.password,
                }),
            });
            console.log('[DevSwitcher] Response status:', res.status);
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                console.error('[DevSwitcher] Error response:', errorData);
                throw new Error(errorData.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            console.log('[DevSwitcher] Login successful, user:', data.user);
            setAuth(data.user, data.token);
            console.log('[DevSwitcher] Reloading page...');
            window.location.reload();
        }
        catch (error) {
            console.error('[DevSwitcher] Failed to switch user:', error);
            alert(`Failed to switch user: ${error.message || error}`);
        }
        finally {
            setSwitching(false);
        }
    };
    const getRoleBadgeColor = (role) => {
        const colors = {
            user: 'bg-slate-100 text-slate-700',
            company_admin: 'bg-indigo-100 text-indigo-700',
            gatekeeper: 'bg-orange-100 text-orange-700',
            approver: 'bg-purple-100 text-purple-700',
        };
        return colors[role] || 'bg-slate-100 text-slate-700';
    };
    // Group users by tenant
    const groupedUsers = DEV_USERS.reduce((acc, user) => {
        if (!acc[user.tenant])
            acc[user.tenant] = [];
        acc[user.tenant].push(user);
        return acc;
    }, {});
    return (_jsxs("div", { className: "fixed bottom-4 right-4 z-50", children: [_jsxs("button", { onClick: () => setIsOpen(!isOpen), className: "flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg shadow-lg hover:bg-slate-800 transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", children: isOpen ? 'close' : 'swap_horiz' }), _jsx("span", { className: "text-sm font-medium", children: "Dev Switcher" })] }), isOpen && (_jsxs("div", { className: "absolute bottom-14 right-0 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-96 overflow-y-auto", children: [_jsx("div", { className: "p-3 border-b border-slate-200 bg-slate-50", children: _jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-600", children: [_jsx("span", { className: "material-symbols-outlined text-[16px]", children: "info" }), _jsx("span", { children: "Click any user to switch instantly" })] }) }), _jsx("div", { className: "p-2", children: Object.entries(groupedUsers).map(([tenant, users]) => (_jsxs("div", { className: "mb-2", children: [_jsx("div", { className: "text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 py-1", children: tenant }), users.map((devUser) => {
                                    const isCurrent = user?.email === devUser.email;
                                    return (_jsx("button", { onClick: () => !isCurrent && switchUser(devUser), disabled: switching || isCurrent, className: `w-full text-left px-3 py-2 rounded-lg transition-colors ${isCurrent
                                            ? 'bg-primary/10 border border-primary/30'
                                            : 'hover:bg-slate-50 border border-transparent'} ${switching ? 'opacity-50 cursor-not-allowed' : ''}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-semibold text-slate-900 truncate", children: devUser.name }), isCurrent && (_jsx("span", { className: "material-symbols-outlined text-[16px] text-primary", children: "check_circle" }))] }), _jsx("div", { className: "text-xs text-slate-500 truncate", children: devUser.email })] }), _jsx("span", { className: `text-xs px-2 py-0.5 rounded font-medium ${getRoleBadgeColor(devUser.role)}`, children: devUser.role.replace('_', ' ') })] }) }, devUser.email));
                                })] }, tenant))) }), _jsxs("div", { className: "p-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 text-center", children: ["All passwords: ", _jsx("code", { className: "bg-slate-200 px-1 rounded", children: "Systech@123" })] })] }))] }));
}
