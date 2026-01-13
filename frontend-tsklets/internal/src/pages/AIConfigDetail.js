import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
const contentTypeIcons = {
    json: { icon: 'data_object', label: 'JSON', color: 'text-yellow-600' },
    yaml: { icon: 'settings_suggest', label: 'YAML', color: 'text-blue-600' },
    markdown: { icon: 'description', label: 'Markdown', color: 'text-purple-600' },
    text: { icon: 'notes', label: 'Text', color: 'text-slate-600' },
};
const visibilityOptions = [
    { value: 'private', icon: 'lock', label: 'Private', desc: 'Only you' },
    { value: 'team', icon: 'group', label: 'Team', desc: 'Team members' },
    { value: 'public', icon: 'public', label: 'Public', desc: 'Everyone' },
];
export default function AIConfigDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuthStore();
    const [config, setConfig] = useState(null);
    const [versions, setVersions] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showVersions, setShowVersions] = useState(false);
    const [showTagModal, setShowTagModal] = useState(false);
    // Edit state
    const [editMode, setEditMode] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editContentType, setEditContentType] = useState('text');
    const [editVisibility, setEditVisibility] = useState('private');
    useEffect(() => {
        fetchConfig();
        fetchVersions();
        fetchTags();
    }, [id]);
    async function fetchConfig() {
        try {
            const res = await fetch(`/api/ai-configs/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                toast.error('Config not found');
                navigate('/ai-configs');
                return;
            }
            const data = await res.json();
            setConfig(data.config);
            // Initialize edit state
            setEditName(data.config.name);
            setEditDescription(data.config.description || '');
            setEditContent(data.config.content);
            setEditContentType(data.config.contentType);
            setEditVisibility(data.config.visibility);
        }
        catch (error) {
            console.error('Fetch config error:', error);
            toast.error('Failed to load config');
        }
        finally {
            setLoading(false);
        }
    }
    async function fetchVersions() {
        try {
            const res = await fetch(`/api/ai-configs/${id}/versions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setVersions(data.versions || []);
        }
        catch (error) {
            console.error('Fetch versions error:', error);
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
    async function handleSave() {
        if (!editName.trim() || !editContent.trim()) {
            toast.error('Name and content are required');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`/api/ai-configs/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: editName,
                    description: editDescription,
                    content: editContent,
                    contentType: editContentType,
                    visibility: editVisibility,
                })
            });
            if (res.ok) {
                const data = await res.json();
                setConfig(data.config);
                setEditMode(false);
                fetchVersions();
                toast.success(data.versionCreated ? 'Saved! New version created.' : 'Saved!');
            }
            else {
                const data = await res.json();
                toast.error(data.error || 'Failed to save');
            }
        }
        catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save');
        }
        finally {
            setSaving(false);
        }
    }
    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this config? This cannot be undone.'))
            return;
        try {
            const res = await fetch(`/api/ai-configs/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Config deleted');
                navigate('/ai-configs');
            }
            else {
                toast.error('Failed to delete');
            }
        }
        catch (error) {
            toast.error('Failed to delete');
        }
    }
    async function handleRollback(versionNumber) {
        if (!confirm(`Rollback to version ${versionNumber}? This will set it as the active version.`))
            return;
        try {
            const res = await fetch(`/api/ai-configs/${id}/versions/${versionNumber}/activate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchConfig();
                fetchVersions();
                toast.success(`Rolled back to version ${versionNumber}`);
            }
            else {
                toast.error('Failed to rollback');
            }
        }
        catch (error) {
            toast.error('Failed to rollback');
        }
    }
    async function handleFork() {
        try {
            const res = await fetch(`/api/ai-configs/${id}/fork`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                toast.success('Config forked!');
                navigate(`/ai-configs/${data.config.id}`);
            }
            else {
                const data = await res.json();
                toast.error(data.error || 'Failed to fork');
            }
        }
        catch (error) {
            toast.error('Failed to fork');
        }
    }
    async function toggleFavorite() {
        try {
            const res = await fetch(`/api/ai-configs/${id}/favorite`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConfig(prev => prev ? {
                    ...prev,
                    isFavorited: data.favorited,
                    favoriteCount: prev.favoriteCount + (data.favorited ? 1 : -1)
                } : null);
            }
        }
        catch (error) {
            toast.error('Failed to update favorite');
        }
    }
    async function addTag(tagId) {
        try {
            const res = await fetch(`/api/ai-configs/${id}/tags`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ tagIds: [tagId] })
            });
            if (res.ok) {
                fetchConfig();
                toast.success('Tag added');
            }
        }
        catch (error) {
            toast.error('Failed to add tag');
        }
    }
    async function removeTag(tagId) {
        try {
            const res = await fetch(`/api/ai-configs/${id}/tags/${tagId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchConfig();
                toast.success('Tag removed');
            }
        }
        catch (error) {
            toast.error('Failed to remove tag');
        }
    }
    function copyToClipboard(text, label) {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    }
    const isOwner = config?.createdBy === user?.id;
    const canEdit = isOwner;
    if (loading) {
        return (_jsxs("div", { className: "flex h-screen bg-background-light overflow-hidden", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" }), _jsx("p", { style: { color: 'var(--text-secondary)' }, children: "Loading config..." })] }) })] }));
    }
    if (!config)
        return null;
    return (_jsxs("div", { className: "flex h-screen bg-background-light overflow-hidden", children: [_jsx(Toaster, { position: "top-right", richColors: true }), _jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-y-auto", children: _jsxs("div", { className: "max-w-6xl mx-auto p-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, className: "mb-8", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4 text-sm", style: { color: 'var(--text-muted)' }, children: [_jsx("button", { onClick: () => navigate('/ai-configs'), className: "hover:text-primary transition-colors", children: "AI Configs" }), _jsx("span", { className: "material-symbols-outlined text-[16px]", children: "chevron_right" }), _jsx("span", { style: { color: 'var(--text-secondary)' }, children: config.name })] }), _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1", children: [editMode ? (_jsx("input", { type: "text", value: editName, onChange: (e) => setEditName(e.target.value), className: "text-3xl font-display font-bold bg-transparent border-b-2 border-primary w-full focus:outline-none mb-2", style: { color: 'var(--text-primary)' } })) : (_jsx("h1", { className: "text-3xl font-display font-bold mb-2", style: { color: 'var(--text-primary)' }, children: config.name })), _jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsxs("button", { onClick: () => copyToClipboard(config.slug, 'Slug'), className: "flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors", title: "Click to copy slug", children: [_jsx("code", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: config.slug }), _jsx("span", { className: "material-symbols-outlined text-[14px]", style: { color: 'var(--text-muted)' }, children: "content_copy" })] }), _jsxs("span", { className: `flex items-center gap-1 px-2 py-1 rounded ${contentTypeIcons[config.contentType].color}`, style: { backgroundColor: 'var(--bg-tertiary)' }, children: [_jsx("span", { className: "material-symbols-outlined text-[16px]", children: contentTypeIcons[config.contentType].icon }), _jsx("span", { className: "text-sm", children: contentTypeIcons[config.contentType].label })] }), _jsxs("span", { className: "flex items-center gap-1 px-2 py-1 rounded text-sm", style: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }, children: [_jsx("span", { className: "material-symbols-outlined text-[16px]", children: visibilityOptions.find(v => v.value === config.visibility)?.icon }), config.visibility] }), config.forkedFromId && (_jsxs("span", { className: "flex items-center gap-1 px-2 py-1 rounded text-sm", style: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }, children: [_jsx("span", { className: "material-symbols-outlined text-[16px]", children: "fork_right" }), "Forked"] }))] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(motion.button, { onClick: toggleFavorite, className: "p-2 rounded-lg transition-all hover:bg-yellow-50", whileHover: { scale: 1.1 }, whileTap: { scale: 0.9 }, title: config.isFavorited ? 'Remove from favorites' : 'Add to favorites', children: _jsx("span", { className: `material-symbols-outlined text-[24px] ${config.isFavorited ? 'text-yellow-500' : ''}`, style: !config.isFavorited ? { color: 'var(--text-muted)' } : {}, children: config.isFavorited ? 'star' : 'star_outline' }) }), _jsxs(motion.button, { onClick: handleFork, className: "btn-secondary flex items-center gap-2", whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "fork_right" }), "Fork"] }), canEdit && !editMode && (_jsxs(motion.button, { onClick: () => setEditMode(true), className: "btn-primary flex items-center gap-2", whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "edit" }), "Edit"] })), editMode && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => {
                                                                setEditMode(false);
                                                                setEditName(config.name);
                                                                setEditDescription(config.description || '');
                                                                setEditContent(config.content);
                                                                setEditContentType(config.contentType);
                                                                setEditVisibility(config.visibility);
                                                            }, className: "btn-secondary", children: "Cancel" }), _jsxs(motion.button, { onClick: handleSave, disabled: saving, className: "btn-primary flex items-center gap-2", whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "save" }), saving ? 'Saving...' : 'Save'] })] }))] })] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-6", children: [_jsxs("div", { className: "col-span-2 space-y-6", children: [_jsxs("div", { className: "rounded-xl border p-6", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("h3", { className: "text-sm font-semibold mb-3", style: { color: 'var(--text-secondary)' }, children: "Description" }), editMode ? (_jsx("textarea", { value: editDescription, onChange: (e) => setEditDescription(e.target.value), placeholder: "Add a description...", className: "input-field w-full", rows: 2 })) : (_jsx("p", { style: { color: config.description ? 'var(--text-primary)' : 'var(--text-muted)' }, children: config.description || 'No description' }))] }), _jsxs("div", { className: "rounded-xl border p-6", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-sm font-semibold", style: { color: 'var(--text-secondary)' }, children: "Content" }), _jsxs("div", { className: "flex items-center gap-2", children: [editMode && (_jsxs("select", { value: editContentType, onChange: (e) => setEditContentType(e.target.value), className: "px-3 py-1 rounded-lg border text-sm", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }, children: [_jsx("option", { value: "text", children: "Text" }), _jsx("option", { value: "markdown", children: "Markdown" }), _jsx("option", { value: "json", children: "JSON" }), _jsx("option", { value: "yaml", children: "YAML" })] })), _jsxs("button", { onClick: () => copyToClipboard(editMode ? editContent : config.content, 'Content'), className: "flex items-center gap-1 px-3 py-1 rounded-lg text-sm hover:bg-slate-100 transition-colors", style: { color: 'var(--text-muted)' }, children: [_jsx("span", { className: "material-symbols-outlined text-[16px]", children: "content_copy" }), "Copy"] })] })] }), editMode ? (_jsx("textarea", { value: editContent, onChange: (e) => setEditContent(e.target.value), className: "w-full font-mono text-sm p-4 rounded-lg border min-h-[400px] focus:outline-none focus:ring-2 focus:ring-primary/50", style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }, spellCheck: false })) : (_jsx("pre", { className: "font-mono text-sm p-4 rounded-lg overflow-x-auto", style: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }, children: config.content })), config.variables && ((() => {
                                                    const vars = typeof config.variables === 'string'
                                                        ? JSON.parse(config.variables)
                                                        : config.variables;
                                                    return vars && vars.length > 0 ? (_jsxs("div", { className: "mt-4 pt-4 border-t", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("h4", { className: "text-xs font-semibold mb-2", style: { color: 'var(--text-muted)' }, children: "Detected Variables" }), _jsx("div", { className: "flex flex-wrap gap-2", children: vars.map((v) => (_jsx("code", { className: "px-2 py-1 rounded text-xs", style: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }, children: `{{${v.name}}}` }, v.name))) })] })) : null;
                                                })())] }), editMode && (_jsxs("div", { className: "rounded-xl border p-6", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("h3", { className: "text-sm font-semibold mb-3", style: { color: 'var(--text-secondary)' }, children: "Visibility" }), _jsx("div", { className: "flex gap-3", children: visibilityOptions.map(opt => (_jsxs("label", { className: `flex-1 flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${editVisibility === opt.value
                                                            ? 'border-primary bg-gradient-shimmer'
                                                            : 'hover:border-primary/30'}`, style: editVisibility !== opt.value ? { borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' } : {}, children: [_jsx("input", { type: "radio", name: "visibility", value: opt.value, checked: editVisibility === opt.value, onChange: (e) => setEditVisibility(e.target.value), className: "sr-only" }), _jsx("span", { className: "material-symbols-outlined text-[20px]", children: opt.icon }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-sm", style: { color: 'var(--text-primary)' }, children: opt.label }), _jsx("div", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: opt.desc })] })] }, opt.value))) })] }))] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "rounded-xl border p-6", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("h3", { className: "text-sm font-semibold mb-4", style: { color: 'var(--text-secondary)' }, children: "Stats" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm", style: { color: 'var(--text-muted)' }, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "star" }), "Favorites"] }), _jsx("span", { className: "font-semibold", style: { color: 'var(--text-primary)' }, children: config.favoriteCount })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm", style: { color: 'var(--text-muted)' }, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "fork_right" }), "Forks"] }), _jsx("span", { className: "font-semibold", style: { color: 'var(--text-primary)' }, children: config.forkCount })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm", style: { color: 'var(--text-muted)' }, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "trending_up" }), "Uses"] }), _jsx("span", { className: "font-semibold", style: { color: 'var(--text-primary)' }, children: config.usageCount })] })] })] }), _jsxs("div", { className: "rounded-xl border p-6", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-sm font-semibold", style: { color: 'var(--text-secondary)' }, children: "Tags" }), canEdit && (_jsx("button", { onClick: () => setShowTagModal(true), className: "text-sm text-primary hover:underline", children: "+ Add" }))] }), config.tags && config.tags.length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-2", children: config.tags.map(tag => (_jsxs("span", { className: "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium group", style: { backgroundColor: tag.color || '#e5e7eb', color: '#374151' }, children: [tag.name, canEdit && (_jsx("button", { onClick: () => removeTag(tag.id), className: "opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600", children: _jsx("span", { className: "material-symbols-outlined text-[14px]", children: "close" }) }))] }, tag.id))) })) : (_jsx("p", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: "No tags" }))] }), _jsxs("div", { className: "rounded-xl border p-6", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-sm font-semibold", style: { color: 'var(--text-secondary)' }, children: "Version History" }), _jsx("button", { onClick: () => setShowVersions(!showVersions), className: "text-sm text-primary hover:underline", children: showVersions ? 'Hide' : `Show (${versions.length})` })] }), _jsx(AnimatePresence, { children: showVersions && (_jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, className: "space-y-2 overflow-hidden", children: versions.length === 0 ? (_jsx("p", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: "No versions yet" })) : (versions.map(version => (_jsxs("div", { className: `p-3 rounded-lg border ${version.id === config.activeVersionId
                                                                ? 'border-primary bg-primary/5'
                                                                : ''}`, style: version.id !== config.activeVersionId ? {
                                                                borderColor: 'var(--border-primary)',
                                                                backgroundColor: 'var(--bg-tertiary)'
                                                            } : {}, children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsxs("span", { className: "font-semibold text-sm", style: { color: 'var(--text-primary)' }, children: ["v", version.version, version.id === config.activeVersionId && (_jsx("span", { className: "ml-2 text-xs text-primary", children: "(active)" }))] }), canEdit && version.id !== config.activeVersionId && (_jsx("button", { onClick: () => handleRollback(version.version), className: "text-xs text-primary hover:underline", children: "Rollback" }))] }), _jsx("p", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: new Date(version.createdAt).toLocaleString() }), version.changeNote && (_jsx("p", { className: "text-xs mt-1", style: { color: 'var(--text-secondary)' }, children: version.changeNote }))] }, version.id)))) })) })] }), _jsxs("div", { className: "rounded-xl border p-6", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsx("h3", { className: "text-sm font-semibold mb-4", style: { color: 'var(--text-secondary)' }, children: "Details" }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { style: { color: 'var(--text-muted)' }, children: "Created by" }), _jsx("span", { style: { color: 'var(--text-primary)' }, children: config.creator?.name || 'Unknown' })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { style: { color: 'var(--text-muted)' }, children: "Created" }), _jsx("span", { style: { color: 'var(--text-primary)' }, children: new Date(config.createdAt).toLocaleDateString() })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { style: { color: 'var(--text-muted)' }, children: "Updated" }), _jsx("span", { style: { color: 'var(--text-primary)' }, children: new Date(config.updatedAt).toLocaleDateString() })] })] })] }), canEdit && (_jsxs("div", { className: "rounded-xl border border-red-200 p-6 bg-red-50", children: [_jsx("h3", { className: "text-sm font-semibold text-red-700 mb-3", children: "Danger Zone" }), _jsx("button", { onClick: handleDelete, className: "w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium", children: "Delete Config" })] }))] })] })] }) }), _jsx(AnimatePresence, { children: showTagModal && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4", onClick: () => setShowTagModal(false), children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "rounded-2xl shadow-2xl max-w-md w-full", style: { backgroundColor: 'var(--bg-card)' }, onClick: (e) => e.stopPropagation(), children: [_jsx("div", { className: "p-6 border-b", style: { borderColor: 'var(--border-primary)' }, children: _jsx("h2", { className: "text-xl font-display font-bold", style: { color: 'var(--text-primary)' }, children: "Add Tags" }) }), _jsx("div", { className: "p-6", children: tags.length === 0 ? (_jsx("p", { style: { color: 'var(--text-muted)' }, children: "No tags available. Create tags first." })) : (_jsxs("div", { className: "space-y-2", children: [tags
                                            .filter(t => !config.tags?.some(ct => ct.id === t.id))
                                            .map(tag => (_jsxs("button", { onClick: () => {
                                                addTag(tag.id);
                                                setShowTagModal(false);
                                            }, className: "w-full flex items-center gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left", children: [_jsx("span", { className: "w-4 h-4 rounded-full", style: { backgroundColor: tag.color || '#e5e7eb' } }), _jsx("span", { style: { color: 'var(--text-primary)' }, children: tag.name })] }, tag.id))), tags.filter(t => !config.tags?.some(ct => ct.id === t.id)).length === 0 && (_jsx("p", { style: { color: 'var(--text-muted)' }, children: "All tags already assigned" }))] })) }), _jsx("div", { className: "p-6 border-t", style: { borderColor: 'var(--border-primary)' }, children: _jsx("button", { onClick: () => setShowTagModal(false), className: "btn-secondary w-full", children: "Close" }) })] }) })) })] }));
}
