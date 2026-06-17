import { tg } from './tg'
import { ru } from './ru'
import { uz } from './uz'
import { en } from './en'
import type { Lang } from '@/types'

export const translations = { tg, ru, uz, en } as const

export const langLabels: Record<Lang, string> = {
  tg: 'Тоҷикӣ',
  ru: 'Русский',
  uz: "O'zbek",
  en: 'English',
}

export function t(lang: Lang, path: string, vars?: Record<string, string>): string {
  const keys = path.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translations[lang]
  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) break
  }
  if (typeof value !== 'string') return path
  if (vars) {
    return Object.entries(vars).reduce(
      (s, [k, v]) => s.replace(`{${k}}`, v),
      value,
    )
  }
  return value
}

export type { Translations } from './tg'
