export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getApiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { error?: string } } }).response
    return res?.data?.error ?? fallback
  }
  return fallback
}

export type LimitError = 'business_limit' | 'client_limit' | 'sms_limit'

const LIMIT_ERRORS: LimitError[] = ['business_limit', 'client_limit', 'sms_limit']

export function getLimitError(err: unknown): LimitError | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { status?: number; data?: { error?: string } } }).response
    if (res?.status === 402) {
      const code = res?.data?.error as LimitError
      if (LIMIT_ERRORS.includes(code)) return code
    }
  }
  return null
}
