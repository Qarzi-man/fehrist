import { NavLink, Link } from 'react-router-dom'
import { useT } from '../i18n'
import AppLayout from '../components/layout/AppLayout'
import { useAuthStore } from '../store/authStore'

const faqs = [
  {
    q: 'Как добавить нового клиента?',
    a: 'Перейдите в раздел «Клиенты» и нажмите «+ Клиент». Введите имя, телефон и заметку (необязательно).',
  },
  {
    q: 'Как добавить долг?',
    a: 'На странице «Долги» нажмите «+ Долг». Выберите клиента, укажите сумму, валюту, тип (мне должны / я должен) и при необходимости срок.',
  },
  {
    q: 'Как отметить долг как погашённый?',
    a: 'Откройте долг и нажмите «Добавить оплату». Долг закроется автоматически, когда сумма будет погашена полностью.',
  },
  {
    q: 'Как пригласить сотрудника?',
    a: 'В «Настройках» → «Сотрудники» введите номер телефона сотрудника. Он получит уведомление и сможет принять приглашение.',
  },
  {
    q: 'Чем отличается бесплатный план от платного?',
    a: 'Бесплатный: 2 бизнеса, 50 клиентов на бизнес, 3 сотрудника, 10 SMS/мес. Платный (29 сом/мес): безлимит по всему + дешёвые SMS пакеты.',
  },
  {
    q: 'Как оплатить подписку или SMS пакет?',
    a: 'Перейдите в «Тарифы», нажмите «Купить» и следуйте инструкции. После перевода пришлите чек — активируем в течение 24 часов.',
  },
  {
    q: 'Как удалить бизнес или аккаунт?',
    a: 'Удалить бизнес можно в «Настройках» (только если нет активных долгов). Аккаунт — в разделе «Профиль» → «Удалить аккаунт».',
  },
  {
    q: 'Мои данные в безопасности?',
    a: 'Да. Все данные хранятся на защищённых серверах. Подробнее — в Политике конфиденциальности.',
  },
]

export default function HelpPage() {
  const t = useT()
  const token = useAuthStore((s) => s.token)

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-12 space-y-8">

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{t.help}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ответы на частые вопросы и контакты поддержки</p>
        </div>

        {/* Contact card */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 md:p-6 text-white shadow-lg">
          <p className="font-semibold text-lg mb-1">Нужна помощь?</p>
          <p className="text-white/75 text-sm mb-4">Напишите нам — ответим в течение 24 часов</p>
          <div className="flex flex-col gap-2">
            <a
              href="mailto:niyatorzuzoda@gmail.com"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 transition rounded-xl px-4 py-2.5 text-sm font-medium w-fit"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              niyatorzuzoda@gmail.com
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">Частые вопросы</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer select-none list-none">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{faq.q}</span>
                  <svg
                    className="shrink-0 w-4 h-4 text-gray-400 transition-transform group-open:rotate-180"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 pt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-gray-700">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Legal links */}
        <div className="flex items-center justify-between gap-4">
          {token ? (
            <Link
              to="/dashboard"
              className="text-sm text-gray-400 hover:text-indigo-500 transition-colors"
            >
              ← На главную
            </Link>
          ) : (
            <a
              href="https://www.daftarcha.tj"
              className="text-sm text-gray-400 hover:text-indigo-500 transition-colors"
            >
              ← На главную
            </a>
          )}
          <div className="flex gap-4 text-xs text-gray-400">
            <NavLink to="/oferta"  className="hover:text-indigo-500 transition">Оферта</NavLink>
            <NavLink to="/privacy" className="hover:text-indigo-500 transition">Конфиденциальность</NavLink>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
