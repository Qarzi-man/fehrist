import { useRef, type KeyboardEvent, type ClipboardEvent } from 'react'

interface OtpInputProps {
  value: string
  onChange: (v: string) => void
  length?: number
}

export function OtpInput({ value, onChange, length = 6 }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length)

  function update(index: number, char: string) {
    const next = digits.slice()
    next[index] = char.replace(/\D/, '')
    onChange(next.join(''))
    if (char && index < length - 1) refs.current[index + 1]?.focus()
  }

  function handleKey(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pasted) {
      onChange(pasted.padEnd(length, '').slice(0, length))
      refs.current[Math.min(pasted.length, length - 1)]?.focus()
      e.preventDefault()
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => update(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className={[
            'w-11 h-12 text-center text-xl font-semibold rounded-xl border',
            'bg-bg-elevated text-white outline-none transition-colors',
            d ? 'border-primary' : 'border-border',
            'focus:border-primary focus:ring-1 focus:ring-primary',
          ].join(' ')}
        />
      ))}
    </div>
  )
}
