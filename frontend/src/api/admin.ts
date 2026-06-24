import api from './client'

export interface AdminStats {
  totalUsers: number
  totalBusinesses: number
  totalDebts: number
  newUsers7d: number
  newUsers30d: number
  dau: number
  mau: number
  smsToday: number
  smsMonth: number
  mrr: number
  conversionRate: number
  dailyRegistrations: { date: string; count: number }[]
  recentPendingPayments: AdminPayment[]
}

export interface AdminUser {
  id: number
  full_name: string | null
  phone: string
  created_at: string
  business_count: number
  is_blocked: boolean
  is_admin: boolean
}

export interface AdminBusiness {
  id: number
  name: string
  owner_name: string | null
  owner_phone: string
  subscription_status: string
  subscription_expires_at: string | null
  client_count: number
  debt_count: number
  member_count: number
  created_at: string
}

export interface AdminPayment {
  id: number
  business_id: number
  business_name: string
  user_id: number
  user_name: string | null
  user_phone: string
  type: string
  amount: number
  sms_count: number | null
  status: 'pending' | 'approved' | 'rejected'
  note: string | null
  created_at: string
  approved_at: string | null
}

export interface AdminSmsLog {
  id: number
  business_name: string
  phone: string
  message: string
  template_key: string | null
  status: string
  created_at: string
}

export interface RevenueRow {
  date: string
  revenue: number
  count: number
}

const B = '/admin'

export const getAdminStats = (): Promise<AdminStats> =>
  api.get(`${B}/stats`).then((r) => r.data)

export const getAdminUsers = (p: { search?: string; page?: number; limit?: number }) =>
  api.get(`${B}/users`, { params: p }).then((r) => r.data as { data: AdminUser[]; total: number; totalPages: number; page: number })

export const blockAdminUser = (id: number, blocked: boolean) =>
  api.patch(`${B}/users/${id}/block`, { blocked }).then((r) => r.data)

export const getAdminBusinesses = (p: { page?: number; limit?: number }) =>
  api.get(`${B}/businesses`, { params: p }).then((r) => r.data as { data: AdminBusiness[]; total: number; totalPages: number; page: number })

export const updateBusinessPlan = (id: number, payload: { subscription_status: string; subscription_expires_at?: string | null }) =>
  api.patch(`${B}/businesses/${id}/plan`, payload).then((r) => r.data)

export const getAdminPayments = (p: { status?: string; page?: number; limit?: number }) =>
  api.get(`${B}/payments`, { params: p }).then((r) => r.data as { data: AdminPayment[]; total: number; totalPages: number; page: number })

export const approveAdminPayment = (id: number) =>
  api.patch(`${B}/payments/${id}/approve`).then((r) => r.data)

export const rejectAdminPayment = (id: number, reason: string) =>
  api.patch(`${B}/payments/${id}/reject`, { reason }).then((r) => r.data)

export const getAdminSmsLogs = (p: { dateFrom?: string; dateTo?: string; page?: number; limit?: number }) =>
  api.get(`${B}/sms`, { params: p }).then((r) => r.data as { data: AdminSmsLog[]; total: number; totalPages: number; page: number })

export const getAdminRevenue = (p: { period?: string }) =>
  api.get(`${B}/revenue`, { params: p }).then((r) => r.data as { data: RevenueRow[]; total: number })
