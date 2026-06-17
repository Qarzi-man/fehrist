/**
 * Paycom SMS OTP service.
 * Credentials come from VITE_PAYCOM_SMS_LOGIN / VITE_PAYCOM_SMS_PASSWORD.
 * OTP codes are stored in Supabase `otp_codes` table and verified server-side
 * via Edge Function so the secret never touches the client.
 */

const SMS_ENDPOINT = import.meta.env.VITE_PAYCOM_SMS_ENDPOINT as string

export async function sendOtp(phone: string): Promise<void> {
  const res = await fetch(`${SMS_ENDPOINT}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'SMS yuborishda xato')
  }
}

export async function verifyOtp(phone: string, code: string): Promise<{ token: string }> {
  const res = await fetch(`${SMS_ENDPOINT}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Kod noto\'g\'ri')
  }
  return res.json() as Promise<{ token: string }>
}
