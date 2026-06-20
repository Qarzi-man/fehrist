import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n'

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const t = useT()

  function handleLogout() {
    logout()
    navigate('/auth')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t.appName}</h1>
        <p className="mt-1 text-gray-500">
          {user?.full_name ?? user?.phone}
        </p>
      </div>
      <button
        onClick={handleLogout}
        className="rounded-xl bg-gray-200 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition"
      >
        Выйти
      </button>
    </div>
  )
}
