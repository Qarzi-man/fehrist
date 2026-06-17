import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Lang } from '@/types'
import { t as translate, langLabels } from '@/locales'

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (path: string, vars?: Record<string, string>) => string
  langLabels: typeof langLabels
}

const LangContext = createContext<LangContextValue | null>(null)

const STORAGE_KEY = 'qm_lang'

function detectLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY) as Lang | null
  if (stored && ['tg', 'ru', 'uz', 'en'].includes(stored)) return stored
  const browser = navigator.language.slice(0, 2)
  const map: Record<string, Lang> = { ru: 'ru', uz: 'uz', en: 'en', tg: 'tg' }
  return map[browser] ?? 'tg'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
    document.documentElement.lang = l
  }

  const value: LangContextValue = {
    lang,
    setLang,
    t: (path, vars) => translate(lang, path, vars),
    langLabels,
  }

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be inside LangProvider')
  return ctx
}
