import { apiRequest } from './api'

export function login(identifiant, motDePasse, role) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: { identifiant, mot_de_passe: motDePasse, role },
  })
}

export function verifyMatriculeEtudiant(matricule) {
  return apiRequest('/auth/verify-matricule-etudiant', {
    method: 'POST',
    body: { matricule },
  })
}

export function verifyMatriculeEnseignant(matricule) {
  return apiRequest('/auth/verify-matricule-enseignant', {
    method: 'POST',
    body: { matricule },
  })
}

export function registerEtudiant(payload) {
  return apiRequest('/auth/register-etudiant', {
    method: 'POST',
    body: payload,
  })
}

export function registerEnseignant(payload) {
  return apiRequest('/auth/register-enseignant', {
    method: 'POST',
    body: payload,
  })
}

export function fetchMe(token) {
  return apiRequest('/auth/me', { token })
}
