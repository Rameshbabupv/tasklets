import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/auth';
export default function ChangePasswordModal({ isOpen, canDismiss = false, onSuccess }) {
    const { token, user, setUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    // Password strength indicator
    const getPasswordStrength = (password) => {
        if (!password)
            return { strength: 0, label: '', color: '' };
        let strength = 0;
        if (password.length >= 8)
            strength++;
        if (/[a-z]/.test(password))
            strength++;
        if (/[A-Z]/.test(password))
            strength++;
        if (/\d/.test(password))
            strength++;
        if (/[@$!%*?&]/.test(password))
            strength++;
        if (strength <= 2)
            return { strength, label: 'Weak', color: 'bg-red-500' };
        if (strength <= 3)
            return { strength, label: 'Medium', color: 'bg-yellow-500' };
        if (strength <= 4)
            return { strength, label: 'Good', color: 'bg-blue-500' };
        return { strength, label: 'Strong', color: 'bg-green-500' };
    };
    const passwordStrength = getPasswordStrength(form.newPassword);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        // Validation
        if (form.newPassword !== form.confirmPassword) {
            setError('New passwords do not match');
            return;
        }
        if (form.newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(form.newPassword)) {
            setError('Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&)');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: form.currentPassword,
                    newPassword: form.newPassword,
                }),
            });
            const data = await res.json();
            console.log('Change password response:', data);
            if (!res.ok) {
                throw new Error(data.error || 'Failed to change password');
            }
            // Update user state to clear requirePasswordChange flag
            if (user) {
                const updatedUser = { ...user, requirePasswordChange: false };
                console.log('Updating user state:', updatedUser);
                setUser(updatedUser);
            }
            // Clear form
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            // Call success callback
            if (onSuccess) {
                onSuccess();
            }
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    if (!isOpen)
        return null;
    return (_jsx(AnimatePresence, { children: _jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, className: "bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6", onClick: (e) => e.stopPropagation(), children: [_jsx("div", { className: "mb-6", children: _jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30", children: _jsx("span", { className: "material-symbols-outlined text-2xl text-yellow-600 dark:text-yellow-400", children: "lock_reset" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-slate-100", children: "Change Password Required" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: canDismiss ? 'Update your password to continue' : 'You must change your password to continue' })] })] }) }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Current Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPasswords.current ? 'text' : 'password', value: form.currentPassword, onChange: (e) => setForm({ ...form, currentPassword: e.target.value }), required: true, className: "w-full px-4 py-3 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent", placeholder: "Enter current password" }), _jsx("button", { type: "button", onClick: () => setShowPasswords({ ...showPasswords, current: !showPasswords.current }), className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300", children: _jsx("span", { className: "material-symbols-outlined text-xl", children: showPasswords.current ? 'visibility_off' : 'visibility' }) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "New Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPasswords.new ? 'text' : 'password', value: form.newPassword, onChange: (e) => setForm({ ...form, newPassword: e.target.value }), required: true, className: "w-full px-4 py-3 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent", placeholder: "Enter new password" }), _jsx("button", { type: "button", onClick: () => setShowPasswords({ ...showPasswords, new: !showPasswords.new }), className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300", children: _jsx("span", { className: "material-symbols-outlined text-xl", children: showPasswords.new ? 'visibility_off' : 'visibility' }) })] }), form.newPassword && (_jsxs("div", { className: "mt-2", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("div", { className: "flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full ${passwordStrength.color} transition-all duration-300`, style: { width: `${(passwordStrength.strength / 5) * 100}%` } }) }), _jsx("span", { className: "text-xs font-medium text-slate-600 dark:text-slate-400", children: passwordStrength.label })] }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special (@$!%*?&)" })] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Confirm New Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showPasswords.confirm ? 'text' : 'password', value: form.confirmPassword, onChange: (e) => setForm({ ...form, confirmPassword: e.target.value }), required: true, className: "w-full px-4 py-3 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent", placeholder: "Confirm new password" }), _jsx("button", { type: "button", onClick: () => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm }), className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300", children: _jsx("span", { className: "material-symbols-outlined text-xl", children: showPasswords.confirm ? 'visibility_off' : 'visibility' }) })] }), form.confirmPassword && form.newPassword !== form.confirmPassword && (_jsx("p", { className: "mt-1 text-xs text-red-600 dark:text-red-400", children: "Passwords do not match" }))] }), error && (_jsx("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3", children: _jsx("p", { className: "text-sm text-red-600 dark:text-red-400", children: error }) })), _jsxs("div", { className: "flex items-center justify-end gap-3 pt-4", children: [canDismiss && (_jsx("button", { type: "button", onClick: onSuccess, className: "px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors", children: "Skip for now" })), _jsxs("button", { type: "submit", disabled: loading || form.newPassword !== form.confirmPassword, className: "inline-flex items-center gap-2 bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx("span", { className: "material-symbols-outlined text-lg", children: "check" }), loading ? 'Changing Password...' : 'Change Password'] })] })] })] }) }) }));
}
