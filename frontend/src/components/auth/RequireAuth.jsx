import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectAuthRole, selectIsAuthenticated } from '../../features/auth/authSlice'

export function RequireAuth({ children, role }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const userRole = useSelector(selectAuthRole)

  if (!isAuthenticated) {
    const loginPath =
      role === 'admin'
        ? '/connexion/admin'
        : role === 'enseignant'
          ? '/connexion/enseignant'
          : '/connexion/etudiant'
    return <Navigate to={loginPath} replace />
  }

  if (role && userRole !== role) {
    return <Navigate to="/" replace />
  }

  return children
}
