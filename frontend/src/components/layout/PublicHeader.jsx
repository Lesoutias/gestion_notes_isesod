import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { GraduationCap, Menu, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ADMIN_LOGIN, INSTITUTE, LOGIN_LINKS, NAV_LINKS } from '../../content/isesod'
import { ButtonLink } from '../ui/Button'

function loginVariant(link) {
  return link.variant || 'outline'
}

export function PublicHeader({ onMenuOpen, menuOpen }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-white/10 bg-warm-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <span className="font-display text-lg font-bold text-ink-900">{INSTITUTE.name}</span>
            <span className="hidden text-xs text-ink-400 sm:block">Gestion des notes</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-500/20 text-brand-300'
                    : 'text-ink-500 hover:bg-white/5 hover:text-ink-700',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to={ADMIN_LOGIN.to}
            className={({ isActive }) =>
              cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-500/20 text-brand-300'
                  : 'text-ink-500 hover:bg-white/5 hover:text-ink-700',
              )
            }
          >
            {ADMIN_LOGIN.menuLabel}
          </NavLink>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {LOGIN_LINKS.map((link) => (
            <ButtonLink
              key={link.to}
              to={link.to}
              variant={loginVariant(link)}
              size="sm"
            >
              {link.label}
            </ButtonLink>
          ))}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-ink-500 hover:bg-white/5 lg:hidden"
          onClick={() => onMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
    </header>
  )
}

export function MobileDrawer({ open, onClose }) {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <nav className="fixed inset-y-0 right-0 z-50 w-72 border-l border-white/10 bg-warm-100 p-6 lg:hidden">
        <div className="mb-6 flex items-center justify-between">
          <span className="font-display font-semibold text-ink-900">Menu</span>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-ink-400 hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="space-y-1">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'block rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-500/20 text-brand-300'
                      : 'text-ink-500 hover:bg-white/5 hover:text-ink-700',
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink
              to={ADMIN_LOGIN.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'block rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-500/20 text-brand-300'
                    : 'text-ink-500 hover:bg-white/5 hover:text-ink-700',
                )
              }
            >
              {ADMIN_LOGIN.menuLabel}
            </NavLink>
          </li>
        </ul>
        <div className="mt-6 space-y-2 border-t border-white/10 pt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-400">Connexion</p>
          {LOGIN_LINKS.map((link) => (
            <ButtonLink
              key={link.to}
              to={link.to}
              variant={loginVariant(link)}
              size="md"
              className="w-full"
              onClick={onClose}
            >
              Espace {link.label}
            </ButtonLink>
          ))}
        </div>
      </nav>
    </>
  )
}

export function PublicHeaderWithDrawer() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <PublicHeader menuOpen={menuOpen} onMenuOpen={setMenuOpen} />
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
