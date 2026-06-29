import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import { useT } from '../../i18n'
import { getApiError } from '../../lib/utils'
import Input from '../ui/Input'
import Button from '../ui/Button'
import OtpInput from '../ui/OtpInput'

type Step = 'phone' | 'otp'

export default function LoginForm({ onSwitch }: { onSwitch: (phone?: string) => void }) {
  const t = useT()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('+992')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendOtpRequest() {
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/send-otp', { phone: phone.trim() })
      return true
    } catch {
      setError(t.errNetwork)
      return false
    } finally {
      setLoading(false)
    }
  }

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault()
    if (!phone.trim()) return setError(t.errPhoneRequired)
    if (await sendOtpRequest()) setStep('otp')
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (otp.length < 6) return setError(t.errOtpRequired)
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { phone: phone.trim(), otp })
      setAuth(data.token, data.user)
      navigate('/dashboard')
    } catch (err) {
      const msg = getApiError(err, '')
      if (msg === 'user_not_found') {
        onSwitch(phone.trim())
      } else if (msg === 'Invalid or expired OTP') {
        setError(t.errInvalidOtp)
      } else {
        setError(t.errNetwork)
      }
    } finally {
      setLoading(false)
    }
  }

  if (step === 'phone') {
    return (
      <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
        <Input
          label={t.phone}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t.phonePlaceholder}
          autoComplete="tel"
          autoFocus
        />
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <Button type="submit" loading={loading} className="w-full mt-1">
          {t.sendOtp}
        </Button>
        <p className="text-center text-sm text-gray-500">
          {t.noAccount}{' '}
          <button type="button" onClick={() => onSwitch()} className="font-semibold text-indigo-600 hover:underline">
            {t.register}
          </button>
        </p>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
      <div className="rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
        {t.otpSentTo} <span className="font-semibold">{phone}</span>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">SMS код</label>
        <OtpInput value={otp} onChange={setOtp} error={error && otp.length < 6 ? error : undefined} />
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      <Button type="submit" loading={loading} className="w-full mt-1">
        {t.login}
      </Button>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => { setStep('phone'); setOtp(''); setError('') }}
          className="text-sm text-gray-400 hover:text-indigo-600 transition"
        >
          ← Изменить номер
        </button>
        <button
          type="button"
          onClick={() => { void sendOtpRequest() }}
          className="text-sm text-gray-400 hover:text-indigo-600 transition"
        >
          {t.resendOtp}
        </button>
      </div>
    </form>
  )
}
