import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/auth';
import ProductModal from '../components/ProductModal';
export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem('products-view-mode') || 'card';
    });
    const { token } = useAuthStore();
    const toggleViewMode = (mode) => {
        setViewMode(mode);
        localStorage.setItem('products-view-mode', mode);
    };
    const surfaceStyles = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' };
    const textPrimary = { color: 'var(--text-primary)' };
    const textSecondary = { color: 'var(--text-secondary)' };
    const textMuted = { color: 'var(--text-muted)' };
    useEffect(() => {
        fetchProducts();
    }, []);
    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setProducts(data);
        }
        catch (err) {
            console.error('Failed to fetch products', err);
        }
        finally {
            setLoading(false);
        }
    };
    const openAddModal = () => {
        setEditingProduct(null);
        setShowModal(true);
    };
    const openEditModal = (product) => {
        setEditingProduct(product);
        setShowModal(true);
    };
    const handleModalClose = () => {
        setShowModal(false);
        setEditingProduct(null);
    };
    const handleModalSave = () => {
        fetchProducts();
    };
    return (_jsxs("div", { className: "h-screen flex overflow-hidden", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsx(Sidebar, {}), _jsxs("main", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsxs("header", { className: "h-16 px-6 border-b flex items-center justify-between shrink-0", style: surfaceStyles, children: [_jsx("h2", { className: "text-lg font-bold", style: textPrimary, children: "Products" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex rounded-lg border", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("button", { onClick: () => toggleViewMode('card'), className: `p-2 transition-colors ${viewMode === 'card' ? 'bg-primary text-white' : ''}`, style: viewMode !== 'card' ? textMuted : {}, title: "Card view", children: _jsx("span", { className: "material-symbols-outlined text-[20px]", children: "grid_view" }) }), _jsx("button", { onClick: () => toggleViewMode('list'), className: `p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : ''}`, style: viewMode !== 'list' ? textMuted : {}, title: "List view", children: _jsx("span", { className: "material-symbols-outlined text-[20px]", children: "view_list" }) })] }), _jsxs("button", { onClick: openAddModal, className: "flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "add" }), "Add Product"] })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: loading ? (_jsx("div", { className: "flex items-center justify-center h-full", style: textSecondary, children: "Loading..." })) : products.length === 0 ? (_jsx("div", { className: "text-center py-12", style: textMuted, children: "No products found. Click \"Add Product\" to create one." })) : viewMode === 'card' ? (
                        /* Card View */
                        _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: products.map((product) => (_jsxs("div", { className: "rounded-xl border p-5 hover:shadow-lg hover:border-primary/30 transition-all group", style: surfaceStyles, children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("div", { className: "size-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-primary", children: _jsx("span", { className: "material-symbols-outlined", children: "inventory_2" }) }), _jsx("button", { onClick: () => openEditModal(product), className: "hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity", style: textMuted, children: _jsx("span", { className: "material-symbols-outlined text-[20px]", children: "edit" }) })] }), _jsx("h3", { className: "font-semibold mb-1", style: textPrimary, children: product.name }), _jsx("p", { className: "text-sm line-clamp-2 mb-3", style: textSecondary, children: product.description || 'No description' }), _jsxs(Link, { to: `/products/${product.id}/dashboard`, className: "flex items-center justify-center gap-2 w-full px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: "dashboard" }), "View Dashboard"] })] }, product.id))) })) : (
                        /* List View */
                        _jsx("div", { className: "rounded-xl border overflow-hidden", style: surfaceStyles, children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("th", { className: "text-left px-4 py-3 text-sm font-semibold", style: textSecondary, children: "Product" }), _jsx("th", { className: "text-left px-4 py-3 text-sm font-semibold hidden md:table-cell", style: textSecondary, children: "Description" }), _jsx("th", { className: "text-right px-4 py-3 text-sm font-semibold", style: textSecondary, children: "Actions" })] }) }), _jsx("tbody", { children: products.map((product) => (_jsxs("tr", { className: "border-b last:border-b-0 hover:bg-primary/5 transition-colors group", style: { borderColor: 'var(--border-primary)' }, children: [_jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "size-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-primary shrink-0", children: _jsx("span", { className: "material-symbols-outlined text-[18px]", children: "inventory_2" }) }), _jsx("span", { className: "font-medium", style: textPrimary, children: product.name })] }) }), _jsx("td", { className: "px-4 py-3 hidden md:table-cell", children: _jsx("p", { className: "text-sm line-clamp-1", style: textSecondary, children: product.description || 'No description' }) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("button", { onClick: () => openEditModal(product), className: "p-1.5 rounded hover:bg-primary/10 transition-colors", style: textMuted, title: "Edit", children: _jsx("span", { className: "material-symbols-outlined text-[18px]", children: "edit" }) }), _jsxs(Link, { to: `/products/${product.id}/dashboard`, className: "flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors", children: [_jsx("span", { className: "material-symbols-outlined text-[16px]", children: "dashboard" }), "Dashboard"] })] }) })] }, product.id))) })] }) })) })] }), showModal && (_jsx(ProductModal, { product: editingProduct, onClose: handleModalClose, onSave: handleModalSave }))] }));
}
