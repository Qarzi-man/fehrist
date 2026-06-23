import api from './axios'

export interface BillingStatus {
  subscription_status: 'free' | 'active'
  subscription_expires_at: string | null
  monthly_sent: number
  purchased_sms: number
  total_sent: number
  free_sms_limit: number
  free_sms_remaining: number
}

export interface PaymentRequest {
  id: number
  business_id: number
  user_id: number
  type: string
  amount: number
  sms_count: number | null
  status: 'pending' | 'approved' | 'rejected'
  note: string | null
  created_at: string
  approved_at: string | null
}

export function getBillingStatus(): Promise<BillingStatus> {
  return api.get('/api/v1/billing/status').then((r) => r.data)
}

export function createPaymentRequest(payload: {
  type: string
  amount: number
  sms_count?: number
  note?: string
}): Promise<PaymentRequest> {
  return api.post('/api/v1/billing/request', payload).then((r) => r.data)
}

export function getPaymentRequests(): Promise<PaymentRequest[]> {
  return api.get('/api/v1/billing/requests').then((r) => r.data)
}
