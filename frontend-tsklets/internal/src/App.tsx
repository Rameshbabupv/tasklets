import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/auth'
import { useTheme } from './hooks/useTheme'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SupportQueue from './pages/SupportQueue'
import TicketDetail from './pages/TicketDetail'
import Clients from './pages/Clients'
import Products from './pages/Products'
import ProductDashboard from './pages/ProductDashboard'
import MyTasks from './pages/MyTasks'
import Ideas from './pages/Ideas'
import IdeaDetail from './pages/IdeaDetail'
import Sprints from './pages/Sprints'
import SprintBoard from './pages/SprintBoard'
import Backlog from './pages/Backlog'
import SprintRetro from './pages/SprintRetro'
import DevUserSwitcher from './components/DevUserSwitcher'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated()) {
    return <Navigate to="/login" />
  }

  // Only internal users can access internal portal
  if (!user?.isInternal) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-slate-600 mt-2">This portal is for internal team only.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function App() {
  const { theme } = useTheme()

  // Sync theme state to HTML element for Tailwind dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/tickets" element={<PrivateRoute><SupportQueue /></PrivateRoute>} />
        <Route path="/tickets/:id" element={<PrivateRoute><TicketDetail /></PrivateRoute>} />
        <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
        <Route path="/products/:id/dashboard" element={<PrivateRoute><ProductDashboard /></PrivateRoute>} />
        <Route path="/my-tasks" element={<PrivateRoute><MyTasks /></PrivateRoute>} />
        <Route path="/sprints" element={<PrivateRoute><Sprints /></PrivateRoute>} />
        <Route path="/sprints/:id" element={<PrivateRoute><SprintBoard /></PrivateRoute>} />
        <Route path="/sprints/:id/retro" element={<PrivateRoute><SprintRetro /></PrivateRoute>} />
        <Route path="/backlog" element={<PrivateRoute><Backlog /></PrivateRoute>} />
        <Route path="/ideas" element={<PrivateRoute><Ideas /></PrivateRoute>} />
        <Route path="/ideas/:id" element={<PrivateRoute><IdeaDetail /></PrivateRoute>} />
      </Routes>
      <DevUserSwitcher />
    </BrowserRouter>
  )
}
