import { useLangStore } from '../store/langStore'
import { privacy } from '../lib/legalContent'
import LegalLayout from '../components/layout/LegalLayout'

export default function PrivacyPage() {
  const lang = useLangStore((s) => s.lang)
  return (
    <LegalLayout
      doc={privacy[lang]}
      otherLink={{ to: '/oferta', label: 'Публичная оферта' }}
    />
  )
}
