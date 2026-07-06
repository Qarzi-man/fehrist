import { useState, useEffect, useCallback, useRef } from 'react'
import { useT } from '../i18n'
import { useBusinessStore } from '../store/businessStore'
import { getDebts, type Debt, type PaginatedDebts } from '../api/debts'
import { exportDebtsToPDF, exportDebtsToExcel } from '../lib/export'
import { formatMoney, formatDate } from '../lib/format'
import { avatarGradient } from '../lib/avatar'
import AppLayout from '../components/layout/AppLayout'
import AddDebtModal from '../components/debts/AddDebtModal'
import DebtDetailModal from '../components/debts/DebtDetailModal'
import Button from '../components/ui/Button'

type FilterTab = 'all' | 'receivable' | 'payable' | 'overdue'

const CURRENCIES = ['TJS', 'USD', 'EUR', 'RUB']
const LIMIT = 20

const selectCls = 'w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30'
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

function DebtRow({ debt, onClick }: { debt: Debt; onClick: () => void }) {
  const t = useT()
  const isReceivable = debt.type === 'receivable'
  const status = debt.computed_status

  const statusCls = {
    active:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    paid:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  }[status] ?? 'bg-gray-100 text-gray-500'

  const statusLabel = { active: t.statusActive, paid: t.statusPaid, overdue: t.statusOverdue }[status]

  return (
    <li
      onClick={onClick}
      className="flex items-center gap-4 px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50/80 dark:hover:bg-gray-700/40 cursor-pointer transition-all duration-150 group"
    >
      <div className={`h-10 w-10 md:h-11 md:w-11 rounded-full bg-gradient-to-br ${avatarGradient(debt.client_name)} flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm group-hover:shadow-md transition-shadow duration-150`}>
        {debt.client_name[0].toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white truncate">{debt.client_name}</p>
        <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(debt.due_date ?? debt.created_at)}</p>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0 max-w-[45%]">
        <span className={`text-sm md:text-base font-bold ${isReceivable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'} text-right`}>
          {isReceivable ? '+' : '−'}{formatMoney(debt.amount, debt.currency)}
        </span>
        <div className="flex flex-wrap gap-1 justify-end">
          <span className={`hidden sm:inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${isReceivable ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}`}>
            {isReceivable ? t.receivable : t.payable}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCls}`}>{statusLabel}</span>
          {debt.kind === 'installment' && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              {t.installmentKind}
            </span>
          )}
        </div>
      </div>
    </li>
  )
}

export default function DebtsPage() {
  const t = useT()
  const activeBusiness = useBusinessStore((s) => s.activeBusiness)
  const activeBusinessId = activeBusiness?.id

  const [result, setResult] = useState<PaginatedDebts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [currency, setCurrency] = useState('')
  const [kind, setKind] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sort, setSort] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilters(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function buildFilters(pg: number, lim: number): Record<string, string | number> {
    const f: Record<string, string | number> = { page: pg, limit: lim }
    if (tab === 'receivable') f.type = 'receivable'
    else if (tab === 'payable') f.type = 'payable'
    else if (tab === 'overdue') f.status = 'overdue'
    if (search.trim()) f.search = search.trim()
    if (currency) f.currency = currency
    if (kind)     f.kind     = kind
    if (dateFrom) f.date_from = dateFrom
    if (dateTo)   f.date_to   = dateTo
    f.sort  = sort
    f.order = sortOrder
    return f
  }

  const load = useCallback(() => {
    setLoading(true)
    setError(false)
    getDebts(buildFilters(page, LIMIT))
      .then(setResult)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, search, currency, kind, dateFrom, dateTo, sort, sortOrder, page, activeBusinessId])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [tab, search, currency, kind, dateFrom, dateTo, sort, sortOrder])

  async function handleExportPDF() {
    setExportOpen(false)
    setExporting(true)
    try {
      const res = await getDebts(buildFilters(1, 1000))
      await exportDebtsToPDF(res.data, activeBusiness?.name ?? 'Daftarcha')
    } finally { setExporting(false) }
  }

  async function handleExportExcel() {
    setExportOpen(false)
    setExporting(true)
    try {
      const res = await getDebts(buildFilters(1, 1000))
      exportDebtsToExcel(res.data)
    } finally { setExporting(false) }
  }

  function resetFilters() {
    setCurrency('')
    setKind('')
    setDateFrom('')
    setDateTo('')
    setSort('date')
    setSortOrder('desc')
  }

  const pills = [
    currency ? { key: 'currency', label: currency,                                              clear: () => setCurrency('') } : null,
    kind     ? { key: 'kind',     label: kind === 'standard' ? t.standardKind : t.installmentKind, clear: () => setKind('') } : null,
    dateFrom ? { key: 'df',       label: `${t.dateFrom}: ${dateFrom}`,                          clear: () => setDateFrom('') } : null,
    dateTo   ? { key: 'dt',       label: `${t.dateTo}: ${dateTo}`,                              clear: () => setDateTo('') } : null,
    sort !== 'date' || sortOrder !== 'desc'
             ? { key: 'sort',     label: `${sort === 'amount' ? t.sortAmount : sort === 'name' ? t.sortName : t.sortDate} ${sortOrder === 'asc' ? '↑' : '↓'}`, clear: () => { setSort('date'); setSortOrder('desc') } }
             : null,
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[]

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all',        label: t.filterAll },
    { key: 'receivable', label: t.receivable },
    { key: 'payable',    label: t.payable },
    { key: 'overdue',    label: t.overdue },
  ]

  const debts = result?.data ?? []
  const totalPages = result?.totalPages ?? 1
  const total = result?.total ?? 0
  const from = total === 0 ? 0 : (page - 1) * LIMIT + 1
  const to = Math.min(page * LIMIT, total)

  const sortOptions = [
    { value: 'date',   label: t.sortDate },
    { value: 'amount', label: t.sortAmount },
    { value: 'name',   label: t.sortName },
  ]

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">{t.debts}</h1>
          <div className="flex items-center gap-2 print:hidden">
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setExportOpen((o) => !o)}
                disabled={exporting}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {exporting ? (
                  <span className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
                ) : (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                <span className="hidden sm:inline">{t.exportBtn}</span>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
                  <button onClick={handleExportPDF} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span>📄</span>{t.exportPDF}
                  </button>
                  <button onClick={handleExportExcel} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span>📊</span>{t.exportExcel}
                  </button>
                </div>
              )}
            </div>
            <Button onClick={() => setShowAdd(true)} className="text-sm md:text-base px-4 md:px-5 py-2 md:py-2.5">
              {t.addDebt}
            </Button>
          </div>
        </div>

        {/* Search + Filters button */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchContact}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30"
            />
          </div>

          {/* Filters button */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilters((o) => !o)}
              className={[
                'flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                pills.length > 0
                  ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0014 13.828V19a1 1 0 01-1.447.894l-4-2A1 1 0 018 17v-3.172a1 1 0 00-.293-.707L1.293 6.707A1 1 0 011 6V4z" />
              </svg>
              <span className="hidden sm:inline">{t.filters}</span>
              {pills.length > 0 && (
                <span className="h-4 min-w-[16px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {pills.length}
                </span>
              )}
            </button>

            {/* Filter panel */}
            {showFilters && (
              <div className="absolute right-0 top-full mt-2 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-4 flex flex-col gap-3">
                {/* Currency */}
                <div>
                  <label className={labelCls}>{t.currency}</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectCls}>
                    <option value="">{t.allCurrencies}</option>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Kind */}
                <div>
                  <label className={labelCls}>{t.debtType}</label>
                  <select value={kind} onChange={(e) => setKind(e.target.value)} className={selectCls}>
                    <option value="">{t.allKinds}</option>
                    <option value="standard">{t.standardKind}</option>
                    <option value="installment">{t.installmentKind}</option>
                  </select>
                </div>

                {/* Date range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>{t.dateFrom}</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t.dateTo}</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectCls} />
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className={labelCls}>{t.sortBy}</label>
                  <div className="flex gap-2">
                    <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${selectCls} flex-1`}>
                      {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                      className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-bold"
                      title={sortOrder === 'asc' ? t.sortAsc : t.sortDesc}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>

                {/* Reset */}
                {pills.length > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors text-left"
                  >
                    {t.resetAll}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-3">
          {tabs.map((tab_) => (
            <button
              key={tab_.key}
              onClick={() => setTab(tab_.key)}
              className={['flex-1 rounded-lg py-2 text-xs md:text-sm font-semibold transition-all',
                tab === tab_.key
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'].join(' ')}
            >
              {tab_.label}
            </button>
          ))}
        </div>

        {/* Active filter pills */}
        {pills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pills.map((pill) => (
              <span
                key={pill.key}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 text-xs font-medium text-indigo-700 dark:text-indigo-300"
              >
                {pill.label}
                <button onClick={pill.clear} className="hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors leading-none">×</button>
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <ul>
              {(['w-40', 'w-32', 'w-44', 'w-36', 'w-28', 'w-40'] as const).map((w, i) => (
                <li key={i} className={`flex items-center gap-4 px-4 md:px-6 py-3 md:py-4 ${i ? 'border-t border-gray-50 dark:border-gray-700' : ''}`}>
                  <div className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className={`h-3.5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse ${w}`} />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-24" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-24" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-20" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
            <p className="text-sm">{t.errNetwork}</p>
            <Button variant="ghost" onClick={load}>{t.tryAgain}</Button>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {debts.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm md:text-base text-gray-400 dark:text-gray-500">{t.noDebts}</p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-50 dark:divide-gray-700">
                  {debts.map((d) => (
                    <DebtRow key={d.id} debt={d} onClick={() => setSelectedDebt(d)} />
                  ))}
                </ul>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 md:px-6 py-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{from}–{to} / {total}</span>
                    <div className="flex items-center gap-2">
                      <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 disabled:opacity-30 hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-700 transition-colors">←</button>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[60px] text-center">{page} / {totalPages}</span>
                      <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 disabled:opacity-30 hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-700 transition-colors">→</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showAdd && (
        <AddDebtModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); load() }} />
      )}
      {selectedDebt && (
        <DebtDetailModal
          debt={selectedDebt}
          onClose={() => setSelectedDebt(null)}
          onUpdated={() => { load() }}
          onDeleted={() => { setSelectedDebt(null); load() }}
        />
      )}
    </AppLayout>
  )
}
