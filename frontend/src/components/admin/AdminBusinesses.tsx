import { useEffect, useState } from 'react'
import { getAdminBusinesses, updateBusinessPlan, type AdminBusiness } from '../../api/admin'

interface PlanModal { biz: AdminBusiness }

function PlanBadge({ status }: { status: string }) {
  if (status === 'active') return <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">Платный</span>
  return <span className="inline-flex items-center rounded-full bg-gray-700/60 px-2.5 py-0.5 text-[10px] font-semibold text-gray-400 ring-1 ring-gray-600/30">Бесплатный</span>
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-700/30 animate-pulse">
      {[48, 24, 28, 16, 16, 16, 28].map((w, i) => (
        <td key={i} className="px-5 py-3.5"><div className={`h-3 bg-gray-700 rounded w-${w}`} /></td>
      ))}
    </tr>
  )
}

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
      .catch((err) => console.error('[AdminBusinesses] load failed:', err?.response?.status, err?.message))
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
    } catch (err) {
      console.error('[AdminBusinesses] save plan failed:', err)
    } finally { setSaving(false) }
  }

  function goPage(p: number) { setPage(p); load(p) }

  return (
    <div className="space-y-4">
      <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-700/50 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Бизнесы</p>
          <p className="text-xs text-gray-500">Всего: {total}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-600 uppercase border-b border-gray-700/50">
                <th className="px-5 py-2.5 text-left font-medium">Название / Владелец</th>
                <th className="px-5 py-2.5 text-left font-medium">План</th>
                <th className="px-5 py-2.5 text-left font-medium">Истекает</th>
                <th className="px-5 py-2.5 text-center font-medium">Клиенты</th>
                <th className="px-5 py-2.5 text-center font-medium">Долги</th>
                <th className="px-5 py-2.5 text-center font-medium">Сотр.</th>
                <th className="px-5 py-2.5 text-right font-medium">Действие</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : businesses.map((b) => (
                  <tr key={b.id} className="border-b border-gray-700/30 last:border-0 hover:bg-gray-700/20 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-white">{b.name}</p>
                      <p className="text-xs text-gray-500">{b.owner_name ?? b.owner_phone}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <PlanBadge status={b.subscription_status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {b.subscription_expires_at ? new Date(b.subscription_expires_at).toLocaleDateString('ru') : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center text-gray-300 font-medium">{b.client_count}</td>
                    <td className="px-5 py-3.5 text-center text-gray-300 font-medium">{b.debt_count}</td>
                    <td className="px-5 py-3.5 text-center text-gray-300 font-medium">{b.member_count}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openPlanModal(b)}
                        className="rounded-lg bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-400 hover:text-white transition"
                      >
                        Изменить план
                      </button>
                    </td>
                  </tr>
                ))
              }
              {!loading && businesses.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-600 py-12">Нет данных</td></tr>
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

      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-700">
            <p className="text-sm font-bold text-white mb-1">Изменить план</p>
            <p className="text-xs text-indigo-400 mb-5">{planModal.biz.name}</p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Статус подписки</label>
                <select
                  value={planStatus}
                  onChange={(e) => setPlanStatus(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="free">Бесплатный</option>
                  <option value="active">Активный (платный)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Действует до</label>
                <input
                  type="date"
                  value={planExpires}
                  onChange={(e) => setPlanExpires(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPlanModal(null)} className="flex-1 rounded-xl border border-gray-700 py-2.5 text-sm text-gray-400 hover:bg-gray-700 transition">
                Отмена
              </button>
              <button onClick={handleSavePlan} disabled={saving} className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm font-semibold text-white transition disabled:opacity-40">
                {saving ? '...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
