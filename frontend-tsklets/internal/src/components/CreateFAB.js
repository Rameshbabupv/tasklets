import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { useCreateHub } from '../store/createHub';
import { useEffect } from 'react';
export default function CreateFAB() {
    const { open } = useCreateHub();
    // Keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                open();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open]);
    return (_jsxs(motion.div, { className: "fixed bottom-8 right-8 z-50 group", initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }, children: [_jsxs(motion.button, { onClick: () => open(), className: "relative size-16 rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-blue-600 text-white shadow-2xl overflow-hidden", whileHover: { scale: 1.1, rotate: 5 }, whileTap: { scale: 0.95 }, children: [_jsx(motion.div, { className: "absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0", animate: {
                            x: ['-200%', '200%'],
                        }, transition: {
                            duration: 3,
                            repeat: Infinity,
                            repeatType: 'loop',
                            ease: 'linear'
                        } }), _jsx(motion.div, { className: "relative z-10 flex items-center justify-center h-full", whileHover: { rotate: 90 }, transition: { duration: 0.3 }, children: _jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", children: _jsx("path", { d: "M12 5v14M5 12h14" }) }) }), _jsx(motion.div, { className: "absolute inset-0 rounded-2xl border-2 border-fuchsia-400", animate: {
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0, 0.5],
                        }, transition: {
                            duration: 2,
                            repeat: Infinity,
                            repeatType: 'loop'
                        } })] }), _jsxs(motion.div, { className: "absolute bottom-full right-0 mb-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-mono rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none", initial: { y: 10, opacity: 0 }, children: [_jsx("span", { className: "text-slate-400", children: "Press" }), ' ', _jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-800 rounded", children: "\u2318K" }), ' ', _jsx("span", { className: "text-slate-400", children: "to create" }), _jsx("div", { className: "absolute top-full right-4 -mt-px", children: _jsx("div", { className: "border-4 border-transparent border-t-slate-900" }) })] })] }));
}
