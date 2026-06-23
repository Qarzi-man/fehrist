import { useNavigate } from 'react-router-dom'
import { useT } from '../../i18n'

type LimitType = 'business_limit' | 'client_limit' | 'sms_limit'

interface Props {
  type: LimitType
  onClose: () => void
}

export default function LimitModal({ type, onClose }: Props) {
  const t = useT()
  const navigate = useNavigate()

  const labelMap: Record<LimitType, string> = {
    business_limit: t.limitBusiness,
    client_limit:   t.limitClient,
    sms_limit:      t.limitSms,
  }

  function handleGoToBilling() {
    onClose()
    navigate('/billing')
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto mb-4">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-amber-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white text-center mb-1">
          {t.limitReachedTitle}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          {labelMap[type]}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleGoToBilling}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            {t.goToBilling}
          </button>
        </div>
      </div>
    </div>
  )
}
