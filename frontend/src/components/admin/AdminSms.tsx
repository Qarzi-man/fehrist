import { useEffect, useState } from 'react'
import { getAdminSmsLogs, type AdminSmsLog } from '../../api/admin'

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
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilter(e: React.FormEvent) { e.preventDefault(); setPage(1); load(1) }
  function goPage(p: number) { setPage(p); load(p) }

  const statusColor = (s: string) => {
    if (s === 'sent')    return 'text-emerald-400'
    if (s === 'failed')  return 'text-red-400'
    return 'text-gray-400'
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleFilter} className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">С:</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">По:</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-semibold text-white transition">
          Применить
        </button>
        <span className="ml-auto text-xs text-gray-500 self-center">Всего: {total}</span>
      </form>

      <div className="bg-gray-800 rounded-xl border border-gray-700">
        {loading ? (
          <p className="text-center text-gray-400 py-10">Загрузка...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-700">
                  <th className="px-4 py-2 text-left">Бизнес</th>
                  <th className="px-4 py-2 text-left">Телефон</th>
                  <th className="px-4 py-2 text-left">Шаблон</th>
                  <th className="px-4 py-2 text-center">Статус</th>
                  <th className="px-4 py-2 text-left">Дата</th>
                  <th className="px-4 py-2 text-left">Сообщение</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-white font-medium">{l.business_name}</td>
                    <td className="px-4 py-3 text-gray-300">{l.phone}</td>
                    <td className="px-4 py-3 text-gray-400">{l.template_key ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold ${statusColor(l.status)}`}>{l.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(l.created_at).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{l.message}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-10">Нет данных</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => goPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${p === page ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
