import { NavLink } from 'react-router-dom'
import { BookMarked, BookOpen, ClipboardList, LayoutDashboard } from 'lucide-react'
import { cn } from '../../lib/cn'

const NAV_ITEMS = [
  { to: '/enseignant', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/enseignant/cours', label: 'Mes cours', icon: BookOpen, end: false },
  { to: '/enseignant/evaluations', label: 'Évaluations', icon: ClipboardList, end: false },
  { to: '/enseignant/cahier-notes', label: 'Cahier des notes', icon: BookMarked, end: false },
]

export function EnseignantSidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-warm-100">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="font-display text-lg font-semibold text-ink-900">ISESOD</p>
        <p className="text-xs text-ink-400">Espace enseignant</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-500/20 text-brand-300'
                  : 'text-ink-500 hover:bg-white/5 hover:text-ink-700',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
