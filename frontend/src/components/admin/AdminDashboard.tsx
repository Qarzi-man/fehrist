import { useEffect, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { getAdminStats, approveAdminPayment, rejectAdminPayment, type AdminStats, type AdminPayment } from '../../api/admin'

const CARD_GRADIENTS = [
  'from-indigo-600/20 to-indigo-600/5 border-indigo-500/20',
  'from-violet-600/20 to-violet-600/5 border-violet-500/20',
  'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20',
  'from-amber-600/20 to-amber-600/5 border-amber-500/20',
]
const CARD_VALUE_COLORS = ['text-indigo-300', 'text-violet-300', 'text-emerald-300', 'text-amber-300']
const CARD_ICONS = [
  <svg key="u" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  <svg key="b" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  <svg key="m" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg key="s" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
]

function MetricCard({ label, value, sub, idx }: { label: string; value: string | number; sub?: string; idx: number }) {
  return (
    <div className={`bg-gradient-to-br ${CARD_GRADIENTS[idx]} border rounded-2xl p-4`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <span className={`${CARD_VALUE_COLORS[idx]} opacity-60`}>{CARD_ICONS[idx]}</span>
      </div>
      <p className={`text-2xl font-bold ${CARD_VALUE_COLORS[idx]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1.5">{sub}</p>}
    </div>
  )
}

function SkeletonCard() {
  return <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4 animate-pulse"><div className="h-3 bg-gray-700 rounded w-24 mb-3" /><div className="h-7 bg-gray-700 rounded w-16 mb-2" /><div className="h-3 bg-gray-700 rounded w-20" /></div>
}

interface Props { onApprove?: () => void }

export default function AdminDashboard({ onApprove }: Props) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: number } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actLoading, setActLoading] = useState(false)

  function load() {
    setLoading(true)
    setError(null)
    getAdminStats()
      .then(setStats)
      .catch((err) => {
        console.error('[AdminDashboard] stats load failed:', err?.response?.status, err?.response?.data, err?.message)
        setError(err?.response?.data?.error ?? err?.message ?? 'Ошибка загрузки')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleApprove(id: number) {
    setActLoading(true)
    try { await approveAdminPayment(id); load(); onApprove?.() }
    catch (err) { console.error('[AdminDashboard] approve failed:', err) }
    finally { setActLoading(false) }
  }

  async function handleReject() {
    if (!rejectModal) return
    setActLoading(true)
    try { await rejectAdminPayment(rejectModal.id, rejectReason); setRejectModal(null); setRejectReason(''); load() }
    catch (err) { console.error('[AdminDashboard] reject failed:', err) }
    finally { setActLoading(false) }
  }

  const dateLabel = (d: string) => {
    const dt = new Date(d)
    return `${dt.getDate()}.${dt.getMonth() + 1}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 animate-pulse" style={{ height: 280 }} />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-xl bg-red-900/30 flex items-center justify-center mb-4">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm text-red-400 font-semibold mb-1">Ошибка загрузки данных</p>
        <p className="text-xs text-gray-500 mb-5 max-w-xs">{error ?? 'Проверьте консоль браузера для деталей'}</p>
        <button
          onClick={load}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-semibold text-white transition"
        >
          Повторить
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Main metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard idx={0} label="Всего пользователей" value={stats.totalUsers} sub={`+${stats.newUsers7d} за 7 дней`} />
        <MetricCard idx={1} label="Всего бизнесов"      value={stats.totalBusinesses} sub={`+${stats.newUsers30d} за 30 дней`} />
        <MetricCard idx={2} label="MRR (сом.)"          value={stats.mrr.toFixed(0)} sub={`Конверсия: ${stats.conversionRate}%`} />
        <MetricCard idx={3} label="SMS сегодня"         value={stats.smsToday} sub={`${stats.smsMonth} за месяц`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">DAU</p>
          <p className="text-xl font-bold text-white">{stats.dau}</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">MAU</p>
          <p className="text-xl font-bold text-white">{stats.mau}</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Всего долгов</p>
          <p className="text-xl font-bold text-white">{stats.totalDebts}</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Новых за 30д</p>
          <p className="text-xl font-bold text-white">{stats.newUsers30d}</p>
        </div>
      </div>

      {/* Registration chart */}
      <div className="bg-gray-800/60 rounded-2xl p-5 border border-gray-700/50">
        <p className="text-sm font-semibold text-white mb-4">Новые регистрации — последние 30 дней</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={stats.dailyRegistrations}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" tickFormatter={dateLabel} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,.4)' }}
              labelStyle={{ color: '#9ca3af', fontSize: 11 }}
              itemStyle={{ color: '#818cf8', fontSize: 12 }}
              labelFormatter={(d) => dateLabel(String(d))}
            />
            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Регистрации" activeDot={{ r: 5, fill: '#818cf8' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent pending payments */}
      <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Ожидающие заявки на оплату</p>
          {stats.recentPendingPayments.length > 0 && (
            <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 rounded-full px-2 py-0.5">
              {stats.recentPendingPayments.length}
            </span>
          )}
        </div>
        {stats.recentPendingPayments.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-8">Нет ожидающих заявок</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-600 uppercase border-b border-gray-700/50">
                <th className="px-5 py-2.5 text-left font-medium">Бизнес</th>
                <th className="px-5 py-2.5 text-left font-medium">Тип</th>
                <th className="px-5 py-2.5 text-right font-medium">Сумма</th>
                <th className="px-5 py-2.5 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPendingPayments.map((p: AdminPayment) => (
                <tr key={p.id} className="border-b border-gray-700/30 last:border-0 hover:bg-gray-700/20 transition">
                  <td className="px-5 py-3">
                    <p className="font-medium text-white">{p.business_name}</p>
                    <p className="text-xs text-gray-500">{p.user_name ?? p.user_phone}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {p.type === 'sms_package' ? `SMS ×${p.sms_count}` : 'Подписка'}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-amber-400">{p.amount} сом.</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleApprove(p.id)}
                        disabled={actLoading}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition disabled:opacity-40"
                      >
                        Одобрить
                      </button>
                      <button
                        onClick={() => { setRejectReason(''); setRejectModal({ id: p.id }) }}
                        disabled={actLoading}
                        className="rounded-lg bg-red-700 hover:bg-red-600 px-3 py-1 text-xs font-semibold text-white transition disabled:opacity-40"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-700">
            <p className="text-sm font-bold text-white mb-3">Причина отклонения</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 mb-4 resize-none"
              rows={3}
              placeholder="Необязательно"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 rounded-xl border border-gray-700 py-2 text-sm text-gray-400 hover:bg-gray-700 transition">Отмена</button>
              <button onClick={handleReject} disabled={actLoading} className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 py-2 text-sm font-semibold text-white transition disabled:opacity-40">
                {actLoading ? '...' : 'Отклонить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
