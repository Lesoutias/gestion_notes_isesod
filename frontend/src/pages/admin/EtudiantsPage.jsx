import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Eye,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { DeleteEtudiantDialog } from '../../components/admin/DeleteEtudiantDialog'
import { EtudiantDetailModal } from '../../components/admin/EtudiantDetailModal'
import { Badge } from '../../components/ui/Badge'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ApiError } from '../../services/api'
import {
  deleteEtudiant,
  getActiveAnneeAcademique,
  getAnneesAcademiques,
  getEtudiants,
  getFilieres,
  getPromotions,
} from '../../services/adminService'

const STATUTS_ACADEMIQUES = [
  { value: '', label: 'Tous les statuts' },
  { value: 'actif', label: 'Actif' },
  { value: 'suspendu', label: 'Suspendu' },
  { value: 'termine', label: 'Terminé' },
]

const STATUTS_COMPTE = [
  { value: '', label: 'Tous les comptes' },
  { value: 'avec', label: 'Compte créé' },
  { value: 'sans', label: 'Compte non créé' },
]

const selectClassName =
  'w-full rounded-xl border border-white/10 bg-warm-100 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30'

function AccountBadge({ userId }) {
  return userId ? (
    <Badge tone="success">Compte créé</Badge>
  ) : (
    <Badge tone="gold">Compte non créé</Badge>
  )
}

function formatFullName(etudiant) {
  return `${etudiant.prenom} ${etudiant.nom} ${etudiant.postnom}`.trim()
}

function matchesSearch(etudiant, query) {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  const fields = [
    etudiant.matricule,
    etudiant.nom,
    etudiant.postnom,
    etudiant.prenom,
    etudiant.email,
  ]
  return fields.some((f) => f && String(f).toLowerCase().includes(q))
}

