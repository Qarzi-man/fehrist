import { create } from 'zustand'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from '../api/notifications'

interface NotificationsState {
  notifications: AppNotification[]
  unread: number
  loading: boolean
  load: () => Promise<void>
  markRead: (id: number) => void
  markAllRead: () => void
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unread: 0,
  loading: false,

  load: async () => {
    if (get().loading) return
    set({ loading: true })
    try {
      const res = await getNotifications()
      set({ notifications: res.data, unread: res.unread, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  markRead: (id) => {
    const wasUnread = get().notifications.find((n) => n.id === id)?.is_read === false
    set((s) => ({
      notifications: s.notifications.map((n) => n.id === id ? { ...n, is_read: true } : n),
      unread: wasUnread ? Math.max(0, s.unread - 1) : s.unread,
    }))
    markNotificationRead(id).catch(() => {})
  },

  markAllRead: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
      unread: 0,
    }))
    markAllNotificationsRead().catch(() => {})
  },
}))
