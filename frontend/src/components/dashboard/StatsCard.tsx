interface Props {
  label: string
  value: number
  color: 'emerald' | 'rose' | 'amber'
  isCount?: boolean
  currency?: string
}

const colorMap = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: 'text-emerald-400' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-100',    icon: 'text-rose-400' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100',   icon: 'text-amber-400' },
}

export default function StatsCard({ label, value, color, isCount = false, currency = 'TJS' }: Props) {
  const c = colorMap[color]
  const display = isCount
    ? String(value)
    : new Intl.NumberFormat('ru-TJ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-4 flex flex-col gap-2`}>
      <span className={`text-xs font-medium ${c.text} opacity-80`}>{label}</span>
      <div className="flex items-end gap-1">
        <span className={`text-2xl font-bold ${c.text} leading-none`}>{display}</span>
        {!isCount && <span className={`text-sm font-medium ${c.text} opacity-60 mb-0.5`}>{currency}</span>}
      </div>
    </div>
  )
}
