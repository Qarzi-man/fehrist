import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../i18n'
import { useAuthStore } from '../store/authStore'
import { getDashboardStats, type DashboardStats, type RecentDebt } from '../api/dashboard'
import { formatMoney, formatDate } from '../lib/format'
import AppLayout from '../components/layout/AppLayout'
import StatsCard from '../components/dashboard/StatsCard'
import AddDebtModal from '../components/debts/AddDebtModal'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'

function statusBadge(status: RecentDebt['status'], t: ReturnType<typeof useT>) {
  const map = {
    active:  { cls: 'bg-blue-50 text-blue-600',      label: t.statusActive },
    paid:    { cls: 'bg-emerald-50 text-emerald-600', label: t.statusPaid },
    overdue: { cls: 'bg-red-50 text-red-600',         label: t.statusOverdue },
  }
  const s = map[status] ?? map.active
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
}

function typeBadge(type: RecentDebt['type'], t: ReturnType<typeof useT>) {
  return type === 'receivable'
    ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{t.receivable}</span>
    : <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">{t.payable}</span>
}

export default function DashboardPage() {
  const t = useT()
  const user = useAuthStore((s) => s.user)

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(false)
    getDashboardStats()
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">{t.dashboard}</h1>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">{user?.full_name ?? user?.phone}</p>
          </div>
          <Button onClick={() => setShowAdd(true)} className="text-sm md:text-base px-4 md:px-5 py-2 md:py-2.5">
            {t.addDebt}
          </Button>
        </div>

        {loading && (
          <div className="flex justify-center py-16 text-indigo-400">
            <Spinner size={32} />
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
            <p className="text-sm">{t.errNetwork}</p>
            <Button variant="ghost" onClick={load}>{t.tryAgain}</Button>
          </div>
        )}

        {stats && !loading && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-3 md:gap-5 mb-6 md:mb-8">
              <StatsCard label={t.receivable} amounts={stats.receivable} color="emerald" />
              <StatsCard label={t.payable}    amounts={stats.payable}    color="rose" />
              <StatsCard label={t.overdue}    count={stats.overdue_count} color="amber" />
            </div>

            {/* Recent debts */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.recentDebts}</h2>
                <Link to="/debts" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">{t.seeAll}</Link>
              </div>

              {stats.recent_debts.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">{t.noDebts}</div>
              ) : (
                <ul>
                  {stats.recent_debts.map((d, i) => (
                    <li key={d.id} className={['flex items-center gap-3 px-4 py-3', i !== 0 ? 'border-t border-gray-50 dark:border-gray-700' : ''].join(' ')}>
                      {/* Avatar */}
                      <div className={['h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                        d.type === 'receivable' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'].join(' ')}>
                        {d.client_name[0].toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{d.client_name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(d.due_date ?? d.created_at)}</p>
                      </div>

                      {/* Amount + badges */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={['text-sm font-semibold',
                          d.type === 'receivable' ? 'text-emerald-600' : 'text-rose-600'].join(' ')}>
                          {d.type === 'receivable' ? '+' : '−'}{formatMoney(d.amount, d.currency)}
                        </span>
                        <div className="flex gap-1">
                          {typeBadge(d.type, t)}
                          {statusBadge(d.status, t)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      {showAdd && (
        <AddDebtModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); load() }}
        />
      )}
    </AppLayout>
  )
}
