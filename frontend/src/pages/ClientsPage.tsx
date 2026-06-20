import { useT } from '../i18n'
import AppLayout from '../components/layout/AppLayout'

export default function ClientsPage() {
  const t = useT()
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">{t.clients}</h1>
        <p className="text-sm text-gray-400">Скоро...</p>
      </div>
    </AppLayout>
  )
}
