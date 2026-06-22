import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import BusinessSwitcher from './BusinessSwitcher'
import { useBusinessStore } from '../../store/businessStore'

export default function AppLayout({ children }: { children: ReactNode }) {
  const activeBusiness = useBusinessStore((s) => s.activeBusiness)

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 min-w-0 md:ml-56 pb-20 md:pb-0">
        {/* Mobile-only business switcher bar */}
        <div className="md:hidden sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-2">
          <BusinessSwitcher isMobile />
        </div>
        {/* key forces all page children to remount when active business changes */}
        <div key={activeBusiness?.id ?? 'no-biz'}>
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
