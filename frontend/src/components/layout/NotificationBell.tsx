import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../../i18n'
import { useNotificationsStore } from '../../store/notificationsStore'
import type { AppNotification } from '../../api/notifications'

function relativeTime(dateStr: string, t: ReturnType<typeof useT>): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)   return t.justNow
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t.minuteAgo}`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${t.hourAgo}`
  return `${Math.floor(diff / 86400)} ${t.dayAgo}`
}

function typeIcon(type: AppNotification['type']): string {
  switch (type) {
    case 'overdue_debt':      return '⚠️'
    case 'invite_received':   return '👤'
    case 'invite_accepted':   return '✅'
    case 'payment_received':  return '💰'
    default:                  return '🔔'
  }
}

function navTarget(type: AppNotification['type']): string {
  switch (type) {
    case 'overdue_debt':
    case 'payment_received': return '/debts'
    default:                 return '/settings'
  }
}

export default function NotificationBell() {
  const t = useT()
  const navigate = useNavigate()
  const { notifications, unread, markRead, markAllRead } = useNotificationsStore()
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const top = rect.bottom + 8
      const fitsRight = rect.left + 320 <= window.innerWidth - 8
      if (fitsRight) {
        setPanelStyle({ position: 'fixed', top, left: rect.left, width: 320 })
      } else {
        setPanelStyle({ position: 'fixed', top, right: Math.max(8, window.innerWidth - rect.right), width: 320 })
      }
    }
    setOpen((v) => !v)
  }

  function handleNotifClick(n: AppNotification) {
    markRead(n.id)
    setOpen(false)
    navigate(navTarget(n.type))
  }

  const badge = unread > 9 ? '9+' : unread > 0 ? String(unread) : null

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="relative p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        aria-label={t.notifications}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {badge && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center leading-none">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          style={panelStyle}
          className="z-[100] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.notifications}</p>
            {unread > 0 && (
              <button
                onClick={() => { markAllRead(); }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
              >
                {t.markAllRead}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[340px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                {t.noNotifications}
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={[
                    'w-full text-left flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition last:border-0',
                    n.is_read ? 'opacity-60' : '',
                  ].join(' ')}
                >
                  <span className="text-base mt-0.5 shrink-0">{typeIcon(n.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs truncate text-gray-900 dark:text-white ${n.is_read ? 'font-medium' : 'font-bold'}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{n.body}</p>
                    )}
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      {relativeTime(n.created_at, t)}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
