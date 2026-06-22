import api from './client'

export interface MonthlyData {
  month: string                    // "YYYY-MM"
  new_receivable: Record<string, number>
  new_payable:    Record<string, number>
  repaid:         Record<string, number>
}

export interface TopClient {
  client_id:       number
  full_name:       string
  by_currency:     Record<string, number>
  total_remaining: number
}

export interface AnalyticsSummary {
  total_active:       number
  overdue_count:      number
  repaid_this_month:  Record<string, number>
}

export interface AnalyticsData {
  monthly:     MonthlyData[]
  top_clients: TopClient[]
  summary:     AnalyticsSummary
}

export async function getAnalytics(months: number): Promise<AnalyticsData> {
  const { data } = await api.get<AnalyticsData>('/analytics', { params: { months } })
  return data
}
