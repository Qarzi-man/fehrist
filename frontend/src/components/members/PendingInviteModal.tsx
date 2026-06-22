import { useState } from 'react'
import { useT } from '../../i18n'
import { acceptInvite, declineInvite, type PendingInvite } from '../../api/members'

interface Props {
  invites: PendingInvite[]
  onDone: () => void
}

export default function PendingInviteModal({ invites, onDone }: Props) {
  const t = useT()
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)

  const current = invites[index]
  if (!current) return null

  function next() {
    if (index < invites.length - 1) setIndex((i) => i + 1)
    else onDone()
  }

  async function handleAccept() {
    setLoading('accept')
    try {
      await acceptInvite(current.id)
      window.location.reload()
    } catch {
      setLoading(null)
    }
  }

  async function handleDecline() {
    setLoading('decline')
    try {
      await declineInvite(current.id)
      next()
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/40 mx-auto mb-4">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-indigo-600 dark:text-indigo-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p className="text-base font-bold text-gray-900 dark:text-white text-center mb-1">
          {t.pendingInviteTitle}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-1">
          {t.pendingInviteText}
        </p>
        <p className="text-base font-semibold text-indigo-600 dark:text-indigo-400 text-center mb-5">
          {current.business_name}
        </p>
        {current.invited_by_name && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-5">
            {current.invited_by_name}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            disabled={loading !== null}
            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
          >
            {loading === 'decline' ? '...' : t.declineInvite}
          </button>
          <button
            onClick={handleAccept}
            disabled={loading !== null}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading === 'accept' ? '...' : t.acceptInvite}
          </button>
        </div>
        {invites.length > 1 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
            {index + 1} / {invites.length}
          </p>
        )}
      </div>
    </div>
  )
}
