import type { Debt, ScheduleItem } from '../api/debts'
import { formatDate } from './format'

type Lang = 'ru' | 'tj' | 'uz' | 'en'

export interface SmsTemplate {
  key: string
  icon: string
  label: Record<Lang, string>
  text: Record<Lang, string>
}

export const SMS_TEMPLATES: SmsTemplate[] = [
  {
    key: 'debt_reminder',
    icon: '🔔',
    label: {
      ru: 'Напоминание о долге',
      tj: 'Ёдоварии қарз',
      uz: 'Qarz eslatmasi',
      en: 'Debt reminder',
    },
    text: {
      ru: 'Уважаемый [имя], ваш долг составляет [сумма] [валюта]. Просим оплатить до [дата]. — Daftarcha',
      tj: 'Муҳтарам [имя], қарзи шумо [сумма] [валюта] мебошад. Лутфан то [дата] пардохт намоед. — Daftarcha',
      uz: "Hurmatli [имя], qarzingiz [сумма] [валюта]. Iltimos [дата] gacha to'lang. — Daftarcha",
      en: 'Dear [имя], your debt is [сумма] [валюта]. Please pay by [дата]. — Daftarcha',
    },
  },
  {
    key: 'payment_confirmed',
    icon: '✅',
    label: {
      ru: 'Оплата принята',
      tj: 'Пардохт қабул шуд',
      uz: "To'lov qabul qilindi",
      en: 'Payment confirmed',
    },
    text: {
      ru: 'Уважаемый [имя], ваша оплата [сумма] [валюта] принята. Спасибо! — Daftarcha',
      tj: 'Муҳтарам [имя], пардохти шумо [сумма] [валюта] қабул шуд. Ташаккур! — Daftarcha',
      uz: "Hurmatli [имя], [сумма] [валюта] to'lovingiz qabul qilindi. Rahmat! — Daftarcha",
      en: 'Dear [имя], your payment of [сумма] [валюта] has been received. Thank you! — Daftarcha',
    },
  },
  {
    key: 'overdue_notice',
    icon: '⚠️',
    label: {
      ru: 'Просрочка',
      tj: 'Мӯҳлат гузашт',
      uz: "Muddati o'tgan",
      en: 'Overdue notice',
    },
    text: {
      ru: 'Уважаемый [имя], срок оплаты [дата] прошёл. Остаток: [сумма] [валюта]. Пожалуйста свяжитесь с нами. — Daftarcha',
      tj: 'Муҳтарам [имя], мӯҳлати пардохт [дата] гузашт. Боқимонда: [сумма] [валюта]. Лутфан бо мо тамос гиред. — Daftarcha',
      uz: "Hurmatli [имя], [дата] to'lov muddati o'tdi. Qoldiq: [сумма] [валюта]. Iltimos biz bilan bog'laning. — Daftarcha",
      en: 'Dear [имя], your payment deadline [дата] has passed. Remaining: [сумма] [валюта]. Please contact us. — Daftarcha',
    },
  },
  {
    key: 'installment_reminder',
    icon: '📅',
    label: {
      ru: 'Платёж по рассрочке',
      tj: 'Пардохти насия',
      uz: "Nasiya to'lovi",
      en: 'Installment reminder',
    },
    text: {
      ru: 'Уважаемый [имя], следующий платёж по рассрочке: [сумма] [валюта] — [дата]. — Daftarcha',
      tj: 'Муҳтарам [имя], пардохти навбатии насия: [сумма] [валюта] — [дата]. — Daftarcha',
      uz: "Hurmatli [имя], navbatdagi nasiya to'lovi: [сумма] [валюта] — [дата]. — Daftarcha",
      en: 'Dear [имя], your next installment payment: [сумма] [валюта] due [дата]. — Daftarcha',
    },
  },
]

function fmtAmt(n: number): string {
  return new Intl.NumberFormat('ru-TJ', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
}

export function fillTemplate(
  templateKey: string,
  lang: Lang,
  debt: Debt,
  schedule: ScheduleItem[] = [],
): string {
  const tpl = SMS_TEMPLATES.find((t) => t.key === templateKey)
  if (!tpl) return ''

  const name = debt.client_name
  const currency = debt.currency
  let amount: string
  let date: string

  switch (templateKey) {
    case 'debt_reminder':
      amount = fmtAmt(Number(debt.remaining) > 0 ? Number(debt.remaining) : Number(debt.amount))
      date = formatDate(debt.due_date)
      break
    case 'payment_confirmed':
      amount = fmtAmt(Number(debt.total_paid))
      date = formatDate(new Date().toISOString())
      break
    case 'overdue_notice':
      amount = fmtAmt(Number(debt.remaining))
      date = formatDate(debt.due_date)
      break
    case 'installment_reminder': {
      const next = schedule.find((s) => s.status !== 'paid')
      amount = next ? fmtAmt(Number(next.amount)) : fmtAmt(Number(debt.amount))
      date = next ? formatDate(next.due_date) : formatDate(debt.due_date)
      break
    }
    default:
      amount = fmtAmt(Number(debt.amount))
      date = formatDate(debt.due_date)
  }

  return tpl.text[lang]
    .replace(/\[имя\]/g, name)
    .replace(/\[сумма\]/g, amount)
    .replace(/\[валюта\]/g, currency)
    .replace(/\[дата\]/g, date)
}
