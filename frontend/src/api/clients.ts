import api from './client'
import type { Debt } from './debts'

export interface ClientDebtSummary {
  currency: string
  receivable: number
  payable: number
}

export interface Client {
  id: number
  full_name: string
  phone: string | null
  note: string | null
  created_at: string
  active_debts_count: number
  debts_by_currency: ClientDebtSummary[] | null
}

export interface ClientDetail extends Omit<Client, 'debts_by_currency'> {
  debts: Debt[]
}

export interface PaginatedClients {
  data: Client[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getClients(params?: {
  search?: string
  page?: number
  limit?: number
}): Promise<PaginatedClients> {
  const { data } = await api.get<PaginatedClients>('/clients', { params })
  return data
}

export async function getClient(id: number): Promise<ClientDetail> {
  const { data } = await api.get<ClientDetail>(`/clients/${id}`)
  return data
}

export async function createClient(payload: {
  full_name: string
  phone?: string
  note?: string
}): Promise<Client> {
  const { data } = await api.post<Client>('/clients', payload)
  return data
}

export async function updateClient(id: number, payload: {
  full_name?: string
  phone?: string
  note?: string
}): Promise<Client> {
  const { data } = await api.put<Client>(`/clients/${id}`, payload)
  return data
}

export async function deleteClient(id: number): Promise<void> {
  await api.delete(`/clients/${id}`)
}
