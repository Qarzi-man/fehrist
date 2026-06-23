import { useEffect, useState } from 'react'
import { getAdminUsers, blockAdminUser, type AdminUser } from '../../api/admin'

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
      .catch(() => {})
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
    } catch {} finally { setActId(null) }
  }

  function goPage(p: number) { setPage(p); load(search, p) }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени или телефону..."
          className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-semibold text-white transition">
          Найти
        </button>
      </form>

      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="px-5 py-3 border-b border-gray-700 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Пользователи</p>
          <p className="text-xs text-gray-500">Всего: {total}</p>
        </div>
        {loading ? (
          <p className="text-center text-gray-400 py-10">Загрузка...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-700">
                  <th className="px-5 py-2 text-left">ID</th>
                  <th className="px-5 py-2 text-left">Имя / Телефон</th>
                  <th className="px-5 py-2 text-left">Зарегистрирован</th>
                  <th className="px-5 py-2 text-center">Бизнесов</th>
                  <th className="px-5 py-2 text-center">Статус</th>
                  <th className="px-5 py-2 text-right">Действие</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/30">
                    <td className="px-5 py-3 text-gray-400">#{u.id}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{u.full_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{u.phone}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString('ru')}
                    </td>
                    <td className="px-5 py-3 text-center text-gray-300">{u.business_count}</td>
                    <td className="px-5 py-3 text-center">
                      {u.is_admin ? (
                        <span className="inline-flex rounded-full bg-purple-900/40 px-2 py-0.5 text-[10px] font-semibold text-purple-400">Admin</span>
                      ) : u.is_blocked ? (
                        <span className="inline-flex rounded-full bg-red-900/40 px-2 py-0.5 text-[10px] font-semibold text-red-400">Заблокирован</span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-900/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">Активен</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!u.is_admin && (
                        <button
                          onClick={() => handleBlock(u)}
                          disabled={actId === u.id}
                          className={[
                            'rounded-lg px-3 py-1 text-xs font-semibold text-white transition disabled:opacity-50',
                            u.is_blocked ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-red-700 hover:bg-red-600',
                          ].join(' ')}
                        >
                          {actId === u.id ? '...' : u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
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
            <button
              key={p}
              onClick={() => goPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${p === page ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
