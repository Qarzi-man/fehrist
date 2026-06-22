import { useState, useEffect } from 'react'
import { useT } from '../../i18n'
import { getClient, deleteClient, type Client, type ClientDetail } from '../../api/clients'
import { formatMoney, formatDate } from '../../lib/format'
import Spinner from '../ui/Spinner'

interface Props {
  client: Client
  onClose: () => void
  onEdit: (client: Client) => void
  onDeleted: () => void
}

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-TJ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

export default function ClientDetailModal({ client, onClose, onEdit, onDeleted }: Props) {
  const t = useT()
  const [detail, setDetail] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    getClient(client.id)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [client.id])

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      await deleteClient(client.id)
      onDeleted()
    } catch {
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const summaries = client.debts_by_currency ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 pb-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-t-3xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-lg font-bold shrink-0">
                {client.full_name[0].toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-base">{client.full_name}</p>
                {client.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{client.phone}</p>}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0 ml-2">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {client.note && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 italic">{client.note}</p>
          )}
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700 p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.activeDebts}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{client.active_debts_count}</p>
            </div>

            <div className="rounded-xl bg-gray-50 dark:bg-gray-700 p-3">
              {summaries.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center mt-1">—</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {summaries.map((s) => (
                    <div key={s.currency} className="flex flex-col">
                      {s.receivable > 0 && (
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          +{fmt(s.receivable)} {s.currency}
                        </span>
                      )}
                      {s.payable > 0 && (
                        <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                          −{fmt(s.payable)} {s.currency}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Debts list */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t.allDebts}</p>

            {loading ? (
              <div className="flex justify-center py-8 text-indigo-400">
                <Spinner size={28} />
              </div>
            ) : !detail?.debts.length ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">{t.noDebts}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {detail.debts.map((d) => {
                  const isReceivable = d.type === 'receivable'
                  const status = d.computed_status as 'active' | 'paid' | 'overdue'
                  const statusCls = {
                    active:  'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                    paid:    'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
                    overdue: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                  }[status] ?? ''
                  const statusLabel = { active: t.statusActive, paid: t.statusPaid, overdue: t.statusOverdue }[status]

                  return (
                    <li key={d.id} className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-700 px-4 py-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(d.due_date ?? d.created_at)}</p>
                        {d.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{d.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-sm font-bold ${isReceivable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isReceivable ? '+' : '−'}{formatMoney(d.amount, d.currency)}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCls}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => onEdit(client)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-600 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t.editClient}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-red-100 dark:border-red-800 py-2.5 px-4 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t.deleteClient}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2 text-center">{t.deleteClient}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 text-center">{t.confirmDeleteClient}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition"
              >
                {deleteLoading ? '...' : t.deleteClient}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
