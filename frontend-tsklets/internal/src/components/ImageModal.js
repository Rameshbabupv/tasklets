import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
export default function ImageModal({ imageUrl, fileName, fileSize, onClose }) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden'; // Prevent background scroll
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);
    const formatFileSize = (bytes) => {
        if (!bytes)
            return '';
        if (bytes < 1024)
            return bytes + ' B';
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4", onClick: onClose, children: _jsxs("div", { className: "relative max-w-7xl max-h-[90vh] flex flex-col", children: [_jsx("button", { onClick: onClose, className: "absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors", children: _jsx("span", { className: "material-symbols-outlined text-[32px]", children: "close" }) }), _jsx("div", { className: "flex items-center justify-center", onClick: (e) => e.stopPropagation(), children: _jsx("img", { src: imageUrl, alt: fileName, className: "max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" }) }), _jsxs("div", { className: "mt-4 text-center text-white", children: [_jsx("p", { className: "text-sm font-medium", children: fileName }), fileSize && _jsx("p", { className: "text-xs text-slate-300 mt-1", children: formatFileSize(fileSize) })] })] }) }));
}
