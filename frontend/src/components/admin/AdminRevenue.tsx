import { useEffect, useState } from 'react'
import { getAdminRevenue, type RevenueRow } from '../../api/admin'

type Period = 'day' | 'week' | 'month'

const TYPE_LABEL: Record<string, string> = {
  subscription: 'Подписка',
  sms:          'SMS пакет',
}

const TYPE_BADGE: Record<string, string> = {
  subscription: 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30',
  sms:          'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
}

function exportCsv(rows: RevenueRow[], total: number) {
  const header = ['Дата', 'Тип', 'Выручка (сом.)', 'Заявок']
  const body   = rows.map((r) => [
    r.date,
    TYPE_LABEL[r.type] ?? r.type,
    parseFloat(String(r.revenue)).toFixed(2),
    r.count,
  ])
  const footer = ['ИТОГО', '', total.toFixed(2), rows.reduce((s, r) => s + r.count, 0)]
  const csv    = [header, ...body, footer].map((r) => r.join(',')).join('\n')
  const blob   = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href = url
  a.download = `revenue-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function AdminRevenue() {
  const [period, setPeriod]         = useState<Period>('month')
  const [rows, setRows]             = useState<RevenueRow[]>([])
  const [total, setTotal]           = useState(0)
  const [totalSub, setTotalSub]     = useState(0)
  const [totalSms, setTotalSms]     = useState(0)
  const [loading, setLoading]       = useState(false)

  function load(p = period) {
    setLoading(true)
    getAdminRevenue({ period: p })
      .then((r) => {
        setRows(r.data)
        setTotal(r.total)
        setTotalSub(r.total_subscription ?? 0)
        setTotalSms(r.total_sms ?? 0)
      })
      .catch((err) => console.error('[AdminRevenue] load failed:', err?.response?.status, err?.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function changePeriod(p: Period) { setPeriod(p); load(p) }

  const periods: { key: Period; label: string }[] = [
    { key: 'day',   label: 'Сегодня' },
    { key: 'week',  label: 'Неделя'  },
    { key: 'month', label: 'Месяц'   },
  ]

  const totalCount = rows.reduce((s, r) => s + r.count, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-800/60 rounded-xl p-1 border border-gray-700/50">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => changePeriod(p.key)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${period === p.key ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => exportCsv(rows, total)}
          className="ml-auto rounded-xl bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-600/30 px-4 py-2 text-xs font-semibold text-emerald-300 hover:text-white transition flex items-center gap-2"
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Экспорт CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 border border-indigo-500/20 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-2">Выручка от подписок</p>
          <p className="text-2xl font-bold text-indigo-300">{totalSub.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">сомони</p>
        </div>
        <div className="bg-gradient-to-br from-amber-600/20 to-amber-600/5 border border-amber-500/20 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-2">Выручка от SMS пакетов</p>
          <p className="text-2xl font-bold text-amber-300">{totalSms.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">сомони</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-2">Итого за период</p>
          <p className="text-2xl font-bold text-emerald-300">{total.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{totalCount} транзакций</p>
        </div>
      </div>

      <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between px-5 py-3.5 border-b border-gray-700/30 animate-pulse">
                <div className="h-3 bg-gray-700 rounded w-24" />
                <div className="h-3 bg-gray-700 rounded w-20" />
                <div className="h-3 bg-gray-700 rounded w-16" />
                <div className="h-3 bg-gray-700 rounded w-8" />
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-600 uppercase border-b border-gray-700/50">
                <th className="px-5 py-2.5 text-left font-medium">Дата</th>
                <th className="px-5 py-2.5 text-left font-medium">Тип</th>
                <th className="px-5 py-2.5 text-right font-medium">Выручка (сом.)</th>
                <th className="px-5 py-2.5 text-right font-medium">Заявок</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-700/30 last:border-0 hover:bg-gray-700/20 transition">
                  <td className="px-5 py-3.5 text-gray-300">{r.date}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${TYPE_BADGE[r.type] ?? 'bg-gray-700/50 text-gray-400'}`}>
                      {TYPE_LABEL[r.type] ?? r.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-emerald-400">{parseFloat(String(r.revenue)).toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-right text-gray-400">{r.count}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="text-center text-gray-600 py-12">Нет данных за период</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
