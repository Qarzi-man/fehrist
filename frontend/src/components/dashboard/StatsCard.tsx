interface Props {
  label: string
  color: 'emerald' | 'rose' | 'amber'
  amounts?: Record<string, number>
  count?: number
}

const gradients = {
  emerald: 'from-[#16a34a] to-[#15803d]',
  rose:    'from-[#dc2626] to-[#b91c1c]',
  amber:   'from-[#d97706] to-[#b45309]',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-TJ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

function EmeraldIcon() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
    </svg>
  )
}
function RoseIcon() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  )
}
function AmberIcon() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

const icons = { emerald: EmeraldIcon, rose: RoseIcon, amber: AmberIcon }

export default function StatsCard({ label, color, amounts, count }: Props) {
  const Icon = icons[color]
  const gradient = gradients[color]

  function renderAmount() {
    if (count !== undefined) {
      return <span className="text-3xl md:text-5xl font-bold text-white leading-none">{count}</span>
    }
    const entries = Object.entries(amounts ?? {})
    if (!entries.length) {
      return (
        <div className="flex items-end gap-1">
          <span className="text-2xl md:text-4xl font-bold text-white leading-none">0</span>
          <span className="text-sm md:text-base font-semibold text-white/70 mb-0.5 md:mb-1">TJS</span>
        </div>
      )
    }
    if (entries.length === 1) {
      const [currency, value] = entries[0]
      return (
        <div className="flex items-end gap-1.5">
          <span className="text-2xl md:text-4xl font-bold text-white leading-none">{fmt(value)}</span>
          <span className="text-sm md:text-base font-semibold text-white/70 mb-0.5 md:mb-1">{currency}</span>
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-1">
        {entries.map(([currency, value]) => (
          <div key={currency} className="flex items-end gap-1">
            <span className="text-xl md:text-2xl font-bold text-white leading-none">{fmt(value)}</span>
            <span className="text-xs md:text-sm font-semibold text-white/70 mb-0.5">{currency}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 md:p-6 flex flex-col gap-2 md:gap-4 shadow-lg`}>
      {/* Decorative circles */}
      <div className="absolute -top-5 -right-5 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -bottom-8 -right-2 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

      {/* Label + icon */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs md:text-sm font-semibold text-white/85 leading-tight">{label}</span>
        <div className="shrink-0 text-white/50 mt-0.5">
          <Icon />
        </div>
      </div>

      {/* Amount */}
      <div className="relative z-10">{renderAmount()}</div>
    </div>
  )
}
