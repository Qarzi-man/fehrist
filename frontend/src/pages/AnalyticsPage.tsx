import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { useT } from '../i18n'
import { useBusinessStore } from '../store/businessStore'
import { getAnalytics, type AnalyticsData, type Period } from '../api/analytics'
import { exportAnalyticsToExcel } from '../lib/export'
import { avatarGradient } from '../lib/avatar'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'

const CURRENCY_ORDER = ['TJS', 'RUB', 'USD']

const COLORS = {
  recv:  '#10b981',
  pabl:  '#f43f5e',
  rpd:   '#6366f1',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-TJ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

function sortCurrencies(currencies: string[]): string[] {
  return [...currencies].sort((a, b) => {
    const ia = CURRENCY_ORDER.indexOf(a)
    const ib = CURRENCY_ORDER.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}

function fmtByCurrency(map: Record<string, number>): string {
  const entries = Object.entries(map)
  if (!entries.length) return '0'
  return sortCurrencies(entries.map(([c]) => c))
    .map((c) => `${fmt(map[c])} ${c}`)
    .join(' · ')
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

type CardColor = 'indigo' | 'rose' | 'emerald' | 'blue'

function SummaryCard({ label, value, sub, color }: {
  label: string
  value: string | number
  sub?: string
  color: CardColor
}) {
  const gradients: Record<CardColor, string> = {
    indigo:  'from-[#4f46e5] to-[#4338ca]',
    rose:    'from-[#dc2626] to-[#b91c1c]',
    emerald: 'from-[#16a34a] to-[#15803d]',
    blue:    'from-[#0284c7] to-[#0369a1]',
  }
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradients[color]} p-4 md:p-5 flex flex-col gap-1.5 shadow-lg`}>
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
      <span className="text-xs md:text-sm font-semibold text-white/85 relative z-10">{label}</span>
      <span className="text-xl md:text-2xl font-bold text-white leading-none relative z-10 break-words">{value}</span>
      {sub && <span className="text-xs text-white/60 relative z-10">{sub}</span>}
    </div>
  )
}

export default function AnalyticsPage() {
  const t = useT()
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id)
  const [period, setPeriod] = useState<Period>('6m')
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
    return sortCurrencies(Array.from(set))
  }

  const currencies = useMemo(() => (data ? deriveCurrencies(data) : []), [data])
  const cur = activeCurrency || currencies[0] || 'TJS'

  const chartData = useMemo(() => {
    if (!data) return []
    return data.monthly.map((m) => ({
      label: m.label,
      recv:  m.new_receivable[cur] ?? 0,
      pabl:  m.new_payable[cur]    ?? 0,
      rpd:   m.repaid[cur]         ?? 0,
    }))
  }, [data, cur])

  const hasChartData = chartData.some((d) => d.recv > 0 || d.pabl > 0 || d.rpd > 0)

  const periods: { value: Period; label: string }[] = [
    { value: '1d', label: t.period1d },
    { value: '1w', label: t.period1w },
    { value: '1m', label: t.period1m },
    { value: '3m', label: t.period3m },
    { value: '6m', label: t.period6m },
    { value: '1y', label: t.period1y },
  ]

  const repaidStr       = fmtByCurrency(data?.summary.repaid_this_month ?? {})
  const repaidPeriodStr = fmtByCurrency(data?.summary.repaid_in_period  ?? {})

  function handleExportExcel() {
    if (data) exportAnalyticsToExcel(data, period)
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-8 space-y-6">

        {/* Header + period */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white print:text-black">{t.analytics}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 print:hidden">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={['rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all',
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
                onClick={() => window.print()}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {[0, 1, 2, 3].map((i) => (
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
            {/* Summary cards — 4 cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
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
              <SummaryCard
                label={t.totalRepaid}
                value={repaidPeriodStr}
                color="blue"
              />
            </div>

            {/* Chart */}
            {data.monthly.length > 0 && (
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
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                      <Bar dataKey="recv" name={t.newReceivable} fill={COLORS.recv} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pabl" name={t.newPayable}    fill={COLORS.pabl} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="rpd"  name={t.repaid}        fill={COLORS.rpd}  radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* Top clients */}
            {data.top_clients.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-4 md:px-6 py-4 border-b border-gray-50 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.topClients}</h2>
                </div>
                <ul className="divide-y divide-gray-50 dark:divide-gray-700">
                  {data.top_clients.map((client, idx) => (
                    <li key={client.client_id} className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4">
                      <span className="text-sm font-bold text-gray-300 dark:text-gray-600 w-5 shrink-0">
                        {idx + 1}
                      </span>
                      <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${avatarGradient(client.full_name)} flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm`}>
                        {client.full_name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{client.full_name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 max-w-[45%]">
                        {client.debts.map((debt, i) => (
                          <div key={i} className="flex items-center gap-1 flex-wrap justify-end">
                            <span className={`hidden sm:inline-flex text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
                              debt.type === 'receivable'
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400'
                            }`}>
                              {debt.type === 'receivable' ? t.iAmOwed : t.iOwe}
                            </span>
                            <span className={`text-xs sm:text-sm font-bold ${
                              debt.type === 'receivable'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-500 dark:text-rose-400'
                            }`}>
                              {fmt(debt.amount)} {debt.currency}
                            </span>
                          </div>
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
