import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { logout } from '../../features/auth/authSlice'
import { Button } from '../ui/Button'

export function EnseignantHeader({ title, subtitle }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

  return (
    <header className="flex flex-col gap-4 border-b border-white/10 bg-warm-50/80 px-6 py-5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-warm-100 px-3 py-2 text-sm text-ink-500 sm:flex">
          <User className="h-4 w-4 text-brand-300" />
          <span>{user?.login}</span>
        </div>
        <Link
          to="/"
          className="text-sm text-ink-400 transition-colors hover:text-brand-300"
        >
          Site public
        </Link>
        <Button variant="ghost" size="sm" onClick={() => dispatch(logout())}>
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </header>
  )
}
