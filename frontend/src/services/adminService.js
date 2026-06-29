import { api } from './api'

const ADMIN = '/admin'

export async function getAdminDashboardData() {
  const [etudiants, enseignants, promotions] = await Promise.all([
    api.get(`${ADMIN}/etudiants/`),
    api.get(`${ADMIN}/enseignants/`),
    api.get(`${ADMIN}/promotions/`),
  ])

  const promotionById = Object.fromEntries(promotions.map((p) => [p.id, p]))
  const etudiantsAvecCompte = etudiants.filter((e) => e.user_id).length
  const enseignantsAvecCompte = enseignants.filter((e) => e.user_id).length

  const etudiantsParPromotion = Object.values(
    etudiants.reduce((acc, etudiant) => {
      const promo = promotionById[etudiant.promotion_id]
      const key = promo ? `${promo.nom}` : `Promo #${etudiant.promotion_id}`
      if (!acc[key]) acc[key] = { promotion: key, total: 0 }
      acc[key].total += 1
      return acc
    }, {}),
  )
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  return {
    stats: {
      etudiantsTotal: etudiants.length,
      enseignantsTotal: enseignants.length,
      etudiantsAvecCompte,
      etudiantsSansCompte: etudiants.length - etudiantsAvecCompte,
      enseignantsAvecCompte,
      enseignantsSansCompte: enseignants.length - enseignantsAvecCompte,
    },
    charts: {
      accountActivation: [
        {
          role: 'Étudiants',
          avecCompte: etudiantsAvecCompte,
          sansCompte: etudiants.length - etudiantsAvecCompte,
        },
        {
          role: 'Enseignants',
          avecCompte: enseignantsAvecCompte,
          sansCompte: enseignants.length - enseignantsAvecCompte,
        },
      ],
      etudiantsParPromotion,
      effectifs: [
        { label: 'Étudiants', total: etudiants.length },
        { label: 'Enseignants', total: enseignants.length },
      ],
    },
    promotionById,
  }
}

/** @deprecated Préférer getAdminDashboardData */
export async function getAdminDashboardStats() {
  const { stats } = await getAdminDashboardData()
  return stats
}

export function getEtudiants() {
  return api.get(`${ADMIN}/etudiants/`)
}

export function getEtudiantById(id) {
  return api.get(`${ADMIN}/etudiants/${id}`)
}

export function createEtudiant(data) {
  return api.post(`${ADMIN}/etudiants/`, data)
}

export function updateEtudiant(id, data) {
  return api.put(`${ADMIN}/etudiants/${id}`, data)
}

export function deleteEtudiant(id) {
  return api.delete(`${ADMIN}/etudiants/${id}`)
}

export function getEnseignants() {
  return api.get(`${ADMIN}/enseignants/`)
}

export function getEnseignantById(id) {
  return api.get(`${ADMIN}/enseignants/${id}`)
}

export function createEnseignant(data) {
  return api.post(`${ADMIN}/enseignants/`, data)
}

export function updateEnseignant(id, data) {
  return api.put(`${ADMIN}/enseignants/${id}`, data)
}

export function deleteEnseignant(id) {
  return api.delete(`${ADMIN}/enseignants/${id}`)
}

export function getPromotions() {
  return api.get(`${ADMIN}/promotions/`)
}

export function getFilieres() {
  return api.get(`${ADMIN}/filieres/`)
}

export function getAnneesAcademiques() {
  return api.get(`${ADMIN}/annees-academiques/`)
}

export function getActiveAnneeAcademique() {
  return api.get(`${ADMIN}/annees-academiques/active`)
}

export function createAnneeAcademique(data) {
  return api.post(`${ADMIN}/annees-academiques/`, data)
}

export function activateAnneeAcademique(id) {
  return api.patch(`${ADMIN}/annees-academiques/${id}/activer`)
}

export function cloturerAnneeAcademique(id) {
  return api.patch(`${ADMIN}/annees-academiques/${id}/cloturer`)
}

// --- Cours catalogue ---

export function getCours() {
  return api.get(`${ADMIN}/cours/`)
}

export function getCoursById(id) {
  return api.get(`${ADMIN}/cours/${id}`)
}

export function createCours(data) {
  return api.post(`${ADMIN}/cours/`, data)
}

export function updateCours(id, data) {
  return api.put(`${ADMIN}/cours/${id}`, data)
}

export function deleteCours(id) {
  return api.delete(`${ADMIN}/cours/${id}`)
}

// --- Affectations cours-promotion ---

export function getAffectationsCours() {
  return api.get(`${ADMIN}/affectations-cours/`)
}

export function getAffectationCoursById(id) {
  return api.get(`${ADMIN}/affectations-cours/${id}`)
}

export function affecterCoursPromotion(data) {
  return api.post(`${ADMIN}/affectations-cours/`, data)
}

export function updateAffectationCours(id, data) {
  return api.put(`${ADMIN}/affectations-cours/${id}`, data)
}

export function deleteAffectationCours(id) {
  return api.delete(`${ADMIN}/affectations-cours/${id}`)
}

export function affecterEnseignantAuCours(affectationId, enseignantId) {
  return api.patch(`${ADMIN}/affectations-cours/${affectationId}/enseignant/${enseignantId}`)
}

export function retirerEnseignantDuCours(affectationId) {
  return api.patch(`${ADMIN}/affectations-cours/${affectationId}/retirer-enseignant`)
}

export function computeCredits(volumeHoraire) {
  if (!volumeHoraire || volumeHoraire <= 0) return 0
  return Math.round(volumeHoraire / 15)
}
