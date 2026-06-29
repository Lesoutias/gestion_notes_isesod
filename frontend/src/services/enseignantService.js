import { api } from './api'

const ENSEIGNANT = '/enseignant'

export function getMesCours() {
  return api.get(`${ENSEIGNANT}/mes-cours`)
}

export function getMesPromotions() {
  return api.get(`${ENSEIGNANT}/mes-promotions`)
}

export function getMesEvaluations() {
  return api.get(`${ENSEIGNANT}/evaluations/`)
}

export function getEvaluationById(id) {
  return api.get(`${ENSEIGNANT}/evaluations/${id}`)
}

export function createEvaluation(data) {
  return api.post(`${ENSEIGNANT}/evaluations/`, data)
}

export function updateEvaluation(id, data) {
  return api.put(`${ENSEIGNANT}/evaluations/${id}`, data)
}

export function deleteEvaluation(id) {
  return api.delete(`${ENSEIGNANT}/evaluations/${id}`)
}

export function cloturerEvaluation(id) {
  return api.patch(`${ENSEIGNANT}/evaluations/${id}/cloturer`)
}

export function getEtudiantsEvaluation(evaluationId) {
  return api.get(`${ENSEIGNANT}/evaluations/${evaluationId}/etudiants`)
}

export function getNotesEvaluation(evaluationId) {
  return api.get(`${ENSEIGNANT}/evaluations/${evaluationId}/notes`)
}

export function saveNoteEvaluation(evaluationId, data) {
  return api.post(`${ENSEIGNANT}/evaluations/${evaluationId}/notes`, data)
}

export function saveNotesEvaluationBulk(evaluationId, data) {
  return api.post(`${ENSEIGNANT}/evaluations/${evaluationId}/notes/bulk`, data)
}

export function updateNote(noteId, data) {
  return api.put(`${ENSEIGNANT}/notes/${noteId}`, data)
}

export function getCahiersNotes() {
  return api.get(`${ENSEIGNANT}/cahiers/`)
}

export function getCahierNotesById(id) {
  return api.get(`${ENSEIGNANT}/cahiers/${id}`)
}

export function getCahierNotesParCours(coursId, anneeAcademiqueId = null) {
  const params = anneeAcademiqueId ? `?annee_academique_id=${anneeAcademiqueId}` : ''
  return api.get(`${ENSEIGNANT}/cahiers/par-cours/${coursId}${params}`)
}

export function genererCahierNotes(coursId, anneeAcademiqueId = null) {
  return api.post(`${ENSEIGNANT}/cahiers/generer`, {
    cours_id: coursId,
    annee_academique_id: anneeAcademiqueId,
  })
}

export function validerCahierNotes(cahierId) {
  return api.patch(`${ENSEIGNANT}/cahiers/${cahierId}/valider`)
}

export function formatNomComplet(personne) {
  if (!personne) return '—'
  return [personne.prenom, personne.nom, personne.postnom].filter(Boolean).join(' ')
}

export function computePourcentage(cote, max) {
  if (!max || max <= 0) return 0
  return Math.round((Number(cote) / Number(max)) * 10000) / 100
}

export const TYPE_EVALUATION_LABELS = {
  TJ: 'Travaux journaliers',
  EXAMEN: 'Examen',
}

export const STATUT_EVALUATION_LABELS = {
  brouillon: 'Brouillon',
  publiee: 'Publiée',
  cloturee: 'Clôturée',
}

export const STATUT_CAHIER_LABELS = {
  brouillon: 'Brouillon',
  valide: 'Validé',
  archive: 'Archivé',
}
