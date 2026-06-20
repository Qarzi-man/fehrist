import { useRef, KeyboardEvent, ClipboardEvent } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  error?: string
}

const LEN = 6

export default function OtpInput({ value, onChange, error }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const digits = value.padEnd(LEN, '').slice(0, LEN).split('')

  const update = (index: number, char: string) => {
    if (!/^\d$/.test(char) && char !== '') return
    const arr = digits.slice()
    arr[index] = char
    onChange(arr.join('').trimEnd())
    if (char && index < LEN - 1) refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        update(index, '')
      } else if (index > 0) {
        refs.current[index - 1]?.focus()
        const arr = digits.slice()
        arr[index - 1] = ''
        onChange(arr.join('').trimEnd())
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < LEN - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LEN)
    onChange(text)
    refs.current[Math.min(text.length, LEN - 1)]?.focus()
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        {Array.from({ length: LEN }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i] ?? ''}
            onChange={(e) => update(i, e.target.value.slice(-1))}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={[
              'h-13 w-11 rounded-xl border-2 text-center text-xl font-bold transition',
              'focus:outline-none focus:ring-2 focus:ring-indigo-100',
              error
                ? 'border-red-400 bg-red-50'
                : digits[i]
                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 bg-gray-50 text-gray-900',
            ].join(' ')}
          />
        ))}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
