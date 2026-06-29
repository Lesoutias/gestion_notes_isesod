import { cn } from '../../lib/cn'

const tones = {
  brand: 'bg-brand-500/20 text-brand-300 border-brand-500/30',
  gold: 'bg-accent-gold/15 text-accent-gold border-accent-gold/30',
  success: 'bg-success-500/15 text-success-500 border-success-500/30',
  muted: 'bg-white/5 text-ink-500 border-white/10',
}

export function Badge({ tone = 'brand', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 font-mono text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
