import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import DebtsPage from './pages/DebtsPage'
import ClientsPage from './pages/ClientsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/auth" replace />
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<RequireGuest><AuthPage /></RequireGuest>} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/debts"     element={<RequireAuth><DebtsPage /></RequireAuth>} />
        <Route path="/clients"    element={<RequireAuth><ClientsPage /></RequireAuth>} />
        <Route path="/analytics"  element={<RequireAuth><AnalyticsPage /></RequireAuth>} />
        <Route path="/settings"   element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
