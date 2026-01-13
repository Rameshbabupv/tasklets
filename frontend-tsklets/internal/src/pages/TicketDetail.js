import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/auth';
import ImageModal from '../components/ImageModal';
// Escalation reason labels
const escalationReasonLabels = {
    executive_request: 'Executive Request',
    production_down: 'Production Down',
    compliance: 'Compliance',
    customer_impact: 'Customer Impact',
    other: 'Other',
};
// Helper to check if ticket is escalated
const isEscalated = (ticket) => ticket.labels?.includes('escalated');
// Helper to check if ticket was created by Systech
const isCreatedBySystech = (ticket) => ticket.labels?.includes('created_by_systech');
const statuses = ['pending_internal_review', 'open', 'in_progress', 'waiting_for_customer', 'rebuttal', 'resolved', 'closed', 'cancelled'];
const priorities = [1, 2, 3, 4, 5];
export default function TicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const [ticket, setTicket] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalImage, setModalImage] = useState(null);
    // Form state for internal fields
    const [status, setStatus] = useState('');
    const [internalPriority, setInternalPriority] = useState('');
    const [internalSeverity, setInternalSeverity] = useState('');
    // Create Dev Task state
    const [showSpawnModal, setShowSpawnModal] = useState(false);
    const [epics, setEpics] = useState([]);
    const [features, setFeatures] = useState([]);
    const [selectedEpicId, setSelectedEpicId] = useState('');
    const [selectedFeatureId, setSelectedFeatureId] = useState('');
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [spawning, setSpawning] = useState(false);
    const [spawnError, setSpawnError] = useState('');
    // New: Product structure
    const [modules, setModules] = useState([]);
    const [components, setComponents] = useState([]);
    const [addons, setAddons] = useState([]);
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [selectedComponentId, setSelectedComponentId] = useState('');
    const [selectedAddonId, setSelectedAddonId] = useState('');
    // New: Role assignments
    const [internalUsers, setInternalUsers] = useState([]);
    const [implementorId, setImplementorId] = useState('');
    const [developerId, setDeveloperId] = useState('');
    const [testerId, setTesterId] = useState('');
    useEffect(() => {
        fetchTicket();
    }, [id]);
    const fetchTicket = async () => {
        try {
            const res = await fetch(`/api/tickets/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            const t = data.ticket;
            setTicket(t);
            setAttachments(data.attachments || []);
            setStatus(t.status);
            setInternalPriority(t.internalPriority || '');
            setInternalSeverity(t.internalSeverity || '');
        }
        catch (err) {
            console.error('Failed to fetch ticket', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(`/api/tickets/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status,
                    internalPriority: internalPriority || null,
                    internalSeverity: internalSeverity || null,
                }),
            });
            navigate('/');
        }
        catch (err) {
            console.error('Failed to update ticket', err);
        }
        finally {
            setSaving(false);
        }
    };
    const openSpawnModal = async () => {
        setShowSpawnModal(true);
        setTaskTitle(`Fix: ${ticket?.title}`);
        setTaskDescription(ticket?.description || '');
        // Fetch internal users for role assignments
        try {
            const res = await fetch('/api/users?internal=true', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setInternalUsers(data.users || data || []);
        }
        catch (err) {
            console.error('Failed to fetch users', err);
        }
        // Fetch modules and addons for the ticket's product
        if (ticket?.productId) {
            try {
                const [modulesRes, addonsRes] = await Promise.all([
                    fetch(`/api/products/${ticket.productId}/modules`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`/api/products/${ticket.productId}/addons`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
                const modulesData = await modulesRes.json();
                const addonsData = await addonsRes.json();
                setModules(modulesData || []);
                setAddons(addonsData || []);
            }
            catch (err) {
                console.error('Failed to fetch product structure', err);
            }
        }
        // Fetch all epics (for optional feature link)
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
    const fetchFeatures = async (epicId) => {
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
    };
    const handleEpicChange = (epicId) => {
        setSelectedEpicId(epicId ? parseInt(epicId) : '');
        setSelectedFeatureId('');
        setFeatures([]);
        if (epicId) {
            fetchFeatures(parseInt(epicId));
        }
    };
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
    const handleSpawnTask = async (e) => {
        e.preventDefault();
        // Validate required role assignments
        if (!implementorId || !developerId || !testerId) {
            setSpawnError('Please assign Implementor, Developer, and Tester');
            return;
        }
        setSpawning(true);
        setSpawnError('');
        try {
            const res = await fetch(`/api/tasks/from-support-ticket/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: taskTitle,
                    description: taskDescription,
                    type: 'bug',
                    // Role assignments
                    implementorId,
                    developerId,
                    testerId,
                    // Product structure (optional)
                    moduleId: selectedModuleId || null,
                    componentId: selectedComponentId || null,
                    addonId: selectedAddonId || null,
                    // Optional feature link
                    featureId: selectedFeatureId || null,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create dev task');
            }
            const data = await res.json();
            // Reset form
            setShowSpawnModal(false);
            setSelectedEpicId('');
            setSelectedFeatureId('');
            setSelectedModuleId('');
            setSelectedComponentId('');
            setSelectedAddonId('');
            setImplementorId('');
            setDeveloperId('');
            setTesterId('');
            setTaskTitle('');
            setTaskDescription('');
            // Refresh ticket to show updated status
            fetchTicket();
            alert(`Dev task ${data.task.issueKey} created! Ticket assigned to implementor and moved to In Progress.`);
        }
        catch (err) {
            setSpawnError(err.message);
        }
        finally {
            setSpawning(false);
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "h-screen flex overflow-hidden bg-background-light", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsx("div", { className: "text-slate-500", children: "Loading..." }) })] }));
    }
    if (!ticket) {
        return (_jsxs("div", { className: "h-screen flex overflow-hidden bg-background-light", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsx("div", { className: "text-slate-500", children: "Ticket not found" }) })] }));
    }
    return (_jsxs("div", { className: "h-screen flex overflow-hidden bg-background-light", children: [_jsx(Sidebar, {}), _jsxs("main", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsxs("header", { className: `h-16 px-6 border-b bg-white flex items-center justify-between shrink-0 ${isEscalated(ticket) ? 'border-red-300' : 'border-slate-200'}`, children: [_jsxs("div", { className: "flex items-center gap-4 flex-wrap", children: [_jsx("button", { onClick: () => navigate('/tickets'), className: "text-slate-500 hover:text-slate-700", children: _jsx("span", { className: "material-symbols-outlined", children: "arrow_back" }) }), _jsx("h2", { className: "text-lg font-bold text-slate-900", children: ticket.issueKey }), isEscalated(ticket) && (_jsxs("span", { className: "px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1.5 animate-pulse", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "priority_high" }), "ESCALATED"] })), isCreatedBySystech(ticket) && (_jsxs("span", { className: "px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1.5", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "business" }), "INTERNAL"] })), ticket.productName && (_jsx("span", { className: "text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded", children: ticket.productName })), ticket.clientName && (_jsx("span", { className: "text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded", children: ticket.clientName }))] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("button", { onClick: openSpawnModal, className: "flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "add_task" }), "Create Dev Task"] }), _jsxs("button", { onClick: handleSave, disabled: saving, className: "flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "save" }), saving ? 'Saving...' : 'Save Changes'] })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: _jsxs("div", { className: "max-w-4xl mx-auto grid grid-cols-3 gap-6", children: [_jsxs("div", { className: "col-span-2 space-y-6", children: [isEscalated(ticket) && (_jsx("div", { className: "p-4 rounded-xl bg-red-50 border border-red-200", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("span", { className: "material-symbols-outlined text-2xl text-red-600", children: "priority_high" }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-sm font-bold text-red-700 mb-1", children: "Escalated Ticket" }), ticket.escalationReason && (_jsxs("p", { className: "text-sm text-red-600 mb-2", children: [_jsx("span", { className: "font-medium", children: "Reason:" }), " ", escalationReasonLabels[ticket.escalationReason] || ticket.escalationReason] })), ticket.escalationNote && (_jsxs("p", { className: "text-sm text-red-600", children: [_jsx("span", { className: "font-medium", children: "Note:" }), " ", ticket.escalationNote] })), ticket.pushedToSystechAt && (_jsxs("p", { className: "text-xs text-red-500 mt-2", children: ["Escalated on ", new Date(ticket.pushedToSystechAt).toLocaleString()] }))] })] }) })), _jsxs("div", { className: "bg-white rounded-xl border border-slate-200 p-6", children: [_jsx("h3", { className: "text-xl font-bold text-slate-900 mb-4", children: ticket.title }), _jsx("p", { className: "text-slate-600 whitespace-pre-wrap", children: ticket.description || 'No description provided.' })] }), _jsxs("div", { className: "bg-white rounded-xl border border-slate-200 p-6", children: [_jsxs("h4", { className: "font-semibold text-slate-700 mb-4 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", children: "person" }), "Client Reported"] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-slate-500 uppercase tracking-wide", children: "Priority" }), _jsxs("div", { className: "text-lg font-bold text-slate-900", children: ["P", ticket.clientPriority] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-slate-500 uppercase tracking-wide", children: "Severity" }), _jsxs("div", { className: "text-lg font-bold text-slate-900", children: ["S", ticket.clientSeverity] })] })] })] }), attachments.length > 0 && (_jsxs("div", { className: "bg-white rounded-xl border border-slate-200 p-6", children: [_jsxs("h4", { className: "font-semibold text-slate-700 mb-4 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", children: "attach_file" }), "Attachments (", attachments.length, ")"] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4", children: attachments.map((att) => (_jsxs("div", { className: "group", children: [_jsx("div", { onClick: () => setModalImage({ url: att.fileUrl, name: att.fileName, size: att.fileSize }), className: "aspect-square rounded-lg overflow-hidden bg-slate-100 border-2 border-slate-200 cursor-pointer hover:border-primary transition-colors", children: _jsx("img", { src: att.fileUrl, alt: att.fileName, className: "w-full h-full object-cover" }) }), _jsxs("div", { className: "mt-2", children: [_jsx("p", { className: "text-xs text-slate-600 truncate", title: att.fileName, children: att.fileName }), att.fileSize && (_jsx("p", { className: "text-xs text-slate-400", children: att.fileSize < 1024
                                                                            ? att.fileSize + ' B'
                                                                            : att.fileSize < 1024 * 1024
                                                                                ? (att.fileSize / 1024).toFixed(1) + ' KB'
                                                                                : (att.fileSize / (1024 * 1024)).toFixed(1) + ' MB' }))] })] }, att.id))) })] }))] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-xl border border-slate-200 p-6", children: [_jsx("h4", { className: "font-semibold text-slate-700 mb-4", children: "Status" }), _jsx("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", children: statuses.map((s) => (_jsx("option", { value: s, children: s.replace(/_/g, ' ').toUpperCase() }, s))) })] }), _jsxs("div", { className: "bg-white rounded-xl border border-slate-200 p-6", children: [_jsxs("h4", { className: "font-semibold text-slate-700 mb-4 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", children: "tune" }), "Internal Triage"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-600 mb-2", children: "Internal Priority" }), _jsxs("select", { value: internalPriority, onChange: (e) => setInternalPriority(e.target.value ? parseInt(e.target.value) : ''), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", children: [_jsx("option", { value: "", children: "Use client priority" }), priorities.map((p) => (_jsxs("option", { value: p, children: ["P", p] }, p)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-slate-600 mb-2", children: "Internal Severity" }), _jsxs("select", { value: internalSeverity, onChange: (e) => setInternalSeverity(e.target.value ? parseInt(e.target.value) : ''), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", children: [_jsx("option", { value: "", children: "Use client severity" }), priorities.map((p) => (_jsxs("option", { value: p, children: ["S", p] }, p)))] })] })] })] }), _jsx("div", { className: "bg-slate-50 rounded-xl border border-slate-200 p-6 text-sm text-slate-500", children: _jsxs("div", { className: "flex justify-between mb-2", children: [_jsx("span", { children: "Created" }), _jsx("span", { className: "font-medium text-slate-700", children: new Date(ticket.createdAt).toLocaleString() })] }) })] })] }) })] }), modalImage && (_jsx(ImageModal, { imageUrl: modalImage.url, fileName: modalImage.name, fileSize: modalImage.size, onClose: () => setModalImage(null) })), showSpawnModal && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "p-6 border-b border-slate-200 sticky top-0 bg-white z-10", children: [_jsx("h3", { className: "text-lg font-bold text-slate-900", children: "Create Development Task" }), _jsxs("p", { className: "text-sm text-slate-500 mt-1", children: ["From: ", _jsx("span", { className: "font-medium text-slate-700", children: ticket?.issueKey }), " \u2022 ", ticket?.productName] })] }), _jsxs("form", { onSubmit: handleSpawnTask, className: "p-6 space-y-6", children: [spawnError && (_jsxs("div", { className: "p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "error" }), spawnError] })), _jsxs("div", { className: "space-y-4", children: [_jsxs("h4", { className: "text-sm font-semibold text-slate-900 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-lg text-emerald-600", children: "group" }), "Role Assignments *"] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-slate-600 mb-1", children: "Implementor" }), _jsxs("select", { value: implementorId, onChange: (e) => setImplementorId(e.target.value ? parseInt(e.target.value) : ''), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20", required: true, children: [_jsx("option", { value: "", children: "Select..." }), internalUsers.map((user) => (_jsx("option", { value: user.id, children: user.name }, user.id)))] }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Overall responsible" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-slate-600 mb-1", children: "Developer" }), _jsxs("select", { value: developerId, onChange: (e) => setDeveloperId(e.target.value ? parseInt(e.target.value) : ''), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20", required: true, children: [_jsx("option", { value: "", children: "Select..." }), internalUsers.map((user) => (_jsx("option", { value: user.id, children: user.name }, user.id)))] }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Writes the code" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-slate-600 mb-1", children: "Tester" }), _jsxs("select", { value: testerId, onChange: (e) => setTesterId(e.target.value ? parseInt(e.target.value) : ''), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/20", required: true, children: [_jsx("option", { value: "", children: "Select..." }), internalUsers.map((user) => (_jsx("option", { value: user.id, children: user.name }, user.id)))] }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Tests the fix" })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("h4", { className: "text-sm font-semibold text-slate-900 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-lg text-blue-600", children: "category" }), "Product Structure (Optional)"] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-slate-600 mb-1", children: "Module" }), _jsxs("select", { value: selectedModuleId, onChange: (e) => handleModuleChange(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", children: [_jsx("option", { value: "", children: "Select module..." }), modules.map((mod) => (_jsx("option", { value: mod.id, children: mod.name }, mod.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-slate-600 mb-1", children: "Component" }), _jsxs("select", { value: selectedComponentId, onChange: (e) => setSelectedComponentId(e.target.value ? parseInt(e.target.value) : ''), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", disabled: !selectedModuleId, children: [_jsx("option", { value: "", children: "Select component..." }), components.map((comp) => (_jsx("option", { value: comp.id, children: comp.name }, comp.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-slate-600 mb-1", children: "Addon" }), _jsxs("select", { value: selectedAddonId, onChange: (e) => setSelectedAddonId(e.target.value ? parseInt(e.target.value) : ''), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", children: [_jsx("option", { value: "", children: "Select addon..." }), addons.map((addon) => (_jsx("option", { value: addon.id, children: addon.name }, addon.id)))] })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("h4", { className: "text-sm font-semibold text-slate-900 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-lg text-orange-600", children: "link" }), "Link to Feature (Optional)"] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-slate-600 mb-1", children: "Epic" }), _jsxs("select", { value: selectedEpicId, onChange: (e) => handleEpicChange(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", children: [_jsx("option", { value: "", children: "Select Epic..." }), epics.map((epic) => (_jsx("option", { value: epic.id, children: epic.title }, epic.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-slate-600 mb-1", children: "Feature" }), _jsxs("select", { value: selectedFeatureId, onChange: (e) => setSelectedFeatureId(e.target.value ? parseInt(e.target.value) : ''), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", disabled: !selectedEpicId, children: [_jsx("option", { value: "", children: "Select Feature..." }), features.map((feature) => (_jsx("option", { value: feature.id, children: feature.title }, feature.id)))] })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("h4", { className: "text-sm font-semibold text-slate-900 flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-lg text-slate-600", children: "description" }), "Task Details"] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-slate-600 mb-1", children: "Title *" }), _jsx("input", { type: "text", value: taskTitle, onChange: (e) => setTaskTitle(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-slate-600 mb-1", children: "Description" }), _jsx("textarea", { value: taskDescription, onChange: (e) => setTaskDescription(e.target.value), className: "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 resize-none", rows: 3 })] })] }), _jsxs("div", { className: "flex justify-between items-center pt-4 border-t border-slate-200", children: [_jsx("p", { className: "text-xs text-slate-500", children: "Ticket will be assigned to Implementor and moved to In Progress" }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "button", onClick: () => {
                                                        setShowSpawnModal(false);
                                                        setSelectedEpicId('');
                                                        setSelectedFeatureId('');
                                                        setSelectedModuleId('');
                                                        setSelectedComponentId('');
                                                        setSelectedAddonId('');
                                                        setImplementorId('');
                                                        setDeveloperId('');
                                                        setTesterId('');
                                                        setSpawnError('');
                                                    }, className: "px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium", children: "Cancel" }), _jsx("button", { type: "submit", disabled: spawning, className: "px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2", children: spawning ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "material-symbols-outlined text-lg animate-spin", children: "progress_activity" }), "Creating..."] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "add_task" }), "Create Dev Task"] })) })] })] })] })] }) }))] }));
}
