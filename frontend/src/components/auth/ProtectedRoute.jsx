import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectAuthRole, selectIsAuthenticated } from '../../features/auth/authSlice'

const LOGIN_PATHS = {
  admin: '/connexion/admin',
  enseignant: '/connexion/enseignant',
  etudiant: '/connexion/etudiant',
}

export function ProtectedRoute({ children, role }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const userRole = useSelector(selectAuthRole)

  if (!isAuthenticated) {
    const loginPath = role ? LOGIN_PATHS[role] || '/connexion/admin' : '/'
    return <Navigate to={loginPath} replace />
  }

  if (role && userRole !== role) {
    return <Navigate to="/" replace />
  }

  return children
}
