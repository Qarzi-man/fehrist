import { useLangStore } from '../store/langStore'
import { oferta } from '../lib/legalContent'
import LegalLayout from '../components/layout/LegalLayout'

export default function OfertaPage() {
  const lang = useLangStore((s) => s.lang)
  return (
    <LegalLayout
      doc={oferta[lang]}
      otherLink={{ to: '/privacy', label: 'Политика конфиденциальности' }}
    />
  )
}
