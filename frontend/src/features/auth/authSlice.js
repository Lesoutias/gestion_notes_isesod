import { createSlice } from '@reduxjs/toolkit'
import {
  getValidStoredAuth,
  isSessionExpired,
  persistAuthSession,
  resolveExpiresAt,
} from '../../services/session'

const stored = getValidStoredAuth()

const initialState = {
  token: stored?.token ?? null,
  expiresAt: stored?.expiresAt ?? null,
  user: stored?.user ?? null,
  role: stored?.role ?? null,
  etudiant: stored?.etudiant ?? null,
  enseignant: stored?.enseignant ?? null,
  permissions: stored?.permissions ?? [],
  status: 'idle',
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart(state) {
      state.status = 'loading'
      state.error = null
    },
    authSuccess(state, action) {
      const { access_token, user, role, etudiant, enseignant, permissions, expires_at } =
        action.payload
      state.status = 'authenticated'
      state.token = access_token
      state.expiresAt = resolveExpiresAt({
        token: access_token,
        expires_at,
      })
      state.user = user
      state.role = role
      state.etudiant = etudiant ?? null
      state.enseignant = enseignant ?? null
      state.permissions = permissions ?? []
      state.error = null
      persistAuthSession(state)
    },
    authFailure(state, action) {
      state.status = 'idle'
      state.error = action.payload
    },
    logout(state) {
      state.token = null
      state.expiresAt = null
      state.user = null
      state.role = null
      state.etudiant = null
      state.enseignant = null
      state.permissions = []
      state.status = 'idle'
      state.error = null
      persistAuthSession(state)
    },
    clearAuthError(state) {
      state.error = null
    },
    authIdle(state) {
      state.status = state.token ? 'authenticated' : 'idle'
    },
  },
})

export const { authStart, authSuccess, authFailure, logout, clearAuthError, authIdle } =
  authSlice.actions
export default authSlice.reducer

export function selectIsAuthenticated(state) {
  const { token, expiresAt } = state.auth
  if (!token) return false
  return !isSessionExpired({ token, expiresAt })
}

export function selectAuthRole(state) {
  return state.auth.role?.nom ?? null
}

export function selectSessionExpiresAt(state) {
  return state.auth.expiresAt
}
