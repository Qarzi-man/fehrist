import { ReactNode, useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useNotificationsStore } from '../../store/notificationsStore'
import { getPendingInvites, type PendingInvite } from '../../api/members'
import { useT } from '../../i18n'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import BusinessSwitcher from './BusinessSwitcher'
import NotificationBell from './NotificationBell'
import PendingInviteModal from '../members/PendingInviteModal'

let pendingChecked = false

export default function AppLayout({ children }: { children: ReactNode }) {
  const t = useT()
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
        <div className="md:hidden print:hidden sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-3 py-2 flex items-center gap-1.5">
          <div className="flex-1 min-w-0">
            <BusinessSwitcher isMobile />
          </div>
          {/* Billing and Help — only in mobile top bar (not in BottomNav) */}
          <NavLink
            to="/billing"
            title={t.billing}
            className={({ isActive }) =>
              `p-2 rounded-xl transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400'}`
            }
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </NavLink>
          <NavLink
            to="/help"
            title={t.help}
            className={({ isActive }) =>
              `p-2 rounded-xl transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400'}`
            }
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </NavLink>
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
