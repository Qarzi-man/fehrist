import api from './client'

export interface Client {
  id: number
  full_name: string
  phone: string | null
}

export async function getClients(): Promise<Client[]> {
  const { data } = await api.get<Client[]>('/clients')
  return data
}

export async function createClient(full_name: string, phone?: string): Promise<Client> {
  const { data } = await api.post<Client>('/clients', { full_name, phone })
  return data
}
