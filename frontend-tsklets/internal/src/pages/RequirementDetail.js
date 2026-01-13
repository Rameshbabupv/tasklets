import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MarkdownEditor from '../components/MarkdownEditor';
const statusColors = {
    draft: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-200',
    brainstorm: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-yellow-500',
    solidified: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-500',
    approved: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500',
    in_development: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500',
    implemented: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500',
    cancelled: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
};
const workflowSteps = ['draft', 'brainstorm', 'solidified', 'approved', 'in_development', 'implemented'];
export default function RequirementDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const [requirement, setRequirement] = useState(null);
    const [amendments, setAmendments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAmendmentModal, setShowAmendmentModal] = useState(false);
    const [editData, setEditData] = useState({});
    const [statusData, setStatusData] = useState({ status: '', participants: '', approvers: '' });
    const [amendmentData, setAmendmentData] = useState({
        title: '',
        description: '',
        businessJustification: '',
        urgency: 'medium'
    });
    useEffect(() => {
        fetchRequirement();
        fetchAmendments();
    }, [id]);
    async function fetchRequirement() {
        try {
            const res = await fetch(`/api/requirements/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setRequirement(data.requirement);
            setEditData(data.requirement);
        }
        catch (error) {
            console.error('Fetch requirement error:', error);
            toast.error('Failed to load requirement');
        }
        finally {
            setLoading(false);
        }
    }
    async function fetchAmendments() {
        try {
            const res = await fetch(`/api/requirements/${id}/amendments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setAmendments(data.amendments || []);
        }
        catch (error) {
            console.error('Fetch amendments error:', error);
        }
    }
    async function handleUpdateStatus() {
        try {
            const body = { status: statusData.status };
            if (statusData.participants) {
                body.participants = statusData.participants.split(',').map(s => s.trim());
            }
            if (statusData.approvers) {
                body.approvers = statusData.approvers.split(',').map(s => s.trim());
            }
            const res = await fetch(`/api/requirements/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                const error = await res.json();
                toast.error(error.error || 'Failed to update status');
                return;
            }
            toast.success('Status updated successfully');
            setShowStatusModal(false);
            fetchRequirement();
        }
        catch (error) {
            console.error('Update status error:', error);
            toast.error('Failed to update status');
        }
    }
    async function handleUpdateRequirement() {
        try {
            const res = await fetch(`/api/requirements/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editData)
            });
            if (!res.ok)
                throw new Error('Failed to update requirement');
            toast.success('Requirement updated successfully');
            setShowEditModal(false);
            fetchRequirement();
        }
        catch (error) {
            console.error('Update requirement error:', error);
            toast.error('Failed to update requirement');
        }
    }
    async function handleCreateAmendment() {
        if (!amendmentData.title) {
            toast.error('Amendment title is required');
            return;
        }
        try {
            const res = await fetch(`/api/requirements/${id}/amendments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(amendmentData)
            });
            if (!res.ok)
                throw new Error('Failed to create amendment');
            toast.success('Amendment created successfully');
            setShowAmendmentModal(false);
            setAmendmentData({ title: '', description: '', businessJustification: '', urgency: 'medium' });
            fetchAmendments();
        }
        catch (error) {
            console.error('Create amendment error:', error);
            toast.error('Failed to create amendment');
        }
    }
    async function handleDeleteRequirement() {
        if (!confirm('Are you sure you want to delete this requirement?'))
            return;
        try {
            const res = await fetch(`/api/requirements/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok)
                throw new Error('Failed to delete requirement');
            toast.success('Requirement deleted');
            navigate('/requirements');
        }
        catch (error) {
            console.error('Delete requirement error:', error);
            toast.error('Failed to delete requirement');
        }
    }
    if (loading) {
        return (_jsxs("div", { className: "flex h-screen", style: { backgroundColor: 'var(--bg-primary)' }, children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }) })] }));
    }
    if (!requirement) {
        return (_jsxs("div", { className: "flex h-screen", style: { backgroundColor: 'var(--bg-primary)' }, children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold", style: { color: 'var(--text-primary)' }, children: "Requirement not found" }), _jsx(Link, { to: "/requirements", className: "text-primary hover:underline mt-2 inline-block", children: "Back to Requirements" })] }) })] }));
    }
    const currentStepIndex = workflowSteps.indexOf(requirement.status);
    return (_jsxs("div", { className: "flex h-screen overflow-hidden", style: { backgroundColor: 'var(--bg-primary)' }, children: [_jsx(Toaster, { position: "top-right", richColors: true }), _jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-y-auto", children: _jsxs("div", { className: "max-w-6xl mx-auto p-8", children: [_jsxs(Link, { to: "/requirements", className: "inline-flex items-center gap-2 mb-6 text-sm font-medium hover:text-primary transition-colors", style: { color: 'var(--text-secondary)' }, children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", children: "arrow_back" }), "Back to Requirements"] }), _jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, className: "mb-8", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("span", { className: "text-sm font-mono font-bold px-3 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300", children: requirement.issueKey }), _jsx("span", { className: `px-4 py-1.5 rounded-lg text-sm font-semibold border shadow-sm ${statusColors[requirement.status]}`, children: requirement.status.replace(/_/g, ' ').toUpperCase() }), _jsxs("span", { className: "text-sm font-bold px-3 py-1 rounded border bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", children: ["P", requirement.priority] })] }), _jsx("h1", { className: "text-3xl font-bold mb-2", style: { color: 'var(--text-primary)' }, children: requirement.title })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(motion.button, { onClick: () => setShowEditModal(true), className: "px-4 py-2 rounded-lg border font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2", style: { borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }, whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "edit" }), "Edit"] }), _jsxs(motion.button, { onClick: () => setShowStatusModal(true), className: "px-4 py-2 rounded-lg bg-gradient-spark text-white font-medium flex items-center gap-2 shadow-md", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "swap_horiz" }), "Change Status"] }), _jsxs(motion.button, { onClick: handleDeleteRequirement, className: "px-4 py-2 rounded-lg border border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "delete" }), "Delete"] })] })] }), _jsxs("div", { className: "mt-6 p-6 rounded-xl border", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("h3", { className: "text-sm font-semibold mb-4 uppercase tracking-wide", style: { color: 'var(--text-secondary)' }, children: "Workflow Progress" }), _jsx("div", { className: "flex items-center justify-between", children: workflowSteps.map((step, index) => (_jsxs("div", { className: "flex items-center flex-1", children: [_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: `size-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${index <= currentStepIndex
                                                                    ? 'bg-gradient-spark text-white border-primary shadow-lg'
                                                                    : 'bg-slate-100 text-slate-400 border-slate-300 dark:bg-slate-700 dark:text-slate-500 dark:border-slate-600'}`, children: index < currentStepIndex ? (_jsx("span", { className: "material-symbols-outlined text-[20px]", children: "check" })) : (index + 1) }), _jsx("span", { className: `text-xs mt-2 text-center capitalize ${index === currentStepIndex ? 'font-semibold' : ''}`, style: { color: index <= currentStepIndex ? 'var(--text-primary)' : 'var(--text-secondary)' }, children: step.replace(/_/g, ' ') })] }), index < workflowSteps.length - 1 && (_jsx("div", { className: `flex-1 h-1 mx-2 rounded transition-all ${index < currentStepIndex ? 'bg-gradient-spark' : 'bg-slate-200 dark:bg-slate-600'}` }))] }, step))) })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [requirement.originalDraft && (_jsxs("div", { className: "p-6 rounded-xl border", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("span", { className: "material-symbols-outlined text-slate-500", children: "draft" }), _jsx("h3", { className: "font-semibold", style: { color: 'var(--text-primary)' }, children: "Original Draft" }), _jsx("span", { className: "text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", children: "Preserved" })] }), _jsx("div", { className: "prose prose-sm max-w-none dark:prose-invert", style: { color: 'var(--text-secondary)' }, children: _jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: requirement.originalDraft }) })] })), _jsxs("div", { className: "p-6 rounded-xl border", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("span", { className: "material-symbols-outlined text-primary", children: "psychology" }), _jsx("h3", { className: "font-semibold", style: { color: 'var(--text-primary)' }, children: "Claude Rewrite" }), requirement.status === 'solidified' && (_jsx("span", { className: "text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", children: "Solidified" }))] }), requirement.claudeRewrite ? (_jsx("div", { className: "prose prose-sm max-w-none dark:prose-invert", style: { color: 'var(--text-secondary)' }, children: _jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: requirement.claudeRewrite }) })) : (_jsx("p", { className: "text-sm italic", style: { color: 'var(--text-secondary)' }, children: "No Claude rewrite yet. Move to \"Brainstorm\" status to collaborate with Claude." }))] }), requirement.description && (_jsxs("div", { className: "p-6 rounded-xl border", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("h3", { className: "font-semibold mb-3", style: { color: 'var(--text-primary)' }, children: "Description" }), _jsx("div", { className: "prose prose-sm max-w-none dark:prose-invert", style: { color: 'var(--text-secondary)' }, children: _jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: requirement.description }) })] })), _jsxs("div", { className: "p-6 rounded-xl border", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "font-semibold", style: { color: 'var(--text-primary)' }, children: "Amendments" }), _jsxs(motion.button, { onClick: () => setShowAmendmentModal(true), className: "text-sm px-3 py-1.5 rounded-lg bg-gradient-spark text-white font-medium flex items-center gap-1", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: [_jsx("span", { className: "material-symbols-outlined text-[16px]", children: "add" }), "Add Amendment"] })] }), amendments.length === 0 ? (_jsx("p", { className: "text-sm italic", style: { color: 'var(--text-secondary)' }, children: "No amendments yet" })) : (_jsx("div", { className: "space-y-3", children: amendments.map(amendment => (_jsxs("div", { className: "p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer", style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { children: [_jsxs("span", { className: "text-xs font-mono font-semibold px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", children: ["Amendment #", amendment.amendmentNumber] }), _jsx("h4", { className: "font-semibold mt-2", style: { color: 'var(--text-primary)' }, children: amendment.title })] }), _jsx("div", { className: "flex gap-2", children: _jsx("span", { className: `text-xs px-2 py-1 rounded ${amendment.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                                                                                amendment.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                                                                                    amendment.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                                        'bg-slate-100 text-slate-700'}`, children: amendment.urgency.toUpperCase() }) })] }), amendment.description && (_jsx("p", { className: "text-sm mt-2", style: { color: 'var(--text-secondary)' }, children: amendment.description })), amendment.beadsFeatureId && (_jsxs("span", { className: "text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-mono inline-block mt-2", children: ["Feature: ", amendment.beadsFeatureId] }))] }, amendment.id))) }))] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "p-6 rounded-xl border", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("h3", { className: "font-semibold mb-4", style: { color: 'var(--text-primary)' }, children: "Beads Links" }), _jsxs("div", { className: "space-y-3", children: [requirement.beadsId && (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold mb-1", style: { color: 'var(--text-secondary)' }, children: "Beads Issue" }), _jsx("span", { className: "text-sm font-mono px-2 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300", children: requirement.beadsId })] })), requirement.beadsEpicId && (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold mb-1", style: { color: 'var(--text-secondary)' }, children: "Epic ID" }), _jsx("span", { className: "text-sm font-mono px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", children: requirement.beadsEpicId })] })), !requirement.beadsId && !requirement.beadsEpicId && (_jsx("p", { className: "text-sm italic", style: { color: 'var(--text-secondary)' }, children: "No beads links yet" }))] })] }), _jsxs("div", { className: "p-6 rounded-xl border", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("h3", { className: "font-semibold mb-4", style: { color: 'var(--text-primary)' }, children: "Metadata" }), _jsxs("div", { className: "space-y-3 text-sm", children: [requirement.targetDate && (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold mb-1", style: { color: 'var(--text-secondary)' }, children: "Target Date" }), _jsx("p", { style: { color: 'var(--text-primary)' }, children: new Date(requirement.targetDate).toLocaleDateString() })] })), requirement.labels && requirement.labels.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold mb-1", style: { color: 'var(--text-secondary)' }, children: "Labels" }), _jsx("div", { className: "flex flex-wrap gap-2", children: requirement.labels.map((label, i) => (_jsx("span", { className: "px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs", children: label }, i))) })] })), requirement.brainstormParticipants && requirement.brainstormParticipants.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold mb-1", style: { color: 'var(--text-secondary)' }, children: "Brainstorm Participants" }), _jsx("p", { className: "text-xs", style: { color: 'var(--text-primary)' }, children: requirement.brainstormParticipants.join(', ') })] })), requirement.approvedBy && requirement.approvedBy.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold mb-1", style: { color: 'var(--text-secondary)' }, children: "Approved By" }), _jsx("p", { className: "text-xs", style: { color: 'var(--text-primary)' }, children: requirement.approvedBy.join(', ') })] }))] })] }), _jsxs("div", { className: "p-6 rounded-xl border", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("h3", { className: "font-semibold mb-4", style: { color: 'var(--text-primary)' }, children: "Timeline" }), _jsxs("div", { className: "space-y-2 text-xs", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { style: { color: 'var(--text-secondary)' }, children: "Created" }), _jsx("span", { style: { color: 'var(--text-primary)' }, children: new Date(requirement.createdAt).toLocaleDateString() })] }), requirement.brainstormStartedAt && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { style: { color: 'var(--text-secondary)' }, children: "Brainstorm Started" }), _jsx("span", { style: { color: 'var(--text-primary)' }, children: new Date(requirement.brainstormStartedAt).toLocaleDateString() })] })), requirement.solidifiedAt && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { style: { color: 'var(--text-secondary)' }, children: "Solidified" }), _jsx("span", { style: { color: 'var(--text-primary)' }, children: new Date(requirement.solidifiedAt).toLocaleDateString() })] })), requirement.implementationStartedAt && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { style: { color: 'var(--text-secondary)' }, children: "Implementation Started" }), _jsx("span", { style: { color: 'var(--text-primary)' }, children: new Date(requirement.implementationStartedAt).toLocaleDateString() })] })), requirement.completedAt && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { style: { color: 'var(--text-secondary)' }, children: "Completed" }), _jsx("span", { style: { color: 'var(--text-primary)' }, children: new Date(requirement.completedAt).toLocaleDateString() })] }))] })] })] })] })] }) }), _jsx(AnimatePresence, { children: showStatusModal && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", onClick: () => setShowStatusModal(false), children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "max-w-lg w-full p-6 rounded-xl shadow-2xl", style: { backgroundColor: 'var(--bg-card)' }, onClick: (e) => e.stopPropagation(), children: [_jsx("h2", { className: "text-2xl font-bold mb-4 bg-gradient-spark bg-clip-text text-transparent", children: "Change Status" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "New Status *" }), _jsxs("select", { value: statusData.status, onChange: (e) => setStatusData({ ...statusData, status: e.target.value }), className: "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50", style: { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }, children: [_jsx("option", { value: "", children: "Select status" }), workflowSteps.map(status => (_jsx("option", { value: status, children: status.replace(/_/g, ' ').toUpperCase() }, status))), _jsx("option", { value: "cancelled", children: "CANCELLED" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Participants (comma-separated user IDs)" }), _jsx("input", { type: "text", value: statusData.participants, onChange: (e) => setStatusData({ ...statusData, participants: e.target.value }), className: "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50", style: { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }, placeholder: "1, 2, 3" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Approvers (comma-separated user IDs)" }), _jsx("input", { type: "text", value: statusData.approvers, onChange: (e) => setStatusData({ ...statusData, approvers: e.target.value }), className: "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50", style: { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }, placeholder: "1, 2" })] })] }), _jsxs("div", { className: "flex gap-3 mt-6", children: [_jsx(motion.button, { onClick: handleUpdateStatus, className: "flex-1 btn-primary", whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, children: "Update Status" }), _jsx(motion.button, { onClick: () => setShowStatusModal(false), className: "px-6 py-2 rounded-lg border font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors", style: { borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }, whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, children: "Cancel" })] })] }) })) }), _jsx(AnimatePresence, { children: showEditModal && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", onClick: () => setShowEditModal(false), children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "max-w-2xl w-full p-6 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto", style: { backgroundColor: 'var(--bg-card)' }, onClick: (e) => e.stopPropagation(), children: [_jsx("h2", { className: "text-2xl font-bold mb-4 bg-gradient-spark bg-clip-text text-transparent", children: "Edit Requirement" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Title" }), _jsx("input", { type: "text", value: editData.title || '', onChange: (e) => setEditData({ ...editData, title: e.target.value }), className: "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50", style: { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' } })] }), _jsx(MarkdownEditor, { value: editData.description || '', onChange: (val) => setEditData({ ...editData, description: val }), label: "Description", height: 128 }), _jsx(MarkdownEditor, { value: editData.claudeRewrite || '', onChange: (val) => setEditData({ ...editData, claudeRewrite: val }), label: "Claude Rewrite", placeholder: "Claude's structured version", height: 160 }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Beads Epic ID" }), _jsx("input", { type: "text", value: editData.beadsEpicId || '', onChange: (e) => setEditData({ ...editData, beadsEpicId: e.target.value }), className: "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50", style: { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }, placeholder: "tsklets-abc123" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Priority" }), _jsxs("select", { value: editData.priority || 3, onChange: (e) => setEditData({ ...editData, priority: parseInt(e.target.value) }), className: "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50", style: { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }, children: [_jsx("option", { value: 0, children: "P0 - Critical" }), _jsx("option", { value: 1, children: "P1 - High" }), _jsx("option", { value: 2, children: "P2 - Medium" }), _jsx("option", { value: 3, children: "P3 - Normal" }), _jsx("option", { value: 4, children: "P4 - Low" })] })] })] }), _jsxs("div", { className: "flex gap-3 mt-6", children: [_jsx(motion.button, { onClick: handleUpdateRequirement, className: "flex-1 btn-primary", whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, children: "Save Changes" }), _jsx(motion.button, { onClick: () => setShowEditModal(false), className: "px-6 py-2 rounded-lg border font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors", style: { borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }, whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, children: "Cancel" })] })] }) })) }), _jsx(AnimatePresence, { children: showAmendmentModal && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", onClick: () => setShowAmendmentModal(false), children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "max-w-2xl w-full p-6 rounded-xl shadow-2xl", style: { backgroundColor: 'var(--bg-card)' }, onClick: (e) => e.stopPropagation(), children: [_jsx("h2", { className: "text-2xl font-bold mb-4 bg-gradient-spark bg-clip-text text-transparent", children: "Add Amendment" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Title *" }), _jsx("input", { type: "text", value: amendmentData.title, onChange: (e) => setAmendmentData({ ...amendmentData, title: e.target.value }), className: "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50", style: { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }, placeholder: "What needs to be added/changed?" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Description" }), _jsx("textarea", { value: amendmentData.description, onChange: (e) => setAmendmentData({ ...amendmentData, description: e.target.value }), className: "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50 h-32 resize-none", style: { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }, placeholder: "Detailed description of the amendment" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Business Justification" }), _jsx("textarea", { value: amendmentData.businessJustification, onChange: (e) => setAmendmentData({ ...amendmentData, businessJustification: e.target.value }), className: "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50 h-24 resize-none", style: { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }, placeholder: "Why is this amendment needed?" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Urgency" }), _jsxs("select", { value: amendmentData.urgency, onChange: (e) => setAmendmentData({ ...amendmentData, urgency: e.target.value }), className: "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50", style: { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }, children: [_jsx("option", { value: "critical", children: "Critical" }), _jsx("option", { value: "high", children: "High" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "low", children: "Low" })] })] })] }), _jsxs("div", { className: "flex gap-3 mt-6", children: [_jsx(motion.button, { onClick: handleCreateAmendment, className: "flex-1 btn-primary", whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, children: "Create Amendment" }), _jsx(motion.button, { onClick: () => setShowAmendmentModal(false), className: "px-6 py-2 rounded-lg border font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors", style: { borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }, whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, children: "Cancel" })] })] }) })) })] }));
}
