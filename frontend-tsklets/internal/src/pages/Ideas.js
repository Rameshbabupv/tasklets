import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/auth';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
const statusColors = {
    inbox: 'bg-slate-100 text-slate-700 border-slate-200',
    discussing: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-500',
    vetted: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500',
    in_progress: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-500',
    shipped: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500',
    archived: 'bg-gray-100 text-gray-500 border-gray-200',
};
const visibilityIcons = {
    private: { icon: 'lock', color: 'text-slate-500', label: 'Private', bgColor: 'bg-slate-100' },
    team: { icon: 'group', color: 'text-blue-600', label: 'Team', bgColor: 'bg-blue-100' },
    public: { icon: 'public', color: 'text-green-600', label: 'Public', bgColor: 'bg-green-100' },
};
export default function Ideas() {
    const { token } = useAuthStore();
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    useEffect(() => {
        fetchIdeas();
    }, []);
    async function fetchIdeas() {
        try {
            const res = await fetch('/api/ideas', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setIdeas(data.ideas || []);
        }
        catch (error) {
            console.error('Fetch ideas error:', error);
            toast.error('Failed to load ideas');
        }
        finally {
            setLoading(false);
        }
    }
    const filteredIdeas = ideas.filter(idea => {
        if (statusFilter !== 'all' && idea.status !== statusFilter) {
            return false;
        }
        if (filter === 'private' && idea.visibility !== 'private') {
            return false;
        }
        if (filter === 'team' && idea.visibility !== 'team') {
            return false;
        }
        return true;
    });
    return (_jsxs("div", { className: "flex h-screen bg-background-light overflow-hidden", children: [_jsx(Toaster, { position: "top-right", richColors: true }), _jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-y-auto", children: _jsxs("div", { className: "max-w-7xl mx-auto p-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-4xl font-display font-bold bg-gradient-spark bg-clip-text text-transparent mb-2", children: [_jsx("span", { className: "inline-block animate-float", children: "\uD83D\uDCA1" }), " SPARK Ideas"] }), _jsx("p", { className: "text-lg", style: { color: 'var(--text-secondary)' }, children: "Capture ideas without constraints. Vet them with your team." })] }), _jsxs(motion.button, { onClick: () => setShowCreateModal(true), className: "btn-primary flex items-center gap-2 relative overflow-hidden group", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", children: "add" }), "New Idea", _jsx("span", { className: "absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" })] })] }), _jsxs("div", { className: "flex gap-4 items-center flex-wrap", children: [_jsx("div", { className: "flex gap-2", children: [
                                                { key: 'all', label: 'All' },
                                                { key: 'my', label: 'My Ideas' },
                                                { key: 'team', label: 'Team' },
                                                { key: 'private', label: 'Private' },
                                            ].map(tab => (_jsx(motion.button, { onClick: () => setFilter(tab.key), className: `px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === tab.key
                                                    ? 'bg-gradient-spark text-white shadow-lg shadow-primary/30'
                                                    : 'hover:bg-gradient-shimmer border hover:border-primary/30'}`, style: filter !== tab.key ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' } : {}, whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: tab.label }, tab.key))) }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "inbox", children: "Inbox" }), _jsx("option", { value: "discussing", children: "Discussing" }), _jsx("option", { value: "vetted", children: "Vetted" }), _jsx("option", { value: "in_progress", children: "In Progress" }), _jsx("option", { value: "shipped", children: "Shipped" })] })] })] }), loading ? (_jsx("div", { className: "grid gap-4", children: [1, 2, 3].map(i => (_jsxs("div", { className: "rounded-xl border p-6 animate-pulse", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("div", { className: "h-6 rounded w-3/4 mb-3", style: { backgroundColor: 'var(--bg-tertiary)' } }), _jsx("div", { className: "h-4 rounded w-1/2 mb-4", style: { backgroundColor: 'var(--bg-tertiary)' } }), _jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "h-4 rounded w-24", style: { backgroundColor: 'var(--bg-tertiary)' } }), _jsx("div", { className: "h-4 rounded w-24", style: { backgroundColor: 'var(--bg-tertiary)' } })] })] }, i))) })) : filteredIdeas.length === 0 ? (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.5 }, className: "text-center py-20 bg-gradient-to-br from-white to-purple-50/30 rounded-2xl border border-purple-100 relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-spark opacity-5" }), _jsxs("div", { className: "relative", children: [_jsxs("div", { className: "relative inline-block mb-6", children: [_jsx("div", { className: "absolute inset-0 bg-yellow-200 rounded-full blur-3xl opacity-30 animate-pulse-slow" }), _jsx("div", { className: "relative text-8xl animate-float", children: "\uD83D\uDCA1" })] }), _jsx("h3", { className: "text-2xl font-bold font-display mb-3", style: { color: 'var(--text-primary)' }, children: "No ideas yet" }), _jsx("p", { className: "mb-8 max-w-md mx-auto text-lg", style: { color: 'var(--text-secondary)' }, children: "Start capturing your brilliant thoughts! Ideas can be kept private, shared with your team, or published for everyone." }), _jsx(motion.button, { onClick: () => setShowCreateModal(true), className: "btn-primary text-lg px-8 py-3", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: "Create Your First Idea" })] })] })) : (_jsx("div", { className: "grid gap-4", children: _jsx(AnimatePresence, { children: filteredIdeas.map((idea, i) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { delay: i * 0.05, duration: 0.3 }, children: _jsxs(Link, { to: `/ideas/${idea.id}`, className: "block rounded-xl border p-6 card-hover relative overflow-hidden group", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("div", { className: "absolute inset-0 bg-gradient-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" }), _jsxs("div", { className: "relative flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "text-lg font-bold font-display mb-2 truncate", style: { color: 'var(--text-primary)' }, children: idea.title }), idea.description && (_jsx("p", { className: "text-sm mb-3 line-clamp-2", style: { color: 'var(--text-secondary)' }, children: idea.description })), _jsxs("div", { className: "flex items-center gap-4 text-sm", style: { color: 'var(--text-muted)' }, children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", "aria-hidden": "true", children: "person" }), _jsx("span", { children: idea.creator.name })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", "aria-hidden": "true", children: "schedule" }), _jsx("span", { children: new Date(idea.createdAt).toLocaleDateString() })] })] })] }), _jsxs("div", { className: "flex flex-col items-end gap-3", children: [_jsxs("div", { className: `flex items-center gap-2 px-3 py-1 rounded-full ${visibilityIcons[idea.visibility].bgColor}`, children: [_jsx("span", { className: `material-symbols-outlined text-[18px] ${visibilityIcons[idea.visibility].color}`, "aria-hidden": "true", children: visibilityIcons[idea.visibility].icon }), _jsx("span", { className: "text-xs font-medium", style: { color: 'var(--text-secondary)' }, children: idea.visibility === 'team' && idea.team ? idea.team.name : visibilityIcons[idea.visibility].label })] }), _jsx("span", { className: `px-4 py-1.5 rounded-full text-xs font-bold border-2 ${statusColors[idea.status]} shadow-sm`, children: idea.status.replace('_', ' ').toUpperCase() }), _jsxs("div", { className: "flex items-center gap-4 text-sm", style: { color: 'var(--text-muted)' }, children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", "aria-hidden": "true", children: "thumb_up" }), _jsx("span", { className: "font-medium", children: idea.voteCount })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", "aria-hidden": "true", children: "comment" }), _jsx("span", { className: "font-medium", children: idea.commentCount })] })] })] })] })] }) }, idea.id))) }) }))] }) }), _jsx(AnimatePresence, { children: showCreateModal && (_jsx(CreateIdeaModal, { onClose: () => setShowCreateModal(false), onCreated: () => {
                        setShowCreateModal(false);
                        fetchIdeas();
                        toast.success('💡 Idea created successfully!');
                    } })) })] }));
}
// Modal component
function CreateIdeaModal({ onClose, onCreated }) {
    const { token } = useAuthStore();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] = useState('private');
    const [submitting, setSubmitting] = useState(false);
    async function handleSubmit(e) {
        e.preventDefault();
        if (!title.trim())
            return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/ideas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ title, description, visibility })
            });
            if (res.ok) {
                onCreated();
            }
            else {
                toast.error('Failed to create idea');
            }
        }
        catch (error) {
            console.error('Create idea error:', error);
            toast.error('Failed to create idea');
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4", onClick: onClose, children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, transition: { type: 'spring', duration: 0.3 }, className: "rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", style: { backgroundColor: 'var(--bg-card)' }, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "p-6 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("h2", { className: "text-2xl font-display font-bold bg-gradient-spark bg-clip-text text-transparent", children: "\uD83D\uDCA1 New Idea" }), _jsx("button", { onClick: onClose, className: "rounded-lg p-2 transition-all hover:bg-white", style: { color: 'var(--text-muted)' }, "aria-label": "Close modal", children: _jsx("span", { className: "material-symbols-outlined", "aria-hidden": "true", children: "close" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "idea-title", className: "block text-sm font-semibold mb-2", style: { color: 'var(--text-secondary)' }, children: "Title *" }), _jsx("input", { id: "idea-title", type: "text", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "e.g., Add dark mode support", className: "input-field", required: true, autoFocus: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "idea-description", className: "block text-sm font-semibold mb-2", style: { color: 'var(--text-secondary)' }, children: "Description" }), _jsx("textarea", { id: "idea-description", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Describe your idea in detail...", className: "input-field min-h-[120px]", rows: 5 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-3", style: { color: 'var(--text-secondary)' }, children: "Who can see this?" }), _jsx("div", { className: "space-y-3", children: [
                                        { value: 'private', icon: 'lock', label: 'Private', desc: 'Just me for now' },
                                        { value: 'team', icon: 'group', label: 'Team', desc: 'Share with my team (coming soon)' },
                                        { value: 'public', icon: 'public', label: 'Public', desc: 'Everyone in organization' },
                                    ].map(option => (_jsxs("label", { className: `flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${visibility === option.value
                                            ? 'border-primary bg-gradient-shimmer shadow-md'
                                            : 'hover:border-primary/30'} ${option.value === 'team' ? 'opacity-60' : ''}`, style: visibility !== option.value ? { borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' } : {}, children: [_jsx("input", { type: "radio", name: "visibility", value: option.value, checked: visibility === option.value, onChange: (e) => setVisibility(e.target.value), className: "mt-1 focus:ring-2 focus:ring-primary", disabled: option.value === 'team' }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", "aria-hidden": "true", children: option.icon }), _jsx("span", { className: "font-semibold", style: { color: 'var(--text-primary)' }, children: option.label })] }), _jsx("p", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: option.desc })] })] }, option.value))) })] }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "btn-secondary flex-1", children: "Cancel" }), _jsx(motion.button, { type: "submit", disabled: submitting || !title.trim(), className: "btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed", whileHover: !submitting && title.trim() ? { scale: 1.02 } : {}, whileTap: !submitting && title.trim() ? { scale: 0.98 } : {}, children: submitting ? 'Creating...' : 'Create Idea' })] })] })] }) }));
}
