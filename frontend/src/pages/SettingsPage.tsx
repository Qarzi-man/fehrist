import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n'
import { useAuthStore } from '../store/authStore'
import { useLangStore, type Lang } from '../store/langStore'
import AppLayout from '../components/layout/AppLayout'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'tj', label: 'Тоҷикӣ' },
  { code: 'ru', label: 'Русский' },
  { code: 'uz', label: "O'zbek" },
  { code: 'en', label: 'English' },
]

export default function SettingsPage() {
  const t = useT()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { lang, setLang } = useLangStore()

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">{t.settings}</h1>

        {/* Profile */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600">
              {(user?.full_name ?? user?.phone ?? '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.full_name ?? '—'}</p>
              <p className="text-sm text-gray-400">{user?.phone}</p>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Язык / Забон</p>
          <div className="grid grid-cols-2 gap-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={['rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                  lang === l.code
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'].join(' ')}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/auth') }}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-50 border border-red-100 px-4 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t.logout}
        </button>
      </div>
    </AppLayout>
  )
}
