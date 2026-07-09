import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../i18n'
import { useAuthStore } from '../store/authStore'
import { useBusinessStore } from '../store/businessStore'
import { getDashboardStats, type DashboardStats, type RecentDebt } from '../api/dashboard'
import { formatMoney, formatDate } from '../lib/format'
import { avatarGradient } from '../lib/avatar'
import AppLayout from '../components/layout/AppLayout'
import StatsCard from '../components/dashboard/StatsCard'
import AddDebtModal from '../components/debts/AddDebtModal'
import Button from '../components/ui/Button'


function getGreeting(t: ReturnType<typeof useT>): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return t.goodMorning
  if (h >= 12 && h < 18) return t.goodAfternoon
  return t.goodEvening
}

function statusBadge(status: RecentDebt['status'], t: ReturnType<typeof useT>) {
  const map = {
    active:  { cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',       label: t.statusActive },
    paid:    { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', label: t.statusPaid },
    overdue: { cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',           label: t.statusOverdue },
  }
  const s = map[status] ?? map.active
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
}

function typeBadge(type: RecentDebt['type'], t: ReturnType<typeof useT>) {
  return type === 'receivable'
    ? <span className="hidden sm:inline-flex text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{t.receivable}</span>
    : <span className="hidden sm:inline-flex text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">{t.payable}</span>
}

const SKELETON_WIDTHS = ['w-36', 'w-28', 'w-44', 'w-32'] as const

function SkeletonDashboard() {
  return (
    <>
      <div className="grid grid-cols-3 gap-3 md:gap-5 mb-6 md:mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl bg-gray-200 dark:bg-gray-700 h-28 md:h-36 animate-pulse" />
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700">
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <ul>
          {SKELETON_WIDTHS.map((w, i) => (
            <li
              key={i}
              className={`flex items-center gap-3 px-4 py-3 ${i ? 'border-t border-gray-50 dark:border-gray-700' : ''}`}
            >
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className={`h-3.5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse ${w}`} />
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-20" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-24" />
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-16" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default function DashboardPage() {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const activeBusiness = useBusinessStore((s) => s.activeBusiness)
  const activeBusinessId = activeBusiness?.id

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
  }, [activeBusinessId])

  useEffect(() => { load() }, [load])

  const displayName = user?.full_name?.split(' ')[0] ?? user?.phone ?? ''
  const todayStr = (() => {
    const s = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
    return s.charAt(0).toUpperCase() + s.slice(1)
  })()

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            {activeBusiness?.logo && (
              <img
                src={activeBusiness.logo}
                alt={activeBusiness.name}
                className="h-10 w-10 md:h-12 md:w-12 rounded-xl object-cover shrink-0 shadow-sm border border-gray-100 dark:border-gray-700"
              />
            )}
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {getGreeting(t)}{displayName ? `, ${displayName}` : ''}!
              </h1>
              <p className="text-sm md:text-base text-gray-400 dark:text-gray-500 mt-0.5">{todayStr}</p>
            </div>
          </div>
          <Button onClick={() => setShowAdd(true)} className="text-sm md:text-base px-4 md:px-5 py-2 md:py-2.5">
            {t.addDebt}
          </Button>
        </div>

        {loading && <SkeletonDashboard />}

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
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-50 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.recentDebts}</h2>
                <Link
                  to="/debts"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  {t.seeAll} →
                </Link>
              </div>

              {stats.recent_debts.length === 0 ? (
                <div className="py-14 text-center">
                  <p className="text-3xl mb-3">📋</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">{t.noDebts}</p>
                </div>
              ) : (
                <ul>
                  {stats.recent_debts.map((d, i) => (
                    <li
                      key={d.id}
                      className={[
                        'flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 transition-all duration-150 cursor-pointer',
                        'hover:bg-gray-50/80 dark:hover:bg-gray-700/40',
                        i !== 0 ? 'border-t border-gray-50 dark:border-gray-700/60' : '',
                      ].join(' ')}
                    >
                      {/* Gradient avatar */}
                      <div
                        className={`h-10 w-10 rounded-full bg-gradient-to-br ${avatarGradient(d.client_name)} flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm`}
                      >
                        {d.client_name[0].toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{d.client_name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {formatDate(d.due_date ?? d.created_at)}
                        </p>
                      </div>

                      {/* Amount + badges */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0 max-w-[45%]">
                        <span
                          className={`text-sm font-bold text-right ${d.type === 'receivable' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}
                        >
                          {d.type === 'receivable' ? '+' : '−'}{formatMoney(d.amount, d.currency)}
                        </span>
                        <div className="flex flex-wrap gap-1 justify-end">
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
