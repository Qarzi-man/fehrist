import api from './client'

export interface Debt {
  id: number
  user_id: number
  client_id: number
  client_name: string
  client_phone: string | null
  amount: number
  currency: string
  description: string | null
  due_date: string | null
  type: 'receivable' | 'payable'
  status: 'active' | 'paid' | 'overdue'
  computed_status: 'active' | 'paid' | 'overdue'
  total_paid: number
  remaining: number
  created_at: string
}

export interface Repayment {
  id: number
  debt_id: number
  amount: number
  note: string | null
  paid_at: string
}

export interface CreateDebtPayload {
  client_id: number
  amount: number
  currency: string
  type: 'receivable' | 'payable'
  description?: string
  due_date?: string
}

export interface UpdateDebtPayload {
  amount?: number
  currency?: string
  description?: string
  due_date?: string
  type?: 'receivable' | 'payable'
}

export async function getDebts(filters?: {
  status?: string
  type?: string
  search?: string
}): Promise<Debt[]> {
  const { data } = await api.get<Debt[]>('/debts', { params: filters })
  return data
}

export async function createDebt(payload: CreateDebtPayload): Promise<Debt> {
  const { data } = await api.post<Debt>('/debts', payload)
  return data
}

export async function updateDebt(id: number, payload: UpdateDebtPayload): Promise<Debt> {
  const { data } = await api.put<Debt>(`/debts/${id}`, payload)
  return data
}

export async function deleteDebt(id: number): Promise<void> {
  await api.delete(`/debts/${id}`)
}

export async function getRepayments(debtId: number): Promise<Repayment[]> {
  const { data } = await api.get<Repayment[]>(`/debts/${debtId}/repayments`)
  return data
}

export async function addRepayment(debtId: number, amount: number, note?: string): Promise<Repayment> {
  const { data } = await api.post<Repayment>(`/debts/${debtId}/repayments`, { amount, note })
  return data
}
