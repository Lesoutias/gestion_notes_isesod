import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function PageHero({ title, subtitle, breadcrumbs = [] }) {
  return (
    <header className="mb-8 space-y-3">
      {breadcrumbs.length > 0 && (
        <nav className="flex flex-wrap items-center gap-1 text-sm text-ink-400">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.label} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-brand-300 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-ink-500">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <h1 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">{title}</h1>
      {subtitle && <p className="max-w-3xl text-lg text-ink-500">{subtitle}</p>}
    </header>
  )
}
