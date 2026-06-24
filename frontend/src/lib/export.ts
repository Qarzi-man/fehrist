import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'
import type { Debt } from '../api/debts'
import type { AnalyticsData } from '../api/analytics'

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-TJ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('ru-RU') : '—'

const typeLabel = (t: string) => (t === 'receivable' ? 'Мне должны' : 'Я должен')

const statusLabel = (s: string) =>
  ({ active: 'Активный', paid: 'Оплачен', overdue: 'Просрочен' }[s] ?? s)

export async function exportDebtsToPDF(debts: Debt[], businessName: string): Promise<void> {
  const container = document.createElement('div')
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:1050px;background:#fff;padding:24px;font-family:system-ui,sans-serif;color:#111827;'

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #e5e7eb">
      <div>
        <div style="font-size:20px;font-weight:700;margin-bottom:4px">${businessName}</div>
        <div style="font-size:13px;color:#6b7280">Экспорт долгов · ${new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>
      <div style="font-size:12px;color:#9ca3af">${debts.length} записей</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="background:#f3f4f6">
          ${['Клиент', 'Тип', 'Сумма', 'Вал.', 'Статус', 'Дата', 'Остаток']
            .map(
              (h) =>
                `<th style="padding:8px 10px;text-align:left;border-bottom:2px solid #e5e7eb;font-weight:600;color:#374151;white-space:nowrap">${h}</th>`
            )
            .join('')}
        </tr>
      </thead>
      <tbody>
        ${debts
          .map(
            (d, i) => `
          <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
            <td style="padding:7px 10px;border-bottom:1px solid #f3f4f6;font-weight:500">${d.client_name}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f3f4f6;color:${d.type === 'receivable' ? '#059669' : '#e11d48'}">${typeLabel(d.type)}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600">${fmt(Number(d.amount))}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f3f4f6;color:#6b7280">${d.currency}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f3f4f6">${statusLabel(d.computed_status)}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f3f4f6;color:#6b7280">${fmtDate(d.due_date ?? d.created_at)}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;color:#4f46e5">${fmt(Number(d.remaining ?? 0))}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  `

  document.body.appendChild(container)
  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const imgH = (canvas.height * pageW) / canvas.width

    let yOffset = 0
    let first = true
    while (yOffset < imgH) {
      if (!first) pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, -yOffset, pageW, imgH)
      yOffset += pageH
      first = false
    }
    pdf.save(`dolgi-${new Date().toISOString().slice(0, 10)}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}

export function exportDebtsToExcel(debts: Debt[]): void {
  const rows = debts.map((d) => ({
    Клиент: d.client_name,
    Телефон: d.client_phone ?? '',
    Тип: typeLabel(d.type),
    Сумма: Number(d.amount),
    Валюта: d.currency,
    Статус: statusLabel(d.computed_status),
    'Дата создания': fmtDate(d.created_at),
    'Срок оплаты': fmtDate(d.due_date),
    Оплачено: Number(d.total_paid ?? 0),
    Остаток: Number(d.remaining ?? 0),
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Долги')
  XLSX.writeFile(wb, `dolgi-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function exportAnalyticsToExcel(data: AnalyticsData, period: string | number): void {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Monthly dynamics
  const monthRows = data.monthly.flatMap((m) => {
    const currencies = new Set([
      ...Object.keys(m.new_receivable),
      ...Object.keys(m.new_payable),
      ...Object.keys(m.repaid),
    ])
    if (!currencies.size) {
      return [{ Месяц: m.label, Валюта: '', 'Мне должны': 0, 'Я должен': 0, Погашено: 0 }]
    }
    return Array.from(currencies).map((cur) => ({
      Месяц: m.label,
      Валюта: cur,
      'Мне должны': m.new_receivable[cur] ?? 0,
      'Я должен': m.new_payable[cur] ?? 0,
      Погашено: m.repaid[cur] ?? 0,
    }))
  })
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthRows), 'По месяцам')

  // Sheet 2: Top clients
  const clientRows = data.top_clients.flatMap((c) =>
    Object.entries(c.by_currency).map(([cur, amount]) => ({
      Клиент: c.full_name,
      Остаток: amount,
      Валюта: cur,
    }))
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(clientRows.length ? clientRows : [{ Клиент: '', Остаток: 0, Валюта: '' }]),
    'Топ клиентов'
  )

  // Sheet 3: Summary
  const summaryRows: Record<string, string | number>[] = [
    { Показатель: `Период (мес)`, Значение: period },
    { Показатель: 'Активных долгов', Значение: data.summary.total_active },
    { Показатель: 'Просроченных', Значение: data.summary.overdue_count },
    ...Object.entries(data.summary.repaid_this_month).map(([cur, val]) => ({
      Показатель: `Погашено за месяц (${cur})`,
      Значение: val,
    })),
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Сводка')

  XLSX.writeFile(wb, `analytics-${period}-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
