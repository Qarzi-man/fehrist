import { ButtonHTMLAttributes } from 'react'
import { cx } from '../../lib/utils'
import Spinner from './Spinner'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'ghost'
}

export default function Button({ loading, variant = 'primary', className, children, disabled, ...props }: Props) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md hover:from-blue-700 hover:to-violet-700 hover:shadow-lg focus-visible:ring-violet-500',
    ghost: 'bg-transparent text-indigo-600 hover:bg-indigo-50 focus-visible:ring-indigo-400',
  }

  return (
    <button
      className={cx(base, variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  )
}
