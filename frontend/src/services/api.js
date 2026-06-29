import {
  clearStoredAuth,
  getStoredAuth,
  isSessionExpired,
  notifySessionExpired,
  STORAGE_KEY,
} from './session'

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api'

const STATUS_MESSAGES = {
  401: 'Session expirée. Veuillez vous reconnecter.',
  403: 'Accès refusé.',
  404: 'Ressource introuvable.',
  422: 'Données invalides. Vérifiez le formulaire.',
  500: 'Erreur serveur. Réessayez plus tard.',
}

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function getStoredToken() {
  const stored = getStoredAuth()
  if (!stored?.token || isSessionExpired(stored)) {
    return null
  }
  return stored.token
}

function parseErrorDetail(data) {
  if (!data?.detail) return null
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) {
    return data.detail.map((e) => e.msg || String(e)).join(', ')
  }
  return null
}

function resolveErrorMessage(status, data) {
  return parseErrorDetail(data) || STATUS_MESSAGES[status] || `Erreur ${status}`
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    token,
    auth = true,
    headers = {},
  } = options

  const storedAuth = auth ? getStoredAuth() : null
  if (auth && storedAuth?.token && isSessionExpired(storedAuth)) {
    notifySessionExpired()
    throw new ApiError(STATUS_MESSAGES[401], 401)
  }

  const bearerToken = token ?? (auth ? getStoredToken() : null)

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) {
    if (!response.ok) {
      throw new ApiError(resolveErrorMessage(response.status), response.status)
    }
    return null
  }

  let data = null
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    data = await response.json()
  }

  if (!response.ok) {
    if (response.status === 401) {
      notifySessionExpired()
    }
    throw new ApiError(resolveErrorMessage(response.status, data), response.status, data)
  }

  return data
}

export async function downloadFile(path, filename, options = {}) {
  const { token, auth = true } = options

  const storedAuth = auth ? getStoredAuth() : null
  if (auth && storedAuth?.token && isSessionExpired(storedAuth)) {
    notifySessionExpired()
    throw new ApiError(STATUS_MESSAGES[401], 401)
  }

  const bearerToken = token ?? (auth ? getStoredToken() : null)

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
    },
  })

  if (!response.ok) {
    let data = null
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = await response.json()
    }
    if (response.status === 401) {
      notifySessionExpired()
    }
    throw new ApiError(resolveErrorMessage(response.status, data), response.status, data)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
}

export { STORAGE_KEY, clearStoredAuth }
