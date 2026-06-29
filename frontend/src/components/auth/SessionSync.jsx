import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { logout } from '../../features/auth/authSlice'
import {
  SESSION_EXPIRED_EVENT,
  getStoredAuth,
  isSessionExpired,
  notifySessionExpired,
  resolveExpiresAt,
} from '../../services/session'

export function SessionSync() {
  const dispatch = useDispatch()

  useEffect(() => {
    const stored = getStoredAuth()
    if (stored?.token && isSessionExpired(stored)) {
      notifySessionExpired()
    }

    function handleSessionExpired() {
      dispatch(logout())
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)

    const auth = getStoredAuth()
    let timerId = null
    if (auth?.token && !isSessionExpired(auth)) {
      const expiryMs = resolveExpiresAt(auth)
      if (expiryMs) {
        const delay = expiryMs - Date.now()
        if (delay > 0) {
          timerId = window.setTimeout(() => notifySessionExpired(), delay)
        }
      }
    }

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
      if (timerId) window.clearTimeout(timerId)
    }
  }, [dispatch])

  return null
}
