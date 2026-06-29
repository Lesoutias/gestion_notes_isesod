import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectAuthRole, selectIsAuthenticated } from '../../features/auth/authSlice'

const ROLE_REDIRECTS = {
  admin: '/admin/dashboard',
  enseignant: '/enseignant',
  etudiant: '/espace/etudiant',
}

export function RedirectIfAuthenticated({ children, expectedRole }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const userRole = useSelector(selectAuthRole)

  if (isAuthenticated && (!expectedRole || userRole === expectedRole)) {
    return <Navigate to={ROLE_REDIRECTS[userRole] || '/'} replace />
  }

  return children
}
