interface Props {
  label: string
  color: 'emerald' | 'rose' | 'amber'
  amounts?: Record<string, number>
  count?: number
}

const colorMap = {
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-800' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-900/20',       text: 'text-rose-600 dark:text-rose-400',       border: 'border-rose-100 dark:border-rose-800' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-600 dark:text-amber-400',     border: 'border-amber-100 dark:border-amber-800' },
}

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-TJ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

export default function StatsCard({ label, color, amounts, count }: Props) {
  const c = colorMap[color]
  const base = `rounded-2xl border ${c.border} ${c.bg} p-4 md:p-6 flex flex-col gap-2 md:gap-3`

  if (count !== undefined) {
    return (
      <div className={base}>
        <span className={`text-xs md:text-sm font-medium ${c.text} opacity-80`}>{label}</span>
        <span className={`text-2xl md:text-4xl font-bold ${c.text} leading-none`}>{count}</span>
      </div>
    )
  }

  const entries = Object.entries(amounts ?? {})

  if (entries.length === 0) {
    return (
      <div className={base}>
        <span className={`text-xs md:text-sm font-medium ${c.text} opacity-80`}>{label}</span>
        <div className="flex items-end gap-1">
          <span className={`text-2xl md:text-4xl font-bold ${c.text} leading-none`}>0</span>
          <span className={`text-sm md:text-base font-medium ${c.text} opacity-60 mb-0.5 md:mb-1`}>TJS</span>
        </div>
      </div>
    )
  }

  if (entries.length === 1) {
    const [currency, value] = entries[0]
    return (
      <div className={base}>
        <span className={`text-xs md:text-sm font-medium ${c.text} opacity-80`}>{label}</span>
        <div className="flex items-end gap-1">
          <span className={`text-2xl md:text-4xl font-bold ${c.text} leading-none`}>{fmt(value)}</span>
          <span className={`text-sm md:text-base font-medium ${c.text} opacity-60 mb-0.5 md:mb-1`}>{currency}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={base}>
      <span className={`text-xs md:text-sm font-medium ${c.text} opacity-80`}>{label}</span>
      <div className="flex flex-col gap-1">
        {entries.map(([currency, value]) => (
          <div key={currency} className="flex items-end gap-1">
            <span className={`text-xl md:text-2xl font-bold ${c.text} leading-none`}>{fmt(value)}</span>
            <span className={`text-xs md:text-sm font-medium ${c.text} opacity-60 mb-0.5`}>{currency}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
