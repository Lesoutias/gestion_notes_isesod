import { useEffect, useMemo, useState } from 'react'
import { Table2, Download } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { SuccessBanner, selectClassName } from '../../components/admin/adminUi.js'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ContentCard } from '../../components/ui/ContentCard'
import { cn } from '../../lib/cn'
import { ApiError } from '../../services/api'
import {
  formatNomComplet,
  getActiveAnneeAcademique,
  getAnneesAcademiques,
  getFicheSynthetiqueById,
  getFichesSynthetiques,
  getFilieres,
  getPromotions,
  promotionLabel,
  STATUT_FICHE_LABELS,
  validerFicheSynthetique,
  downloadFicheSynthetiquePdf,
} from '../../services/adminService'

function VerticalName({ children, className }) {
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap text-center text-[11px] leading-tight',
        '[writing-mode:vertical-rl] rotate-180',
        className,
      )}
    >
      {children}
    </span>
  )
}

function buildMatrix(lignes) {
  const etudiantsMap = new Map()
  const coursMap = new Map()
  const cells = new Map()

  lignes.forEach((ligne) => {
    if (ligne.etudiant) etudiantsMap.set(ligne.etudiant_id, ligne.etudiant)
    if (ligne.cours) coursMap.set(ligne.cours_id, ligne.cours)
    cells.set(`${ligne.cours_id}-${ligne.etudiant_id}`, ligne)
  })

  const etudiants = [...etudiantsMap.values()].sort((a, b) =>
    formatNomComplet(a).localeCompare(formatNomComplet(b), 'fr'),
  )
  const cours = [...coursMap.values()].sort((a, b) =>
    a.intitule.localeCompare(b.intitule, 'fr'),
  )

  return { etudiants, cours, cells }
}

