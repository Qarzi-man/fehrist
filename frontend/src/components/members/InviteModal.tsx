import { useState } from 'react'
import { useT } from '../../i18n'
import { inviteMember } from '../../api/members'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function InviteModal({ onClose, onSuccess }: Props) {
  const t = useT()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = phone.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    try {
      await inviteMember(trimmed)
      onSuccess()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      if (msg === 'User not found') setError(t.memberNotFound)
      else if (msg === 'Member limit reached (max 3)') setError(t.memberLimitReached)
      else if (msg === 'Cannot invite yourself') setError(t.errNetwork)
      else setError(t.errNetwork)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <p className="text-base font-bold text-gray-900 dark:text-white mb-4">{t.inviteEmployee}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+992 XX XXX XX XX"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30"
          />
          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading ? '...' : t.inviteEmployee}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
