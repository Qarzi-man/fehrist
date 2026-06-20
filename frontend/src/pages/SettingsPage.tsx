import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n'
import { useAuthStore } from '../store/authStore'
import { useLangStore, type Lang } from '../store/langStore'
import { useThemeStore } from '../store/themeStore'
import AppLayout from '../components/layout/AppLayout'

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

export default function SettingsPage() {
  const t = useT()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { lang, setLang } = useLangStore()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const [showConfirm, setShowConfirm] = useState(false)

  function handleLogout() {
    logout()
    navigate('/auth')
  }

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
    </AppLayout>
  )
}
