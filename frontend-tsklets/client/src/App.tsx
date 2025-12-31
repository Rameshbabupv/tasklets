import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/auth'
import { useTheme } from './hooks/useTheme'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MyTickets from './pages/MyTickets'
import NewTicket from './pages/NewTicket'
import TicketDetail from './pages/TicketDetail'
import UserManagement from './pages/UserManagement'
import KnowledgeBase from './pages/KnowledgeBase'
import InternalTriageQueue from './pages/InternalTriageQueue'
import AppLayout from './components/AppLayout'
import DevUserSwitcher from './components/DevUserSwitcher'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { theme } = useTheme()

  // Sync theme state to HTML element for Tailwind dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Protected routes with shared AppLayout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/tickets" element={<MyTickets />} />
          <Route path="/tickets/new" element={<NewTicket />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/help" element={<KnowledgeBase />} />
          <Route path="/triage" element={<InternalTriageQueue />} />
        </Route>
      </Routes>
      <DevUserSwitcher />
    </>
  )
}
