import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { useT } from '../i18n'
import { useBusinessStore } from '../store/businessStore'
import { getAnalytics, type AnalyticsData } from '../api/analytics'
import { exportAnalyticsToExcel } from '../lib/export'
import { avatarGradient } from '../lib/avatar'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'

type Period = 3 | 6 | 12

const COLORS = {
  recv:  '#10b981', // emerald-500
  pabl:  '#f43f5e', // rose-500
  rpd:   '#6366f1', // indigo-500
}

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-TJ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

function monthShort(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('ru', { month: 'short' })
}

function CurrencyTabs({ currencies, active, onChange }: {
  currencies: string[]
  active: string
  onChange: (c: string) => void
}) {
  if (currencies.length <= 1) return null
  return (
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 self-start">
      {currencies.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={['rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
            active === c
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'].join(' ')}
        >
          {c}
        </button>
      ))}
    </div>
  )
}

function SummaryCard({ label, value, sub, color }: {
  label: string
  value: string | number
  sub?: string
  color: 'indigo' | 'rose' | 'emerald'
}) {
  const gradients = {
    indigo:  'from-[#4f46e5] to-[#4338ca]',
    rose:    'from-[#dc2626] to-[#b91c1c]',
    emerald: 'from-[#16a34a] to-[#15803d]',
  }
  const gradient = gradients[color]
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 md:p-5 flex flex-col gap-1.5 shadow-lg`}>
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
      <span className="text-xs md:text-sm font-semibold text-white/85 relative z-10">{label}</span>
      <span className="text-2xl md:text-3xl font-bold text-white leading-none relative z-10">{value}</span>
      {sub && <span className="text-xs text-white/60 relative z-10">{sub}</span>}
    </div>
  )
}

export default function AnalyticsPage() {
  const t = useT()
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id)
  const [period, setPeriod] = useState<Period>(6)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeCurrency, setActiveCurrency] = useState<string>('')

  const load = useCallback(() => {
    setLoading(true)
    setError(false)
    getAnalytics(period)
      .then((d) => {
        setData(d)
        const currencies = deriveCurrencies(d)
        if (currencies.length && !currencies.includes(activeCurrency)) {
          setActiveCurrency(currencies[0])
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [period, activeBusinessId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  function deriveCurrencies(d: AnalyticsData): string[] {
    const set = new Set<string>()
    for (const m of d.monthly) {
      Object.keys(m.new_receivable).forEach((c) => set.add(c))
      Object.keys(m.new_payable).forEach((c) => set.add(c))
      Object.keys(m.repaid).forEach((c) => set.add(c))
    }
    return Array.from(set).sort()
  }

  const currencies = useMemo(() => (data ? deriveCurrencies(data) : []), [data])

  const cur = activeCurrency || currencies[0] || 'TJS'

  const chartData = useMemo(() => {
    if (!data) return []
    return data.monthly.map((m) => ({
      label: monthShort(m.month),
      recv:  m.new_receivable[cur] ?? 0,
      pabl:  m.new_payable[cur]    ?? 0,
      rpd:   m.repaid[cur]         ?? 0,
    }))
  }, [data, cur])

  const hasChartData = chartData.some((d) => d.recv > 0 || d.pabl > 0 || d.rpd > 0)

  const periods: { value: Period; label: string }[] = [
    { value: 3,  label: t.period3m },
    { value: 6,  label: t.period6m },
    { value: 12, label: t.period1y },
  ]

  const repaidThisMonth = data?.summary.repaid_this_month ?? {}
  const repaidStr = Object.entries(repaidThisMonth).length === 0
    ? '0'
    : Object.entries(repaidThisMonth).map(([c, v]) => `${fmt(v)} ${c}`).join(' · ')

  function handleExportExcel() {
    if (data) exportAnalyticsToExcel(data, period)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-8 space-y-6">

        {/* Header + period */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white print:text-black">{t.analytics}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 print:hidden">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={['rounded-lg px-3 py-1.5 text-sm font-semibold transition-all',
                    period === p.value
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'].join(' ')}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 print:hidden">
              <button
                onClick={handleExportExcel}
                disabled={!data}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">{t.exportExcel}</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span className="hidden sm:inline">{t.printBtn}</span>
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <>
            <div className="grid grid-cols-3 gap-3 md:gap-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl bg-gray-200 dark:bg-gray-700 h-24 md:h-28 animate-pulse" />
              ))}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 md:p-6 h-80 animate-pulse" />
          </>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
            <p className="text-sm">{t.errNetwork}</p>
            <Button variant="ghost" onClick={load}>{t.tryAgain}</Button>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 md:gap-5">
              <SummaryCard
                label={t.totalActiveDebts}
                value={data.summary.total_active}
                color="indigo"
              />
              <SummaryCard
                label={t.overdue}
                value={data.summary.overdue_count}
                color="rose"
              />
              <SummaryCard
                label={t.repaidThisMonth}
                value={repaidStr}
                color="emerald"
              />
            </div>

            {/* Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.debts}</h2>
                <CurrencyTabs
                  currencies={currencies}
                  active={cur}
                  onChange={setActiveCurrency}
                />
              </div>

              {!hasChartData ? (
                <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-sm">
                  {t.noData}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} barCategoryGap="30%" barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                      width={42}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        `${fmt(Number(value ?? 0))} ${cur}`,
                        name,
                      ]}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                    />
                    <Bar dataKey="recv" name={t.newReceivable} fill={COLORS.recv} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pabl" name={t.newPayable}    fill={COLORS.pabl} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rpd"  name={t.repaid}        fill={COLORS.rpd}  radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top clients */}
            {data.top_clients.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-4 md:px-6 py-4 border-b border-gray-50 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.topClients}</h2>
                </div>
                <ul className="divide-y divide-gray-50 dark:divide-gray-700">
                  {data.top_clients.map((client, idx) => (
                    <li key={client.client_id} className="flex items-center gap-4 px-4 md:px-6 py-3 md:py-4">
                      <span className="text-sm font-bold text-gray-300 dark:text-gray-600 w-5 shrink-0">
                        {idx + 1}
                      </span>
                      <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${avatarGradient(client.full_name)} flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm`}>
                        {client.full_name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{client.full_name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        {Object.entries(client.by_currency).map(([currency, amount]) => (
                          <span key={currency} className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            {fmt(amount)} {currency}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
