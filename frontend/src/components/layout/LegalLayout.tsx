import { Link } from 'react-router-dom'
import { useLangStore, type Lang } from '../../store/langStore'
import type { LegalDoc } from '../../lib/legalContent'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'tj', label: 'TJ' },
  { code: 'uz', label: 'UZ' },
  { code: 'en', label: 'EN' },
]

interface Props {
  doc: LegalDoc
  otherLink: { to: string; label: string }
}

export default function LegalLayout({ doc, otherLink }: Props) {
  const { lang, setLang } = useLangStore()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 36 36" fill="none">
                <path d="M6 4C6 2.9 6.9 2 8 2H28C29.1 2 30 2.9 30 4V32L18 27L6 32V4Z" fill="white" fillOpacity="0.95"/>
                <path d="M12 10H24M12 15H24M12 20H20" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Daftarcha
            </span>
          </Link>

          {/* Lang switcher */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={[
                  'rounded-md px-2.5 py-1 text-xs font-semibold transition-all',
                  lang === l.code
                    ? 'bg-white dark:bg-gray-600 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                ].join(' ')}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 pb-16">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">{doc.title}</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">{doc.updated}</p>

        <div className="space-y-4">
          {doc.sections.map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">{s.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{s.text}</p>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/dashboard"
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            ← На главную
          </Link>
          <Link
            to={otherLink.to}
            className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            {otherLink.label} →
          </Link>
        </div>
      </main>
    </div>
  )
}
