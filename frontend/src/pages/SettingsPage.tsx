import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n'
import { useAuthStore } from '../store/authStore'
import { useLangStore, type Lang } from '../store/langStore'
import { useThemeStore } from '../store/themeStore'
import { useIsOwner } from '../lib/useIsOwner'
import { getMembers, removeMember, type Member } from '../api/members'
import AppLayout from '../components/layout/AppLayout'
import InviteModal from '../components/members/InviteModal'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'tj', label: 'Тоҷикӣ' },
  { code: 'ru', label: 'Русский' },
  { code: 'uz', label: "O'zbek" },
  { code: 'en', label: 'English' },
]

const MoonIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
)
const SunIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
)

function statusBadge(status: Member['status'], t: ReturnType<typeof useT>) {
  return status === 'active'
    ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">{t.memberStatusActive}</span>
    : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">{t.memberStatusPending}</span>
}

export default function SettingsPage() {
  const t = useT()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { lang, setLang } = useLangStore()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const isOwner = useIsOwner()
  const [showConfirm, setShowConfirm] = useState(false)

  // Members state
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [removeConfirmId, setRemoveConfirmId] = useState<number | null>(null)
  const [removing, setRemoving] = useState(false)

  const loadMembers = useCallback(() => {
    if (!isOwner) return
    setMembersLoading(true)
    getMembers()
      .then(setMembers)
      .catch(() => {})
      .finally(() => setMembersLoading(false))
  }, [isOwner])

  useEffect(() => { loadMembers() }, [loadMembers])

  function handleLogout() {
    logout()
    navigate('/auth')
  }

  function handleInviteSuccess() {
    setShowInvite(false)
    setInviteSuccess(true)
    loadMembers()
    setTimeout(() => setInviteSuccess(false), 3000)
  }

  async function handleRemove(id: number) {
    setRemoving(true)
    try {
      await removeMember(id)
      setRemoveConfirmId(null)
      loadMembers()
    } catch {
      // ignore
    } finally {
      setRemoving(false)
    }
  }

  const atLimit = members.length >= 3

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6 md:mb-8">{t.settings}</h1>

        {/* Profile */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-lg font-bold text-indigo-600 dark:text-indigo-300">
              {(user?.full_name ?? user?.phone ?? '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.full_name ?? '—'}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">{user?.phone}</p>
              <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400">
                {isOwner ? t.ownerLabel : t.employeeLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mb-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Язык / Забон</p>
          <div className="grid grid-cols-2 gap-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={['rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                  lang === l.code
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'].join(' ')}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">
                {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
              </span>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.darkMode}</p>
            </div>
            <button
              onClick={toggleTheme}
              className={['relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'].join(' ')}
              role="switch"
              aria-checked={theme === 'dark'}
            >
              <span
                className={['pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200',
                  theme === 'dark' ? 'translate-x-5' : 'translate-x-0'].join(' ')}
              />
            </button>
          </div>
        </div>

        {/* Employees — owner only */}
        {isOwner && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.employees}</p>
              {!atLimit ? (
                <button
                  onClick={() => setShowInvite(true)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition"
                >
                  {t.inviteEmployee}
                </button>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">{t.memberLimitReached}</span>
              )}
            </div>

            {inviteSuccess && (
              <div className="mb-3 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2">
                {t.inviteSent}
              </div>
            )}

            {membersLoading ? (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t.noMembers}</p>
            ) : (
              <ul className="divide-y divide-gray-50 dark:divide-gray-700">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-300 shrink-0">
                      {(m.full_name ?? m.phone ?? '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{m.full_name ?? '—'}</p>
                      {m.phone && <p className="text-xs text-gray-400 dark:text-gray-500">{m.phone}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {statusBadge(m.status, t)}
                      {removeConfirmId === m.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleRemove(m.id)}
                            disabled={removing}
                            className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded-lg transition disabled:opacity-50"
                          >
                            {removing ? '...' : t.removeMember}
                          </button>
                          <button
                            onClick={() => setRemoveConfirmId(null)}
                            className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                          >
                            {t.cancel}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRemoveConfirmId(m.id)}
                          className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {atLimit && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">{t.memberLimitReached}</p>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t.logout}
        </button>
      </div>

      {/* Logout confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-5 text-center">{t.logoutConfirmTitle}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition"
              >
                {t.logoutConfirmYes}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={handleInviteSuccess}
        />
      )}
    </AppLayout>
  )
}
