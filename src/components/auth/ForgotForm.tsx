import { useState } from 'react'
import { useLang } from '@/contexts/LangContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { OtpInput } from './OtpInput'
import type { usePhoneAuth } from '@/hooks/usePhoneAuth'

interface Props {
  auth: ReturnType<typeof usePhoneAuth>
}

export function ForgotForm({ auth }: Props) {
  const { t } = useLang()
  const [phone, setPhone] = useState('+992')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')

  function handlePhone(v: string) {
    if (!v.startsWith('+992')) { setPhone('+992'); return }
    setPhone(v)
  }

  if (auth.step === 'forgot-otp') {
    return (
      <form
        onSubmit={async e => { e.preventDefault(); await auth.verifyOtpAndReset(code, newPassword) }}
        className="flex flex-col gap-4"
      >
        <p className="text-sm text-muted text-center">
          {t('auth.otpSent', { phone: auth.pendingPhone ?? '' })}
        </p>

        <OtpInput value={code} onChange={setCode} />

        <Input
          label={t('settings.newPassword')}
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />

        {auth.error && <p className="text-sm text-danger text-center">{auth.error}</p>}

        <Button type="submit" fullWidth loading={auth.loading} disabled={code.length < 6 || newPassword.length < 8}>
          {t('auth.verify')}
        </Button>

        <button
          type="button"
          className="text-sm text-muted hover:text-white text-center"
          onClick={() => { auth.clearError(); auth.setStep('forgot') }}
        >
          ← {t('common.back')}
        </button>
      </form>
    )
  }

  return (
    <form
      onSubmit={async e => { e.preventDefault(); await auth.startForgot(phone) }}
      className="flex flex-col gap-4"
    >
      <Input
        label={t('auth.phone')}
        type="tel"
        value={phone}
        onChange={e => handlePhone(e.target.value)}
        placeholder="+992 90 123 45 67"
        required
      />

      {auth.error && <p className="text-sm text-danger text-center">{auth.error}</p>}

      <Button type="submit" fullWidth loading={auth.loading}>
        {t('auth.sendOtp')}
      </Button>

      <button
        type="button"
        className="text-sm text-muted hover:text-white text-center"
        onClick={() => { auth.clearError(); auth.setStep('login') }}
      >
        ← {t('common.back')}
      </button>
    </form>
  )
}
