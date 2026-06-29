export const STORAGE_KEY = 'isesod_auth'
export const SESSION_EXPIRED_EVENT = 'isesod:session-expired'

export function decodeTokenPayload(token) {
  if (!token) return null
  try {
    const base64 = token.split('.')[1]
    if (!base64) return null
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function getTokenExpiresAt(token) {
  const payload = decodeTokenPayload(token)
  if (!payload?.exp) return null
  return payload.exp * 1000
}

export function resolveExpiresAt({ token, expiresAt, expires_at }) {
  if (expiresAt) return expiresAt
  if (expires_at) return new Date(expires_at).getTime()
  return getTokenExpiresAt(token)
}

export function isTokenExpired(token, now = Date.now()) {
  const expiresAt = getTokenExpiresAt(token)
  if (!expiresAt) return true
  return now >= expiresAt
}

export function isSessionExpired(auth, now = Date.now()) {
  if (!auth?.token) return true
  const expiresAt = resolveExpiresAt(auth)
  if (expiresAt && now >= expiresAt) return true
  return isTokenExpired(auth.token, now)
}

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getValidStoredAuth() {
  const stored = getStoredAuth()
  if (!stored?.token || isSessionExpired(stored)) {
    clearStoredAuth()
    return null
  }
  return {
    ...stored,
    expiresAt: resolveExpiresAt(stored),
  }
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY)
}

export function notifySessionExpired() {
  clearStoredAuth()
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
}

export function persistAuthSession(state) {
  if (state.token && state.user) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: state.token,
        expiresAt: state.expiresAt,
        user: state.user,
        role: state.role,
        etudiant: state.etudiant,
        enseignant: state.enseignant,
        permissions: state.permissions,
      }),
    )
  } else {
    clearStoredAuth()
  }
}
