import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { authFailure, authStart, authSuccess } from '../features/auth/authSlice'
import { login as loginApi } from '../services/auth'
import { ApiError } from '../lib/api'

const ROLE_REDIRECTS = {
  admin: '/admin/dashboard',
  enseignant: '/enseignant',
  etudiant: '/espace/etudiant',
}

export function useAuthActions() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  async function handleLogin(identifiant, motDePasse) {
    dispatch(authStart())
    try {
      const data = await loginApi(identifiant, motDePasse)
      dispatch(authSuccess(data))
      const roleNom = data.role?.nom
      navigate(ROLE_REDIRECTS[roleNom] || '/')
      return data
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Connexion impossible'
      dispatch(authFailure(message))
      throw error
    }
  }

  function handleAuthResponse(data) {
    dispatch(authSuccess(data))
    const roleNom = data.role?.nom
    navigate(ROLE_REDIRECTS[roleNom] || '/')
  }

  return { handleLogin, handleAuthResponse }
}
