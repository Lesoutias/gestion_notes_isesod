import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  Pencil,
  Plus,
  Trash2,
  UserCog,
} from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { SuccessBanner } from '../../components/admin/adminUi.js'
import { Badge } from '../../components/ui/Badge'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { cn } from '../../lib/cn'
import { ApiError } from '../../services/api'
import {
  deleteAffectationCours,
  getAffectationsCours,
  getEnseignants,
  getFilieres,
  getPromotions,
} from '../../services/adminService'

const PAGE_SIZE = 10

function IconActionLink({ to, label, icon: Icon, className }) {
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

function IconActionButton({ label, icon: Icon, onClick, className, disabled }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-2 transition-colors disabled:opacity-50',
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

export default function AffectationsCoursPage() {
  const [affectations, setAffectations] = useState([])
  const [filieres, setFilieres] = useState([])
  const [promotions, setPromotions] = useState([])
  const [enseignants, setEnseignants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)

  const filiereById = useMemo(
    () => Object.fromEntries(filieres.map((f) => [f.id, f])),
    [filieres],
  )
  const promotionById = useMemo(
    () => Object.fromEntries(promotions.map((p) => [p.id, p])),
    [promotions],
  )
  const enseignantById = useMemo(
    () => Object.fromEntries(enseignants.map((e) => [e.id, e])),
    [enseignants],
  )

  const totalPages = Math.max(1, Math.ceil(affectations.length / PAGE_SIZE))

  const paginatedAffectations = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return affectations.slice(start, start + PAGE_SIZE)
  }, [affectations, page])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [aff, fil, prom, ens] = await Promise.all([
        getAffectationsCours(),
        getFilieres(),
        getPromotions(),
        getEnseignants(),
      ])
      setAffectations(aff)
      setFilieres(fil)
      setPromotions(prom)
      setEnseignants(ens)
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

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAffectationCours(deleteTarget.id)
      setAffectations((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      setSuccess('Affectation supprimée')
      setDeleteTarget(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression impossible')
    } finally {
      setDeleting(false)
    }
  }

  function enseignantLabel(id) {
    const e = enseignantById[id]
    return e ? `${e.prenom} ${e.nom}` : '—'
  }

  const rangeStart = affectations.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, affectations.length)

  return (
    <>
      <AdminHeader
        title="Affectations des cours"
        subtitle="Étape 2 et 3 — Promotion, volume horaire, crédits et enseignant"
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-ink-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
            <p>
              <strong className="text-ink-700">Étape 3 :</strong> survolez l&apos;icône enseignant{' '}
              <UserCog className="inline h-3.5 w-3.5 text-brand-300" /> dans le tableau pour octroyer
              un cours à un enseignant.
            </p>
          </div>
          <ButtonLink to="/admin/affectations-cours/nouveau" variant="gold" size="md" className="shrink-0">
            <Plus className="h-4 w-4" />
            Affecter à une promotion
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
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-white/10 bg-warm-200/50 text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="w-[72px] px-3 py-3">Code</th>
                  <th className="min-w-[140px] px-3 py-3">Intitulé</th>
                  <th className="w-[64px] px-3 py-3">Filière</th>
                  <th className="w-[56px] px-3 py-3">Promo</th>
                  <th className="w-[64px] px-3 py-3">Vol.</th>
                  <th className="w-[72px] px-3 py-3">Crédits</th>
                  <th className="w-[130px] px-3 py-3">Enseignant</th>
                  <th className="w-[96px] px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-ink-400">
                      Chargement…
                    </td>
                  </tr>
                ) : affectations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center">
                      <Layers className="mx-auto mb-3 h-10 w-10 text-ink-400" />
                      <p className="text-ink-400">Aucune affectation enregistrée</p>
                      <ButtonLink
                        to="/admin/affectations-cours/nouveau"
                        variant="gold"
                        size="sm"
                        className="mt-4"
                      >
                        Créer une affectation
                      </ButtonLink>
                    </td>
                  </tr>
                ) : (
                  paginatedAffectations.map((aff) => {
                    const promo = promotionById[aff.promotion_id]
                    const filiere = promo ? filiereById[promo.filiere_id] : null
                    const enseignantPath = `/admin/affectations-cours/${aff.id}/enseignant`
                    const modifierPath = `/admin/affectations-cours/${aff.id}/modifier`

                    return (
                      <tr key={aff.id} className="border-b border-white/5 text-ink-500">
                        <td className="px-3 py-2.5">
                          <span className="block truncate font-mono text-xs text-brand-300">
                            {aff.code || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="block truncate font-medium text-ink-700" title={aff.intitule}>
                            {aff.intitule}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="block truncate" title={filiere?.sigle}>
                            {filiere?.sigle || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="block truncate" title={promo?.nom}>
                            {promo?.nom || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {aff.volume_horaire ?? '—'} h
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone="brand">{aff.credits ?? 0} cr.</Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          {aff.enseignant_id ? (
                            <div className="flex min-w-0 items-center gap-1.5">
                              <span
                                className="min-w-0 flex-1 truncate text-xs text-ink-700"
                                title={enseignantLabel(aff.enseignant_id)}
                              >
                                {enseignantLabel(aff.enseignant_id)}
                              </span>
                              <IconActionLink
                                to={enseignantPath}
                                label="Changer l'enseignant"
                                icon={UserCog}
                                className="shrink-0 text-brand-300 hover:bg-brand-500/10"
                              />
                            </div>
                          ) : (
                            <IconActionLink
                              to={enseignantPath}
                              label="Octroyer à un enseignant"
                              icon={UserCog}
                              className="text-accent-gold hover:bg-accent-gold/10"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-0.5">
                            <IconActionLink
                              to={modifierPath}
                              label="Modifier l'affectation"
                              icon={Pencil}
                              className="text-brand-300 hover:bg-brand-500/10"
                            />
                            <IconActionButton
                              label="Supprimer l'affectation"
                              icon={Trash2}
                              onClick={() => setDeleteTarget(aff)}
                              className="text-danger-500 hover:bg-danger-500/10"
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && affectations.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-400">
                {rangeStart}–{rangeEnd} sur {affectations.length} affectation
                {affectations.length > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  title="Page précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[80px] text-center text-sm text-ink-500">
                  Page {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  title="Page suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer l'affectation"
      >
        <p className="mb-4 text-sm text-ink-500">
          Voulez-vous vraiment supprimer l&apos;affectation du cours{' '}
          <strong>{deleteTarget?.intitule}</strong> ?
          {deleteTarget?.enseignant_id && (
            <span className="mt-2 block text-danger-500">
              Un enseignant est actuellement assigné à ce cours.
            </span>
          )}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={confirmDelete}
            disabled={deleting}
            className="bg-danger-500 hover:bg-danger-600"
          >
            {deleting ? 'Suppression…' : 'Supprimer'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
