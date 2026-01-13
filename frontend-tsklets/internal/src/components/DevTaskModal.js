import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
export default function DevTaskModal({ ticket, onClose, onSuccess }) {
    const { token } = useAuthStore();
    const [isClosing, setIsClosing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);
    // Form state - Role assignments
    const [internalUsers, setInternalUsers] = useState([]);
    const [implementorId, setImplementorId] = useState('');
    const [developerId, setDeveloperId] = useState('');
    const [testerId, setTesterId] = useState('');
    // Product structure
    const [modules, setModules] = useState([]);
    const [components, setComponents] = useState([]);
    const [addons, setAddons] = useState([]);
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [selectedComponentId, setSelectedComponentId] = useState('');
    const [selectedAddonId, setSelectedAddonId] = useState('');
    // Feature link
    const [epics, setEpics] = useState([]);
    const [features, setFeatures] = useState([]);
    const [selectedEpicId, setSelectedEpicId] = useState('');
    const [selectedFeatureId, setSelectedFeatureId] = useState('');
    // Task details
    const [taskTitle, setTaskTitle] = useState(`Fix: ${ticket.title}`);
    const [taskDescription, setTaskDescription] = useState(ticket.description || '');
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        loadInitialData();
        const handleEscape = (e) => {
            if (e.key === 'Escape')
                handleClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);
    const loadInitialData = async () => {
        // Fetch internal users (systech.com users)
        try {
            const res = await fetch('/api/users/internal', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setInternalUsers(data || []);
        }
        catch (err) {
            console.error('Failed to fetch users', err);
        }
        // Fetch modules, addons, and product defaults for the ticket's product
        if (ticket.productId) {
            try {
                const [modulesRes, addonsRes, productsRes] = await Promise.all([
                    fetch(`/api/products/${ticket.productId}/modules`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`/api/products/${ticket.productId}/addons`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch('/api/products', {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
                const modulesData = await modulesRes.json();
                const addonsData = await addonsRes.json();
                const productsData = await productsRes.json();
                setModules(modulesData || []);
                setAddons(addonsData || []);
                // Find the product and pre-fill role assignments from defaults
                const product = productsData.find((p) => p.id === ticket.productId);
                if (product) {
                    if (product.defaultImplementorId)
                        setImplementorId(product.defaultImplementorId);
                    if (product.defaultDeveloperId)
                        setDeveloperId(product.defaultDeveloperId);
                    if (product.defaultTesterId)
                        setTesterId(product.defaultTesterId);
                }
            }
            catch (err) {
                console.error('Failed to fetch product structure', err);
            }
        }
        // Fetch all epics
        try {
            const res = await fetch('/api/epics', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setEpics(data.epics || []);
        }
        catch (err) {
            console.error('Failed to fetch epics', err);
        }
    };
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => onClose(), 200);
    };
    // Handle module change - fetch components
    const handleModuleChange = async (moduleId) => {
        setSelectedModuleId(moduleId ? parseInt(moduleId) : '');
        setSelectedComponentId('');
        setComponents([]);
        if (moduleId) {
            try {
                const res = await fetch(`/api/products/modules/${moduleId}/components`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setComponents(data || []);
            }
            catch (err) {
                console.error('Failed to fetch components', err);
            }
        }
    };
    // Handle epic change - fetch features
    const handleEpicChange = async (epicId) => {
        setSelectedEpicId(epicId ? parseInt(epicId) : '');
        setSelectedFeatureId('');
        setFeatures([]);
        if (epicId) {
            try {
                const res = await fetch(`/api/features?epicId=${epicId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setFeatures(data.features || []);
            }
            catch (err) {
                console.error('Failed to fetch features', err);
            }
        }
    };
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!implementorId || !developerId || !testerId) {
            setError('Please assign Implementor, Developer, and Tester');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/tasks/from-support-ticket/${ticket.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: taskTitle,
                    description: taskDescription,
                    type: 'bug',
                    implementorId,
                    developerId,
                    testerId,
                    moduleId: selectedModuleId || null,
                    componentId: selectedComponentId || null,
                    addonId: selectedAddonId || null,
                    featureId: selectedFeatureId || null,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create dev task');
            }
            const data = await res.json();
            setSuccess(data.task.issueKey);
            // Auto-close after showing success
            setTimeout(() => {
                onSuccess(data.task.issueKey);
            }, 1500);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: `fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto
        ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`, onClick: handleClose, children: [_jsx("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm" }), _jsxs("div", { className: `relative w-full max-w-2xl my-8 rounded-2xl shadow-2xl overflow-hidden
          ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`, style: { backgroundColor: 'var(--bg-card)' }, onClick: (e) => e.stopPropagation(), children: [_jsx("div", { className: "h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" }), _jsxs("div", { className: "px-6 py-4 border-b flex items-center justify-between", style: { borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg", children: _jsx("span", { className: "material-symbols-outlined text-xl text-white", children: "add_task" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold", style: { color: 'var(--text-primary)' }, children: "Create Development Task" }), _jsxs("p", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: ["From: ", _jsx("span", { className: "font-medium text-violet-600 dark:text-violet-400", children: ticket.issueKey }), ticket.productName && (_jsxs(_Fragment, { children: [" \u2022 ", _jsx("span", { className: "font-medium", children: ticket.productName })] }))] })] })] }), _jsx("button", { onClick: handleClose, className: "size-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors", style: { color: 'var(--text-muted)' }, children: _jsx("span", { className: "material-symbols-outlined", children: "close" }) })] }), _jsxs("div", { className: "px-6 py-3 border-b flex items-center gap-3", style: { borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }, children: [_jsx("span", { className: "material-symbols-outlined text-orange-500", children: "support_agent" }), _jsx("div", { className: "flex-1 min-w-0", children: _jsx("p", { className: "text-sm font-medium truncate", style: { color: 'var(--text-primary)' }, children: ticket.title }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6 max-h-[60vh] overflow-y-auto", children: [success && (_jsxs("div", { className: "p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center", children: [_jsx("span", { className: "material-symbols-outlined text-4xl text-emerald-500 mb-2", children: "check_circle" }), _jsxs("p", { className: "text-sm font-semibold text-emerald-700 dark:text-emerald-300", children: ["Dev task ", _jsx("span", { className: "font-mono font-bold", children: success }), " created!"] }), _jsx("p", { className: "text-xs text-emerald-600 dark:text-emerald-400 mt-1", children: "Ticket assigned to implementor and moved to In Progress" })] })), error && (_jsxs("div", { className: "p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "error" }), error] })), !success && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("h4", { className: "text-sm font-semibold flex items-center gap-2", style: { color: 'var(--text-primary)' }, children: [_jsx("span", { className: "material-symbols-outlined text-lg text-emerald-500", children: "group" }), "Role Assignments ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium mb-1.5", style: { color: 'var(--text-secondary)' }, children: "Implementor" }), _jsxs("select", { value: implementorId, onChange: (e) => setImplementorId(e.target.value ? parseInt(e.target.value) : ''), className: "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }, required: true, children: [_jsx("option", { value: "", children: "Select..." }), internalUsers.map((user) => (_jsx("option", { value: user.id, children: user.name }, user.id)))] }), _jsx("p", { className: "text-[10px] mt-1", style: { color: 'var(--text-muted)' }, children: "Overall responsible" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium mb-1.5", style: { color: 'var(--text-secondary)' }, children: "Developer" }), _jsxs("select", { value: developerId, onChange: (e) => setDeveloperId(e.target.value ? parseInt(e.target.value) : ''), className: "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }, required: true, children: [_jsx("option", { value: "", children: "Select..." }), internalUsers.map((user) => (_jsx("option", { value: user.id, children: user.name }, user.id)))] }), _jsx("p", { className: "text-[10px] mt-1", style: { color: 'var(--text-muted)' }, children: "Writes the code" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium mb-1.5", style: { color: 'var(--text-secondary)' }, children: "Tester" }), _jsxs("select", { value: testerId, onChange: (e) => setTesterId(e.target.value ? parseInt(e.target.value) : ''), className: "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }, required: true, children: [_jsx("option", { value: "", children: "Select..." }), internalUsers.map((user) => (_jsx("option", { value: user.id, children: user.name }, user.id)))] }), _jsx("p", { className: "text-[10px] mt-1", style: { color: 'var(--text-muted)' }, children: "Tests the fix" })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("h4", { className: "text-sm font-semibold flex items-center gap-2", style: { color: 'var(--text-primary)' }, children: [_jsx("span", { className: "material-symbols-outlined text-lg text-blue-500", children: "category" }), "Product Structure ", _jsx("span", { className: "text-xs font-normal", style: { color: 'var(--text-muted)' }, children: "(Optional)" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium mb-1.5", style: { color: 'var(--text-secondary)' }, children: "Module" }), _jsxs("select", { value: selectedModuleId, onChange: (e) => handleModuleChange(e.target.value), className: "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }, children: [_jsx("option", { value: "", children: "Select module..." }), modules.map((mod) => (_jsx("option", { value: mod.id, children: mod.name }, mod.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium mb-1.5", style: { color: 'var(--text-secondary)' }, children: "Component" }), _jsxs("select", { value: selectedComponentId, onChange: (e) => setSelectedComponentId(e.target.value ? parseInt(e.target.value) : ''), className: "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }, disabled: !selectedModuleId, children: [_jsx("option", { value: "", children: "Select component..." }), components.map((comp) => (_jsx("option", { value: comp.id, children: comp.name }, comp.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium mb-1.5", style: { color: 'var(--text-secondary)' }, children: "Addon" }), _jsxs("select", { value: selectedAddonId, onChange: (e) => setSelectedAddonId(e.target.value ? parseInt(e.target.value) : ''), className: "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }, children: [_jsx("option", { value: "", children: "Select addon..." }), addons.map((addon) => (_jsx("option", { value: addon.id, children: addon.name }, addon.id)))] })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("h4", { className: "text-sm font-semibold flex items-center gap-2", style: { color: 'var(--text-primary)' }, children: [_jsx("span", { className: "material-symbols-outlined text-lg text-orange-500", children: "link" }), "Link to Feature ", _jsx("span", { className: "text-xs font-normal", style: { color: 'var(--text-muted)' }, children: "(Optional)" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium mb-1.5", style: { color: 'var(--text-secondary)' }, children: "Epic" }), _jsxs("select", { value: selectedEpicId, onChange: (e) => handleEpicChange(e.target.value), className: "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }, children: [_jsx("option", { value: "", children: "Select epic..." }), epics.map((epic) => (_jsx("option", { value: epic.id, children: epic.title }, epic.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium mb-1.5", style: { color: 'var(--text-secondary)' }, children: "Feature" }), _jsxs("select", { value: selectedFeatureId, onChange: (e) => setSelectedFeatureId(e.target.value ? parseInt(e.target.value) : ''), className: "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 disabled:opacity-50", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }, disabled: !selectedEpicId, children: [_jsx("option", { value: "", children: "Select feature..." }), features.map((feature) => (_jsx("option", { value: feature.id, children: feature.title }, feature.id)))] })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("h4", { className: "text-sm font-semibold flex items-center gap-2", style: { color: 'var(--text-primary)' }, children: [_jsx("span", { className: "material-symbols-outlined text-lg text-slate-500", children: "description" }), "Task Details"] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-xs font-medium mb-1.5", style: { color: 'var(--text-secondary)' }, children: ["Title ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", value: taskTitle, onChange: (e) => setTaskTitle(e.target.value), className: "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }, required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium mb-1.5", style: { color: 'var(--text-secondary)' }, children: "Description" }), _jsx("textarea", { value: taskDescription, onChange: (e) => setTaskDescription(e.target.value), className: "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }, rows: 3 })] })] })] })), _jsxs("div", { className: "flex justify-between items-center pt-4 border-t", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("p", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: !success && 'Ticket will be assigned to Implementor and moved to In Progress' }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "button", onClick: handleClose, className: "px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors", style: { color: 'var(--text-secondary)' }, children: success ? 'Close' : 'Cancel' }), !success && (_jsx("button", { type: "submit", disabled: loading, className: "px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md", children: loading ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "material-symbols-outlined text-lg animate-spin", children: "progress_activity" }), "Creating..."] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "add_task" }), "Create Dev Task"] })) }))] })] })] })] }), _jsx("style", { children: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(20px) scale(0.98); }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .animate-fade-out { animation: fadeOut 0.2s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        .animate-slide-down { animation: slideDown 0.2s ease-out forwards; }
      ` })] }));
}
