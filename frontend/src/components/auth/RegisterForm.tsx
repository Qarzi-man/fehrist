import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import { useT } from '../../i18n'
import { getApiError } from '../../lib/utils'
import Input from '../ui/Input'
import Button from '../ui/Button'
import OtpInput from '../ui/OtpInput'

type Step = 1 | 2

export default function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const t = useT()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [step, setStep] = useState<Step>(1)
  const [phone, setPhone] = useState('+992')
  const [otp, setOtp] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!phone.trim()) return setError(t.errPhoneRequired)

    setLoading(true)
    try {
      await api.post('/auth/send-otp', { phone: phone.trim() })
      setStep(2)
    } catch {
      setError(t.errNetwork)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (otp.length < 6) return setError(t.errOtpRequired)
    if (!fullName.trim()) return setError(t.errNameRequired)
    if (password.length < 6) return setError(t.errPasswordShort)

    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', {
        phone: phone.trim(),
        otp,
        full_name: fullName.trim(),
        password,
      })
      setAuth(data.token, data.user)
      navigate('/dashboard')
    } catch (err) {
      const msg = getApiError(err, '')
      if (msg === 'Invalid or expired OTP') setError(t.errInvalidOtp)
      else if (msg === 'Phone already registered') setError(t.errPhoneExists)
      else setError(t.errNetwork)
    } finally {
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
        <p className="text-sm text-gray-500">{t.step1Hint}</p>
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
          {t.alreadyHaveAccount}{' '}
          <button type="button" onClick={onSwitch} className="font-semibold text-indigo-600 hover:underline">
            {t.login}
          </button>
        </p>
      </form>
    )
  }

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-4">
      <div className="rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
        {t.otpSentTo} <span className="font-semibold">{phone}</span>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">SMS код</label>
        <OtpInput value={otp} onChange={setOtp} error={error && otp.length < 6 ? error : undefined} />
      </div>

      <Input
        label={t.fullName}
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder={t.namePlaceholder}
        autoComplete="name"
      />

      <Input
        label={t.password}
        type="password"
        showToggle
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t.passwordPlaceholder}
        autoComplete="new-password"
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-2 mt-1">
        <Button
          type="button"
          variant="ghost"
          onClick={() => { setStep(1); setOtp(''); setError('') }}
          className="flex-1"
        >
          ←
        </Button>
        <Button type="submit" loading={loading} className="flex-[3]">
          {t.verifyAndRegister}
        </Button>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={handleSendOtp}
          className="text-sm text-gray-400 hover:text-indigo-600 transition"
        >
          {t.resendOtp}
        </button>
      </div>
    </form>
  )
}
