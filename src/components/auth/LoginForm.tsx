import { useState } from 'react'
import { useLang } from '@/contexts/LangContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { usePhoneAuth } from '@/hooks/usePhoneAuth'

interface Props {
  auth: ReturnType<typeof usePhoneAuth>
}

export function LoginForm({ auth }: Props) {
  const { t } = useLang()
  const [phone, setPhone] = useState('+992')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  function handlePhone(v: string) {
    if (!v.startsWith('+992')) { setPhone('+992'); return }
    setPhone(v)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await auth.login(phone, password)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label={t('auth.phone')}
        type="tel"
        value={phone}
        onChange={e => handlePhone(e.target.value)}
        placeholder="+992 90 123 45 67"
        inputMode="tel"
        required
      />

      <Input
        label={t('auth.password')}
        type={showPass ? 'text' : 'password'}
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        rightElement={
          <button type="button" onClick={() => setShowPass(p => !p)} className="text-xs text-muted hover:text-white">
            {showPass ? '🙈' : '👁'}
          </button>
        }
      />

      {auth.error && (
        <p className="text-sm text-danger text-center">{auth.error}</p>
      )}

      <Button type="submit" fullWidth loading={auth.loading}>
        {t('auth.login')}
      </Button>

      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted">{t('auth.orDivider')}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Button type="button" variant="secondary" fullWidth onClick={auth.loginWithGoogle}>
        <GoogleIcon />
        {t('auth.googleLogin')}
      </Button>

      <div className="flex justify-between text-sm mt-1">
        <button
          type="button"
          className="text-muted hover:text-white transition-colors"
          onClick={() => { auth.clearError(); auth.setStep('forgot') }}
        >
          {t('auth.forgotPassword')}
        </button>
        <button
          type="button"
          className="text-primary hover:text-primary-light transition-colors font-medium"
          onClick={() => { auth.clearError(); auth.setStep('register') }}
        >
          {t('auth.register')}
        </button>
      </div>
    </form>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
