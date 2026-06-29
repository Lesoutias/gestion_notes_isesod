import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

const variants = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-400 focus-visible:ring-brand-400/50 shadow-soft',
  secondary:
    'bg-warm-200 text-ink-900 border border-white/10 hover:bg-warm-200/80 focus-visible:ring-white/20',
  gold:
    'bg-accent-gold text-brand-900 hover:bg-accent-gold/90 focus-visible:ring-accent-gold/50 font-semibold',
  ghost:
    'bg-transparent text-ink-700 hover:bg-white/5 focus-visible:ring-white/20',
  outline:
    'border border-brand-500/50 text-brand-300 hover:bg-brand-500/10 focus-visible:ring-brand-400/30',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-warm-50',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function ButtonLink({ variant = 'primary', size = 'md', className, children, to, ...props }) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-warm-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
