import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/auth';
import { useTheme } from './hooks/useTheme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AllTickets from './pages/AllTickets';
import NewTicket from './pages/NewTicket';
import TicketDetail from './pages/TicketDetail';
import UserManagement from './pages/UserManagement';
import KnowledgeBase from './pages/KnowledgeBase';
import InternalTriageQueue from './pages/InternalTriageQueue';
import AppLayout from './components/AppLayout';
import DevUserSwitcher from './components/DevUserSwitcher';
function ProtectedRoute({ children }) {
    const { token } = useAuthStore();
    if (!token)
        return _jsx(Navigate, { to: "/login", replace: true });
    return _jsx(_Fragment, { children: children });
}
export default function App() {
    const { theme } = useTheme();
    // Sync theme state to HTML element for Tailwind dark mode
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);
    return (_jsxs(_Fragment, { children: [_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsxs(Route, { element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, {}) }), children: [_jsx(Route, { path: "/", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/tickets", element: _jsx(AllTickets, {}) }), _jsx(Route, { path: "/tickets/new", element: _jsx(NewTicket, {}) }), _jsx(Route, { path: "/tickets/:id", element: _jsx(TicketDetail, {}) }), _jsx(Route, { path: "/users", element: _jsx(UserManagement, {}) }), _jsx(Route, { path: "/help", element: _jsx(KnowledgeBase, {}) }), _jsx(Route, { path: "/triage", element: _jsx(InternalTriageQueue, {}) })] })] }), _jsx(DevUserSwitcher, {})] }));
}
