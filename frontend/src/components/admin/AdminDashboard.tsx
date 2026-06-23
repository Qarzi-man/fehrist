import { useEffect, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { getAdminStats, approveAdminPayment, rejectAdminPayment, type AdminStats, type AdminPayment } from '../../api/admin'

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

interface Props { onApprove?: () => void }

export default function AdminDashboard({ onApprove }: Props) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState<{ id: number } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actLoading, setActLoading] = useState(false)

  function load() {
    setLoading(true)
    getAdminStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleApprove(id: number) {
    setActLoading(true)
    try { await approveAdminPayment(id); load(); onApprove?.() } catch {} finally { setActLoading(false) }
  }

  async function handleReject() {
    if (!rejectModal) return
    setActLoading(true)
    try { await rejectAdminPayment(rejectModal.id, rejectReason); setRejectModal(null); setRejectReason(''); load() }
    catch {} finally { setActLoading(false) }
  }

  if (loading || !stats) return <p className="text-gray-400 p-8">{loading ? 'Загрузка...' : 'Ошибка'}</p>

  const dateLabel = (d: string) => {
    const dt = new Date(d)
    return `${dt.getDate()}.${dt.getMonth() + 1}`
  }

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Всего пользователей" value={stats.totalUsers} sub={`+${stats.newUsers7d} за 7д`} />
        <MetricCard label="Всего бизнесов" value={stats.totalBusinesses} sub={`+${stats.newUsers30d} за 30д`} />
        <MetricCard label="MRR (сом.)" value={stats.mrr.toFixed(0)} sub={`Конверсия: ${stats.conversionRate}%`} />
        <MetricCard label="SMS сегодня" value={stats.smsToday} sub={`${stats.smsMonth} за месяц`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="DAU" value={stats.dau} />
        <MetricCard label="MAU" value={stats.mau} />
        <MetricCard label="Всего долгов" value={stats.totalDebts} />
        <MetricCard label="Новые за 30д" value={stats.newUsers30d} />
      </div>

      {/* Registration chart */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <p className="text-sm font-semibold text-white mb-4">Новые регистрации (последние 30 дней)</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={stats.dailyRegistrations}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" tickFormatter={dateLabel} tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#818cf8' }}
              labelFormatter={(d) => dateLabel(String(d))}
            />
            <Line type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={2} dot={false} name="Регистрации" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent pending payments */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="px-5 py-4 border-b border-gray-700">
          <p className="text-sm font-semibold text-white">Последние заявки на оплату (ожидают)</p>
        </div>
        {stats.recentPendingPayments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Нет ожидающих заявок</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-700">
                <th className="px-5 py-2 text-left">Бизнес / Пользователь</th>
                <th className="px-5 py-2 text-left">Тип</th>
                <th className="px-5 py-2 text-right">Сумма</th>
                <th className="px-5 py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPendingPayments.map((p: AdminPayment) => (
                <tr key={p.id} className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/30">
                  <td className="px-5 py-3">
                    <p className="font-medium text-white">{p.business_name}</p>
                    <p className="text-xs text-gray-400">{p.user_name ?? p.user_phone}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-300">
                    {p.type === 'sms_package' ? `SMS ×${p.sms_count}` : 'Подписка'}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-amber-400">{p.amount} сом.</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleApprove(p.id)}
                        disabled={actLoading}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1 text-xs font-semibold text-white transition disabled:opacity-50"
                      >
                        Одобрить
                      </button>
                      <button
                        onClick={() => { setRejectReason(''); setRejectModal({ id: p.id }) }}
                        disabled={actLoading}
                        className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1 text-xs font-semibold text-white transition disabled:opacity-50"
                      >
                        Отклонить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-700">
            <p className="text-sm font-bold text-white mb-3">Причина отклонения</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 mb-4 resize-none"
              rows={3}
              placeholder="Необязательно"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 rounded-xl border border-gray-600 py-2 text-sm text-gray-300 hover:bg-gray-700 transition">Отмена</button>
              <button onClick={handleReject} disabled={actLoading} className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                {actLoading ? '...' : 'Отклонить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
