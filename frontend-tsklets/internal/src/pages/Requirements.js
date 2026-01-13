import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/auth';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import MarkdownEditor from '../components/MarkdownEditor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
const statusColors = {
    draft: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600',
    brainstorm: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-yellow-500',
    solidified: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-500',
    approved: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500',
    in_development: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500',
    implemented: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500',
    cancelled: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
};
const priorityColors = [
    'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/30 dark:text-red-400', // P0
    'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400', // P1
    'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400', // P2
    'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400', // P3
    'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-700 dark:text-slate-300', // P4
];
export default function Requirements() {
    const { token } = useAuthStore();
    const [requirements, setRequirements] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRequirement, setNewRequirement] = useState({
        title: '',
        description: '',
        priority: 3,
    });
    useEffect(() => {
        fetchProducts();
    }, []);
    useEffect(() => {
        if (selectedProduct) {
            fetchRequirements();
        }
    }, [selectedProduct]);
    async function fetchProducts() {
        try {
            const res = await fetch('/api/products', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            const productsList = Array.isArray(data) ? data : [];
            setProducts(productsList);
            if (productsList.length > 0) {
                setSelectedProduct(productsList[0].id);
            }
        }
        catch (error) {
            console.error('Fetch products error:', error);
            toast.error('Failed to load products');
        }
    }
    async function fetchRequirements() {
        if (!selectedProduct)
            return;
        setLoading(true);
        try {
            const url = statusFilter === 'all'
                ? `/api/requirements?productId=${selectedProduct}`
                : `/api/requirements?productId=${selectedProduct}&status=${statusFilter}`;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setRequirements(data.requirements || []);
        }
        catch (error) {
            console.error('Fetch requirements error:', error);
            toast.error('Failed to load requirements');
        }
        finally {
            setLoading(false);
        }
    }
    async function handleCreateRequirement() {
        if (!newRequirement.title.trim()) {
            toast.error('Title is required');
            return;
        }
        try {
            const res = await fetch('/api/requirements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: selectedProduct,
                    title: newRequirement.title,
                    description: newRequirement.description,
                    priority: newRequirement.priority,
                    originalDraft: newRequirement.description, // Preserve original
                })
            });
            if (!res.ok)
                throw new Error('Failed to create requirement');
            const data = await res.json();
            toast.success(`Requirement ${data.requirement.issueKey} created!`);
            setShowCreateModal(false);
            setNewRequirement({ title: '', description: '', priority: 3 });
            fetchRequirements();
        }
        catch (error) {
            console.error('Create requirement error:', error);
            toast.error('Failed to create requirement');
        }
    }
    const filteredRequirements = requirements.filter(req => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (req.title?.toLowerCase().includes(query) ||
                req.description?.toLowerCase().includes(query) ||
                req.issueKey?.toLowerCase().includes(query));
        }
        return true;
    });
    // Group by status
    const groupedRequirements = {
        draft: [],
        brainstorm: [],
        solidified: [],
        approved: [],
        in_development: [],
        implemented: [],
        cancelled: [],
    };
    filteredRequirements.forEach(req => {
        groupedRequirements[req.status].push(req);
    });
    return (_jsxs("div", { className: "flex h-screen overflow-hidden", style: { backgroundColor: 'var(--bg-primary)' }, children: [_jsx(Toaster, { position: "top-right", richColors: true }), _jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-y-auto", children: _jsxs("div", { className: "max-w-7xl mx-auto p-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-4xl font-display font-bold bg-gradient-spark bg-clip-text text-transparent mb-2", children: [_jsx("span", { className: "inline-block animate-float", children: "\uD83D\uDCDD" }), " Requirements"] }), _jsx("p", { className: "text-lg", style: { color: 'var(--text-secondary)' }, children: "Capture, brainstorm, and solidify requirements with Claude" })] }), _jsxs(motion.button, { onClick: () => setShowCreateModal(true), className: "btn-primary flex items-center gap-2 relative overflow-hidden group", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, disabled: !selectedProduct, children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", children: "add" }), "New Requirement", _jsx("span", { className: "absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" })] })] }), _jsxs("div", { className: "flex gap-4 items-center flex-wrap", children: [_jsxs("select", { value: selectedProduct || '', onChange: (e) => setSelectedProduct(parseInt(e.target.value)), className: "px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all", style: { backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }, children: [_jsx("option", { value: "", children: "Select Product" }), products.map(product => (_jsx("option", { value: product.id, children: product.name }, product.id)))] }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all", style: { backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }, children: [_jsx("option", { value: "all", children: "All Statuses" }), _jsx("option", { value: "draft", children: "Draft" }), _jsx("option", { value: "brainstorm", children: "Brainstorm" }), _jsx("option", { value: "solidified", children: "Solidified" }), _jsx("option", { value: "approved", children: "Approved" }), _jsx("option", { value: "in_development", children: "In Development" }), _jsx("option", { value: "implemented", children: "Implemented" }), _jsx("option", { value: "cancelled", children: "Cancelled" })] }), _jsxs("div", { className: "flex-1 min-w-[200px] relative", children: [_jsx("input", { type: "text", placeholder: "Search requirements...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full px-4 py-2 pl-10 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all", style: { backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' } }), _jsx("span", { className: "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]", style: { color: 'var(--text-secondary)' }, children: "search" })] })] })] }), loading && (_jsx("div", { className: "text-center py-12", children: _jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }) })), !loading && !selectedProduct && (_jsxs("div", { className: "text-center py-12", children: [_jsx("span", { className: "material-symbols-outlined text-6xl mb-4", style: { color: 'var(--text-secondary)' }, children: "folder_open" }), _jsx("p", { className: "text-lg", style: { color: 'var(--text-secondary)' }, children: "Select a product to view requirements" })] })), !loading && selectedProduct && (_jsx("div", { className: "space-y-8", children: Object.keys(groupedRequirements).map(status => {
                                const reqs = groupedRequirements[status];
                                if (reqs.length === 0 && statusFilter !== 'all')
                                    return null;
                                return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 }, children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("h2", { className: "text-xl font-semibold capitalize", style: { color: 'var(--text-primary)' }, children: status.replace(/_/g, ' ') }), _jsx("span", { className: `px-3 py-1 rounded-full text-sm font-medium border ${statusColors[status]}`, children: reqs.length })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: _jsx(AnimatePresence, { children: reqs.map((req, index) => (_jsx(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, transition: { delay: index * 0.05 }, children: _jsx(Link, { to: `/requirements/${req.id}`, children: _jsxs(motion.div, { whileHover: { scale: 1.02, y: -4 }, transition: { duration: 0.2 }, className: "p-6 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer", style: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }, children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("span", { className: "text-xs font-mono font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300", children: req.issueKey }), _jsxs("span", { className: `text-xs font-bold px-2 py-1 rounded border ${priorityColors[req.priority]}`, children: ["P", req.priority] })] }), _jsx("h3", { className: "font-semibold text-lg mb-2 line-clamp-2", style: { color: 'var(--text-primary)' }, children: req.title }), req.description && (_jsx("div", { className: "text-sm mb-3 prose prose-sm max-w-none line-clamp-3 dark:prose-invert", style: { color: 'var(--text-secondary)' }, children: _jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: req.description }) })), _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [req.beadsEpicId && (_jsxs("span", { className: "text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-mono", children: ["Epic: ", req.beadsEpicId] })), req.labels && req.labels.length > 0 && (_jsx("span", { className: "text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", children: req.labels[0] }))] })] }) }) }, req.id))) }) }), reqs.length === 0 && statusFilter === 'all' && (_jsx("div", { className: "text-center py-8 rounded-lg border-2 border-dashed", style: { borderColor: 'var(--border-primary)' }, children: _jsx("p", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: "No requirements in this status" }) }))] }, status));
                            }) }))] }) }), _jsx(AnimatePresence, { children: showCreateModal && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", onClick: () => setShowCreateModal(false), children: _jsxs(motion.div, { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 }, className: "max-w-2xl w-full p-6 rounded-xl shadow-2xl", style: { backgroundColor: 'var(--bg-card)' }, onClick: (e) => e.stopPropagation(), children: [_jsx("h2", { className: "text-2xl font-bold mb-4 bg-gradient-spark bg-clip-text text-transparent", children: "Create New Requirement" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Title *" }), _jsx("input", { type: "text", value: newRequirement.title, onChange: (e) => setNewRequirement({ ...newRequirement, title: e.target.value }), className: "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50", style: { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }, placeholder: "Brief title for requirement" })] }), _jsx(MarkdownEditor, { value: newRequirement.description, onChange: (val) => setNewRequirement({ ...newRequirement, description: val }), label: "Description", placeholder: "Describe requirement in your own words. This will be preserved as original draft.", height: 128 }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Priority" }), _jsxs("select", { value: newRequirement.priority, onChange: (e) => setNewRequirement({ ...newRequirement, priority: parseInt(e.target.value) }), className: "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/50", style: { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }, children: [_jsx("option", { value: 0, children: "P0 - Critical" }), _jsx("option", { value: 1, children: "P1 - High" }), _jsx("option", { value: 2, children: "P2 - Medium" }), _jsx("option", { value: 3, children: "P3 - Normal" }), _jsx("option", { value: 4, children: "P4 - Low" })] })] })] }), _jsxs("div", { className: "flex gap-3 mt-6", children: [_jsx(motion.button, { onClick: handleCreateRequirement, className: "flex-1 btn-primary", whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, children: "Create Requirement" }), _jsx(motion.button, { onClick: () => setShowCreateModal(false), className: "px-6 py-2 rounded-lg border font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors", style: { borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }, whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, children: "Cancel" })] })] }) })) })] }));
}
