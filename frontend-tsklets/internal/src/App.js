import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/auth';
import { useTheme } from './hooks/useTheme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SupportQueue from './pages/SupportQueue';
import TicketDetail from './pages/TicketDetail';
import Clients from './pages/Clients';
import Products from './pages/Products';
import ProductDashboard from './pages/ProductDashboard';
import MyTasks from './pages/MyTasks';
import Ideas from './pages/Ideas';
import IdeaDetail from './pages/IdeaDetail';
import Sprints from './pages/Sprints';
import SprintBoard from './pages/SprintBoard';
import Backlog from './pages/Backlog';
import SprintRetro from './pages/SprintRetro';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import Roadmap from './pages/Roadmap';
import Requirements from './pages/Requirements';
import RequirementDetail from './pages/RequirementDetail';
import DevTasks from './pages/DevTasks';
import DevUserSwitcher from './components/DevUserSwitcher';
import CreateHub from './components/CreateHub';
import CreateFAB from './components/CreateFAB';
import { Toaster } from 'sonner';
function PrivateRoute({ children }) {
    const { isAuthenticated, user } = useAuthStore();
    if (!isAuthenticated()) {
        return _jsx(Navigate, { to: "/login" });
    }
    // Only internal users can access internal portal
    if (!user?.isInternal) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", style: { backgroundColor: 'var(--bg-secondary)' }, children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold text-red-600", children: "Access Denied" }), _jsx("p", { className: "text-slate-600 mt-2", children: "This portal is for internal team only." })] }) }));
    }
    return _jsx(_Fragment, { children: children });
}
export default function App() {
    const { theme } = useTheme();
    // Sync theme state to HTML element for Tailwind dark mode
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);
    return (_jsxs(BrowserRouter, { children: [_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "/dashboard", element: _jsx(PrivateRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/executive", element: _jsx(PrivateRoute, { children: _jsx(ExecutiveDashboard, {}) }) }), _jsx(Route, { path: "/roadmap", element: _jsx(PrivateRoute, { children: _jsx(Roadmap, {}) }) }), _jsx(Route, { path: "/tickets", element: _jsx(PrivateRoute, { children: _jsx(SupportQueue, {}) }) }), _jsx(Route, { path: "/tickets/:id", element: _jsx(PrivateRoute, { children: _jsx(TicketDetail, {}) }) }), _jsx(Route, { path: "/clients", element: _jsx(PrivateRoute, { children: _jsx(Clients, {}) }) }), _jsx(Route, { path: "/products", element: _jsx(PrivateRoute, { children: _jsx(Products, {}) }) }), _jsx(Route, { path: "/products/:id/dashboard", element: _jsx(PrivateRoute, { children: _jsx(ProductDashboard, {}) }) }), _jsx(Route, { path: "/my-tasks", element: _jsx(PrivateRoute, { children: _jsx(MyTasks, {}) }) }), _jsx(Route, { path: "/sprints", element: _jsx(PrivateRoute, { children: _jsx(Sprints, {}) }) }), _jsx(Route, { path: "/sprints/:id", element: _jsx(PrivateRoute, { children: _jsx(SprintBoard, {}) }) }), _jsx(Route, { path: "/sprints/:id/retro", element: _jsx(PrivateRoute, { children: _jsx(SprintRetro, {}) }) }), _jsx(Route, { path: "/backlog", element: _jsx(PrivateRoute, { children: _jsx(Backlog, {}) }) }), _jsx(Route, { path: "/dev-tasks", element: _jsx(PrivateRoute, { children: _jsx(DevTasks, {}) }) }), _jsx(Route, { path: "/ideas", element: _jsx(PrivateRoute, { children: _jsx(Ideas, {}) }) }), _jsx(Route, { path: "/ideas/:id", element: _jsx(PrivateRoute, { children: _jsx(IdeaDetail, {}) }) }), _jsx(Route, { path: "/requirements", element: _jsx(PrivateRoute, { children: _jsx(Requirements, {}) }) }), _jsx(Route, { path: "/requirements/:id", element: _jsx(PrivateRoute, { children: _jsx(RequirementDetail, {}) }) })] }), _jsx(DevUserSwitcher, {}), _jsx(CreateHub, {}), _jsx(CreateFAB, {}), _jsx(Toaster, { position: "top-right", richColors: true })] }));
}
