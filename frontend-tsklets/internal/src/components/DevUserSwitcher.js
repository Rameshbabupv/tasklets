import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuthStore } from '../store/auth';
const DEV_USERS = [
    // Internal Portal Users (password: Systech@123)
    { email: 'ramesh@systech.com', name: 'Ramesh', role: 'admin', tenant: 'Systech-erp.ai', password: 'Systech@123' },
    { email: 'mohan@systech.com', name: 'Mohan', role: 'support', tenant: 'Systech-erp.ai', password: 'Systech@123' },
    { email: 'sakthi@systech.com', name: 'Sakthi', role: 'integrator', tenant: 'Systech-erp.ai', password: 'Systech@123' },
    { email: 'jai@systech.com', name: 'Jai', role: 'developer', tenant: 'Systech-erp.ai', password: 'Systech@123' },
    { email: 'priya@systech.com', name: 'Priya', role: 'developer', tenant: 'Systech-erp.ai', password: 'Systech@123' },
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
            setAuth(data.token, data.user);
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
            admin: 'bg-red-100 text-red-700',
            support: 'bg-blue-100 text-blue-700',
            integrator: 'bg-purple-100 text-purple-700',
            developer: 'bg-green-100 text-green-700',
            ceo: 'bg-amber-100 text-amber-700',
        };
        return colors[role] || 'bg-slate-100 text-slate-700';
    };
    return (_jsxs("div", { className: "fixed bottom-4 right-4 z-50", children: [_jsxs("button", { onClick: () => setIsOpen(!isOpen), className: "flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg shadow-lg hover:bg-slate-800 transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", children: isOpen ? 'close' : 'swap_horiz' }), _jsx("span", { className: "text-sm font-medium", children: "Dev Switcher" })] }), isOpen && (_jsxs("div", { className: "absolute bottom-14 right-0 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-96 overflow-y-auto", children: [_jsx("div", { className: "p-3 border-b border-slate-200 bg-slate-50", children: _jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-600", children: [_jsx("span", { className: "material-symbols-outlined text-[16px]", children: "info" }), _jsx("span", { children: "Click any user to switch instantly" })] }) }), _jsxs("div", { className: "p-2", children: [_jsx("div", { className: "text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 py-1", children: "Internal Portal Users" }), DEV_USERS.map((devUser) => {
                                const isCurrent = user?.email === devUser.email;
                                return (_jsx("button", { onClick: () => !isCurrent && switchUser(devUser), disabled: switching || isCurrent, className: `w-full text-left px-3 py-2 rounded-lg transition-colors ${isCurrent
                                        ? 'bg-primary/10 border border-primary/30'
                                        : 'hover:bg-slate-50 border border-transparent'} ${switching ? 'opacity-50 cursor-not-allowed' : ''}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-semibold text-slate-900 truncate", children: devUser.name }), isCurrent && (_jsx("span", { className: "material-symbols-outlined text-[16px] text-primary", children: "check_circle" }))] }), _jsx("div", { className: "text-xs text-slate-500 truncate", children: devUser.email })] }), _jsx("span", { className: `text-xs px-2 py-0.5 rounded font-medium ${getRoleBadgeColor(devUser.role)}`, children: devUser.role })] }) }, devUser.email));
                            })] }), _jsxs("div", { className: "p-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 text-center", children: ["All passwords: ", _jsx("code", { className: "bg-slate-200 px-1 rounded", children: "Systech@123" })] })] }))] }));
}
