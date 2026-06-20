export function formatMoney(amount: number, currency = 'TJS'): string {
  return (
    new Intl.NumberFormat('ru-TJ', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount) +
    ' ' + currency
  )
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-TJ', { day: 'numeric', month: 'short', year: 'numeric' })
}
