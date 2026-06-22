import { ReactNode, useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { getPendingInvites, type PendingInvite } from '../../api/members'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import BusinessSwitcher from './BusinessSwitcher'
import PendingInviteModal from '../members/PendingInviteModal'

let pendingChecked = false

export default function AppLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])

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
        {/* Mobile-only business switcher bar */}
        <div className="md:hidden print:hidden sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-2">
          <BusinessSwitcher isMobile />
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
