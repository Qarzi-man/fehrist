interface Props {
  label: string
  value: number
  color: 'emerald' | 'rose' | 'amber'
  isCount?: boolean
  currency?: string
}

const colorMap = {
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-800' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-900/20',       text: 'text-rose-600 dark:text-rose-400',       border: 'border-rose-100 dark:border-rose-800' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-600 dark:text-amber-400',     border: 'border-amber-100 dark:border-amber-800' },
}

export default function StatsCard({ label, value, color, isCount = false, currency = 'TJS' }: Props) {
  const c = colorMap[color]
  const display = isCount
    ? String(value)
    : new Intl.NumberFormat('ru-TJ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-4 md:p-6 flex flex-col gap-2 md:gap-3`}>
      <span className={`text-xs md:text-sm font-medium ${c.text} opacity-80`}>{label}</span>
      <div className="flex items-end gap-1">
        <span className={`text-2xl md:text-4xl font-bold ${c.text} leading-none`}>{display}</span>
        {!isCount && <span className={`text-sm md:text-base font-medium ${c.text} opacity-60 mb-0.5 md:mb-1`}>{currency}</span>}
      </div>
    </div>
  )
}
