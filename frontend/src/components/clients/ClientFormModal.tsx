import { useState, FormEvent } from 'react'
import { useT } from '../../i18n'
import { createClient, updateClient, type Client } from '../../api/clients'
import { getApiError, getLimitError, type LimitError } from '../../lib/utils'
import Button from '../ui/Button'
import Input from '../ui/Input'
import LimitModal from '../ui/LimitModal'

interface Props {
  clientToEdit?: Client
  onClose: () => void
  onSuccess: () => void
}

export default function ClientFormModal({ clientToEdit, onClose, onSuccess }: Props) {
  const t = useT()
  const isEdit = !!clientToEdit

  const [name, setName]   = useState(clientToEdit?.full_name ?? '')
  const [phone, setPhone] = useState(clientToEdit?.phone ?? '')
  const [note, setNote]   = useState(clientToEdit?.note ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [limitError, setLimitError] = useState<LimitError | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError(t.errNameRequired); return }
    setError('')
    setLoading(true)
    try {
      if (isEdit) {
        await updateClient(clientToEdit!.id, {
          full_name: name.trim(),
          phone: phone.trim() || undefined,
          note:  note.trim()  || undefined,
        })
      } else {
        await createClient({
          full_name: name.trim(),
          phone: phone.trim() || undefined,
          note:  note.trim()  || undefined,
        })
      }
      onSuccess()
    } catch (err) {
      const limit = getLimitError(err)
      if (limit) { setLimitError(limit) } else { setError(getApiError(err, t.errNetwork)) }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    {limitError && <LimitModal type={limitError} onClose={() => setLimitError(null)} />}
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEdit ? t.editClient : t.addClient}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label={t.fullName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            autoFocus
          />
          <Input
            label={t.phone}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t.phonePlaceholder}
          />
          <Input
            label={t.clientNote}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="..."
          />

          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">{t.cancel}</Button>
            <Button type="submit" loading={loading} className="flex-[2]">{t.save}</Button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}
