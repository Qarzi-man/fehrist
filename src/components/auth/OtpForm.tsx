import { useState } from 'react'
import { useLang } from '@/contexts/LangContext'
import { Button } from '@/components/ui/Button'
import { OtpInput } from './OtpInput'
import type { usePhoneAuth } from '@/hooks/usePhoneAuth'

interface Props {
  auth: ReturnType<typeof usePhoneAuth>
  onVerify: (code: string) => Promise<void>
  onResend: () => Promise<void>
}

export function OtpForm({ auth, onVerify, onResend }: Props) {
  const { t } = useLang()
  const [code, setCode] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onVerify(code)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="text-center">
        <p className="text-sm text-muted">
          {t('auth.otpSent', { phone: auth.pendingPhone ?? '' })}
        </p>
        {import.meta.env.DEV && (
          <p className="text-xs text-warn mt-1">DEV: введи 000000</p>
        )}
      </div>

      <OtpInput value={code} onChange={setCode} />

      {auth.error && (
        <p className="text-sm text-danger text-center">{auth.error}</p>
      )}

      <Button type="submit" fullWidth loading={auth.loading} disabled={code.length < 6}>
        {t('auth.verify')}
      </Button>

      <button
        type="button"
        className="text-sm text-muted hover:text-white text-center transition-colors"
        onClick={onResend}
      >
        {t('auth.resendOtp')}
      </button>

      <button
        type="button"
        className="text-sm text-muted hover:text-white text-center transition-colors"
        onClick={() => { auth.clearError(); auth.setStep('register') }}
      >
        ← {t('common.back')}
      </button>
    </form>
  )
}
