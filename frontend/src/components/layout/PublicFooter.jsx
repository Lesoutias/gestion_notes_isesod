import { Link } from 'react-router-dom'
import { ADMIN_LOGIN, INSTITUTE, NAV_LINKS } from '../../content/isesod'

export function PublicFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative z-10 border-t border-white/10 bg-warm-100/80">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-3">
            <h3 className="font-display text-lg font-semibold text-ink-900">{INSTITUTE.name}</h3>
            <p className="text-sm text-ink-500 leading-relaxed">{INSTITUTE.fullName}</p>
            <p className="font-display text-sm italic text-accent-gold">{INSTITUTE.motto}</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-ink-400">Navigation</h4>
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-ink-500 transition-colors hover:text-brand-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to={ADMIN_LOGIN.to}
                  className="text-sm text-ink-500 transition-colors hover:text-brand-300"
                >
                  {ADMIN_LOGIN.menuLabel}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-ink-400">Contact</h4>
            <p className="text-sm text-ink-500 leading-relaxed">{INSTITUTE.address}</p>
            <p className="font-mono text-xs text-ink-400">Agrément {INSTITUTE.agrement}</p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-ink-400">
          © {year} {INSTITUTE.name} — Goma, RDC. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}