export default function FichesSynthetiquesPage() {
  const [filieres, setFilieres] = useState([])
  const [promotions, setPromotions] = useState([])
  const [annees, setAnnees] = useState([])
  const [filiereId, setFiliereId] = useState('')
  const [promotionId, setPromotionId] = useState('')
  const [anneeId, setAnneeId] = useState('')
  const [fiche, setFiche] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingFiche, setLoadingFiche] = useState(false)
  const [validating, setValidating] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const filiereById = useMemo(
    () => Object.fromEntries(filieres.map((f) => [f.id, f])),
    [filieres],
  )

  const promotionsFiltrees = useMemo(() => {
    if (!filiereId) return []
    return promotions
      .filter((p) => String(p.filiere_id) === filiereId)
      .sort((a, b) => a.niveau - b.niveau || a.nom.localeCompare(b.nom, 'fr'))
  }, [promotions, filiereId])

  const promotionSelectionnee = promotions.find((p) => String(p.id) === promotionId)
  const filiereSelectionnee = filiereById[Number(filiereId)]

  const lignes = fiche?.lignes ?? []
  const { etudiants, cours, cells } = useMemo(() => buildMatrix(lignes), [lignes])

  const totauxEtudiants = useMemo(() => {
    const totals = {}
    etudiants.forEach((etu) => {
      totals[etu.id] = lignes
        .filter((l) => l.etudiant_id === etu.id)
        .reduce((sum, l) => sum + (l.points_ponderes ?? 0), 0)
    })
    return totals
  }, [etudiants, lignes])

  useEffect(() => {
    Promise.all([
      getFilieres(),
      getPromotions(),
      getAnneesAcademiques(),
      getActiveAnneeAcademique(),
    ])
      .then(([filieresData, promos, anneesData, activeAnnee]) => {
        setFilieres(filieresData)
        setPromotions(promos)
        setAnnees(anneesData)
        if (activeAnnee?.id) setAnneeId(String(activeAnnee.id))
        else if (anneesData.length) setAnneeId(String(anneesData[0].id))
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Chargement impossible')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!promotionId || !anneeId) {
      setFiche(null)
      return
    }

    let cancelled = false
    setLoadingFiche(true)
    setError('')

    getFichesSynthetiques({
      promotion_id: promotionId,
      annee_academique_id: anneeId,
    })
      .then(async (fiches) => {
        if (cancelled) return
        if (fiches.length === 0) {
          setFiche(null)
          return
        }
        const detail = await getFicheSynthetiqueById(fiches[0].id)
        if (!cancelled) setFiche(detail)
      })
      .catch((err) => {
        if (!cancelled) {
          setFiche(null)
          if (!(err instanceof ApiError && err.status === 401)) {
            setError(err instanceof ApiError ? err.message : 'Chargement de la fiche impossible')
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingFiche(false)
      })

    return () => {
      cancelled = true
    }
  }, [promotionId, anneeId])

  async function handleValider() {
    if (!fiche) return
    if (
      !window.confirm(
        'Valider cette fiche synthétique ? Les bulletins et relevés de cotes seront générés.',
      )
    ) {
      return
    }
    setValidating(true)
    setError('')
    try {
      await validerFicheSynthetique(fiche.id)
      const detail = await getFicheSynthetiqueById(fiche.id)
      setFiche(detail)
      setSuccess(
        'Fiche synthétique validée — les relevés de cotes sont disponibles dans le menu Relevés de cotes',
      )
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Validation impossible')
    } finally {
      setValidating(false)
    }
  }

  async function handleDownloadPdf() {
    if (!fiche?.id) return
    setDownloadingPdf(true)
    setError('')
    try {
      await downloadFicheSynthetiquePdf(fiche.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Téléchargement du PDF impossible')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const anneeLabel = annees.find((a) => String(a.id) === anneeId)?.libelle
  const peutValider = fiche?.statut === 'complete'

  return (
    <>
      <AdminHeader
        title="Fiches synthétiques"
        subtitle="Points pondérés par cours et par étudiant — alimentées à la validation des cahiers de cotes"
      />
      <div className="space-y-4 p-6">
        <ContentCard title="Sélection">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="filiere_id" className="block text-sm font-medium text-ink-700">
                Filière
              </label>
              <select
                id="filiere_id"
                value={filiereId}
                onChange={(e) => {
                  setFiliereId(e.target.value)
                  setPromotionId('')
                  setFiche(null)
                }}
                disabled={loading}
                className={selectClassName}
              >
                <option value="">Sélectionner une filière…</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.sigle ? `${f.sigle} — ${f.nom}` : f.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="promotion_id" className="block text-sm font-medium text-ink-700">
                Promotion
              </label>
              <select
                id="promotion_id"
                value={promotionId}
                onChange={(e) => setPromotionId(e.target.value)}
                disabled={loading || !filiereId}
                className={selectClassName}
              >
                <option value="">
                  {filiereId ? 'Sélectionner une promotion…' : 'Choisissez d\'abord une filière'}
                </option>
                {promotionsFiltrees.map((p) => (
                  <option key={p.id} value={p.id}>
                    {promotionLabel(p, filiereSelectionnee)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="annee_id" className="block text-sm font-medium text-ink-700">
                Année académique
              </label>
              <select
                id="annee_id"
                value={anneeId}
                onChange={(e) => setAnneeId(e.target.value)}
                disabled={loading}
                className={selectClassName}
              >
                <option value="">Sélectionner…</option>
                {annees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.libelle}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {loadingFiche && promotionId && anneeId && (
            <p className="mt-3 text-sm text-ink-400">Chargement de la fiche…</p>
          )}
        </ContentCard>

        <SuccessBanner message={success} onClose={() => setSuccess('')} />
        {error && (
          <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        )}

        {fiche && peutValider && (
          <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-300">
            Tous les cours ont été reçus ({fiche.total_cours_recus}/{fiche.total_cours_attendus}).
            Vous pouvez valider la fiche pour générer les relevés de cotes de chaque étudiant.
          </div>
        )}

        {fiche && fiche.statut !== 'validee' && fiche.statut !== 'complete' && fiche.total_cours_attendus > 0 && (
          <div className="rounded-xl border border-accent-gold/30 bg-accent-gold/10 px-4 py-3 text-sm text-accent-gold">
            En attente de {fiche.total_cours_attendus - fiche.total_cours_recus} cours supplémentaire
            {fiche.total_cours_attendus - fiche.total_cours_recus > 1 ? 's' : ''} avant validation.
          </div>
        )}

        {fiche && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
              <Table2 className="h-4 w-4 text-brand-300" />
              <span>
                {promotionLabel(promotionSelectionnee, filiereSelectionnee)} — {anneeLabel}
              </span>
              <Badge
                tone={
                  fiche.statut === 'validee' ? 'success' : fiche.statut === 'complete' ? 'brand' : 'gold'
                }
              >
                {STATUT_FICHE_LABELS[fiche.statut] || fiche.statut}
              </Badge>
              <span className="text-ink-400">
                {fiche.total_cours_recus}/{fiche.total_cours_attendus} cours reçus
              </span>
            </div>
            {peutValider && (
              <Button type="button" variant="primary" onClick={handleValider} disabled={validating}>
                {validating ? 'Validation…' : 'Valider la fiche'}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
            >
              <Download className="h-4 w-4" />
              {downloadingPdf ? 'Export…' : 'Exporter PDF'}
            </Button>
          </div>
        )}

        {fiche && (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-warm-100">
            <table className="w-auto border-collapse text-xs">
              <thead className="border-b border-white/10 bg-warm-200/50 text-ink-400">
                <tr>
                  <th className="sticky left-0 z-10 bg-warm-200/95 px-3 py-2 text-left font-medium uppercase tracking-wider">
                    Cours
                  </th>
                  {etudiants.map((etu) => (
                    <th
                      key={etu.id}
                      className="px-1 py-2 align-bottom font-normal"
                      title={formatNomComplet(etu)}
                    >
                      <VerticalName>{formatNomComplet(etu)}</VerticalName>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cours.length === 0 ? (
                  <tr>
                    <td
                      colSpan={Math.max(etudiants.length + 1, 2)}
                      className="px-4 py-12 text-center text-ink-400"
                    >
                      Aucun cours transféré — validez des cahiers de cotes enseignant
                    </td>
                  </tr>
                ) : (
                  cours.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 text-ink-500">
                      <td className="sticky left-0 z-10 whitespace-nowrap bg-warm-100 px-3 py-1.5 font-medium text-ink-700">
                        {c.intitule}
                        <span className="ml-1 text-[10px] text-ink-400">({c.credits} cr.)</span>
                      </td>
                      {etudiants.map((etu) => {
                        const ligne = cells.get(`${c.id}-${etu.id}`)
                        return (
                          <td key={etu.id} className="px-2 py-1.5 text-center tabular-nums">
                            {ligne ? (
                              <span title={`${ligne.points_ponderes} / ${ligne.points_max_ponderes} pts`}>
                                {ligne.points_ponderes}
                              </span>
                            ) : (
                              <span className="text-ink-400">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                )}
                {cours.length > 0 && etudiants.length > 0 && (
                  <tr className="border-t border-white/10 bg-warm-200/30 font-medium text-ink-700">
                    <td className="sticky left-0 z-10 bg-warm-200/95 px-3 py-2">Total pts pond.</td>
                    {etudiants.map((etu) => (
                      <td key={etu.id} className="px-2 py-2 text-center tabular-nums">
                        {Math.round((totauxEtudiants[etu.id] ?? 0) * 100) / 100}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {promotionId && anneeId && !loadingFiche && !fiche && (
          <p className="text-center text-sm text-ink-400">
            Aucune fiche pour {promotionLabel(promotionSelectionnee, filiereSelectionnee)} en{' '}
            {anneeLabel}. Elle sera créée lors de la première validation d&apos;un cahier de cotes.
          </p>
        )}
      </div>
    </>
  )
}