export default function EtudiantsPage() {
  const [etudiants, setEtudiants] = useState([])
  const [filieres, setFilieres] = useState([])
  const [promotions, setPromotions] = useState([])
  const [annees, setAnnees] = useState([])
  const [activeAnnee, setActiveAnnee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [filiereId, setFiliereId] = useState('')
  const [promotionId, setPromotionId] = useState('')
  const [statutAcademique, setStatutAcademique] = useState('')
  const [statutCompte, setStatutCompte] = useState('')

  const [detailEtudiant, setDetailEtudiant] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filiereById = useMemo(
    () => Object.fromEntries(filieres.map((f) => [f.id, f])),
    [filieres],
  )
  const promotionById = useMemo(
    () => Object.fromEntries(promotions.map((p) => [p.id, p])),
    [promotions],
  )
  const anneeById = useMemo(
    () => Object.fromEntries(annees.map((a) => [a.id, a])),
    [annees],
  )

  const promotionsForFiliere = useMemo(() => {
    if (!filiereId) return promotions
    return promotions.filter((p) => String(p.filiere_id) === filiereId)
  }, [promotions, filiereId])

  const filteredEtudiants = useMemo(() => {
    return etudiants.filter((etudiant) => {
      if (!matchesSearch(etudiant, search)) return false

      if (statutAcademique && etudiant.statut !== statutAcademique) return false

      if (statutCompte === 'avec' && !etudiant.user_id) return false
      if (statutCompte === 'sans' && etudiant.user_id) return false

      if (promotionId && String(etudiant.promotion_id) !== promotionId) return false

      if (filiereId && !promotionId) {
        const promo = promotionById[etudiant.promotion_id]
        if (!promo || String(promo.filiere_id) !== filiereId) return false
      }

      return true
    })
  }, [etudiants, search, statutAcademique, statutCompte, promotionId, filiereId, promotionById])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [etudiantsData, filieresData, promotionsData, anneesData] = await Promise.all([
        getEtudiants(),
        getFilieres(),
        getPromotions(),
        getAnneesAcademiques(),
      ])
      setEtudiants(etudiantsData)
      setFilieres(filieresData)
      setPromotions(promotionsData)
      setAnnees(anneesData)

      const active = await getActiveAnneeAcademique()
      setActiveAnnee(active)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function handleFiliereChange(value) {
    setFiliereId(value)
    setPromotionId('')
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setError('')
    try {
      await deleteEtudiant(deleteTarget.id)
      setEtudiants((prev) => prev.filter((e) => e.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression impossible')
    } finally {
      setDeleting(false)
    }
  }

  function getFiliereForEtudiant(etudiant) {
    const promo = promotionById[etudiant.promotion_id]
    return promo ? filiereById[promo.filiere_id] : null
  }

  return (
    <>
      <AdminHeader
        title="Étudiants"
        subtitle="Inscription académique — le compte utilisateur est créé séparément par l'étudiant avec son matricule"
      />

      <div className="space-y-6 p-6">
        {!loading && !activeAnnee && (
          <div className="flex items-start gap-3 rounded-xl border border-accent-gold/30 bg-accent-gold/10 px-4 py-3 text-sm text-accent-gold">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <strong>Aucune année académique active.</strong>{' '}
              <Link to="/admin/annees-academiques" className="underline hover:text-accent-gold/80">
                Créez et activez une année académique
              </Link>{' '}
              avant d&apos;inscrire des étudiants. Les nouveaux étudiants sont automatiquement
              rattachés à l&apos;année active.
            </p>
          </div>
        )}

        {activeAnnee && (
          <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-ink-500">
            Année académique active :{' '}
            <strong className="text-brand-300">{activeAnnee.libelle}</strong>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              name="search"
              placeholder="Rechercher par matricule, nom, prénom, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <ButtonLink to="/admin/etudiants/nouveau" variant="gold" size="md" className="shrink-0">
            <Plus className="h-4 w-4" />
            Ajouter un étudiant
          </ButtonLink>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <label htmlFor="filter-filiere" className="block text-xs font-medium uppercase tracking-wider text-ink-400">
              Filière
            </label>
            <select
              id="filter-filiere"
              value={filiereId}
              onChange={(e) => handleFiliereChange(e.target.value)}
              className={selectClassName}
            >
              <option value="">Toutes les filières</option>
              {filieres.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.sigle} — {f.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="filter-promotion" className="block text-xs font-medium uppercase tracking-wider text-ink-400">
              Promotion
            </label>
            <select
              id="filter-promotion"
              value={promotionId}
              onChange={(e) => setPromotionId(e.target.value)}
              className={selectClassName}
            >
              <option value="">Toutes les promotions</option>
              {promotionsForFiliere.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="filter-statut" className="block text-xs font-medium uppercase tracking-wider text-ink-400">
              Statut académique
            </label>
            <select
              id="filter-statut"
              value={statutAcademique}
              onChange={(e) => setStatutAcademique(e.target.value)}
              className={selectClassName}
            >
              {STATUTS_ACADEMIQUES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="filter-compte" className="block text-xs font-medium uppercase tracking-wider text-ink-400">
              Statut du compte
            </label>
            <select
              id="filter-compte"
              value={statutCompte}
              onChange={(e) => setStatutCompte(e.target.value)}
              className={selectClassName}
            >
              {STATUTS_COMPTE.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-warm-100">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-white/10 bg-warm-200/50 text-xs uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3">Matricule</th>
                <th className="px-4 py-3">Nom complet</th>
                <th className="px-4 py-3">Sexe</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Filière</th>
                <th className="px-4 py-3">Promotion</th>
                <th className="px-4 py-3">Année acad.</th>
                <th className="px-4 py-3">Statut acad.</th>
                <th className="px-4 py-3">Compte</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-ink-400">
                    Chargement des étudiants…
                  </td>
                </tr>
              ) : etudiants.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center">
                    <GraduationCap className="mx-auto mb-3 h-10 w-10 text-ink-400" />
                    <p className="text-ink-400">Aucun étudiant enregistré</p>
                    <ButtonLink to="/admin/etudiants/nouveau" variant="gold" size="sm" className="mt-4">
                      Ajouter un étudiant
                    </ButtonLink>
                  </td>
                </tr>
              ) : filteredEtudiants.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-ink-400">
                    Aucun résultat pour ces critères de recherche
                  </td>
                </tr>
              ) : (
                filteredEtudiants.map((etudiant) => {
                  const filiere = getFiliereForEtudiant(etudiant)
                  const promotion = promotionById[etudiant.promotion_id]
                  const annee = anneeById[etudiant.annee_academique_id]

                  return (
                    <tr key={etudiant.id} className="border-b border-white/5 text-ink-500">
                      <td className="px-4 py-3 font-mono text-brand-300">
                        {etudiant.matricule || '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink-700">
                        {formatFullName(etudiant)}
                      </td>
                      <td className="px-4 py-3">{etudiant.sexe}</td>
                      <td className="px-4 py-3">{etudiant.email || '—'}</td>
                      <td className="px-4 py-3">{etudiant.telephone || '—'}</td>
                      <td className="px-4 py-3">{filiere?.sigle || '—'}</td>
                      <td className="px-4 py-3">{promotion?.nom || '—'}</td>
                      <td className="px-4 py-3">{annee?.libelle || '—'}</td>
                      <td className="px-4 py-3 capitalize">{etudiant.statut}</td>
                      <td className="px-4 py-3">
                        <AccountBadge userId={etudiant.user_id} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailEtudiant(etudiant)}
                            title="Voir détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Link
                            to={`/admin/etudiants/${etudiant.id}/modifier`}
                            className="inline-flex items-center rounded-lg p-2 text-brand-300 hover:bg-brand-500/10"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(etudiant)}
                            className="text-danger-500 hover:bg-danger-500/10"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && etudiants.length > 0 && (
          <p className="text-sm text-ink-400">
            {filteredEtudiants.length} étudiant{filteredEtudiants.length !== 1 ? 's' : ''} affiché
            {filteredEtudiants.length !== 1 ? 's' : ''} sur {etudiants.length}
          </p>
        )}
      </div>

      <EtudiantDetailModal
        etudiant={detailEtudiant}
        filiere={detailEtudiant ? getFiliereForEtudiant(detailEtudiant) : null}
        promotion={detailEtudiant ? promotionById[detailEtudiant.promotion_id] : null}
        annee={detailEtudiant ? anneeById[detailEtudiant.annee_academique_id] : null}
        onClose={() => setDetailEtudiant(null)}
      />

      <DeleteEtudiantDialog
        etudiant={deleteTarget}
        deleting={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
