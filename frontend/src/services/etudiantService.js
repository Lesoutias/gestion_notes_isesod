import { api, downloadFile } from './api'

const ETUDIANT = '/etudiant'

export function getEtudiantDashboard() {
  return api.get(`${ETUDIANT}/dashboard`)
}

export function getEtudiantEvaluations(coursId = null) {
  const qs = coursId ? `?cours_id=${coursId}` : ''
  return api.get(`${ETUDIANT}/evaluations${qs}`)
}

export function getMesRelevesCotes() {
  return api.get(`${ETUDIANT}/mes-releves-cotes`)
}

export function getMonReleveCotes(id) {
  return api.get(`${ETUDIANT}/mes-releves-cotes/${id}`)
}

export function downloadMonReleveCotesPdf(id, filename = `releve_cotes_${id}.pdf`) {
  return downloadFile(`${ETUDIANT}/mes-releves-cotes/${id}/pdf`, filename)
}

export function downloadMonBulletinPdf(id, filename = `bulletin_${id}.pdf`) {
  return downloadFile(`${ETUDIANT}/mes-releves-cotes/${id}/bulletin/pdf`, filename)
}

export function formatNomComplet(personne) {
  if (!personne) return '—'
  return [personne.prenom, personne.nom, personne.postnom].filter(Boolean).join(' ')
}

export function promotionLabel(filiere, promotion) {
  if (!promotion) return '—'
  const sigle = filiere?.sigle
  return sigle ? `${sigle} — ${promotion.nom}` : promotion.nom
}

export const STATUT_ETUDIANT_LABELS = {
  actif: 'Actif',
  suspendu: 'Suspendu',
  termine: 'Terminé',
}

export const STATUT_RELEVE_LABELS = {
  genere: 'Généré',
  publie: 'Publié',
}

export const TYPE_EVALUATION_LABELS = {
  TJ: 'Travaux journaliers',
  EXAMEN: 'Examen',
}

export const STATUT_EVALUATION_LABELS = {
  publiee: 'Publiée',
  cloturee: 'Clôturée',
}
