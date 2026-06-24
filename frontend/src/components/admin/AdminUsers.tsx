import { useEffect, useState } from 'react'
import { getAdminUsers, blockAdminUser, type AdminUser } from '../../api/admin'

function Badge({ type }: { type: 'admin' | 'blocked' | 'active' }) {
  if (type === 'admin')   return <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-violet-400 ring-1 ring-violet-500/20">Admin</span>
  if (type === 'blocked') return <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-red-400 ring-1 ring-red-500/20">Заблокирован</span>
  return <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">Активен</span>
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-700/30 animate-pulse">
      {[28, 48, 32, 20, 24, 24].map((w, i) => (
        <td key={i} className="px-5 py-3.5"><div className={`h-3 bg-gray-700 rounded w-${w}`} /></td>
      ))}
    </tr>
  )
}

export default function AdminUsers() {
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [users, setUsers]     = useState<AdminUser[]>([])
  const [total, setTotal]     = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [actId, setActId]     = useState<number | null>(null)

  function load(s = search, p = page) {
    setLoading(true)
    getAdminUsers({ search: s, page: p, limit: 20 })
      .then((r) => { setUsers(r.data); setTotal(r.total); setTotalPages(r.totalPages) })
      .catch((err) => console.error('[AdminUsers] load failed:', err?.response?.status, err?.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    load(search, 1)
  }

  async function handleBlock(user: AdminUser) {
    setActId(user.id)
    try {
      await blockAdminUser(user.id, !user.is_blocked)
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_blocked: !u.is_blocked } : u))
    } catch (err) {
      console.error('[AdminUsers] block failed:', err)
    } finally { setActId(null) }
  }

  function goPage(p: number) { setPage(p); load(search, p) }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или телефону..."
            className="w-full bg-gray-800/80 border border-gray-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:bg-gray-800"
          />
        </div>
        <button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition">
          Найти
        </button>
      </form>

      <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-700/50 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Пользователи</p>
          <p className="text-xs text-gray-500">Всего: {total}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-600 uppercase border-b border-gray-700/50">
                <th className="px-5 py-2.5 text-left font-medium">ID</th>
                <th className="px-5 py-2.5 text-left font-medium">Имя / Телефон</th>
                <th className="px-5 py-2.5 text-left font-medium">Дата</th>
                <th className="px-5 py-2.5 text-center font-medium">Бизнесов</th>
                <th className="px-5 py-2.5 text-center font-medium">Статус</th>
                <th className="px-5 py-2.5 text-right font-medium">Действие</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-700/30 last:border-0 hover:bg-gray-700/20 transition">
                    <td className="px-5 py-3.5 text-gray-600 text-xs">#{u.id}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-white">{u.full_name ?? '—'}</p>
                      <p className="text-xs text-gray-500">{u.phone}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString('ru')}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="text-gray-300 font-medium">{u.business_count}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge type={u.is_admin ? 'admin' : u.is_blocked ? 'blocked' : 'active'} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {!u.is_admin && (
                        <button
                          onClick={() => handleBlock(u)}
                          disabled={actId === u.id}
                          className={[
                            'rounded-lg px-3 py-1 text-xs font-semibold text-white transition disabled:opacity-40',
                            u.is_blocked ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-red-700 hover:bg-red-600',
                          ].join(' ')}
                        >
                          {actId === u.id ? '...' : u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              }
              {!loading && users.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-600 py-12">Нет данных</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => goPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${p === page ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
