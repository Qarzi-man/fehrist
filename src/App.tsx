import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LangProvider } from '@/contexts/LangContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import { AuthPage } from '@/pages/AuthPage'

function AppRoutes() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={session ? <Navigate to="/" replace /> : <AuthPage />}
      />
      <Route
        path="/*"
        element={
          session
            ? <div className="min-h-screen flex items-center justify-center text-white">App — Sprint 3+</div>
            : <Navigate to="/auth" replace />
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  )
}
