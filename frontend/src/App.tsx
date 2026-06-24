import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import api from './api/client'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import DebtsPage from './pages/DebtsPage'
import ClientsPage from './pages/ClientsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import BillingPage from './pages/BillingPage'
import AdminPage from './pages/AdminPage'
import OfertaPage from './pages/OfertaPage'
import PrivacyPage from './pages/PrivacyPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/auth" replace />
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const user  = useAuthStore((s) => s.user)
  if (!token) return <Navigate to="/auth" replace />
  if (!user?.is_admin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

function AppWithRefresh({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const updateUser = useAuthStore((s) => s.updateUser)
  const [ready, setReady] = useState(!token)

  useEffect(() => {
    if (!token) { setReady(true); return }
    api.get('/auth/me')
      .then((r) => {
        console.log('[App] /me response:', r.data)
        if (typeof r.data?.is_admin === 'boolean') {
          updateUser({ is_admin: r.data.is_admin })
        }
      })
      .catch((err) => console.error('[App] /me failed:', err?.response?.status, err?.message))
      .finally(() => setReady(true))
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AppWithRefresh>
      <Routes>
        <Route path="/auth"     element={<RequireGuest><AuthPage /></RequireGuest>} />
        <Route path="/oferta"   element={<OfertaPage />} />
        <Route path="/privacy"  element={<PrivacyPage />} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/debts"     element={<RequireAuth><DebtsPage /></RequireAuth>} />
        <Route path="/clients"   element={<RequireAuth><ClientsPage /></RequireAuth>} />
        <Route path="/analytics" element={<RequireAuth><AnalyticsPage /></RequireAuth>} />
        <Route path="/settings"  element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/profile"   element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/billing"   element={<RequireAuth><BillingPage /></RequireAuth>} />
        <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </AppWithRefresh>
    </BrowserRouter>
  )
}
