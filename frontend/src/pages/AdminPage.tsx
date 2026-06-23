import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import AdminDashboard from '../components/admin/AdminDashboard'
import AdminUsers from '../components/admin/AdminUsers'
import AdminBusinesses from '../components/admin/AdminBusinesses'
import AdminPayments from '../components/admin/AdminPayments'
import AdminSms from '../components/admin/AdminSms'
import AdminRevenue from '../components/admin/AdminRevenue'

type Tab = 'dashboard' | 'users' | 'businesses' | 'payments' | 'sms' | 'revenue'

const NAV: { key: Tab; label: string; icon: string }[] = [
  { key: 'dashboard',  label: 'Дашборд',          icon: '📊' },
  { key: 'users',      label: 'Пользователи',      icon: '👥' },
  { key: 'businesses', label: 'Бизнесы',           icon: '🏢' },
  { key: 'payments',   label: 'Заявки на оплату',  icon: '💳' },
  { key: 'sms',        label: 'SMS логи',          icon: '📱' },
  { key: 'revenue',    label: 'Финансы',           icon: '💰' },
]

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-800">
          <p className="text-sm font-extrabold text-indigo-400 tracking-tight">Daftarcha</p>
          <p className="text-xs text-gray-500 mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              className={[
                'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition',
                tab === n.key
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200',
              ].join(' ')}
            >
              <span className="text-base">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800 space-y-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition text-left"
          >
            <span>←</span> Вернуться
          </button>
          <div className="px-3 py-2">
            <p className="text-xs text-gray-600 truncate">{user?.full_name ?? user?.phone}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-900 shrink-0">
          <h1 className="text-base font-bold text-white">{NAV.find((n) => n.key === tab)?.label}</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'dashboard'  && <AdminDashboard />}
          {tab === 'users'      && <AdminUsers />}
          {tab === 'businesses' && <AdminBusinesses />}
          {tab === 'payments'   && <AdminPayments />}
          {tab === 'sms'        && <AdminSms />}
          {tab === 'revenue'    && <AdminRevenue />}
        </div>
      </main>
    </div>
  )
}
