import { useEffect, useState } from 'react'
import { getAdminBusinesses, updateBusinessPlan, type AdminBusiness } from '../../api/admin'

interface PlanModal { biz: AdminBusiness }

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]   = useState(false)
  const [planModal, setPlanModal] = useState<PlanModal | null>(null)
  const [planStatus, setPlanStatus] = useState('free')
  const [planExpires, setPlanExpires] = useState('')
  const [saving, setSaving]     = useState(false)

  function load(p = page) {
    setLoading(true)
    getAdminBusinesses({ page: p, limit: 20 })
      .then((r) => { setBusinesses(r.data); setTotal(r.total); setTotalPages(r.totalPages) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openPlanModal(biz: AdminBusiness) {
    setPlanStatus(biz.subscription_status)
    setPlanExpires(biz.subscription_expires_at ? biz.subscription_expires_at.slice(0, 10) : '')
    setPlanModal({ biz })
  }

  async function handleSavePlan() {
    if (!planModal) return
    setSaving(true)
    try {
      await updateBusinessPlan(planModal.biz.id, {
        subscription_status: planStatus,
        subscription_expires_at: planExpires || null,
      })
      setBusinesses((prev) =>
        prev.map((b) =>
          b.id === planModal.biz.id
            ? { ...b, subscription_status: planStatus, subscription_expires_at: planExpires || null }
            : b
        )
      )
      setPlanModal(null)
    } catch {} finally { setSaving(false) }
  }

  function goPage(p: number) { setPage(p); load(p) }

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="px-5 py-3 border-b border-gray-700 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Бизнесы</p>
          <p className="text-xs text-gray-500">Всего: {total}</p>
        </div>
        {loading ? (
          <p className="text-center text-gray-400 py-10">Загрузка...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-700">
                  <th className="px-5 py-2 text-left">Название / Владелец</th>
                  <th className="px-5 py-2 text-left">План</th>
                  <th className="px-5 py-2 text-left">Истекает</th>
                  <th className="px-5 py-2 text-center">Клиенты</th>
                  <th className="px-5 py-2 text-center">Долги</th>
                  <th className="px-5 py-2 text-center">Сотр.</th>
                  <th className="px-5 py-2 text-right">Действие</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr key={b.id} className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/30">
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{b.name}</p>
                      <p className="text-xs text-gray-400">{b.owner_name ?? b.owner_phone}</p>
                    </td>
                    <td className="px-5 py-3">
                      {b.subscription_status === 'active' ? (
                        <span className="inline-flex rounded-full bg-emerald-900/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">Активный</span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-700 px-2 py-0.5 text-[10px] font-semibold text-gray-400">Бесплатный</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {b.subscription_expires_at ? new Date(b.subscription_expires_at).toLocaleDateString('ru') : '—'}
                    </td>
                    <td className="px-5 py-3 text-center text-gray-300">{b.client_count}</td>
                    <td className="px-5 py-3 text-center text-gray-300">{b.debt_count}</td>
                    <td className="px-5 py-3 text-center text-gray-300">{b.member_count}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => openPlanModal(b)}
                        className="rounded-lg bg-indigo-700 hover:bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition"
                      >
                        Изменить план
                      </button>
                    </td>
                  </tr>
                ))}
                {businesses.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-gray-500 py-10">Нет данных</td></tr>
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

      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-700">
            <p className="text-sm font-bold text-white mb-4">
              Изменить план: <span className="text-indigo-400">{planModal.biz.name}</span>
            </p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Статус</label>
                <select
                  value={planStatus}
                  onChange={(e) => setPlanStatus(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="free">Бесплатный</option>
                  <option value="active">Активный (платный)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Действует до</label>
                <input
                  type="date"
                  value={planExpires}
                  onChange={(e) => setPlanExpires(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPlanModal(null)} className="flex-1 rounded-xl border border-gray-600 py-2 text-sm text-gray-300 hover:bg-gray-700 transition">
                Отмена
              </button>
              <button onClick={handleSavePlan} disabled={saving} className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                {saving ? '...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
