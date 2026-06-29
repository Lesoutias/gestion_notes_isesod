import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { EtudiantHeader } from '../../components/etudiant/EtudiantHeader'
import { selectClassName } from '../../components/admin/adminUi.js'
import { Badge } from '../../components/ui/Badge'
import { ContentCard } from '../../components/ui/ContentCard'
import { ApiError } from '../../services/api'
import {
  getEtudiantEvaluations,
  STATUT_EVALUATION_LABELS,
  TYPE_EVALUATION_LABELS,
} from '../../services/etudiantService'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fr-FR')
}

export default function EtudiantEvaluationsPage() {
  const [data, setData] = useState(null)
  const [coursId, setCoursId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEvaluations = useCallback(async (selectedCoursId = null) => {
    setLoading(true)
    setError('')
    try {
      const result = await getEtudiantEvaluations(selectedCoursId)
      setData(result)
      if (result.cours_selectionne_id) {
        setCoursId(String(result.cours_selectionne_id))
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvaluations()
  }, [loadEvaluations])

  const coursSelectionne = useMemo(
    () => data?.cours?.find((c) => String(c.id) === coursId),
    [data, coursId],
  )

  const evaluations = data?.evaluations ?? []
  const resume = data?.resume

  async function handleCoursChange(event) {
    const nextId = event.target.value
    setCoursId(nextId)
    await loadEvaluations(nextId ? Number(nextId) : null)
  }

  return (
    <>
      <EtudiantHeader
        title="Évaluations"
        subtitle="Consultez vos notes par cours et le récapitulatif de vos résultats"
      />

      <div className="space-y-6 p-6">
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <ContentCard title="Filtrer par cours">
          <div className="max-w-md">
            <label htmlFor="cours-filter" className="mb-1.5 block text-sm font-medium text-ink-500">
              Cours
            </label>
            <select
              id="cours-filter"
              value={coursId}
              onChange={handleCoursChange}
              className={selectClassName}
              disabled={loading || !data?.cours?.length}
            >
              {!data?.cours?.length && <option value="">Aucun cours</option>}
              {data?.cours?.map((cours) => (
                <option key={cours.id} value={cours.id}>
                  {cours.intitule}
                  {cours.semestre ? ` (${cours.semestre})` : ''}
                </option>
              ))}
            </select>
          </div>
        </ContentCard>

        {resume && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ContentCard>
              <p className="text-sm text-ink-400">Moyenne /20</p>
              <p className="font-display text-3xl font-bold text-ink-900">
                {resume.moyenne_sur_20}
              </p>
              <p className="mt-1 text-xs text-ink-400">{resume.appreciation}</p>
            </ContentCard>
            <ContentCard>
              <p className="text-sm text-ink-400">Total pondéré</p>
              <p className="font-display text-3xl font-bold text-ink-900">
                {resume.points_ponderes}
                <span className="text-lg font-normal text-ink-400">
                  {' '}
                  / {resume.points_max_ponderes}
                </span>
              </p>
            </ContentCard>
            <ContentCard>
              <p className="text-sm text-ink-400">TJ /10</p>
              <p className="font-display text-3xl font-bold text-ink-900">
                {resume.cote_tj_sur_10}
              </p>
            </ContentCard>
            <ContentCard>
              <p className="text-sm text-ink-400">Examen /10</p>
              <p className="font-display text-3xl font-bold text-ink-900">
                {resume.cote_examen_sur_10}
              </p>
            </ContentCard>
          </div>
        )}

        <ContentCard
          title={coursSelectionne ? coursSelectionne.intitule : 'Notes par évaluation'}
        >
          {loading ? (
            <p className="text-sm text-ink-400">Chargement…</p>
          ) : evaluations.length === 0 ? (
            <p className="text-sm text-ink-500">
              Aucune évaluation publiée pour ce cours pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-warm-200/50 text-xs uppercase tracking-wider text-ink-400">
                  <tr>
                    <th className="px-3 py-2">Évaluation</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Note obtenue</th>
                    <th className="px-3 py-2">%</th>
                    <th className="px-3 py-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((evaluation) => (
                    <tr key={evaluation.id} className="border-b border-white/5 text-ink-500">
                      <td className="px-3 py-2.5 font-medium text-ink-700">
                        {evaluation.libelle}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={evaluation.type_evaluation === 'EXAMEN' ? 'gold' : 'brand'}>
                          {TYPE_EVALUATION_LABELS[evaluation.type_evaluation] ||
                            evaluation.type_evaluation}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">{formatDate(evaluation.date_evaluation)}</td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {evaluation.cote_obtenue != null ? (
                          <>
                            <span className="font-medium text-ink-900">
                              {evaluation.cote_obtenue}
                            </span>
                            <span className="text-ink-400"> / {evaluation.cote_maximale}</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {evaluation.pourcentage != null ? `${evaluation.pourcentage} %` : '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        {STATUT_EVALUATION_LABELS[evaluation.statut] || evaluation.statut}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ContentCard>
      </div>
    </>
  )
}
