import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/auth';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
const contentTypeIcons = {
    json: { icon: 'data_object', label: 'JSON', color: 'text-yellow-600' },
    yaml: { icon: 'settings_suggest', label: 'YAML', color: 'text-blue-600' },
    markdown: { icon: 'description', label: 'Markdown', color: 'text-purple-600' },
    text: { icon: 'notes', label: 'Text', color: 'text-slate-600' },
};
const visibilityIcons = {
    private: { icon: 'lock', label: 'Private', color: 'text-slate-500', bgColor: 'bg-slate-100' },
    team: { icon: 'group', label: 'Team', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    public: { icon: 'public', label: 'Public', color: 'text-green-600', bgColor: 'bg-green-100' },
};
export default function AIConfigs() {
    const { token } = useAuthStore();
    const [configs, setConfigs] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [visibilityFilter, setVisibilityFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    useEffect(() => {
        fetchConfigs();
        fetchTags();
    }, []);
    async function fetchConfigs() {
        try {
            const params = new URLSearchParams();
            if (filter === 'favorites')
                params.append('favorites', 'true');
            if (visibilityFilter !== 'all')
                params.append('visibility', visibilityFilter);
            if (tagFilter !== 'all')
                params.append('tags', tagFilter);
            if (searchQuery)
                params.append('search', searchQuery);
            const res = await fetch(`/api/ai-configs?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setConfigs(data.configs || []);
        }
        catch (error) {
            console.error('Fetch configs error:', error);
            toast.error('Failed to load AI configs');
        }
        finally {
            setLoading(false);
        }
    }
    async function fetchTags() {
        try {
            const res = await fetch('/api/tags', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setTags(data.tags || []);
        }
        catch (error) {
            console.error('Fetch tags error:', error);
        }
    }
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchConfigs();
        }, 300);
        return () => clearTimeout(timeout);
    }, [filter, visibilityFilter, tagFilter, searchQuery]);
    async function toggleFavorite(configId, e) {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = await fetch(`/api/ai-configs/${configId}/favorite`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConfigs(prev => prev.map(c => c.id === configId
                    ? { ...c, isFavorited: data.favorited, favoriteCount: c.favoriteCount + (data.favorited ? 1 : -1) }
                    : c));
            }
        }
        catch (error) {
            toast.error('Failed to update favorite');
        }
    }
    return (_jsxs("div", { className: "flex h-screen bg-background-light overflow-hidden", children: [_jsx(Toaster, { position: "top-right", richColors: true }), _jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-y-auto", children: _jsxs("div", { className: "max-w-7xl mx-auto p-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-4xl font-display font-bold bg-gradient-spark bg-clip-text text-transparent mb-2", children: [_jsx("span", { className: "inline-block animate-float", children: "\uD83E\uDD16" }), " AI Configs"] }), _jsx("p", { className: "text-lg", style: { color: 'var(--text-secondary)' }, children: "Store and manage prompts, skills, hooks, and MCP configurations" })] }), _jsxs(motion.button, { onClick: () => setShowCreateModal(true), className: "btn-primary flex items-center gap-2 relative overflow-hidden group", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", children: "add" }), "New Config", _jsx("span", { className: "absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" })] })] }), _jsxs("div", { className: "flex gap-4 items-center flex-wrap", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]", style: { color: 'var(--text-muted)' }, children: "search" }), _jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search configs...", className: "w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' } })] }), _jsx("div", { className: "flex gap-2", children: [
                                                { key: 'all', label: 'All', icon: 'view_list' },
                                                { key: 'my', label: 'My Configs', icon: 'person' },
                                                { key: 'favorites', label: 'Favorites', icon: 'star' },
                                            ].map(tab => (_jsxs(motion.button, { onClick: () => setFilter(tab.key), className: `px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filter === tab.key
                                                    ? 'bg-gradient-spark text-white shadow-lg shadow-primary/30'
                                                    : 'hover:bg-gradient-shimmer border hover:border-primary/30'}`, style: filter !== tab.key ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' } : {}, whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: tab.icon }), tab.label] }, tab.key))) }), _jsxs("select", { value: visibilityFilter, onChange: (e) => setVisibilityFilter(e.target.value), className: "px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("option", { value: "all", children: "All Visibility" }), _jsx("option", { value: "private", children: "Private" }), _jsx("option", { value: "team", children: "Team" }), _jsx("option", { value: "public", children: "Public" })] }), tags.length > 0 && (_jsxs("select", { value: tagFilter, onChange: (e) => setTagFilter(e.target.value), className: "px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("option", { value: "all", children: "All Tags" }), tags.map(tag => (_jsx("option", { value: tag.id, children: tag.name }, tag.id)))] }))] })] }), loading ? (_jsx("div", { className: "grid gap-4", children: [1, 2, 3].map(i => (_jsxs("div", { className: "rounded-xl border p-6 animate-pulse", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("div", { className: "h-6 rounded w-3/4 mb-3", style: { backgroundColor: 'var(--bg-tertiary)' } }), _jsx("div", { className: "h-4 rounded w-1/2 mb-4", style: { backgroundColor: 'var(--bg-tertiary)' } }), _jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "h-4 rounded w-24", style: { backgroundColor: 'var(--bg-tertiary)' } }), _jsx("div", { className: "h-4 rounded w-24", style: { backgroundColor: 'var(--bg-tertiary)' } })] })] }, i))) })) : configs.length === 0 ? (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.5 }, className: "text-center py-20 bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-blue-100 relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-spark opacity-5" }), _jsxs("div", { className: "relative", children: [_jsxs("div", { className: "relative inline-block mb-6", children: [_jsx("div", { className: "absolute inset-0 bg-blue-200 rounded-full blur-3xl opacity-30 animate-pulse-slow" }), _jsx("div", { className: "relative text-8xl animate-float", children: "\uD83E\uDD16" })] }), _jsx("h3", { className: "text-2xl font-bold font-display mb-3", style: { color: 'var(--text-primary)' }, children: "No AI configs yet" }), _jsx("p", { className: "mb-8 max-w-md mx-auto text-lg", style: { color: 'var(--text-secondary)' }, children: "Start storing your prompts, skills, hooks, and MCP configurations. Share them with your team or keep them private." }), _jsx(motion.button, { onClick: () => setShowCreateModal(true), className: "btn-primary text-lg px-8 py-3", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: "Create Your First Config" })] })] })) : (_jsx("div", { className: "grid gap-4", children: _jsx(AnimatePresence, { children: configs.map((config, i) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { delay: i * 0.05, duration: 0.3 }, children: _jsxs(Link, { to: `/ai-configs/${config.id}`, className: "block rounded-xl border p-6 card-hover relative overflow-hidden group", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("div", { className: "absolute inset-0 bg-gradient-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" }), _jsxs("div", { className: "relative flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("h3", { className: "text-lg font-bold font-display truncate", style: { color: 'var(--text-primary)' }, children: config.name }), _jsx("code", { className: "text-xs px-2 py-0.5 rounded", style: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }, children: config.slug })] }), config.description && (_jsx("p", { className: "text-sm mb-3 line-clamp-2", style: { color: 'var(--text-secondary)' }, children: config.description })), config.tags && config.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mb-3", children: config.tags.map(tag => (_jsx("span", { className: "px-2 py-0.5 rounded-full text-xs font-medium", style: { backgroundColor: tag.color || '#e5e7eb', color: '#374151' }, children: tag.name }, tag.id))) })), config.variables && ((() => {
                                                                const vars = typeof config.variables === 'string'
                                                                    ? JSON.parse(config.variables)
                                                                    : config.variables;
                                                                return vars && vars.length > 0 ? (_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("span", { className: "material-symbols-outlined text-[16px]", style: { color: 'var(--text-muted)' }, children: "code" }), _jsxs("span", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: ["Variables: ", vars.map((v) => `{{${v.name}}}`).join(', ')] })] })) : null;
                                                            })()), _jsxs("div", { className: "flex items-center gap-4 text-sm", style: { color: 'var(--text-muted)' }, children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "person" }), _jsx("span", { children: config.creator?.name || 'Unknown' })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "schedule" }), _jsx("span", { children: new Date(config.updatedAt).toLocaleDateString() })] })] })] }), _jsxs("div", { className: "flex flex-col items-end gap-3", children: [_jsx(motion.button, { onClick: (e) => toggleFavorite(config.id, e), className: "p-2 rounded-lg transition-all hover:bg-yellow-50", whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 }, children: _jsx("span", { className: `material-symbols-outlined text-[24px] ${config.isFavorited ? 'text-yellow-500' : ''}`, style: !config.isFavorited ? { color: 'var(--text-muted)' } : {}, children: config.isFavorited ? 'star' : 'star_outline' }) }), _jsxs("div", { className: "flex items-center gap-2 px-3 py-1 rounded-full", style: { backgroundColor: 'var(--bg-tertiary)' }, children: [_jsx("span", { className: `material-symbols-outlined text-[18px] ${contentTypeIcons[config.contentType].color}`, children: contentTypeIcons[config.contentType].icon }), _jsx("span", { className: "text-xs font-medium", style: { color: 'var(--text-secondary)' }, children: contentTypeIcons[config.contentType].label })] }), _jsxs("div", { className: `flex items-center gap-2 px-3 py-1 rounded-full ${visibilityIcons[config.visibility].bgColor}`, children: [_jsx("span", { className: `material-symbols-outlined text-[18px] ${visibilityIcons[config.visibility].color}`, children: visibilityIcons[config.visibility].icon }), _jsx("span", { className: "text-xs font-medium", style: { color: 'var(--text-secondary)' }, children: config.visibility === 'team' && config.team ? config.team.name : visibilityIcons[config.visibility].label })] }), _jsxs("div", { className: "flex items-center gap-4 text-sm", style: { color: 'var(--text-muted)' }, children: [_jsxs("div", { className: "flex items-center gap-1", title: "Favorites", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "star" }), _jsx("span", { className: "font-medium", children: config.favoriteCount })] }), _jsxs("div", { className: "flex items-center gap-1", title: "Forks", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "fork_right" }), _jsx("span", { className: "font-medium", children: config.forkCount })] }), _jsxs("div", { className: "flex items-center gap-1", title: "Uses", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "trending_up" }), _jsx("span", { className: "font-medium", children: config.usageCount })] })] })] })] })] }) }, config.id))) }) }))] }) }), _jsx(AnimatePresence, { children: showCreateModal && (_jsx(CreateConfigModal, { onClose: () => setShowCreateModal(false), onCreated: () => {
                        setShowCreateModal(false);
                        fetchConfigs();
                        toast.success('🤖 AI Config created successfully!');
                    } })) })] }));
}
// Create Modal component
function CreateConfigModal({ onClose, onCreated }) {
    const { token } = useAuthStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [contentType, setContentType] = useState('text');
    const [visibility, setVisibility] = useState('private');
    const [submitting, setSubmitting] = useState(false);
    async function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim() || !content.trim())
            return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/ai-configs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, description, content, contentType, visibility })
            });
            if (res.ok) {
                onCreated();
            }
            else {
                const data = await res.json();
                toast.error(data.error || 'Failed to create config');
            }
        }
        catch (error) {
            console.error('Create config error:', error);
            toast.error('Failed to create config');
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4", onClick: onClose, children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, transition: { type: 'spring', duration: 0.3 }, className: "rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto", style: { backgroundColor: 'var(--bg-card)' }, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("h2", { className: "text-2xl font-display font-bold bg-gradient-spark bg-clip-text text-transparent", children: "\uD83E\uDD16 New AI Config" }), _jsx("button", { onClick: onClose, className: "rounded-lg p-2 transition-all hover:bg-white", style: { color: 'var(--text-muted)' }, "aria-label": "Close modal", children: _jsx("span", { className: "material-symbols-outlined", children: "close" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "config-name", className: "block text-sm font-semibold mb-2", style: { color: 'var(--text-secondary)' }, children: "Name *" }), _jsx("input", { id: "config-name", type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g., Code Review Prompt", className: "input-field", required: true, autoFocus: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "content-type", className: "block text-sm font-semibold mb-2", style: { color: 'var(--text-secondary)' }, children: "Content Type" }), _jsxs("select", { id: "content-type", value: contentType, onChange: (e) => setContentType(e.target.value), className: "input-field", children: [_jsx("option", { value: "text", children: "Text" }), _jsx("option", { value: "markdown", children: "Markdown" }), _jsx("option", { value: "json", children: "JSON" }), _jsx("option", { value: "yaml", children: "YAML" })] })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "config-description", className: "block text-sm font-semibold mb-2", style: { color: 'var(--text-secondary)' }, children: "Description" }), _jsx("input", { id: "config-description", type: "text", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Brief description of this config", className: "input-field" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "config-content", className: "block text-sm font-semibold mb-2", style: { color: 'var(--text-secondary)' }, children: ["Content * ", _jsxs("span", { className: "font-normal text-xs", children: ["(Use ", '{{variable}}', " for placeholders)"] })] }), _jsx("textarea", { id: "config-content", value: content, onChange: (e) => setContent(e.target.value), placeholder: "Enter your prompt, skill definition, or configuration...", className: "input-field font-mono text-sm min-h-[200px]", rows: 10, required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-3", style: { color: 'var(--text-secondary)' }, children: "Visibility" }), _jsx("div", { className: "space-y-3", children: [
                                        { value: 'private', icon: 'lock', label: 'Private', desc: 'Only you can see and use this' },
                                        { value: 'team', icon: 'group', label: 'Team', desc: 'Share with your team members' },
                                        { value: 'public', icon: 'public', label: 'Public', desc: 'Everyone in organization can see' },
                                    ].map(option => (_jsxs("label", { className: `flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${visibility === option.value
                                            ? 'border-primary bg-gradient-shimmer shadow-md'
                                            : 'hover:border-primary/30'}`, style: visibility !== option.value ? { borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' } : {}, children: [_jsx("input", { type: "radio", name: "visibility", value: option.value, checked: visibility === option.value, onChange: (e) => setVisibility(e.target.value), className: "mt-1 focus:ring-2 focus:ring-primary" }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", children: option.icon }), _jsx("span", { className: "font-semibold", style: { color: 'var(--text-primary)' }, children: option.label })] }), _jsx("p", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: option.desc })] })] }, option.value))) })] }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "btn-secondary flex-1", children: "Cancel" }), _jsx(motion.button, { type: "submit", disabled: submitting || !name.trim() || !content.trim(), className: "btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed", whileHover: !submitting && name.trim() && content.trim() ? { scale: 1.02 } : {}, whileTap: !submitting && name.trim() && content.trim() ? { scale: 0.98 } : {}, children: submitting ? 'Creating...' : 'Create Config' })] })] })] }) }));
}
