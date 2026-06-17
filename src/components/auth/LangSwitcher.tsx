import { useLang } from '@/contexts/LangContext'
import type { Lang } from '@/types'

export function LangSwitcher() {
  const { lang, setLang, langLabels } = useLang()

  return (
    <div className="flex gap-1">
      {(Object.keys(langLabels) as Lang[]).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={[
            'px-2 py-0.5 rounded-md text-xs font-medium transition-colors',
            l === lang
              ? 'bg-primary text-white'
              : 'text-muted hover:text-white',
          ].join(' ')}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
