import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useCreateHub } from '../../store/createHub';
import { useAuthStore } from '../../store/auth';
import { toast } from 'sonner';
const typeConfig = {
    idea: { icon: '💡', color: 'from-yellow-500 to-amber-500', label: 'Idea' },
    requirement: { icon: '📝', color: 'from-blue-500 to-indigo-500', label: 'Requirement' },
    epic: { icon: '🎯', color: 'from-purple-500 to-pink-500', label: 'Epic' },
    feature: { icon: '✨', color: 'from-cyan-500 to-blue-500', label: 'Feature' },
    task: { icon: '✅', color: 'from-green-500 to-emerald-500', label: 'Task' },
    bug: { icon: '🐛', color: 'from-red-500 to-rose-500', label: 'Bug' },
    ticket: { icon: '🎫', color: 'from-orange-500 to-amber-500', label: 'Ticket' },
};
export default function CreateForm({ type }) {
    const { close, selectType } = useCreateHub();
    const { token } = useAuthStore();
    const [mode, setMode] = useState('quick');
    const [submitting, setSubmitting] = useState(false);
    const [clients, setClients] = useState([]);
    const [clientUsers, setClientUsers] = useState([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 3,
        labels: '',
        targetDate: '',
        clientId: 0,
        reporterId: 0,
    });
    // Fetch clients list when creating a ticket
    useEffect(() => {
        if (type === 'ticket') {
            fetchClients();
        }
    }, [type]);
    // Fetch users when client changes
    useEffect(() => {
        if (type === 'ticket' && formData.clientId > 0) {
            fetchClientUsers(formData.clientId);
        }
        else {
            setClientUsers([]);
            setFormData(prev => ({ ...prev, reporterId: 0 }));
        }
    }, [formData.clientId, type]);
    const fetchClients = async () => {
        setLoadingClients(true);
        try {
            const res = await fetch('/api/clients', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setClients(data.clients || []);
            }
        }
        catch (error) {
            console.error('Failed to fetch clients:', error);
        }
        finally {
            setLoadingClients(false);
        }
    };
    const fetchClientUsers = async (clientId) => {
        setLoadingUsers(true);
        try {
            const res = await fetch(`/api/users/client/${clientId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setClientUsers(data || []);
            }
        }
        catch (error) {
            console.error('Failed to fetch client users:', error);
        }
        finally {
            setLoadingUsers(false);
        }
    };
    const config = typeConfig[type];
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let endpoint = '';
            const body = {
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
            };
            // Add type-specific fields
            if (type === 'requirement') {
                endpoint = '/api/requirements';
                body.productId = 14; // Tasklets product ID
                body.originalDraft = formData.description;
            }
            else if (type === 'idea') {
                endpoint = '/api/ideas';
                body.visibility = 'private';
            }
            else if (type === 'epic') {
                endpoint = '/api/epics';
                body.productId = 14; // Tasklets product ID
            }
            else if (type === 'feature') {
                endpoint = '/api/features';
                body.epicId = 1; // TODO: Get from context or user selection
            }
            else if (type === 'task') {
                endpoint = '/api/tasks';
                body.featureId = 1; // TODO: Get from context
                body.type = 'task';
            }
            else if (type === 'bug') {
                endpoint = '/api/tasks';
                body.featureId = 1; // TODO: Get from context
                body.type = 'bug';
            }
            else if (type === 'ticket') {
                endpoint = '/api/tickets';
                body.productId = 14; // Tasklets product ID
                // Add client and reporter if selected
                if (formData.clientId > 0) {
                    body.clientId = formData.clientId;
                }
                if (formData.reporterId > 0) {
                    body.reporterId = formData.reporterId;
                }
            }
            // Add optional fields for detailed mode
            if (mode === 'detailed') {
                if (formData.labels) {
                    body.labels = formData.labels.split(',').map(l => l.trim());
                }
                if (formData.targetDate) {
                    body.targetDate = formData.targetDate;
                }
            }
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create');
            }
            const data = await res.json();
            const createdItem = data[type] || data.idea || data.requirement || data.epic || data.feature || data.task || data.ticket;
            toast.success(`${config.label} created successfully!`, {
                description: createdItem.issueKey || createdItem.title
            });
            // Close modal
            close();
            // Refresh the page or update the list
            window.location.reload();
        }
        catch (error) {
            console.error('Create error:', error);
            toast.error(`Failed to create ${config.label.toLowerCase()}`, {
                description: error.message
            });
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, className: "p-6", children: [_jsxs("button", { onClick: () => selectType(null), className: "flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors", children: [_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("path", { d: "M19 12H5M12 19l-7-7 7-7", strokeLinecap: "round", strokeLinejoin: "round" }) }), "Back to selection"] }), _jsxs("div", { className: "flex items-center gap-4 mb-6", children: [_jsx("div", { className: `size-16 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center text-3xl shadow-lg`, children: config.icon }), _jsxs("div", { children: [_jsxs("h3", { className: "text-2xl font-bold text-slate-900 dark:text-white", children: ["Create ", config.label] }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: mode === 'quick' ? 'Quick capture mode' : 'Detailed planning mode' })] })] }), _jsxs("div", { className: "flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 w-fit", children: [_jsx("button", { onClick: () => setMode('quick'), className: `px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'quick'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'}`, children: "\u26A1 Quick Capture" }), _jsx("button", { onClick: () => setMode('detailed'), className: `px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'detailed'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'}`, children: "\uD83D\uDCCB Detailed Planning" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: ["Title ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), placeholder: `What's this ${type} about?`, required: true, autoFocus: true, className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-900 dark:text-white placeholder:text-slate-400" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: ["Description ", mode === 'detailed' && _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), placeholder: mode === 'quick' ? 'Optional details...' : 'Provide comprehensive details...', required: mode === 'detailed', rows: mode === 'quick' ? 3 : 6, className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none" })] }), type === 'ticket' && (_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Client / Company" }), _jsxs("select", { value: formData.clientId, onChange: (e) => setFormData({ ...formData, clientId: parseInt(e.target.value), reporterId: 0 }), disabled: loadingClients, className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-900 dark:text-white disabled:opacity-50", children: [_jsx("option", { value: 0, children: "-- Internal (No Client) --" }), clients.map(client => (_jsxs("option", { value: client.id, children: [client.name, " ", client.type === 'owner' ? '(Owner)' : client.type === 'partner' ? '(Partner)' : ''] }, client.id)))] }), loadingClients && _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Loading clients..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Reporter" }), _jsxs("select", { value: formData.reporterId, onChange: (e) => setFormData({ ...formData, reporterId: parseInt(e.target.value) }), disabled: formData.clientId === 0 || loadingUsers, className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-900 dark:text-white disabled:opacity-50", children: [_jsx("option", { value: 0, children: formData.clientId === 0 ? '-- Select client first --' : '-- Me (Creator) --' }), clientUsers.map(user => (_jsxs("option", { value: user.id, children: [user.name, " (", user.email, ")"] }, user.id)))] }), loadingUsers && _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Loading users..." }), formData.clientId > 0 && clientUsers.length === 0 && !loadingUsers && (_jsx("p", { className: "text-xs text-amber-500 mt-1", children: "No users found for this client" }))] })] })), mode === 'detailed' && (_jsxs(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Priority" }), _jsxs("select", { value: formData.priority, onChange: (e) => setFormData({ ...formData, priority: parseInt(e.target.value) }), className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-900 dark:text-white", children: [_jsx("option", { value: "0", children: "P0 - Critical" }), _jsx("option", { value: "1", children: "P1 - High" }), _jsx("option", { value: "2", children: "P2 - Medium" }), _jsx("option", { value: "3", children: "P3 - Normal" }), _jsx("option", { value: "4", children: "P4 - Low" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Target Date" }), _jsx("input", { type: "date", value: formData.targetDate, onChange: (e) => setFormData({ ...formData, targetDate: e.target.value }), className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-900 dark:text-white" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Labels (comma-separated)" }), _jsx("input", { type: "text", value: formData.labels, onChange: (e) => setFormData({ ...formData, labels: e.target.value }), placeholder: "frontend, urgent, customer-request", className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-slate-900 dark:text-white placeholder:text-slate-400" })] })] })), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx(motion.button, { type: "submit", disabled: submitting, className: `flex-1 px-6 py-3 rounded-xl font-semibold text-white shadow-lg bg-gradient-to-r ${config.color} hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed`, whileHover: { scale: submitting ? 1 : 1.02 }, whileTap: { scale: submitting ? 1 : 0.98 }, children: submitting ? 'Creating...' : `Create ${config.label}` }), _jsx("button", { type: "button", onClick: () => selectType(null), disabled: submitting, className: "px-6 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50", children: "Cancel" })] })] })] }));
}
