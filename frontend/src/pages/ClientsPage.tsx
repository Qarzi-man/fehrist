import { useState, useEffect, useCallback } from 'react'
import { useT } from '../i18n'
import { getClients, type Client, type PaginatedClients, type ClientDebtSummary } from '../api/clients'
import AppLayout from '../components/layout/AppLayout'
import ClientFormModal from '../components/clients/ClientFormModal'
import ClientDetailModal from '../components/clients/ClientDetailModal'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

const LIMIT = 20

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-TJ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

function DebtSummaryLine({ summaries }: { summaries: ClientDebtSummary[] }) {
  const lines: { label: string; color: string }[] = []
  for (const s of summaries) {
    if (s.receivable > 0) lines.push({ label: `+${fmt(s.receivable)} ${s.currency}`, color: 'text-emerald-600 dark:text-emerald-400' })
    if (s.payable    > 0) lines.push({ label: `−${fmt(s.payable)}    ${s.currency}`, color: 'text-rose-600 dark:text-rose-400' })
  }
  if (!lines.length) return null
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
      {lines.map((l, i) => (
        <span key={i} className={`text-xs font-semibold ${l.color}`}>{l.label}</span>
      ))}
    </div>
  )
}

function ClientRow({ client, onClick }: { client: Client; onClick: () => void }) {
  const t = useT()
  return (
    <li
      onClick={onClick}
      className="flex items-center gap-4 px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
    >
      <div className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
        {client.full_name[0].toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white truncate">{client.full_name}</p>
        {client.phone && (
          <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500">{client.phone}</p>
        )}
        <DebtSummaryLine summaries={client.debts_by_currency ?? []} />
      </div>

      <div className="shrink-0 text-right">
        {client.active_debts_count > 0 ? (
          <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            {client.active_debts_count}
          </span>
        ) : (
          <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t.activeDebts}</p>
      </div>
    </li>
  )
}

export default function ClientsPage() {
  const t = useT()
  const [result, setResult] = useState<PaginatedClients | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(false)
    getClients({ search: search.trim() || undefined, page, limit: LIMIT })
      .then(setResult)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [search, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search])

  const clients    = result?.data ?? []
  const total      = result?.total ?? 0
  const totalPages = result?.totalPages ?? 1
  const from = total === 0 ? 0 : (page - 1) * LIMIT + 1
  const to   = Math.min(page * LIMIT, total)

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">{t.clients}</h1>
          <Button onClick={() => setShowAdd(true)} className="text-sm md:text-base px-4 md:px-5 py-2 md:py-2.5">
            {t.addClient}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchContact}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30"
          />
        </div>

        {/* Content */}
        {loading && (
          <div className="flex justify-center py-20 text-indigo-400">
            <Spinner size={36} />
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
            <p className="text-sm">{t.errNetwork}</p>
            <Button variant="ghost" onClick={load}>{t.tryAgain}</Button>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {clients.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-4xl mb-3">👥</p>
                <p className="text-sm md:text-base text-gray-400 dark:text-gray-500">{t.noClients}</p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-50 dark:divide-gray-700">
                  {clients.map((c) => (
                    <ClientRow key={c.id} client={c} onClick={() => setSelectedClient(c)} />
                  ))}
                </ul>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 md:px-6 py-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {from}–{to} / {total}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 disabled:opacity-30 hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-700 transition-colors"
                      >
                        ←
                      </button>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
                        {page} / {totalPages}
                      </span>
                      <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 disabled:opacity-30 hover:enabled:bg-gray-50 dark:hover:enabled:bg-gray-700 transition-colors"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showAdd && (
        <ClientFormModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); load() }}
        />
      )}

      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onEdit={(c) => { setSelectedClient(null); setEditingClient(c) }}
          onDeleted={() => { setSelectedClient(null); load() }}
        />
      )}

      {editingClient && (
        <ClientFormModal
          clientToEdit={editingClient}
          onClose={() => setEditingClient(null)}
          onSuccess={() => { setEditingClient(null); load() }}
        />
      )}
    </AppLayout>
  )
}
