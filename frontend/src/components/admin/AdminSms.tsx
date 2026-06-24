import { useEffect, useState } from 'react'
import { getAdminSmsLogs, type AdminSmsLog } from '../../api/admin'

function StatusBadge({ status }: { status: string }) {
  if (status === 'sent')   return <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">sent</span>
  if (status === 'failed') return <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-red-400 ring-1 ring-red-500/20">failed</span>
  return <span className="inline-flex items-center rounded-full bg-gray-700/60 px-2.5 py-0.5 text-[10px] font-semibold text-gray-400 ring-1 ring-gray-600/30">{status}</span>
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-700/30 animate-pulse">
      {[36, 28, 20, 20, 28, 44].map((w, i) => (
        <td key={i} className="px-4 py-3.5"><div className={`h-3 bg-gray-700 rounded w-${w}`} /></td>
      ))}
    </tr>
  )
}

export default function AdminSms() {
  const [logs, setLogs]       = useState<AdminSmsLog[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')

  function load(p = page, df = dateFrom, dt = dateTo) {
    setLoading(true)
    getAdminSmsLogs({ dateFrom: df || undefined, dateTo: dt || undefined, page: p, limit: 20 })
      .then((r) => { setLogs(r.data); setTotal(r.total); setTotalPages(r.totalPages) })
      .catch((err) => console.error('[AdminSms] load failed:', err?.response?.status, err?.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilter(e: React.FormEvent) { e.preventDefault(); setPage(1); load(1) }
  function goPage(p: number) { setPage(p); load(p) }

  return (
    <div className="space-y-4">
      <form onSubmit={handleFilter} className="flex gap-3 flex-wrap items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-gray-500 font-medium">С даты</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="bg-gray-800/80 border border-gray-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-gray-500 font-medium">По дату</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="bg-gray-800/80 border border-gray-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition">
          Применить
        </button>
        <span className="ml-auto text-xs text-gray-600 self-center">Всего: {total}</span>
      </form>

      <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-600 uppercase border-b border-gray-700/50">
                <th className="px-4 py-2.5 text-left font-medium">Бизнес</th>
                <th className="px-4 py-2.5 text-left font-medium">Телефон</th>
                <th className="px-4 py-2.5 text-left font-medium">Шаблон</th>
                <th className="px-4 py-2.5 text-center font-medium">Статус</th>
                <th className="px-4 py-2.5 text-left font-medium">Дата</th>
                <th className="px-4 py-2.5 text-left font-medium">Сообщение</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : logs.map((l) => (
                  <tr key={l.id} className="border-b border-gray-700/30 last:border-0 hover:bg-gray-700/20 transition">
                    <td className="px-4 py-3.5 text-white font-medium">{l.business_name}</td>
                    <td className="px-4 py-3.5 text-gray-400">{l.phone}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{l.template_key ?? '—'}</td>
                    <td className="px-4 py-3.5 text-center"><StatusBadge status={l.status} /></td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">
                      {new Date(l.created_at).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 max-w-[220px] truncate">{l.message}</td>
                  </tr>
                ))
              }
              {!loading && logs.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-600 py-12">Нет данных</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => goPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${p === page ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}
            >{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
