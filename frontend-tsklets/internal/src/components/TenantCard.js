import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
const tierColors = {
    enterprise: 'bg-purple-100 text-purple-700 border-purple-200',
    business: 'bg-blue-100 text-blue-700 border-blue-200',
    starter: 'bg-slate-100 text-slate-700 border-slate-200',
};
const gradients = [
    'from-blue-50 to-indigo-50',
    'from-orange-50 to-red-50',
    'from-gray-50 to-gray-100',
    'from-emerald-50 to-teal-50',
    'from-cyan-50 to-sky-50',
    'from-fuchsia-50 to-pink-50',
];
export default function TenantCard({ tenant }) {
    const navigate = useNavigate();
    const gradient = gradients[tenant.id % gradients.length];
    return (_jsxs("div", { className: "group rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden cursor-pointer", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("div", { className: `h-24 bg-gradient-to-r ${gradient} relative`, children: _jsx("div", { className: "absolute top-3 right-3", children: _jsx("span", { className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${tenant.isActive
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-red-100 text-red-800 border-red-200'}`, children: tenant.isActive ? 'Active' : 'Inactive' }) }) }), _jsxs("div", { className: "px-5 pb-5 flex-1 flex flex-col", children: [_jsx("div", { className: "relative -mt-10 mb-3", children: _jsx("div", { className: "size-16 rounded-xl p-1 shadow-sm", style: { backgroundColor: 'var(--bg-card)' }, children: _jsx("div", { className: "w-full h-full rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-bold text-xl border", style: { color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }, children: tenant.name.charAt(0) }) }) }), _jsx("div", { className: "flex items-center gap-2 mb-1", children: _jsx("h3", { className: "text-lg font-bold truncate", style: { color: 'var(--text-primary)' }, children: tenant.name }) }), _jsx("div", { className: "flex items-center gap-2 mb-4", children: _jsx("span", { className: `inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border ${tierColors[tenant.tier]}`, children: tenant.tier.charAt(0).toUpperCase() + tenant.tier.slice(1) }) }), _jsxs("div", { className: "grid grid-cols-2 gap-4 py-4 border-t mb-4", style: { borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-xs uppercase font-semibold tracking-wider", style: { color: 'var(--text-muted)' }, children: "Users" }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", style: { color: 'var(--text-muted)' }, children: "group" }), _jsx("span", { className: "text-sm font-semibold", style: { color: 'var(--text-primary)' }, children: tenant.userCount })] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-xs uppercase font-semibold tracking-wider", style: { color: 'var(--text-muted)' }, children: "Tickets" }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", style: { color: 'var(--text-muted)' }, children: "confirmation_number" }), _jsx("span", { className: "text-sm font-semibold", style: { color: 'var(--text-primary)' }, children: tenant.ticketCount })] })] })] }), _jsx("div", { className: "mt-auto", children: _jsxs("button", { onClick: () => navigate('/clients'), className: "w-full flex items-center justify-center gap-2 rounded-lg border bg-transparent py-2 px-4 text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors", style: { borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "settings" }), "Configure"] }) })] })] }));
}
