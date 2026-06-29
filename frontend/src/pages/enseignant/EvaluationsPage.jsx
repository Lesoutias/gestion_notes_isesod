import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  Lock,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
} from 'lucide-react'
import { EnseignantHeader } from '../../components/enseignant/EnseignantHeader'
import { SuccessBanner, selectClassName } from '../../components/admin/adminUi.js'
import { Badge } from '../../components/ui/Badge'
import { Button, ButtonLink } from '../../components/ui/Button'
import { cn } from '../../lib/cn'
import { ApiError } from '../../services/api'
import {
  cloturerEvaluation,
  deleteEvaluation,
  getCahiersNotes,
  getMesCours,
  getMesEvaluations,
  getMesPromotions,
  getNotesEvaluation,
  getEtudiantsEvaluation,
  STATUT_EVALUATION_LABELS,
  TYPE_EVALUATION_LABELS,
} from '../../services/enseignantService'

const PAGE_SIZE = 10

function IconLink({ to, label, icon: Icon, className }) {
  return (
    <Link
      to={to}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-2 transition-colors',
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </Link>
  )
}

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState([])
  const [cours, setCours] = useState([])
  const [promotions, setPromotions] = useState([])
  const [noteCounts, setNoteCounts] = useState({})
  const [etudiantCounts, setEtudiantCounts] = useState({})
  const [cahierStatutByCours, setCahierStatutByCours] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [coursId, setCoursId] = useState('')
  const [promotionId, setPromotionId] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)

  const coursById = useMemo(() => Object.fromEntries(cours.map((c) => [c.id, c])), [cours])
  const promotionById = useMemo(
    () => Object.fromEntries(promotions.map((p) => [p.id, p])),
    [promotions],
  )

  const filtered = useMemo(() => {
    return evaluations.filter((ev) => {
      const c = coursById[ev.cours_id]
      if (coursId && String(ev.cours_id) !== coursId) return false
      if (promotionId && String(c?.promotion_id) !== promotionId) return false
      if (typeFilter && ev.type_evaluation !== typeFilter) return false
      return true
    })
  }, [evaluations, coursById, coursId, promotionId, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [evData, coursData, promos, cahiers] = await Promise.all([
        getMesEvaluations(),
        getMesCours(),
        getMesPromotions(),
        getCahiersNotes(),
      ])
      setEvaluations(evData)
      setCours(coursData)
      setPromotions(promos)

      const statuts = {}
      cahiers.forEach((cahier) => {
        statuts[cahier.cours_id] = cahier.statut
      })
      setCahierStatutByCours(statuts)

      const counts = {}
      const etuCounts = {}
      await Promise.all(
        evData.map(async (ev) => {
          try {
            const [notes, etudiants] = await Promise.all([
              getNotesEvaluation(ev.id),
              getEtudiantsEvaluation(ev.id),
            ])
            counts[ev.id] = notes.length
            etuCounts[ev.id] = etudiants.length
          } catch {
            counts[ev.id] = 0
            etuCounts[ev.id] = 0
          }
        }),
      )
      setNoteCounts(counts)
      setEtudiantCounts(etuCounts)
      setPage(1)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  async function handleDelete(ev) {
    if (cahierStatutByCours[ev.cours_id] === 'valide') {
      setError('Impossible de supprimer : le cahier de cotes est déjà validé pour ce cours')
      return
    }
    if (
      !window.confirm(
        `Supprimer l'évaluation « ${ev.libelle} » ? Les notes associées seront retirées et le cahier des notes sera recalculé.`,
      )
    ) {
      return
    }
    setError('')
    try {
      await deleteEvaluation(ev.id)
      setEvaluations((prev) => prev.filter((e) => e.id !== ev.id))
      setSuccess('Évaluation supprimée')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression impossible')
    }
  }

  async function handleCloturer(ev) {
    const notes = noteCounts[ev.id] ?? 0
    const total = etudiantCounts[ev.id] ?? 0
    if (notes === 0) {
      setError('Impossible de clôturer : aucun étudiant n\'a été coté')
      return
    }
    if (notes < total) {
      setError(
        `Impossible de clôturer : ${total - notes} étudiant${total - notes > 1 ? 's' : ''} non encore coté${total - notes > 1 ? 's' : ''}`,
      )
      return
    }
    setError('')
    try {
      const updated = await cloturerEvaluation(ev.id)
      setEvaluations((prev) => prev.map((e) => (e.id === ev.id ? updated : e)))
      setSuccess('Évaluation clôturée')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Clôture impossible')
    }
  }

  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length)

  return (
    <>
      <EnseignantHeader
        title="Évaluations"
        subtitle="Créez des TJ et un examen, puis cotez les étudiants de la promotion"
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="filter-cours" className="block text-xs font-medium uppercase text-ink-400">
                Cours
              </label>
              <select
                id="filter-cours"
                value={coursId}
                onChange={(e) => {
                  setCoursId(e.target.value)
                  setPage(1)
                }}
                className={selectClassName}
              >
                <option value="">Tous les cours</option>
                {cours.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.intitule}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="filter-promo" className="block text-xs font-medium uppercase text-ink-400">
                Promotion
              </label>
              <select
                id="filter-promo"
                value={promotionId}
                onChange={(e) => {
                  setPromotionId(e.target.value)
                  setPage(1)
                }}
                className={selectClassName}
              >
                <option value="">Toutes</option>
                {promotions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="filter-type" className="block text-xs font-medium uppercase text-ink-400">
                Type
              </label>
              <select
                id="filter-type"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setPage(1)
                }}
                className={selectClassName}
              >
                <option value="">Tous</option>
                <option value="TJ">TJ</option>
                <option value="EXAMEN">Examen</option>
              </select>
            </div>
          </div>
          <ButtonLink to="/enseignant/evaluations/nouveau" variant="gold" size="md" className="shrink-0">
            <Plus className="h-4 w-4" />
            Créer une évaluation
          </ButtonLink>
        </div>

        <SuccessBanner message={success} onClose={() => setSuccess('')} />
        {error && (
          <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-warm-100">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 bg-warm-200/50 text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-3 py-3">Cours</th>
                  <th className="px-3 py-3">Promotion</th>
                  <th className="px-3 py-3">Libellé</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Max</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Cotés</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-12 text-center text-ink-400">
                      Chargement…
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-12 text-center">
                      <ClipboardList className="mx-auto mb-3 h-10 w-10 text-ink-400" />
                      <p className="text-ink-400">Aucune évaluation</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((ev) => {
                    const c = coursById[ev.cours_id]
                    const promo = c ? promotionById[c.promotion_id] : null
                    const isCloturee = ev.statut === 'cloturee'
                    const notesCount = noteCounts[ev.id] ?? 0
                    const etuCount = etudiantCounts[ev.id] ?? 0
                    const peutCloturer = !isCloturee && notesCount > 0 && notesCount >= etuCount
                    const cahierValide = cahierStatutByCours[ev.cours_id] === 'valide'
                    const peutSupprimer = !cahierValide
                    return (
                      <tr key={ev.id} className="border-b border-white/5 text-ink-500">
                        <td className="px-3 py-2.5 font-medium text-ink-700">{c?.intitule || '—'}</td>
                        <td className="px-3 py-2.5">{promo?.nom || '—'}</td>
                        <td className="px-3 py-2.5">{ev.libelle}</td>
                        <td className="px-3 py-2.5">
                          <Badge tone={ev.type_evaluation === 'TJ' ? 'brand' : 'gold'}>
                            {ev.type_evaluation}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">/{ev.cote_maximale}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {new Date(ev.date_evaluation).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-3 py-2.5">{noteCounts[ev.id] ?? 0}</td>
                        <td className="px-3 py-2.5">
                          <Badge tone={isCloturee ? 'success' : 'gold'}>
                            {STATUT_EVALUATION_LABELS[ev.statut] || ev.statut}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-end gap-0.5">
                            <IconLink
                              to={`/enseignant/evaluations/${ev.id}/cotation`}
                              label="Coter les étudiants"
                              icon={UserCheck}
                              className="text-brand-300 hover:bg-brand-500/10"
                            />
                            {!isCloturee && (
                              <>
                                <IconLink
                                  to={`/enseignant/evaluations/${ev.id}/modifier`}
                                  label="Modifier"
                                  icon={Pencil}
                                  className="text-brand-300 hover:bg-brand-500/10"
                                />
                                <button
                                  type="button"
                                  title={
                                    peutCloturer
                                      ? 'Clôturer'
                                      : 'Cotez tous les étudiants avant de clôturer'
                                  }
                                  aria-label="Clôturer"
                                  onClick={() => handleCloturer(ev)}
                                  disabled={!peutCloturer}
                                  className={cn(
                                    'inline-flex items-center justify-center rounded-lg p-2',
                                    peutCloturer
                                      ? 'text-accent-gold hover:bg-accent-gold/10'
                                      : 'cursor-not-allowed text-ink-400 opacity-50',
                                  )}
                                >
                                  <Lock className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {peutSupprimer && (
                              <button
                                type="button"
                                title="Supprimer"
                                aria-label="Supprimer"
                                onClick={() => handleDelete(ev)}
                                className="inline-flex items-center justify-center rounded-lg p-2 text-danger-500 hover:bg-danger-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-sm text-ink-400">
              <span>
                {rangeStart}–{rangeEnd} sur {filtered.length}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Préc.
                </Button>
                <span className="text-ink-500">
                  {page}/{totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suiv.
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
