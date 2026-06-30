import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getAdminPayments } from '../api/admin'
import AdminDashboard from '../components/admin/AdminDashboard'
import AdminUsers from '../components/admin/AdminUsers'
import AdminBusinesses from '../components/admin/AdminBusinesses'
import AdminPayments from '../components/admin/AdminPayments'
import AdminSms from '../components/admin/AdminSms'
import AdminRevenue from '../components/admin/AdminRevenue'

type Tab = 'dashboard' | 'users' | 'businesses' | 'payments' | 'sms' | 'revenue'

function IconChart() {
  return <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
}
function IconUsers() {
  return <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function IconBuilding() {
  return <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
}
function IconCard() {
  return <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
}
function IconChat() {
  return <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
}
function IconMoney() {
  return <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}
function IconBack() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
}

const NAV: { key: Tab; label: string; Icon: () => JSX.Element }[] = [
  { key: 'dashboard',  label: 'Дашборд',         Icon: IconChart    },
  { key: 'users',      label: 'Пользователи',     Icon: IconUsers    },
  { key: 'businesses', label: 'Бизнесы',          Icon: IconBuilding },
  { key: 'payments',   label: 'Заявки на оплату', Icon: IconCard     },
  { key: 'sms',        label: 'SMS логи',         Icon: IconChat     },
  { key: 'revenue',    label: 'Финансы',          Icon: IconMoney    },
]

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [pendingCount, setPendingCount] = useState(0)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const current = NAV.find((n) => n.key === tab)!

  useEffect(() => {
    getAdminPayments({ status: 'pending', limit: 1 })
      .then((r) => setPendingCount(r.total))
      .catch(() => {})
  }, [tab])

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-gray-900 border-r border-gray-800/80 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white text-xs font-bold">D</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight">Daftarcha</p>
              <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ key, label, Icon }) => {
            const active = tab === key
            const badge = key === 'payments' && pendingCount > 0 ? pendingCount : null
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={[
                  'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-all duration-150',
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100',
                ].join(' ')}
              >
                <span className={active ? 'text-white/90' : 'text-gray-500'}>
                  <Icon />
                </span>
                <span className="flex-1">{label}</span>
                {badge !== null && (
                  <span className="min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center leading-none">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-800/80 space-y-0.5">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition text-left"
          >
            <IconBack />
            Вернуться
          </button>
          <div className="px-3 py-1.5">
            <p className="text-[11px] text-gray-600 truncate">{user?.full_name ?? user?.phone}</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800/80 bg-gray-900/60 shrink-0 flex items-center gap-3">
          <span className="text-gray-500"><current.Icon /></span>
          <h1 className="text-base font-semibold text-white">{current.label}</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
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
