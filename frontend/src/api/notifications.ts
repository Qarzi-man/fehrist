import api from './client'

export interface AppNotification {
  id: number
  user_id: number
  business_id: number | null
  type: 'overdue_debt' | 'invite_received' | 'invite_accepted' | 'payment_received'
  title: string
  body: string | null
  is_read: boolean
  data: Record<string, unknown> | null
  created_at: string
}

export interface NotificationsResponse {
  data: AppNotification[]
  total: number
  unread: number
  page: number
  limit: number
  totalPages: number
}

export async function getNotifications(page = 1): Promise<NotificationsResponse> {
  const { data } = await api.get<NotificationsResponse>('/notifications', { params: { page, limit: 50 } })
  return data
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.patch(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all')
}
