import { useState } from 'react'
import { useT } from '../i18n'
import LangSwitcher from '../components/ui/LangSwitcher'
import LoginForm from '../components/auth/LoginForm'
import RegisterForm from '../components/auth/RegisterForm'

type Tab = 'login' | 'register'

export default function AuthPage() {
  const t = useT()
  const [tab, setTab] = useState<Tab>('login')

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 px-4 py-10">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-400/10 blur-2xl" />

      {/* Lang switcher */}
      <div className="absolute right-4 top-4">
        <LangSwitcher />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-lg">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 4C6 2.9 6.9 2 8 2H28C29.1 2 30 2.9 30 4V32L18 27L6 32V4Z" fill="white" fillOpacity="0.9"/>
              <path d="M12 10H24M12 15H24M12 20H20" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t.appName}</h1>
          <p className="mt-1 text-sm text-white/70">{t.appTagline}</p>
        </div>

        {/* Form card */}
        <div className="rounded-3xl bg-white px-8 py-8 shadow-2xl">
          {/* Tabs */}
          <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setTab('login')}
              className={[
                'flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
                tab === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {t.login}
            </button>
            <button
              onClick={() => setTab('register')}
              className={[
                'flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
                tab === 'register'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {t.register}
            </button>
          </div>

          {tab === 'login' ? (
            <LoginForm onSwitch={() => setTab('register')} />
          ) : (
            <RegisterForm onSwitch={() => setTab('login')} />
          )}
        </div>
      </div>
    </div>
  )
}
