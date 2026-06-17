import { useState } from 'react'
import { sb } from '@/lib/supabase'

export type AuthStep = 'login' | 'register' | 'otp' | 'forgot' | 'forgot-otp'

interface RegisterData {
  phone: string
  password: string
  email?: string
  fullName: string
  businessName: string
}

const DEV_OTP = '000000'
const isDev = import.meta.env.DEV

function phoneToEmail(phone: string) {
  return `${phone.replace(/\D/g, '')}@ph.daftarcha.tj`
}

async function lookupEmail(phone: string): Promise<string> {
  const { data } = await sb
    .from('profiles')
    .select('email')
    .eq('phone', phone)
    .single()
  return (data?.email as string | null) ?? phoneToEmail(phone)
}

async function sendPaycomOtp(phone: string): Promise<void> {
  if (isDev) {
    console.info(`[DEV] OTP for ${phone}: ${DEV_OTP}`)
    return
  }
  const endpoint = import.meta.env.VITE_PAYCOM_SMS_ENDPOINT
  const res = await fetch(`${endpoint}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  })
  if (!res.ok) throw new Error('SMS юборишда хато')
}

async function verifyPaycomOtp(phone: string, code: string): Promise<void> {
  if (isDev) {
    if (code !== DEV_OTP) throw new Error('Нодуруст (dev: 000000)')
    return
  }
  const endpoint = import.meta.env.VITE_PAYCOM_SMS_ENDPOINT
  const res = await fetch(`${endpoint}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  })
  if (!res.ok) throw new Error('Рамзи нодуруст')
}

export function usePhoneAuth() {
  const [step, setStep] = useState<AuthStep>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingData, setPendingData] = useState<RegisterData | null>(null)

  function clearError() { setError(null) }

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    setLoading(true)
    setError(null)
    try {
      return await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Хато рух дод')
      return null
    } finally {
      setLoading(false)
    }
  }

  async function login(phone: string, password: string) {
    await run(async () => {
      const email = await lookupEmail(phone)
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) throw new Error('Рақам ё парол нодуруст')
    })
  }

  async function startRegister(data: RegisterData) {
    await run(async () => {
      const { data: existing } = await sb
        .from('profiles')
        .select('id')
        .eq('phone', data.phone)
        .single()
      if (existing) throw new Error('Ин рақам аллакай сабт шудааст')
      await sendPaycomOtp(data.phone)
      setPendingData(data)
      setStep('otp')
    })
  }

  async function verifyOtpAndRegister(code: string) {
    if (!pendingData) return
    await run(async () => {
      await verifyPaycomOtp(pendingData.phone, code)

      const email = pendingData.email?.trim() || phoneToEmail(pendingData.phone)
      const { data: authData, error: signUpErr } = await sb.auth.signUp({
        email,
        password: pendingData.password,
        options: {
          data: {
            full_name: pendingData.fullName,
            phone: pendingData.phone,
          },
        },
      })
      if (signUpErr) throw signUpErr
      const userId = authData.user?.id
      if (!userId) throw new Error('Хато: id не найдено')

      await sb.from('profiles').insert({
        id: userId,
        phone: pendingData.phone,
        email: pendingData.email?.trim() || null,
        full_name: pendingData.fullName,
      })

      await sb.from('businesses').insert({
        owner_id: userId,
        name: pendingData.businessName,
      })
    })
  }

  async function startForgot(phone: string) {
    await run(async () => {
      const { data } = await sb
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .single()
      if (!data) throw new Error('Ин рақам сабт нашудааст')
      await sendPaycomOtp(phone)
      setPendingData({ phone, password: '', fullName: '', businessName: '' })
      setStep('forgot-otp')
    })
  }

  async function verifyOtpAndReset(code: string, newPassword: string) {
    if (!pendingData) return
    await run(async () => {
      await verifyPaycomOtp(pendingData.phone, code)
      const email = await lookupEmail(pendingData.phone)
      const { error } = await sb.auth.signInWithPassword({ email, password: newPassword })
      if (!error) return
      const { error: updateErr } = await sb.auth.updateUser({ password: newPassword })
      if (updateErr) throw updateErr
    })
  }

  async function loginWithGoogle() {
    await run(async () => {
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
    })
  }

  return {
    step, setStep,
    loading, error, clearError,
    login,
    startRegister,
    verifyOtpAndRegister,
    startForgot,
    verifyOtpAndReset,
    loginWithGoogle,
    pendingPhone: pendingData?.phone ?? null,
  }
}
