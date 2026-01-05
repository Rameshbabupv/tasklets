import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '../store/auth';
import ImageModal from './ImageModal';
export default function NewTicketModal({ isOpen, onClose }) {
    const { token, user } = useAuthStore();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [modalImage, setModalImage] = useState(null);
    const [form, setForm] = useState({
        title: '',
        description: '',
        productId: 0,
        type: 'support',
        clientPriority: 3,
        clientSeverity: 3,
    });
    const isCompanyAdmin = user?.role === 'company_admin';
    useEffect(() => {
        if (!isOpen)
            return;
        const fetchProducts = async () => {
            if (!user?.id || !user?.tenantId || !token)
                return;
            try {
                // First try to fetch user's assigned products
                const userProductsRes = await fetch(`/api/users/${user.id}/products`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (userProductsRes.ok) {
                    const userProducts = await userProductsRes.json();
                    // If user has assigned products, use those
                    if (userProducts.length > 0) {
                        setProducts(userProducts);
                        // If only 1 product, auto-select it
                        if (userProducts.length === 1) {
                            setForm((prev) => ({ ...prev, productId: userProducts[0].id }));
                        }
                        setLoadingProducts(false);
                        return;
                    }
                }
                // Fallback: fetch all tenant products if user has no assigned products
                const res = await fetch(`/api/products/tenant/${user.tenantId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok)
                    throw new Error('Failed to fetch products');
                const data = await res.json();
                setProducts(data);
            }
            catch (err) {
                console.error('Failed to fetch products:', err);
                toast.error('Failed to load products');
            }
            finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
    }, [isOpen, user?.id, user?.tenantId, token]);
    // Create and cleanup preview URLs
    useEffect(() => {
        const urls = selectedFiles.map((file) => URL.createObjectURL(file));
        setPreviewUrls(urls);
        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [selectedFiles]);
    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setForm({
                title: '',
                description: '',
                productId: products.length === 1 ? products[0].id : 0,
                type: 'support',
                clientPriority: 3,
                clientSeverity: 3,
            });
            setSelectedFiles([]);
            setPreviewUrls([]);
        }
    }, [isOpen, products]);
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter((file) => {
            const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
            const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
            const validTypes = [...imageTypes, ...videoTypes];
            const isVideo = videoTypes.includes(file.type);
            if (!validTypes.includes(file.type)) {
                toast.error(`${file.name}: Invalid file type. Only images and videos are allowed.`);
                return false;
            }
            // 50MB limit for videos, 5MB for images
            const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
            if (file.size > maxSize) {
                toast.error(`${file.name}: File too large. Maximum ${isVideo ? '50MB' : '5MB'}.`);
                return false;
            }
            return true;
        });
        if (selectedFiles.length + validFiles.length > 5) {
            toast.error('Maximum 5 files allowed');
            return;
        }
        setSelectedFiles([...selectedFiles, ...validFiles]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    const handleRemoveFile = (index) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    };
    const formatFileSize = (bytes) => {
        if (bytes < 1024)
            return bytes + ' B';
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.productId || form.productId === 0) {
            toast.error('Please select a product');
            return;
        }
        setLoading(true);
        try {
            // Step 1: Create ticket
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });
            if (!res.ok)
                throw new Error('Failed to create ticket');
            const data = await res.json();
            const ticketId = data.ticket.id;
            // Step 2: Upload files if any
            if (selectedFiles.length > 0) {
                const formData = new FormData();
                selectedFiles.forEach((file) => {
                    formData.append('files', file);
                });
                const uploadRes = await fetch(`/api/tickets/${ticketId}/attachments`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });
                if (!uploadRes.ok) {
                    console.error('Failed to upload attachments');
                    toast.warning('Ticket created but some attachments failed to upload');
                }
            }
            toast.success('🎫 Ticket created successfully!');
            onClose();
            navigate(`/tickets/${ticketId}`);
        }
        catch (err) {
            console.error('Failed to create ticket:', err);
            toast.error('Failed to create ticket. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(AnimatePresence, { children: isOpen && (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: onClose, className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50" }), _jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 20 }, transition: { type: 'spring', duration: 0.3 }, style: { backgroundColor: 'var(--bg-card)' }, className: "rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col", children: [_jsx("div", { style: { borderBottomColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }, className: "px-6 py-4 border-b bg-gradient-to-r from-white to-purple-50/30", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `size-10 rounded-xl text-white flex items-center justify-center shadow-lg ${form.type === 'feature_request'
                                                                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                                                : 'bg-gradient-to-br from-primary to-purple-600'}`, children: _jsx("span", { className: "material-symbols-outlined text-xl", "aria-hidden": "true", children: form.type === 'feature_request' ? 'lightbulb' : 'confirmation_number' }) }), _jsxs("div", { children: [_jsx("h2", { className: `text-xl font-bold bg-clip-text text-transparent ${form.type === 'feature_request'
                                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                                                        : 'bg-gradient-to-r from-primary to-purple-600'}`, children: form.type === 'feature_request' ? 'New Feature Request' : 'New Support Ticket' }), _jsx("p", { style: { color: 'var(--text-secondary)' }, className: "text-sm", children: form.type === 'feature_request' ? 'Submit a new idea or enhancement' : 'Submit a new issue to our team' })] })] }), _jsx(motion.button, { onClick: onClose, whileHover: { scale: 1.1, rotate: 90 }, whileTap: { scale: 0.9 }, style: { color: 'var(--text-muted)' }, className: "p-2 hover:bg-slate-100 rounded-lg transition-colors", "aria-label": "Close", children: _jsx("span", { className: "material-symbols-outlined", "aria-hidden": "true", children: "close" }) })] }) }), _jsx("div", { className: "flex-1 overflow-y-auto px-6 py-6", children: _jsxs("form", { onSubmit: handleSubmit, id: "new-ticket-form", className: "space-y-6", children: [isCompanyAdmin && (_jsxs("div", { children: [_jsx("label", { htmlFor: "type", style: { color: 'var(--text-secondary)' }, className: "block text-sm font-semibold mb-2", children: "Ticket Type *" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("button", { type: "button", onClick: () => setForm({ ...form, type: 'support' }), className: `flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${form.type === 'support'
                                                                        ? 'border-primary bg-primary/5'
                                                                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'}`, children: [_jsx("div", { className: `size-10 rounded-lg flex items-center justify-center ${form.type === 'support'
                                                                                ? 'bg-gradient-to-br from-primary to-purple-600 text-white'
                                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`, children: _jsx("span", { className: "material-symbols-outlined", children: "confirmation_number" }) }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: `font-semibold ${form.type === 'support' ? 'text-primary' : ''}`, style: { color: form.type === 'support' ? undefined : 'var(--text-primary)' }, children: "Support" }), _jsx("p", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: "Report an issue" })] })] }), _jsxs("button", { type: "button", onClick: () => setForm({ ...form, type: 'feature_request' }), className: `flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${form.type === 'feature_request'
                                                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'}`, children: [_jsx("div", { className: `size-10 rounded-lg flex items-center justify-center ${form.type === 'feature_request'
                                                                                ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`, children: _jsx("span", { className: "material-symbols-outlined", children: "lightbulb" }) }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: `font-semibold ${form.type === 'feature_request' ? 'text-green-600' : ''}`, style: { color: form.type === 'feature_request' ? undefined : 'var(--text-primary)' }, children: "Feature Request" }), _jsx("p", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: "Suggest an idea" })] })] })] })] })), _jsxs("div", { children: [_jsx("label", { htmlFor: "title", style: { color: 'var(--text-secondary)' }, className: "block text-sm font-semibold mb-2", children: "Subject *" }), _jsx("input", { id: "title", type: "text", value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }), placeholder: form.type === 'feature_request' ? 'Briefly describe your feature idea' : 'Briefly summarize the issue (e.g. Login page timeout)', required: true, style: {
                                                                color: 'var(--text-primary)',
                                                                backgroundColor: 'var(--bg-card)',
                                                                borderColor: 'var(--border-primary)'
                                                            }, className: "block w-full rounded-lg border-0 py-3 px-4 ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-primary text-sm" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", style: { color: 'var(--text-secondary)' }, className: "block text-sm font-semibold mb-2", children: "Description" }), _jsx("textarea", { id: "description", value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }), placeholder: "Please provide detailed steps to reproduce the issue...", rows: 5, style: {
                                                                color: 'var(--text-primary)',
                                                                backgroundColor: 'var(--bg-card)',
                                                                borderColor: 'var(--border-primary)'
                                                            }, className: "block w-full rounded-lg border-0 py-3 px-4 ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-primary text-sm" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "product", style: { color: 'var(--text-secondary)' }, className: "block text-sm font-semibold mb-2", children: "Product *" }), loadingProducts ? (_jsx("div", { style: { color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }, className: "block w-full rounded-lg border-0 py-3 px-4 ring-1 ring-inset text-sm", children: "Loading products..." })) : products.length === 0 ? (_jsx("div", { className: "block w-full rounded-lg border-0 py-3 px-4 text-red-600 ring-1 ring-inset ring-red-300 bg-red-50 text-sm", children: "No products available. Please contact support." })) : (_jsxs("select", { id: "product", value: form.productId, onChange: (e) => setForm({ ...form, productId: parseInt(e.target.value) }), required: true, disabled: products.length === 1, style: {
                                                                color: 'var(--text-primary)',
                                                                backgroundColor: products.length === 1 ? 'var(--bg-tertiary)' : 'var(--bg-card)',
                                                                borderColor: 'var(--border-primary)'
                                                            }, className: `block w-full rounded-lg border-0 py-3 px-4 ring-1 ring-inset focus:ring-2 focus:ring-primary text-sm ${products.length === 1 ? 'cursor-not-allowed' : ''}`, children: [_jsx("option", { value: 0, children: "Select a product..." }), products.map((product) => (_jsxs("option", { value: product.id, children: [product.name, " ", product.description ? `- ${product.description}` : ''] }, product.id)))] })), products.length === 1 && (_jsx("p", { style: { color: 'var(--text-secondary)' }, className: "text-xs mt-1", children: "\u2139\uFE0F Auto-selected based on your account" }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "priority", style: { color: 'var(--text-secondary)' }, className: "block text-sm font-semibold mb-2", children: "Priority" }), _jsxs("select", { id: "priority", value: form.clientPriority, onChange: (e) => setForm({ ...form, clientPriority: parseInt(e.target.value) }), style: {
                                                                        color: 'var(--text-primary)',
                                                                        backgroundColor: 'var(--bg-card)',
                                                                        borderColor: 'var(--border-primary)'
                                                                    }, className: "block w-full rounded-lg border-0 py-3 px-4 ring-1 ring-inset focus:ring-2 focus:ring-primary text-sm", children: [_jsx("option", { value: 1, children: "P1 - Critical" }), _jsx("option", { value: 2, children: "P2 - High" }), _jsx("option", { value: 3, children: "P3 - Medium" }), _jsx("option", { value: 4, children: "P4 - Low" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "severity", style: { color: 'var(--text-secondary)' }, className: "block text-sm font-semibold mb-2", children: "Severity" }), _jsxs("select", { id: "severity", value: form.clientSeverity, onChange: (e) => setForm({ ...form, clientSeverity: parseInt(e.target.value) }), style: {
                                                                        color: 'var(--text-primary)',
                                                                        backgroundColor: 'var(--bg-card)',
                                                                        borderColor: 'var(--border-primary)'
                                                                    }, className: "block w-full rounded-lg border-0 py-3 px-4 ring-1 ring-inset focus:ring-2 focus:ring-primary text-sm", children: [_jsx("option", { value: 1, children: "S1 - Critical" }), _jsx("option", { value: 2, children: "S2 - Major" }), _jsx("option", { value: 3, children: "S3 - Minor" }), _jsx("option", { value: 4, children: "S4 - Cosmetic" })] })] })] }), _jsxs("div", { children: [_jsx("label", { style: { color: 'var(--text-secondary)' }, className: "block text-sm font-semibold mb-2", children: "Attachments" }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/jpeg,image/png,image/gif,image/svg+xml,video/mp4,video/webm,video/quicktime,.mov,.avi,.wmv", multiple: true, onChange: handleFileSelect, className: "hidden" }), _jsxs("div", { onClick: () => fileInputRef.current?.click(), style: { borderColor: 'var(--border-primary)' }, className: "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-slate-50 transition-all", children: [_jsx("span", { style: { color: 'var(--text-muted)' }, className: "material-symbols-outlined text-3xl mb-2", "aria-hidden": "true", children: "cloud_upload" }), _jsx("p", { style: { color: 'var(--text-secondary)' }, className: "text-sm font-medium", children: "Click to upload images or videos" }), _jsx("p", { style: { color: 'var(--text-muted)' }, className: "text-xs", children: "Images: 5MB max | Videos: 50MB max (5 files total)" })] }), selectedFiles.length > 0 && (_jsx("div", { className: "mt-4 grid grid-cols-3 gap-3", children: selectedFiles.map((file, index) => {
                                                                const isVideo = file.type.startsWith('video/');
                                                                return (_jsxs("div", { className: "relative group", children: [_jsx("div", { onClick: () => !isVideo && setModalImage({ url: previewUrls[index], name: file.name, size: file.size }), style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }, className: `aspect-square rounded-lg overflow-hidden border-2 ${isVideo ? '' : 'cursor-pointer hover:border-primary'} transition-colors`, children: isVideo ? (_jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700", children: [_jsx("span", { className: "material-symbols-outlined text-3xl text-slate-500 mb-1", children: "videocam" }), _jsx("span", { className: "text-xs text-slate-500", children: "Video" })] })) : (_jsx("img", { src: previewUrls[index], alt: file.name, className: "w-full h-full object-cover" })) }), _jsx("button", { type: "button", onClick: () => handleRemoveFile(index), className: "absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors", children: _jsx("span", { className: "material-symbols-outlined text-[14px]", "aria-hidden": "true", children: "close" }) }), _jsx("p", { style: { color: 'var(--text-secondary)' }, className: "text-xs truncate mt-1", title: file.name, children: file.name }), _jsx("p", { style: { color: 'var(--text-muted)' }, className: "text-xs", children: formatFileSize(file.size) })] }, index));
                                                            }) }))] })] }) }), _jsxs("div", { style: { borderTopColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }, className: "px-6 py-4 border-t flex items-center justify-end gap-3", children: [_jsx(motion.button, { type: "button", onClick: onClose, whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, style: { color: 'var(--text-secondary)' }, className: "px-4 py-2.5 text-sm font-semibold hover:bg-white rounded-lg transition-colors", children: "Cancel" }), _jsxs(motion.button, { type: "submit", form: "new-ticket-form", disabled: loading, whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, className: `inline-flex items-center gap-2 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 ${form.type === 'feature_request'
                                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                                    : 'bg-gradient-to-r from-primary to-purple-600'}`, children: [_jsx("span", { className: "material-symbols-outlined text-lg", "aria-hidden": "true", children: form.type === 'feature_request' ? 'lightbulb' : 'send' }), loading ? 'Submitting...' : (form.type === 'feature_request' ? 'Submit Request' : 'Submit Ticket')] })] })] }) })] })) }), modalImage && (_jsx(ImageModal, { imageUrl: modalImage.url, fileName: modalImage.name, fileSize: modalImage.size, onClose: () => setModalImage(null) }))] }));
}
