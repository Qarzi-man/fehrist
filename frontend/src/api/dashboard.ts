import api from './client'

export interface RecentDebt {
  id: number
  amount: number
  currency: string
  type: 'receivable' | 'payable'
  status: 'active' | 'paid' | 'overdue'
  due_date: string | null
  created_at: string
  client_name: string
}

export interface DashboardStats {
  receivable: Record<string, number>
  payable: Record<string, number>
  overdue_count: number
  recent_debts: RecentDebt[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/dashboard')
  return data
}
