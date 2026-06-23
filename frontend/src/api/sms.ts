import api from './client'

export interface SmsLog {
  id: number
  business_id: number
  debt_id: number | null
  client_id: number | null
  client_name?: string
  phone: string
  message: string
  template_key: string | null
  status: string
  created_at: string
}

export interface SendSmsPayload {
  debt_id?: number
  phone: string
  message: string
  template_key?: string
}

export async function sendSmsToClient(payload: SendSmsPayload): Promise<SmsLog> {
  const { data } = await api.post<SmsLog>('/sms/send', payload)
  return data
}

export async function getSmsLogs(page = 1, limit = 20): Promise<{
  data: SmsLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}> {
  const { data } = await api.get('/sms/logs', { params: { page, limit } })
  return data
}
