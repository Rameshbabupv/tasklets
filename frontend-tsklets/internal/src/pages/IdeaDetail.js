import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
const statusOptions = [
    { value: 'inbox', label: 'Inbox', icon: 'inbox', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { value: 'discussing', label: 'Discussing', icon: 'forum', color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-500' },
    { value: 'vetted', label: 'Vetted', icon: 'verified', color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500' },
    { value: 'in_progress', label: 'In Progress', icon: 'pending', color: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-500' },
    { value: 'shipped', label: 'Shipped', icon: 'rocket_launch', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500' },
];
const reactionEmojis = {
    thumbs_up: '👍',
    heart: '❤️',
    fire: '🔥',
};
export default function IdeaDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuthStore();
    const [idea, setIdea] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    useEffect(() => {
        fetchIdea();
    }, [id]);
    async function fetchIdea() {
        try {
            const res = await fetch(`/api/ideas/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setIdea(data.idea);
        }
        catch (error) {
            console.error('Fetch idea error:', error);
            toast.error('Failed to load idea');
        }
        finally {
            setLoading(false);
        }
    }
    async function updateStatus(status) {
        try {
            const res = await fetch(`/api/ideas/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchIdea();
                toast.success(`Status updated to ${status.replace('_', ' ')}!`);
                // Celebration for shipped
                if (status === 'shipped') {
                    toast.success('🎉 Idea shipped! Amazing work!', {
                        duration: 5000,
                    });
                }
            }
        }
        catch (error) {
            console.error('Update status error:', error);
            toast.error('Failed to update status');
        }
    }
    async function updateVisibility(visibility) {
        try {
            const res = await fetch(`/api/ideas/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ visibility })
            });
            if (res.ok) {
                fetchIdea();
                toast.success(`Visibility updated to ${visibility}!`);
            }
        }
        catch (error) {
            console.error('Update visibility error:', error);
            toast.error('Failed to update visibility');
        }
    }
    async function addComment(e) {
        e.preventDefault();
        if (!commentText.trim())
            return;
        setSubmittingComment(true);
        try {
            const res = await fetch(`/api/ideas/${id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ comment: commentText })
            });
            if (res.ok) {
                setCommentText('');
                fetchIdea();
                toast.success('Comment added!');
            }
        }
        catch (error) {
            console.error('Add comment error:', error);
            toast.error('Failed to add comment');
        }
        finally {
            setSubmittingComment(false);
        }
    }
    async function toggleReaction(reaction) {
        try {
            await fetch(`/api/ideas/${id}/reactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ reaction })
            });
            fetchIdea();
        }
        catch (error) {
            console.error('Toggle reaction error:', error);
            toast.error('Failed to toggle reaction');
        }
    }
    if (loading) {
        return (_jsxs("div", { className: "flex h-screen", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsx(Toaster, { position: "top-right", richColors: true }), _jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "text-center", children: [_jsx("div", { className: "inline-block animate-float text-6xl mb-4", children: "\uD83D\uDCA1" }), _jsx("p", { className: "text-slate-500 text-lg", children: "Loading idea..." })] }) })] }));
    }
    if (!idea) {
        return (_jsxs("div", { className: "flex h-screen", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsx(Toaster, { position: "top-right", richColors: true }), _jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-slate-900 mb-4", children: "Idea not found" }), _jsx("button", { onClick: () => navigate('/ideas'), className: "btn-primary", children: "Back to Ideas" })] }) })] }));
    }
    const isCreator = user?.id === idea.createdBy;
    const isAdmin = user?.role === 'admin' || user?.isInternal;
    // Group reactions by type
    const reactionCounts = idea.reactions.reduce((acc, r) => {
        acc[r.reaction] = (acc[r.reaction] || 0) + 1;
        return acc;
    }, {});
    const userReactions = idea.reactions
        .filter(r => r.user.id === user?.id)
        .map(r => r.reaction);
    return (_jsxs("div", { className: "flex h-screen overflow-hidden", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsx(Toaster, { position: "top-right", richColors: true }), _jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-y-auto", children: _jsxs("div", { className: "max-w-4xl mx-auto p-8", children: [_jsxs(motion.button, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, onClick: () => navigate('/ideas'), className: "flex items-center gap-2 text-slate-600 hover:text-primary mb-6 transition-colors group", children: [_jsx("span", { className: "material-symbols-outlined group-hover:-translate-x-1 transition-transform", "aria-hidden": "true", children: "arrow_back" }), _jsx("span", { className: "font-medium", children: "Back to Ideas" })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden", children: [_jsxs("div", { className: "p-8 border-b border-slate-200 bg-gradient-to-br from-white to-purple-50/20", children: [_jsxs("div", { className: "flex items-start justify-between gap-4 mb-6", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h1", { className: "text-3xl font-display font-bold text-slate-900 mb-3", children: idea.title }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-slate-500", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", "aria-hidden": "true", children: "person" }), _jsx("span", { children: idea.creator.name })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", "aria-hidden": "true", children: "schedule" }), _jsx("span", { children: new Date(idea.createdAt).toLocaleDateString() })] })] })] }), (isCreator || isAdmin) && (_jsx(motion.button, { whileHover: { scale: 1.1, rotate: 5 }, whileTap: { scale: 0.9 }, className: "text-slate-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-purple-50", "aria-label": "Edit idea", children: _jsx("span", { className: "material-symbols-outlined", "aria-hidden": "true", children: "edit" }) }))] }), _jsx("div", { className: "flex items-center gap-2 overflow-x-auto pb-2", children: statusOptions.map((s, idx) => {
                                                const isActive = s.value === idea.status;
                                                const isPast = statusOptions.findIndex(x => x.value === idea.status) > idx;
                                                return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(motion.button, { onClick: () => isCreator || isAdmin ? updateStatus(s.value) : null, disabled: !isCreator && !isAdmin, className: `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${isActive
                                                                ? s.color + ' shadow-lg'
                                                                : isPast
                                                                    ? 'bg-slate-100 text-slate-400 border-slate-200'
                                                                    : 'bg-white text-slate-500 hover:bg-gradient-shimmer border-slate-200 hover:border-primary/30'} ${isCreator || isAdmin ? 'cursor-pointer' : 'cursor-default'}`, whileHover: isCreator || isAdmin ? { scale: 1.05 } : {}, whileTap: isCreator || isAdmin ? { scale: 0.95 } : {}, children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", "aria-hidden": "true", children: s.icon }), _jsx("span", { children: s.label })] }), idx < statusOptions.length - 1 && (_jsx("span", { className: "material-symbols-outlined text-slate-300", "aria-hidden": "true", children: "arrow_forward" }))] }, s.value));
                                            }) })] }), idea.description && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.2 }, className: "p-8 border-b border-slate-200", children: _jsx("p", { className: "text-slate-700 text-lg leading-relaxed whitespace-pre-wrap", children: idea.description }) })), _jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.3 }, className: "p-8 border-b border-slate-200 space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "visibility-select", className: "block text-sm font-bold text-slate-700 mb-3", children: "Visibility" }), _jsxs("select", { id: "visibility-select", value: idea.visibility, onChange: (e) => updateVisibility(e.target.value), disabled: !isCreator && !isAdmin, className: "input-field max-w-xs", children: [_jsx("option", { value: "private", children: "\uD83D\uDD12 Private (just me)" }), _jsx("option", { value: "team", children: "\uD83D\uDC65 Team (coming soon)" }), _jsx("option", { value: "public", children: "\uD83C\uDF10 Public (everyone)" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-bold text-slate-700 mb-3", children: "Reactions" }), _jsx("div", { className: "flex gap-3", children: Object.entries(reactionEmojis).map(([key, emoji]) => {
                                                        const count = reactionCounts[key] || 0;
                                                        const hasReacted = userReactions.includes(key);
                                                        return (_jsxs(motion.button, { onClick: () => toggleReaction(key), className: `flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-all ${hasReacted
                                                                ? 'border-primary bg-gradient-spark text-white shadow-lg shadow-primary/30'
                                                                : 'border-slate-200 hover:border-primary/50 hover:bg-gradient-shimmer'}`, whileHover: { scale: 1.05, y: -2 }, whileTap: { scale: 0.95 }, "aria-label": `${hasReacted ? 'Remove' : 'Add'} ${key} reaction`, children: [_jsx("span", { className: "text-2xl", children: emoji }), _jsx("span", { className: `font-bold text-lg ${hasReacted ? 'text-white' : 'text-slate-700'}`, children: count })] }, key));
                                                    }) })] })] }), _jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.4 }, className: "p-8", children: [_jsxs("h3", { className: "text-xl font-display font-bold text-slate-900 mb-6 flex items-center gap-2", children: [_jsx("span", { children: "\uD83D\uDCAC Comments" }), _jsxs("span", { className: "text-sm font-normal text-slate-500", children: ["(", idea.commentCount, ")"] })] }), _jsxs("form", { onSubmit: addComment, className: "mb-8", children: [_jsx("textarea", { value: commentText, onChange: (e) => setCommentText(e.target.value), placeholder: "Add your thoughts...", className: "input-field min-h-[120px] mb-3", rows: 4, "aria-label": "Add comment" }), _jsx(motion.button, { type: "submit", disabled: !commentText.trim() || submittingComment, className: "btn-primary disabled:opacity-50 disabled:cursor-not-allowed", whileHover: commentText.trim() && !submittingComment ? { scale: 1.05 } : {}, whileTap: commentText.trim() && !submittingComment ? { scale: 0.95 } : {}, children: submittingComment ? 'Posting...' : 'Post Comment' })] }), _jsx("div", { className: "space-y-4", children: _jsx(AnimatePresence, { children: idea.comments.length === 0 ? (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "text-center py-12 bg-gradient-to-br from-slate-50 to-purple-50/20 rounded-xl border border-slate-200", children: [_jsx("div", { className: "text-4xl mb-3", children: "\uD83D\uDCAC" }), _jsx("p", { className: "text-slate-500", children: "No comments yet. Be the first to share your thoughts!" })] })) : (idea.comments.map((comment, i) => (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: i * 0.05 }, className: "bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("div", { className: "size-10 rounded-full bg-gradient-spark flex items-center justify-center text-white text-lg font-bold shadow-md", children: comment.user.name.charAt(0) }), _jsxs("div", { children: [_jsx("div", { className: "font-bold text-slate-900", children: comment.user.name }), _jsx("div", { className: "text-xs text-slate-500", children: new Date(comment.createdAt).toLocaleString() })] })] }), _jsx("p", { className: "text-slate-700 leading-relaxed whitespace-pre-wrap", children: comment.comment })] }, comment.id)))) }) })] })] })] }) })] }));
}
