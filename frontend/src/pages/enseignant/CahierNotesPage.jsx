import { useEffect, useMemo, useState } from 'react'
import { BookMarked } from 'lucide-react'
import { EnseignantHeader } from '../../components/enseignant/EnseignantHeader'
import { SuccessBanner, selectClassName } from '../../components/admin/adminUi.js'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ContentCard } from '../../components/ui/ContentCard'
import { cn } from '../../lib/cn'
import { ApiError } from '../../services/api'
import {
  formatNomComplet,
  genererCahierNotes,
  getCahierNotesParCours,
  getMesCours,
  getMesPromotions,
  STATUT_CAHIER_LABELS,
  validerCahierNotes,
} from '../../services/enseignantService'

function formatPoints(obtenus, max) {
  if (max == null || max <= 0) return '—'
  return `${obtenus ?? 0} / ${max}`
}

function truncateLabel(label, max = 14) {
  if (!label) return 'TJ'
  return label.length > max ? `${label.slice(0, max)}…` : label
}

export default function CahierNotesPage() {
  const [cours, setCours] = useState([])
  const [promotions, setPromotions] = useState([])
  const [coursId, setCoursId] = useState('')
  const [cahier, setCahier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingCahier, setLoadingCahier] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const promotionById = useMemo(
    () => Object.fromEntries(promotions.map((p) => [p.id, p])),
    [promotions],
  )

  const coursSelectionne = cours.find((c) => String(c.id) === coursId)
  const promoLabel = coursSelectionne
    ? promotionById[coursSelectionne.promotion_id]?.nom
    : null

  const isValide = cahier?.statut === 'valide'
  const lignes = cahier?.lignes ?? []
  const evaluationsTj = cahier?.evaluations_tj ?? []
  const hasCahier = Boolean(cahier)

  const totalColumns = 2 + evaluationsTj.length + 9

  useEffect(() => {
    Promise.all([getMesCours(), getMesPromotions()])
      .then(([coursData, promos]) => {
        setCours(coursData)
        setPromotions(promos)
        if (coursData.length === 1) setCoursId(String(coursData[0].id))
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Chargement impossible')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!coursId) {
      setCahier(null)
      return
    }

    let cancelled = false
    setLoadingCahier(true)
    setError('')

    getCahierNotesParCours(Number(coursId))
      .then((data) => {
        if (!cancelled) setCahier(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setCahier(null)
          if (err instanceof ApiError && err.status !== 404) {
            setError(err.message)
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCahier(false)
      })

    return () => {
      cancelled = true
    }
  }, [coursId])

  async function handleGenererOuMettreAJour() {
    if (!coursId) {
      setError('Sélectionnez un cours')
      return
    }
    setGenerating(true)
    setError('')
    setSuccess('')
    try {
      const data = await genererCahierNotes(Number(coursId))
      setCahier(data)
      setSuccess(
        data.created === false
          ? 'Cahier des notes mis à jour avec les dernières cotes'
          : 'Cahier des notes généré à partir des évaluations encodées',
      )
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Opération impossible')
    } finally {
      setGenerating(false)
    }
  }

  async function handleValider() {
    if (!cahier) return
    if (!window.confirm('Valider ce cahier des notes ? Cette action alimentera la fiche synthétique.')) return
    setValidating(true)
    setError('')
    try {
      const updated = await validerCahierNotes(cahier.id)
      setCahier(updated)
      setSuccess('Cahier des notes validé')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Validation impossible')
    } finally {
      setValidating(false)
    }
  }

  function getTjDetail(ligne, evaluationId) {
    return ligne.details_tj?.find((detail) => detail.evaluation_id === evaluationId)
  }

  return (
    <>
      <EnseignantHeader
        title="Cahier des notes"
        subtitle="Détail de chaque TJ, puis total TJ /10 + Examen /10 = Total /20."
      />
      <div className="space-y-4 p-6">
        <ContentCard title="Sélection du cours">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label htmlFor="cours_id" className="block text-sm font-medium text-ink-700">
                Cours
              </label>
              <select
                id="cours_id"
                value={coursId}
                onChange={(e) => setCoursId(e.target.value)}
                disabled={loading}
                className={selectClassName}
              >
                <option value="">Sélectionner un cours…</option>
                {cours.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.intitule} ({c.credits} cr.)
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="gold"
              onClick={handleGenererOuMettreAJour}
              disabled={generating || loadingCahier || !coursId || isValide}
            >
              {generating
                ? hasCahier
                  ? 'Mise à jour…'
                  : 'Génération…'
                : hasCahier
                  ? 'Mettre à jour le cahier'
                  : 'Générer le cahier'}
            </Button>
          </div>
          {coursSelectionne && (
            <p className="mt-3 text-sm text-ink-500">
              Promotion : <strong>{promoLabel || '—'}</strong> — Volume :{' '}
              {coursSelectionne.volume_horaire} h — Crédits : {coursSelectionne.credits}
            </p>
          )}
          {loadingCahier && coursId && (
            <p className="mt-2 text-sm text-ink-400">Chargement du cahier existant…</p>
          )}
        </ContentCard>

        <SuccessBanner message={success} onClose={() => setSuccess('')} />
        {error && (
          <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        )}

        {cahier && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <BookMarked className="h-4 w-4 text-brand-300" />
              Cahier #{cahier.id} —{' '}
              <Badge tone={isValide ? 'success' : 'gold'}>
                {STATUT_CAHIER_LABELS[cahier.statut] || cahier.statut}
              </Badge>
              {!isValide && (
                <span className="text-ink-400">
                  — mis à jour automatiquement lors de l&apos;encodage des notes
                </span>
              )}
            </div>
            {!isValide && (
              <Button type="button" variant="primary" onClick={handleValider} disabled={validating}>
                {validating ? 'Validation…' : 'Valider le cahier'}
              </Button>
            )}
          </div>
        )}

        {cahier && (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-warm-100">
            <table
              className="w-full text-left text-xs"
              style={{ minWidth: `${Math.max(1280, 520 + evaluationsTj.length * 88)}px` }}
            >
              <thead className="border-b border-white/10 bg-warm-200/50 uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-2 py-2" rowSpan={2}>
                    Matricule
                  </th>
                  <th className="px-2 py-2" rowSpan={2}>
                    Nom
                  </th>
                  {evaluationsTj.length > 0 && (
                    <th
                      className="border-l border-white/10 px-2 py-2 text-center text-brand-300"
                      colSpan={evaluationsTj.length}
                    >
                      Travaux journaliers (détail)
                    </th>
                  )}
                  <th
                    className="border-l border-white/10 px-2 py-2 text-center text-brand-300"
                    colSpan={2}
                  >
                    Total TJ
                  </th>
                  <th className="border-l border-white/10 px-2 py-2 text-center" colSpan={2}>
                    Examen
                  </th>
                  <th className="border-l border-white/10 px-2 py-2 text-center" colSpan={5}>
                    Résultat
                  </th>
                </tr>
                <tr>
                  {evaluationsTj.map((evaluation) => (
                    <th
                      key={evaluation.id}
                      className="border-l border-white/5 px-2 py-2 text-center normal-case"
                      title={`${evaluation.libelle} (/${evaluation.cote_maximale})`}
                    >
                      <span className="block truncate">{truncateLabel(evaluation.libelle)}</span>
                      <span className="text-[10px] text-ink-400">/{evaluation.cote_maximale}</span>
                    </th>
                  ))}
                  <th className="border-l border-white/10 px-2 py-2">Pts Σ</th>
                  <th className="px-2 py-2">/10</th>
                  <th className="border-l border-white/10 px-2 py-2">Pts</th>
                  <th className="px-2 py-2">/10</th>
                  <th className="border-l border-white/10 px-2 py-2">/20</th>
                  <th className="px-2 py-2">Cr.</th>
                  <th className="px-2 py-2">Pond.</th>
                  <th className="px-2 py-2">Max</th>
                  <th className="px-2 py-2">Appr.</th>
                </tr>
              </thead>
              <tbody>
                {lignes.length === 0 ? (
                  <tr>
                    <td colSpan={totalColumns} className="px-4 py-12 text-center text-ink-400">
                      Aucune ligne — encodez des notes dans vos évaluations puis générez ou mettez à jour
                      le cahier
                    </td>
                  </tr>
                ) : (
                  lignes.map((ligne) => {
                    const etu = ligne.etudiant
                    return (
                      <tr key={ligne.id} className="border-b border-white/5 text-ink-500">
                        <td className="px-2 py-2 font-mono text-brand-300">
                          {etu?.matricule || '—'}
                        </td>
                        <td className="px-2 py-2">{formatNomComplet(etu)}</td>
                        {evaluationsTj.map((evaluation) => {
                          const detail = getTjDetail(ligne, evaluation.id)
                          return (
                            <td
                              key={evaluation.id}
                              className="border-l border-white/5 px-2 py-2 text-center"
                            >
                              {detail
                                ? formatPoints(detail.cote_obtenue, detail.cote_maximale)
                                : '0 / ' + evaluation.cote_maximale}
                            </td>
                          )
                        })}
                        <td
                          className={cn(
                            'border-l border-white/10 px-2 py-2 font-medium',
                            evaluationsTj.length === 0 && 'border-l-white/10',
                          )}
                        >
                          {formatPoints(ligne.points_tj_obtenus, ligne.points_tj_max)}
                        </td>
                        <td className="px-2 py-2 font-medium text-ink-700">{ligne.cote_tj_sur_10}</td>
                        <td className="border-l border-white/10 px-2 py-2">
                          {formatPoints(ligne.points_examen_obtenus, ligne.points_examen_max)}
                        </td>
                        <td className="px-2 py-2">{ligne.cote_examen_sur_10}</td>
                        <td className="border-l border-white/10 px-2 py-2 font-medium text-ink-700">
                          {ligne.cote_finale_sur_20}
                        </td>
                        <td className="px-2 py-2">{ligne.credits}</td>
                        <td className="px-2 py-2">{ligne.points_ponderes}</td>
                        <td className="px-2 py-2">{ligne.points_max_ponderes}</td>
                        <td className="px-2 py-2">
                          <Badge tone={ligne.cote_finale_sur_20 >= 10 ? 'success' : 'gold'}>
                            {ligne.appreciation}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {coursId && !loadingCahier && !cahier && (
          <p className="text-center text-sm text-ink-400">
            Aucun cahier pour ce cours. Générez-le une première fois, puis il sera réutilisé et mis à
            jour à chaque encodage de notes.
          </p>
        )}
      </div>
    </>
  )
}
