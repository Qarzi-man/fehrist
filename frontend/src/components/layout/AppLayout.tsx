import { ReactNode, useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNotificationsStore } from '../../store/notificationsStore'
import { getPendingInvites, type PendingInvite } from '../../api/members'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import BusinessSwitcher from './BusinessSwitcher'
import NotificationBell from './NotificationBell'
import PendingInviteModal from '../members/PendingInviteModal'

let pendingChecked = false

export default function AppLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const { load: loadNotifications } = useNotificationsStore()
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])

  useEffect(() => {
    if (!user) return
    loadNotifications()
    const interval = setInterval(loadNotifications, 60_000)
    return () => clearInterval(interval)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user || pendingChecked) return
    pendingChecked = true
    getPendingInvites()
      .then((invites) => { if (invites.length) setPendingInvites(invites) })
      .catch(() => {})
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 min-w-0 md:ml-56 print:ml-0 pb-20 md:pb-0 print:pb-0">
        {/* Mobile-only top bar */}
        <div className="md:hidden print:hidden sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-2 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <BusinessSwitcher isMobile />
          </div>
          <NotificationBell />
        </div>
        {children}
      </main>
      <BottomNav />
      {pendingInvites.length > 0 && (
        <PendingInviteModal
          invites={pendingInvites}
          onDone={() => setPendingInvites([])}
        />
      )}
    </div>
  )
}
