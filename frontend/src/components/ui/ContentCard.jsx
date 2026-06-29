import { cn } from '../../lib/cn'

export function ContentCard({ title, children, className, icon: Icon }) {
  return (
    <article
      className={cn(
        'rounded-2xl border border-white/10 bg-warm-100 p-6 shadow-soft transition-shadow hover:shadow-glow',
        className,
      )}
    >
      {(title || Icon) && (
        <header className="mb-4 flex items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
              <Icon className="h-5 w-5" />
            </div>
          )}
          {title && (
            <h2 className="font-display text-xl font-semibold text-ink-900">{title}</h2>
          )}
        </header>
      )}
      <div className="space-y-3 text-ink-500 leading-relaxed">{children}</div>
    </article>
  )
}
