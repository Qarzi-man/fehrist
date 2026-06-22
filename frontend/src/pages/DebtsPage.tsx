import { useState, useEffect, useCallback } from 'react'
import { useT } from '../i18n'
import { getDebts, type Debt, type PaginatedDebts } from '../api/debts'
import { formatMoney, formatDate } from '../lib/format'
import AppLayout from '../components/layout/AppLayout'
import AddDebtModal from '../components/debts/AddDebtModal'
import DebtDetailModal from '../components/debts/DebtDetailModal'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

type FilterTab = 'all' | 'receivable' | 'payable' | 'overdue'

const CURRENCIES = ['TJS', 'USD', 'EUR', 'RUB']
const LIMIT = 20

const selectCls = 'rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30'

function DebtRow({ debt, onClick }: { debt: Debt; onClick: () => void }) {
  const t = useT()
  const isReceivable = debt.type === 'receivable'
  const status = debt.computed_status

  const statusCls = {
    active:  'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    paid:    'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    overdue: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  }[status] ?? 'bg-gray-50 text-gray-500'

  const statusLabel = { active: t.statusActive, paid: t.statusPaid, overdue: t.statusOverdue }[status]

  return (
    <li
      onClick={onClick}
      className="flex items-center gap-4 px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
    >
      <div className={`h-10 w-10 md:h-11 md:w-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isReceivable ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'}`}>
        {debt.client_name[0].toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white truncate">{debt.client_name}</p>
        <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500">{formatDate(debt.due_date ?? debt.created_at)}</p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-sm md:text-base font-bold ${isReceivable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {isReceivable ? '+' : '−'}{formatMoney(debt.amount, debt.currency)}
        </span>
        <div className="flex gap-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isReceivable ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'}`}>
            {isReceivable ? t.receivable : t.payable}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCls}`}>{statusLabel}</span>
        </div>
      </div>
    </li>
  )
}

export default function DebtsPage() {
  const t = useT()
  const [result, setResult] = useState<PaginatedDebts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [currency, setCurrency] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(false)
    const filters: Record<string, string | number> = { page, limit: LIMIT }
    if (tab === 'receivable') filters.type = 'receivable'
    else if (tab === 'payable') filters.type = 'payable'
    else if (tab === 'overdue') filters.status = 'overdue'
    if (search.trim()) filters.search = search.trim()
    if (currency) filters.currency = currency
    if (dateFrom) filters.date_from = dateFrom
    if (dateTo)   filters.date_to   = dateTo
    getDebts(filters)
      .then(setResult)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [tab, search, currency, dateFrom, dateTo, page])

  useEffect(() => { load() }, [load])

  // Reset to page 1 when any filter changes (not when page itself changes)
  useEffect(() => { setPage(1) }, [tab, search, currency, dateFrom, dateTo])

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

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">{t.debts}</h1>
          <Button onClick={() => setShowAdd(true)} className="text-sm md:text-base px-4 md:px-5 py-2 md:py-2.5">
            {t.addDebt}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
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

        {/* Extra filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={selectCls}
          >
            <option value="">{t.allCurrencies}</option>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{t.dateFrom}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={selectCls}
            />
          </div>

          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{t.dateTo}</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={selectCls}
            />
          </div>

          {(currency || dateFrom || dateTo) && (
            <button
              onClick={() => { setCurrency(''); setDateFrom(''); setDateTo('') }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        {loading && (
          <div className="flex justify-center py-20 text-indigo-400">
            <Spinner size={36} />
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 md:px-6 py-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {from}–{to} / {total}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 disabled:opacity-30 hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-700 transition-colors"
                      >
                        ←
                      </button>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
                        {page} / {totalPages}
                      </span>
                      <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 disabled:opacity-30 hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-700 transition-colors"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showAdd && (
        <AddDebtModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); load() }}
        />
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
