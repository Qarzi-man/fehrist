import { ru } from './ru'
import { tj } from './tj'
import { uz } from './uz'
import { en } from './en'
import { useLangStore } from '../store/langStore'

const translations = { ru, tj, uz, en }

export function useT() {
  const lang = useLangStore((s) => s.lang)
  return translations[lang]
}
