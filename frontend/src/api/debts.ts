import api from './client'

export interface CreateDebtPayload {
  client_id: number
  amount: number
  currency: string
  type: 'receivable' | 'payable'
  description?: string
  due_date?: string
}

export async function createDebt(payload: CreateDebtPayload) {
  const { data } = await api.post('/debts', payload)
  return data
}
