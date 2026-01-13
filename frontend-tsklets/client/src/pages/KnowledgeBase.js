import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// Category data
const categories = [
    {
        id: 'getting-started',
        icon: 'rocket_launch',
        title: 'Getting Started',
        description: 'New here? Learn the basics and get up to speed quickly.',
        articles: 8,
        gradient: 'from-emerald-500 to-teal-600',
        bgGlow: 'bg-emerald-500/20',
    },
    {
        id: 'tickets',
        icon: 'confirmation_number',
        title: 'Tickets & Support',
        description: 'Create, track, and manage your support requests.',
        articles: 12,
        gradient: 'from-blue-500 to-indigo-600',
        bgGlow: 'bg-blue-500/20',
    },
    {
        id: 'account',
        icon: 'person',
        title: 'Account & Security',
        description: 'Manage your profile, password, and security settings.',
        articles: 6,
        gradient: 'from-violet-500 to-purple-600',
        bgGlow: 'bg-violet-500/20',
    },
    {
        id: 'integrations',
        icon: 'hub',
        title: 'Integrations',
        description: 'Connect with your favorite tools and services.',
        articles: 4,
        gradient: 'from-orange-500 to-red-600',
        bgGlow: 'bg-orange-500/20',
    },
    {
        id: 'billing',
        icon: 'payments',
        title: 'Billing & Plans',
        description: 'Understand your subscription and payment options.',
        articles: 5,
        gradient: 'from-pink-500 to-rose-600',
        bgGlow: 'bg-pink-500/20',
    },
    {
        id: 'troubleshooting',
        icon: 'build',
        title: 'Troubleshooting',
        description: 'Common issues and how to resolve them fast.',
        articles: 15,
        gradient: 'from-amber-500 to-orange-600',
        bgGlow: 'bg-amber-500/20',
    },
];
// Popular articles
const popularArticles = [
    {
        id: 1,
        title: 'How to Create Your First Support Ticket',
        category: 'Getting Started',
        readTime: '3 min read',
        views: 2847,
        featured: true,
    },
    {
        id: 2,
        title: 'Understanding Ticket Priority Levels',
        category: 'Tickets & Support',
        readTime: '4 min read',
        views: 1923,
    },
    {
        id: 3,
        title: 'Setting Up Two-Factor Authentication',
        category: 'Account & Security',
        readTime: '2 min read',
        views: 1654,
    },
    {
        id: 4,
        title: 'Tracking Your Ticket Status',
        category: 'Tickets & Support',
        readTime: '3 min read',
        views: 1432,
    },
    {
        id: 5,
        title: 'How to Upload Attachments',
        category: 'Getting Started',
        readTime: '2 min read',
        views: 1287,
    },
];
// FAQ data
const faqs = [
    {
        question: 'How quickly will I receive a response to my ticket?',
        answer: 'Our support team typically responds within 2-4 business hours for standard priority tickets. Critical issues are addressed within 1 hour. You\'ll receive email notifications for all updates.',
    },
    {
        question: 'Can I update a ticket after submitting it?',
        answer: 'Yes! You can add comments, upload additional attachments, and update the priority of your ticket at any time. Simply open the ticket from your dashboard and use the comment section.',
    },
    {
        question: 'How do I escalate an urgent issue?',
        answer: 'When creating a ticket, select "Critical" as the priority level. This ensures your issue is flagged for immediate attention. For existing tickets, you can update the priority from the ticket detail page.',
    },
    {
        question: 'What file types can I attach to tickets?',
        answer: 'We support most common file types including images (PNG, JPG, GIF), documents (PDF, DOC, DOCX), spreadsheets (XLS, XLSX), and text files. Maximum file size is 25MB per attachment.',
    },
    {
        question: 'How do I invite team members to my organization?',
        answer: 'If you\'re a Company Admin, navigate to User Management from your dashboard. Click "Add User" to invite new team members. They\'ll receive an email invitation to set up their account.',
    },
];
export default function KnowledgeBase() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);
    const filteredCategories = categories.filter((cat) => cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return (_jsxs("div", { className: "min-h-screen", style: { backgroundColor: 'var(--bg-secondary)' }, children: [_jsxs("section", { className: "relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 opacity-40 dark:opacity-20", children: _jsx("div", { className: "absolute inset-0", style: {
                                backgroundImage: `radial-gradient(circle at 1px 1px, var(--border-primary) 1px, transparent 0)`,
                                backgroundSize: '40px 40px',
                            } }) }), _jsx(motion.div, { animate: {
                            x: [0, 30, 0],
                            y: [0, -20, 0],
                        }, transition: { duration: 8, repeat: Infinity, ease: "easeInOut" }, className: "absolute top-20 left-1/4 w-72 h-72 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-full blur-3xl" }), _jsx(motion.div, { animate: {
                            x: [0, -20, 0],
                            y: [0, 30, 0],
                        }, transition: { duration: 10, repeat: Infinity, ease: "easeInOut" }, className: "absolute top-40 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" }), _jsx("div", { className: "relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32", children: _jsxs(motion.div, { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, className: "text-center max-w-3xl mx-auto", children: [_jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 0.1 }, className: "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 mb-6", children: [_jsx("span", { className: "material-symbols-outlined text-primary text-lg", children: "auto_awesome" }), _jsx("span", { className: "text-sm font-semibold text-primary", children: "Help Center" })] }), _jsxs("h1", { className: "text-4xl md:text-6xl font-black mb-6 tracking-tight", style: { color: 'var(--text-primary)' }, children: ["How can we", ' ', _jsx("span", { className: "bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent", children: "help you" }), "?"] }), _jsx("p", { className: "text-lg md:text-xl mb-10", style: { color: 'var(--text-secondary)' }, children: "Find answers, learn best practices, and get the most out of Support Desk." }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 }, className: `relative max-w-2xl mx-auto transition-all duration-300 ${searchFocused ? 'scale-105' : ''}`, children: [_jsx("div", { className: `absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-2xl blur transition-opacity duration-300 ${searchFocused ? 'opacity-50' : 'opacity-0'}` }), _jsxs("div", { className: "relative flex items-center rounded-xl overflow-hidden shadow-2xl", style: { backgroundColor: 'var(--bg-card)' }, children: [_jsx("span", { className: "material-symbols-outlined text-2xl ml-5", style: { color: 'var(--text-muted)' }, children: "search" }), _jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), onFocus: () => setSearchFocused(true), onBlur: () => setSearchFocused(false), placeholder: "Search for articles, tutorials, guides...", className: "flex-1 px-4 py-5 text-lg bg-transparent outline-none", style: { color: 'var(--text-primary)' } }), _jsx("button", { className: "m-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity", children: "Search" })] }), _jsxs("div", { className: "flex flex-wrap items-center justify-center gap-2 mt-4", children: [_jsx("span", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: "Popular:" }), ['create ticket', 'reset password', 'attachments'].map((term) => (_jsx("button", { onClick: () => setSearchQuery(term), className: "px-3 py-1 text-sm rounded-full border hover:border-primary hover:text-primary transition-colors", style: {
                                                        color: 'var(--text-secondary)',
                                                        borderColor: 'var(--border-primary)',
                                                    }, children: term }, term)))] })] })] }) })] }), _jsxs("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, className: "text-center mb-12", children: [_jsx("h2", { className: "text-3xl font-bold mb-4", style: { color: 'var(--text-primary)' }, children: "Browse by Category" }), _jsx("p", { style: { color: 'var(--text-secondary)' }, children: "Find what you need, organized by topic" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredCategories.map((category, index) => (_jsx(motion.div, { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: index * 0.1 }, whileHover: { y: -8, scale: 1.02 }, className: "group relative", children: _jsxs("div", { className: "relative overflow-hidden rounded-2xl border p-6 h-full transition-all duration-300 hover:shadow-2xl", style: {
                                    backgroundColor: 'var(--bg-card)',
                                    borderColor: 'var(--border-primary)',
                                }, children: [_jsx("div", { className: `absolute -top-20 -right-20 w-40 h-40 ${category.bgGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500` }), _jsx("div", { className: `relative w-14 h-14 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-4 shadow-lg`, children: _jsx("span", { className: "material-symbols-outlined text-white text-2xl", children: category.icon }) }), _jsx("h3", { className: "text-xl font-bold mb-2 group-hover:text-primary transition-colors", style: { color: 'var(--text-primary)' }, children: category.title }), _jsx("p", { className: "text-sm mb-4", style: { color: 'var(--text-secondary)' }, children: category.description }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-sm font-medium", style: { color: 'var(--text-muted)' }, children: [category.articles, " articles"] }), _jsx("span", { className: "material-symbols-outlined text-slate-300 group-hover:text-primary group-hover:translate-x-2 transition-all", children: "arrow_forward" })] })] }) }, category.id))) })] }), _jsxs("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, className: "flex items-center justify-between mb-12", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold mb-2", style: { color: 'var(--text-primary)' }, children: "Popular Articles" }), _jsx("p", { style: { color: 'var(--text-secondary)' }, children: "Most viewed by our community" })] }), _jsxs("button", { className: "hidden md:flex items-center gap-2 text-primary hover:text-purple-600 font-semibold group", children: ["View all articles", _jsx("span", { className: "material-symbols-outlined group-hover:translate-x-1 transition-transform", children: "arrow_forward" })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx(motion.div, { initial: { opacity: 0, x: -30 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, whileHover: { scale: 1.02 }, className: "lg:row-span-2", children: _jsxs("div", { className: "relative overflow-hidden rounded-2xl border h-full p-8 flex flex-col justify-end min-h-[400px] group cursor-pointer", style: {
                                        backgroundColor: 'var(--bg-card)',
                                        borderColor: 'var(--border-primary)',
                                    }, children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/10" }), _jsx("div", { className: "absolute top-8 right-8 w-32 h-32 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-2xl" }), _jsx("div", { className: "absolute top-8 right-8", children: _jsx("span", { className: "material-symbols-outlined text-8xl text-primary/10 group-hover:text-primary/20 transition-colors", children: "menu_book" }) }), _jsxs("div", { className: "relative", children: [_jsxs("span", { className: "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "star" }), "Featured"] }), _jsx("h3", { className: "text-2xl font-bold mb-3 group-hover:text-primary transition-colors", style: { color: 'var(--text-primary)' }, children: popularArticles[0].title }), _jsx("p", { className: "text-sm mb-4", style: { color: 'var(--text-secondary)' }, children: "Everything you need to know to get started with creating and managing support tickets effectively." }), _jsxs("div", { className: "flex items-center gap-4 text-sm", style: { color: 'var(--text-muted)' }, children: [_jsx("span", { children: popularArticles[0].readTime }), _jsx("span", { children: "\u2022" }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "material-symbols-outlined text-sm", children: "visibility" }), popularArticles[0].views.toLocaleString(), " views"] })] })] })] }) }), _jsx("div", { className: "space-y-4", children: popularArticles.slice(1).map((article, index) => (_jsx(motion.div, { initial: { opacity: 0, x: 30 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { delay: index * 0.1 }, whileHover: { x: 8 }, className: "group cursor-pointer", children: _jsxs("div", { className: "flex items-center gap-4 p-4 rounded-xl border hover:border-primary/50 transition-all", style: {
                                            backgroundColor: 'var(--bg-card)',
                                            borderColor: 'var(--border-primary)',
                                        }, children: [_jsx("div", { className: "flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center font-bold text-slate-500 dark:text-slate-300", children: index + 2 }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: "font-semibold mb-1 group-hover:text-primary transition-colors truncate", style: { color: 'var(--text-primary)' }, children: article.title }), _jsxs("div", { className: "flex items-center gap-3 text-xs", style: { color: 'var(--text-muted)' }, children: [_jsx("span", { className: "px-2 py-0.5 rounded-full", style: { backgroundColor: 'var(--bg-tertiary)' }, children: article.category }), _jsx("span", { children: article.readTime })] })] }), _jsx("span", { className: "material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors", children: "chevron_right" })] }) }, article.id))) })] })] }), _jsxs("section", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, className: "text-center mb-12", children: [_jsxs("span", { className: "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-semibold mb-4", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "help" }), "FAQ"] }), _jsx("h2", { className: "text-3xl font-bold mb-4", style: { color: 'var(--text-primary)' }, children: "Frequently Asked Questions" }), _jsx("p", { style: { color: 'var(--text-secondary)' }, children: "Quick answers to common questions" })] }), _jsx("div", { className: "space-y-4", children: faqs.map((faq, index) => (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: index * 0.1 }, children: _jsxs("div", { className: "rounded-xl border overflow-hidden transition-all", style: {
                                    backgroundColor: 'var(--bg-card)',
                                    borderColor: openFaq === index ? 'var(--accent-primary)' : 'var(--border-primary)',
                                }, children: [_jsxs("button", { onClick: () => setOpenFaq(openFaq === index ? null : index), className: "w-full flex items-center justify-between p-5 text-left", children: [_jsx("span", { className: "font-semibold pr-4", style: { color: 'var(--text-primary)' }, children: faq.question }), _jsx(motion.span, { animate: { rotate: openFaq === index ? 180 : 0 }, transition: { duration: 0.2 }, className: "material-symbols-outlined flex-shrink-0", style: { color: openFaq === index ? 'var(--accent-primary)' : 'var(--text-muted)' }, children: "expand_more" })] }), _jsx(AnimatePresence, { children: openFaq === index && (_jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.2 }, children: _jsx("div", { className: "px-5 pb-5 pt-0", style: { color: 'var(--text-secondary)' }, children: _jsx("div", { className: "pt-2 border-t", style: { borderColor: 'var(--border-primary)' }, children: _jsx("p", { className: "mt-3 leading-relaxed", children: faq.answer }) }) }) })) })] }) }, index))) })] }), _jsx("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, whileInView: { opacity: 1, scale: 1 }, viewport: { once: true }, className: "relative overflow-hidden rounded-3xl", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-primary via-purple-600 to-pink-600" }), _jsx("div", { className: "absolute inset-0 opacity-30", style: {
                                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                                backgroundSize: '32px 32px',
                            } }), _jsx(motion.div, { animate: {
                                rotate: [0, 360],
                                scale: [1, 1.1, 1],
                            }, transition: { duration: 20, repeat: Infinity, ease: "linear" }, className: "absolute top-10 left-10 w-20 h-20 border-2 border-white/20 rounded-full" }), _jsx(motion.div, { animate: {
                                rotate: [360, 0],
                            }, transition: { duration: 15, repeat: Infinity, ease: "linear" }, className: "absolute bottom-10 right-20 w-32 h-32 border-2 border-white/10 rounded-xl" }), _jsx("div", { className: "relative px-8 py-16 md:py-20 text-center", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, children: [_jsxs("span", { className: "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-semibold mb-6 backdrop-blur-sm", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "support_agent" }), "We're here to help"] }), _jsx("h2", { className: "text-3xl md:text-4xl font-bold text-white mb-4", children: "Can't find what you're looking for?" }), _jsx("p", { className: "text-lg text-white/80 mb-8 max-w-2xl mx-auto", children: "Our support team is just a message away. Create a ticket and we'll get back to you within hours." }), _jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4", children: [_jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-lg", children: [_jsx("span", { className: "material-symbols-outlined", children: "add" }), "Create a Ticket"] }), _jsxs("button", { className: "inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20", children: [_jsx("span", { className: "material-symbols-outlined", children: "chat" }), "Live Chat"] })] })] }) })] }) }), _jsx("footer", { className: "border-t py-8", style: { borderColor: 'var(--border-primary)' }, children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-white text-sm", children: "support_agent" }) }), _jsx("span", { className: "font-semibold", style: { color: 'var(--text-primary)' }, children: "Support Desk" })] }), _jsx("p", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: "\u00A9 2025 Support Desk. All rights reserved." })] }) }) })] }));
}
