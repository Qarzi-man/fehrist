import { usePhoneAuth } from '@/hooks/usePhoneAuth'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { OtpForm } from '@/components/auth/OtpForm'
import { ForgotForm } from '@/components/auth/ForgotForm'
import { LangSwitcher } from '@/components/auth/LangSwitcher'
import { useLang } from '@/contexts/LangContext'

const titles: Record<string, string> = {
  login: 'auth.login',
  register: 'auth.register',
  otp: 'auth.verify',
  forgot: 'auth.forgotPassword',
  'forgot-otp': 'auth.verify',
}

export function AuthPage() {
  const { t } = useLang()
  const auth = usePhoneAuth()

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <LangSwitcher />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-4">
            <span className="text-3xl">💳</span>
          </div>
          <h1 className="text-2xl font-bold">{t('appName')}</h1>
          <p className="text-sm text-muted mt-1">
            {auth.step === 'login' && t('auth.hasAccount')}
            {auth.step === 'register' && t('auth.noAccount')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold mb-5 text-center">
            {t(titles[auth.step] ?? 'auth.login')}
          </h2>

          {auth.step === 'login' && <LoginForm auth={auth} />}

          {auth.step === 'register' && <RegisterForm auth={auth} />}

          {auth.step === 'otp' && (
            <OtpForm
              auth={auth}
              onVerify={code => auth.verifyOtpAndRegister(code)}
              onResend={async () => auth.setStep('register')}
            />
          )}

          {(auth.step === 'forgot' || auth.step === 'forgot-otp') && (
            <ForgotForm auth={auth} />
          )}
        </div>

        <p className="text-center text-xs text-muted mt-6">
          © 2025 GAMMA GROUP
        </p>
      </div>
    </div>
  )
}
