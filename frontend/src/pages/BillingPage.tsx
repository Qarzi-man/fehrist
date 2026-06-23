import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { useT } from '../i18n'
import {
  getBillingStatus,
  createPaymentRequest,
  getPaymentRequests,
  type BillingStatus,
  type PaymentRequest,
} from '../api/billing'

const SMS_PACKAGES = [
  { count: 50,  price: 25 },
  { count: 100, price: 50 },
  { count: 300, price: 150 },
]

interface PayModal {
  type: string
  amount: number
  sms_count?: number
  label: string
}

export default function BillingPage() {
  const t = useT()
  const navigate = useNavigate()
  const [status, setStatus]     = useState<BillingStatus | null>(null)
  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [payModal, setPayModal] = useState<PayModal | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]   = useState(false)

  useEffect(() => {
    Promise.all([getBillingStatus(), getPaymentRequests()])
      .then(([s, r]) => { setStatus(s); setRequests(r) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmitRequest() {
    if (!payModal || submitting) return
    setSubmitting(true)
    try {
      await createPaymentRequest({
        type: payModal.type,
        amount: payModal.amount,
        sms_count: payModal.sms_count,
      })
      const updated = await getPaymentRequests()
      setRequests(updated)
      setSuccess(true)
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  function openSmsPackage(pkg: typeof SMS_PACKAGES[0]) {
    setSuccess(false)
    setPayModal({
      type: 'sms',
      amount: pkg.price,
      sms_count: pkg.count,
      label: `${pkg.count} SMS — ${pkg.price} сом.`,
    })
  }

  const statusBadge =
    status?.subscription_status === 'active'
      ? <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-2.5 py-0.5">✓ {t.planActive}</span>
      : <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold px-2.5 py-0.5">{t.planFree}</span>

  const reqStatusMap: Record<string, string> = {
    pending:  t.requestPending,
    approved: t.requestApproved,
    rejected: t.requestRejected,
  }
  const reqStatusColor: Record<string, string> = {
    pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  const instruction = t.paymentInstruction.replace('{amount}', String(payModal?.amount ?? ''))

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t.billingTitle}</h1>
        </div>

        {loading ? (
          <p className="text-center text-sm text-gray-400 py-12">{t.loading}</p>
        ) : (
          <>
            {/* Current plan */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{t.currentPlan}</p>
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-gray-900 dark:text-white">Daftarcha</span>
                {statusBadge}
              </div>
              {status?.subscription_expires_at && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  до {new Date(status.subscription_expires_at).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* SMS balance */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">{t.smsBalance}</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{t.freeSmsRemaining}</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {status?.free_sms_remaining ?? 0} / {status?.free_sms_limit ?? 10}
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${Math.round(((status?.free_sms_remaining ?? 0) / (status?.free_sms_limit ?? 10)) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{t.purchasedSms}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{status?.purchased_sms ?? 0}</span>
                </div>
              </div>
            </div>

            {/* SMS packages */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">{t.smsPackages}</p>
              <div className="grid grid-cols-3 gap-3">
                {SMS_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.count}
                    onClick={() => openSmsPackage(pkg)}
                    className="flex flex-col items-center gap-1 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 p-3 transition group"
                  >
                    <span className="text-xl font-extrabold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{pkg.count}</span>
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">SMS</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{pkg.price} сом.</span>
                    <span className="mt-1 text-[10px] font-semibold text-white bg-indigo-500 rounded-full px-2 py-0.5">{t.buyBtn}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subscription */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">{t.billing}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">29 {t.billing === 'Тарифы' ? 'сомони' : 'som.'} / мес.</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Безлимит клиентов и бизнесов</p>
                </div>
                <button
                  onClick={() => { setSuccess(false); setPayModal({ type: 'subscription', amount: 29, label: 'Подписка — 29 сом./мес.' }) }}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                >
                  {t.buyBtn}
                </button>
              </div>
            </div>

            {/* Payment requests */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">{t.billingRequests}</p>
              {requests.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t.noRequests}</p>
              ) : (
                <div className="space-y-2">
                  {requests.map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {r.amount} сом.{r.sms_count ? ` · ${r.sms_count} SMS` : ''}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${reqStatusColor[r.status] ?? reqStatusColor.pending}`}>
                        {reqStatusMap[r.status] ?? r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Payment modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            {success ? (
              <>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-4">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-green-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white text-center mb-5">{t.paymentRequested}</p>
                <button
                  onClick={() => setPayModal(null)}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                >
                  OK
                </button>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{t.paymentModalTitle}</h3>
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-4">{payModal.label}</p>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-5">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{instruction}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPayModal(null)}
                    className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSubmitRequest}
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {submitting ? '...' : t.sendBtn}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
