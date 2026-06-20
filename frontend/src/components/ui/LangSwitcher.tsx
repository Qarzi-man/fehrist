import { useLangStore, type Lang } from '../../store/langStore'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'tj', label: 'TJ' },
  { code: 'ru', label: 'RU' },
  { code: 'uz', label: 'UZ' },
  { code: 'en', label: 'EN' },
]

export default function LangSwitcher() {
  const { lang, setLang } = useLangStore()

  return (
    <div className="flex gap-1 rounded-lg bg-white/20 p-1 backdrop-blur-sm">
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={[
            'rounded-md px-2.5 py-1 text-xs font-semibold transition-all',
            lang === l.code
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-white/80 hover:text-white',
          ].join(' ')}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
