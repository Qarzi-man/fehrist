import { useState, useEffect } from 'react'
import { useT } from '../../i18n'
import { type Debt, type ScheduleItem } from '../../api/debts'
import { sendSmsToClient } from '../../api/sms'
import { SMS_TEMPLATES, fillTemplate } from '../../lib/smsTemplates'
import { getApiError } from '../../lib/utils'
import Button from '../ui/Button'

type Lang = 'ru' | 'tj' | 'uz' | 'en'

const LANGS: { key: Lang; label: string }[] = [
  { key: 'tj', label: 'TJ' },
  { key: 'ru', label: 'RU' },
  { key: 'uz', label: 'UZ' },
  { key: 'en', label: 'EN' },
]

interface Props {
  debt: Debt
  schedule?: ScheduleItem[]
  onClose: () => void
}

export default function SendSmsModal({ debt, schedule = [], onClose }: Props) {
  const t = useT()
  const [lang, setLang] = useState<Lang>('ru')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [phone, setPhone] = useState(debt.client_phone || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!selectedTemplate) return
    setMessage(fillTemplate(selectedTemplate, lang, debt, schedule))
  }, [selectedTemplate, lang])

  async function handleSend() {
    setError('')
    if (!phone.trim()) { setError(t.errPhoneRequired); return }
    if (!message.trim()) { setError(t.smsMessage + ' обязательно'); return }
    setSending(true)
    try {
      await sendSmsToClient({
        debt_id: debt.id,
        phone: phone.trim(),
        message: message.trim(),
        template_key: selectedTemplate || undefined,
      })
      setSent(true)
      setTimeout(onClose, 1800)
    } catch (err) {
      setError(getApiError(err, t.errNetwork))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.smsNotification}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-base font-semibold text-emerald-700 dark:text-emerald-400 text-center">{t.smsSent}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Phone */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.phone}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+992..."
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-sm dark:text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
              />
            </div>

            {/* Lang switcher */}
            <div className="flex gap-1">
              {LANGS.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLang(l.key)}
                  className={[
                    'flex-1 py-1.5 rounded-lg text-xs font-bold transition-all',
                    lang === l.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600',
                  ].join(' ')}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Template cards */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {t.selectTemplate}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SMS_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl.key)}
                    className={[
                      'rounded-xl border-2 p-3 text-left transition-all',
                      selectedTemplate === tpl.key
                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-500'
                        : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600',
                    ].join(' ')}
                  >
                    <span className="text-xl block mb-1">{tpl.icon}</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-tight">
                      {tpl.label[lang]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message textarea */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.smsMessage}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Введите сообщение..."
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-sm dark:text-white resize-none focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 text-right">{message.length} симв.</p>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                {t.cancel}
              </Button>
              <Button
                type="button"
                loading={sending}
                onClick={handleSend}
                disabled={!message.trim() || !phone.trim()}
                className="flex-[2]"
              >
                {t.sendBtn}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
