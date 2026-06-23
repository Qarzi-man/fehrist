import { useEffect, useState } from 'react'
import { getAdminRevenue, type RevenueRow } from '../../api/admin'

type Period = 'day' | 'week' | 'month'

function exportCsv(rows: RevenueRow[], total: number) {
  const header = ['Дата', 'Выручка (сом.)', 'Заявок']
  const body = rows.map((r) => [r.date, parseFloat(String(r.revenue)).toFixed(2), r.count])
  const footer = ['ИТОГО', total.toFixed(2), rows.reduce((s, r) => s + r.count, 0)]
  const csv = [header, ...body, footer].map((r) => r.join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `revenue-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function AdminRevenue() {
  const [period, setPeriod]   = useState<Period>('month')
  const [rows, setRows]       = useState<RevenueRow[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)

  function load(p = period) {
    setLoading(true)
    getAdminRevenue({ period: p })
      .then((r) => { setRows(r.data); setTotal(r.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function changePeriod(p: Period) { setPeriod(p); load(p) }

  const periods: { key: Period; label: string }[] = [
    { key: 'day',   label: 'Сегодня' },
    { key: 'week',  label: 'Неделя' },
    { key: 'month', label: 'Месяц' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 bg-gray-800 rounded-xl p-1 border border-gray-700">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => changePeriod(p.key)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${period === p.key ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => exportCsv(rows, total)}
          className="ml-auto rounded-xl bg-emerald-700 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition flex items-center gap-2"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Экспорт CSV
        </button>
      </div>

      {/* Total card */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1">Итого выручка за период</p>
          <p className="text-3xl font-bold text-emerald-400">{total.toFixed(2)} <span className="text-lg font-medium text-gray-400">сом.</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-1">Одобрено заявок</p>
          <p className="text-xl font-bold text-white">{rows.reduce((s, r) => s + r.count, 0)}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700">
        {loading ? (
          <p className="text-center text-gray-400 py-10">Загрузка...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-700">
                  <th className="px-5 py-2 text-left">Дата</th>
                  <th className="px-5 py-2 text-right">Выручка (сом.)</th>
                  <th className="px-5 py-2 text-right">Заявок</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/30">
                    <td className="px-5 py-3 text-gray-300">{r.date}</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-400">{parseFloat(String(r.revenue)).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right text-gray-300">{r.count}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={3} className="text-center text-gray-500 py-10">Нет данных за период</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
