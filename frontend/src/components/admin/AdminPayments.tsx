import { useEffect, useState } from 'react'
import { getAdminPayments, approveAdminPayment, rejectAdminPayment, type AdminPayment } from '../../api/admin'

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

function StatusBadge({ status }: { status: string }) {
  if (status === 'pending')  return <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400 ring-1 ring-amber-500/20">Ожидает</span>
  if (status === 'approved') return <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">Одобрено</span>
  return <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-red-400 ring-1 ring-red-500/20">Отклонено</span>
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-700/30 animate-pulse">
      {[12, 44, 28, 20, 24, 28, 32].map((w, i) => (
        <td key={i} className="px-4 py-3.5"><div className={`h-3 bg-gray-700 rounded w-${w}`} /></td>
      ))}
    </tr>
  )
}

export default function AdminPayments() {
  const [status, setStatus]   = useState<StatusFilter>('all')
  const [page, setPage]       = useState(1)
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [total, setTotal]     = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [actId, setActId]     = useState<number | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: number } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  function load(s = status, p = page) {
    setLoading(true)
    getAdminPayments({ status: s === 'all' ? undefined : s, page: p, limit: 20 })
      .then((r) => { setPayments(r.data); setTotal(r.total); setTotalPages(r.totalPages) })
      .catch((err) => console.error('[AdminPayments] load failed:', err?.response?.status, err?.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function changeStatus(s: StatusFilter) { setStatus(s); setPage(1); load(s, 1) }
  function goPage(p: number) { setPage(p); load(status, p) }

  async function handleApprove(id: number) {
    setActId(id)
    try { await approveAdminPayment(id); load() }
    catch (err) { console.error('[AdminPayments] approve failed:', err) }
    finally { setActId(null) }
  }

  async function handleReject() {
    if (!rejectModal) return
    setActId(rejectModal.id)
    try {
      await rejectAdminPayment(rejectModal.id, rejectReason)
      setRejectModal(null); setRejectReason(''); load()
    } catch (err) {
      console.error('[AdminPayments] reject failed:', err)
    } finally { setActId(null) }
  }

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all',      label: 'Все' },
    { key: 'pending',  label: 'Ожидают' },
    { key: 'approved', label: 'Одобрены' },
    { key: 'rejected', label: 'Отклонены' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap items-center">
        <div className="flex gap-1 bg-gray-800/60 rounded-xl p-1 border border-gray-700/50">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => changeStatus(t.key)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${status === t.key ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-gray-600">Всего: {total}</span>
      </div>

      <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-600 uppercase border-b border-gray-700/50">
                <th className="px-4 py-2.5 text-left font-medium">#</th>
                <th className="px-4 py-2.5 text-left font-medium">Бизнес</th>
                <th className="px-4 py-2.5 text-left font-medium">Тип</th>
                <th className="px-4 py-2.5 text-right font-medium">Сумма</th>
                <th className="px-4 py-2.5 text-center font-medium">Статус</th>
                <th className="px-4 py-2.5 text-left font-medium">Дата</th>
                <th className="px-4 py-2.5 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : payments.map((p) => (
                  <tr
                    key={p.id}
                    className={[
                      'border-b border-gray-700/30 last:border-0 transition',
                      p.status === 'pending' ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-gray-700/20',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3.5 text-gray-600 text-xs">#{p.id}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-white">{p.business_name}</p>
                      <p className="text-xs text-gray-500">{p.user_name ?? p.user_phone}</p>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">
                      {p.type === 'sms_package' ? `SMS ×${p.sms_count}` : 'Подписка'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-amber-400">{p.amount} сом.</td>
                    <td className="px-4 py-3.5 text-center"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">
                      {new Date(p.created_at).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {p.status === 'pending' && (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(p.id)}
                            disabled={actId === p.id}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white transition disabled:opacity-40"
                          >
                            Одобрить
                          </button>
                          <button
                            onClick={() => { setRejectReason(''); setRejectModal({ id: p.id }) }}
                            disabled={actId === p.id}
                            className="rounded-lg bg-red-700 hover:bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white transition disabled:opacity-40"
                          >
                            Отклонить
                          </button>
                        </div>
                      )}
                      {p.status !== 'pending' && p.note && (
                        <span className="text-xs text-gray-600 italic">{p.note.slice(0, 30)}</span>
                      )}
                    </td>
                  </tr>
                ))
              }
              {!loading && payments.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-600 py-12">Нет заявок</td></tr>
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

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-700">
            <p className="text-sm font-bold text-white mb-3">Причина отклонения</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 mb-4 resize-none"
              rows={3}
              placeholder="Необязательно"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 rounded-xl border border-gray-700 py-2.5 text-sm text-gray-400 hover:bg-gray-700 transition">Отмена</button>
              <button onClick={handleReject} disabled={!!actId} className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-sm font-semibold text-white transition disabled:opacity-40">
                {actId ? '...' : 'Отклонить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
