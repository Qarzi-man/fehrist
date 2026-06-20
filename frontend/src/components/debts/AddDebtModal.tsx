import { useState, useEffect, FormEvent } from 'react'
import { useT } from '../../i18n'
import { getClients, createClient, type Client } from '../../api/clients'
import { createDebt, updateDebt, type Debt } from '../../api/debts'
import { getApiError } from '../../lib/utils'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface Props {
  onClose: () => void
  onSuccess: () => void
  debtToEdit?: Debt
}

const CURRENCIES = ['TJS', 'USD', 'RUB']

export default function AddDebtModal({ onClose, onSuccess, debtToEdit }: Props) {
  const t = useT()
  const isEdit = !!debtToEdit

  const [type, setType] = useState<'receivable' | 'payable'>(debtToEdit?.type ?? 'receivable')
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState<number | null>(debtToEdit?.client_id ?? null)
  const [newName, setNewName] = useState('')
  const [amount, setAmount] = useState(debtToEdit ? String(debtToEdit.amount) : '')
  const [currency, setCurrency] = useState(debtToEdit?.currency ?? 'TJS')
  const [description, setDescription] = useState(debtToEdit?.description ?? '')
  const [dueDate, setDueDate] = useState(debtToEdit?.due_date?.slice(0, 10) ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isEdit) getClients().then(setClients).catch(() => {})
  }, [isEdit])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!isEdit && !clientId && !newName.trim()) return setError(t.selectContact)
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return setError(t.amount + ' обязательна')

    setLoading(true)
    try {
      if (isEdit) {
        await updateDebt(debtToEdit!.id, {
          amount: Number(amount),
          currency,
          type,
          description: description.trim() || undefined,
          due_date: dueDate || undefined,
        })
      } else {
        let resolvedClientId = clientId
        if (!resolvedClientId) {
          const c = await createClient(newName.trim())
          resolvedClientId = c.id
        }
        await createDebt({
          client_id: resolvedClientId!,
          amount: Number(amount),
          currency,
          type,
          description: description.trim() || undefined,
          due_date: dueDate || undefined,
        })
      }
      onSuccess()
    } catch (err) {
      setError(getApiError(err, t.errNetwork))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEdit ? t.editDebt : t.addDebt}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Type toggle */}
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-700 p-1">
            <button type="button" onClick={() => setType('receivable')}
              className={['flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
                type === 'receivable'
                  ? 'bg-white dark:bg-gray-600 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'].join(' ')}>
              {t.iAmOwed}
            </button>
            <button type="button" onClick={() => setType('payable')}
              className={['flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
                type === 'payable'
                  ? 'bg-white dark:bg-gray-600 text-rose-700 dark:text-rose-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'].join(' ')}>
              {t.iOwe}
            </button>
          </div>

          {/* Contact — read-only in edit mode */}
          {isEdit ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.contact}</label>
              <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {debtToEdit!.client_name}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.contact}</label>
              {clients.length > 0 && (
                <select
                  value={clientId ?? ''}
                  onChange={(e) => { setClientId(e.target.value ? Number(e.target.value) : null); setNewName('') }}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-sm dark:text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">{t.newContactName}</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              )}
              {!clientId && (
                <Input
                  placeholder={t.newContactName}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              )}
            </div>
          )}

          {/* Amount + Currency */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label={t.amount}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1 w-24">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.currency}</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-[46px] w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 text-sm font-semibold dark:text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <Input
            label={t.description}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Комментарий..."
          />

          <Input
            label={t.dueDate}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          {error && <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">{t.cancel}</Button>
            <Button type="submit" loading={loading} className="flex-[2]">{t.save}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
