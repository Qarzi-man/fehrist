import api from './client'

export interface MonthlyData {
  month: string                    // "YYYY-MM"
  new_receivable: Record<string, number>
  new_payable:    Record<string, number>
  repaid:         Record<string, number>
}

export interface TopClientDebt {
  currency: string
  type:     'receivable' | 'payable'
  amount:   number
}

export interface TopClient {
  client_id:       number
  full_name:       string
  by_currency:     Record<string, number>   // kept for export compat
  debts:           TopClientDebt[]
  total_remaining: number
}

export interface AnalyticsSummary {
  total_active:       number
  overdue_count:      number
  repaid_this_month:  Record<string, number>
  repaid_in_period:   Record<string, number>
}

export interface AnalyticsData {
  monthly:     MonthlyData[]
  top_clients: TopClient[]
  summary:     AnalyticsSummary
}

export type Period = '1d' | '1w' | '3m' | '6m' | '1y'

export async function getAnalytics(period: Period): Promise<AnalyticsData> {
  const { data } = await api.get<AnalyticsData>('/analytics', { params: { period } })
  return data
}
