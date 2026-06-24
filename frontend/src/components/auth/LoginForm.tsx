import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import { useT } from '../../i18n'
import { getApiError } from '../../lib/utils'
import Input from '../ui/Input'
import Button from '../ui/Button'

const SAVED_PHONE_KEY = 'daftarcha-saved-phone'

function getSavedPhone() {
  return localStorage.getItem(SAVED_PHONE_KEY) || ''
}

export default function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const t = useT()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const saved = getSavedPhone()
  const [phone, setPhone] = useState(saved || '+992')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(!!saved)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!phone.trim()) return setError(t.errPhoneRequired)
    if (!password) return setError(t.errPasswordRequired)

    if (remember) {
      localStorage.setItem(SAVED_PHONE_KEY, phone.trim())
    } else {
      localStorage.removeItem(SAVED_PHONE_KEY)
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { phone: phone.trim(), password })
      setAuth(data.token, data.user)
      navigate('/dashboard')
    } catch (err) {
      const msg = getApiError(err, '')
      if (msg === 'Invalid credentials') setError(t.errInvalidCredentials)
      else setError(t.errNetwork)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label={t.phone}
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={t.phonePlaceholder}
        autoComplete="tel"
        autoFocus
      />
      <Input
        label={t.password}
        type="password"
        showToggle
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t.passwordPlaceholder}
        autoComplete="current-password"
      />

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
        />
        <span className="text-sm text-gray-600">{t.rememberMe}</span>
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" loading={loading} className="w-full mt-1">
        {t.login}
      </Button>

      <p className="text-center text-sm text-gray-500">
        {t.noAccount}{' '}
        <button type="button" onClick={onSwitch} className="font-semibold text-indigo-600 hover:underline">
          {t.register}
        </button>
      </p>
    </form>
  )
}
