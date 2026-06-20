import { useState, useEffect, FormEvent } from 'react'
import { useT } from '../../i18n'
import {
  type Debt, type Repayment,
  getRepayments, addRepayment, deleteDebt,
} from '../../api/debts'
import { formatMoney, formatDate } from '../../lib/format'
import { getApiError } from '../../lib/utils'
import Button from '../ui/Button'
import Input from '../ui/Input'
import AddDebtModal from './AddDebtModal'

interface Props {
  debt: Debt
  onClose: () => void
  onUpdated: () => void
  onDeleted: () => void
}

export default function DebtDetailModal({ debt, onClose, onUpdated, onDeleted }: Props) {
  const t = useT()
  const [repayments, setRepayments] = useState<Repayment[]>([])
  const [loadingR, setLoadingR] = useState(true)
  const [showPayForm, setShowPayForm] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payNote, setPayNote] = useState('')
  const [payError, setPayError] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const isReceivable = debt.type === 'receivable'
  const status = debt.computed_status

  useEffect(() => {
    getRepayments(debt.id)
      .then(setRepayments)
      .catch(() => {})
      .finally(() => setLoadingR(false))
  }, [debt.id])

  async function handleAddPayment(e: FormEvent) {
    e.preventDefault()
    setPayError('')
    const amt = Number(payAmount)
    if (!amt || amt <= 0) { setPayError(t.amount + ' обязательна'); return }
    setPayLoading(true)
    try {
      const r = await addRepayment(debt.id, amt, payNote.trim() || undefined)
      setRepayments((prev) => [r, ...prev])
      setPayAmount('')
      setPayNote('')
      setShowPayForm(false)
      onUpdated()
    } catch (err) {
      setPayError(getApiError(err, t.errNetwork))
    } finally {
      setPayLoading(false)
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      await deleteDebt(debt.id)
      onDeleted()
    } catch {
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const statusCls = {
    active:  'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    paid:    'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    overdue: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  }[status] ?? 'bg-gray-50 text-gray-600'

  const statusLabel = { active: t.statusActive, paid: t.statusPaid, overdue: t.statusOverdue }[status]

  if (showEdit) {
    return (
      <AddDebtModal
        debtToEdit={debt}
        onClose={() => setShowEdit(false)}
        onSuccess={() => { setShowEdit(false); onUpdated(); onClose() }}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-6 pb-4 ${isReceivable ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'} rounded-t-3xl sm:rounded-t-3xl`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${isReceivable ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-800 text-rose-700 dark:text-rose-300'}`}>
                {debt.client_name[0].toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-base">{debt.client_name}</p>
                {debt.client_phone && <p className="text-sm text-gray-500 dark:text-gray-400">{debt.client_phone}</p>}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0 ml-2">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isReceivable ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-800 text-rose-700 dark:text-rose-300'}`}>
              {isReceivable ? t.receivable : t.payable}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCls}`}>{statusLabel}</span>
            {debt.due_date && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{t.dueDate.split(' ')[0]}: {formatDate(debt.due_date)}</span>
            )}
          </div>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Amount summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700 p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.totalDebt}</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">{formatMoney(debt.amount, debt.currency)}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">{t.paidAmount}</p>
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">{formatMoney(debt.total_paid, debt.currency)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${Number(debt.remaining) > 0 ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
              <p className={`text-xs mb-1 ${Number(debt.remaining) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500 dark:text-gray-400'}`}>{t.remaining}</p>
              <p className={`text-base font-bold ${Number(debt.remaining) > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-gray-700 dark:text-gray-300'}`}>
                {formatMoney(Math.max(0, Number(debt.remaining)), debt.currency)}
              </p>
            </div>
          </div>

          {debt.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">{debt.description}</p>
          )}

          {/* Add payment */}
          {status !== 'paid' && (
            <div>
              {showPayForm ? (
                <form onSubmit={handleAddPayment} className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 flex flex-col gap-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.addPayment}</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        label={t.amount}
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        step="0.01"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="pt-6 text-sm font-semibold text-gray-500 dark:text-gray-400 self-center">{debt.currency}</div>
                  </div>
                  <Input
                    label={t.paymentNote}
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="..."
                  />
                  {payError && <p className="text-sm text-red-600 dark:text-red-400">{payError}</p>}
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowPayForm(false)} className="flex-1">{t.cancel}</Button>
                    <Button type="submit" loading={payLoading} className="flex-[2]">{t.save}</Button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowPayForm(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-700 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  {t.addPayment}
                </button>
              )}
            </div>
          )}

          {/* Payment history */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t.paymentHistory}</p>
            {loadingR ? (
              <p className="text-sm text-gray-400 text-center py-4">{t.loading}</p>
            ) : repayments.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t.noPayments}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {repayments.map((r) => (
                  <li key={r.id} className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-700 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{formatMoney(r.amount, debt.currency)}</p>
                      {r.note && <p className="text-xs text-gray-500 dark:text-gray-400">{r.note}</p>}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(r.paid_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setShowEdit(true)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-600 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t.editDebt}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-red-100 dark:border-red-800 py-2.5 px-4 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t.deleteDebt}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2 text-center">{t.deleteDebt}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 text-center">{t.confirmDeleteDebt}</p>
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
                {deleteLoading ? '...' : t.deleteDebt}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
