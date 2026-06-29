import { cn } from '../../lib/cn'

export function Input({ label, error, id, className, ...props }) {
  const inputId = id || props.name

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-xl border border-white/10 bg-warm-100 px-4 py-2.5 text-ink-900',
          'placeholder:text-ink-400 transition-colors',
          'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
          error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/30',
          className,
        )}
        {...props}
      />
      {error && <p className="text-sm text-danger-500">{error}</p>}
    </div>
  )
}
