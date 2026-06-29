import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { EnseignantHeader } from '../../components/enseignant/EnseignantHeader'
import { SuccessBanner } from '../../components/admin/adminUi.js'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ContentCard } from '../../components/ui/ContentCard'
import { Input } from '../../components/ui/Input'
import { ApiError } from '../../services/api'
import {
  cloturerEvaluation,
  computePourcentage,
  formatNomComplet,
  getEtudiantsEvaluation,
  getEvaluationById,
  getMesCours,
  getMesPromotions,
  getNotesEvaluation,
  saveNotesEvaluationBulk,
  TYPE_EVALUATION_LABELS,
} from '../../services/enseignantService'

export default function CotationEvaluationPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [evaluation, setEvaluation] = useState(null)
  const [etudiants, setEtudiants] = useState([])
  const [notesByEtudiant, setNotesByEtudiant] = useState({})
  const [coursLabel, setCoursLabel] = useState('—')
  const [promotionLabel, setPromotionLabel] = useState('—')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isCloturee = evaluation?.statut === 'cloturee'
  const coteMax = evaluation?.cote_maximale ?? 0

  const rows = useMemo(() => {
    return etudiants.map((etudiant) => {
      const note = notesByEtudiant[etudiant.id]
      const cote = note?.cote_obtenue ?? ''
      const pct =
        cote !== '' && coteMax > 0
          ? computePourcentage(cote, coteMax)
          : note?.pourcentage ?? null
      return { etudiant, cote, pct, noteId: note?.id }
    })
  }, [etudiants, notesByEtudiant, coteMax])

  const nonCotes = rows.filter((r) => r.cote === '').length

  useEffect(() => {
    async function load() {
      try {
        const [ev, etu, notes, cours, promos] = await Promise.all([
          getEvaluationById(id),
          getEtudiantsEvaluation(id),
          getNotesEvaluation(id),
          getMesCours(),
          getMesPromotions(),
        ])
        setEvaluation(ev)
        setEtudiants(etu)

        const noteMap = {}
        notes.forEach((n) => {
          noteMap[n.etudiant_id] = n
        })
        setNotesByEtudiant(noteMap)

        const c = cours.find((item) => item.id === ev.cours_id)
        if (c) {
          setCoursLabel(c.intitule)
          const promo = promos.find((p) => p.id === c.promotion_id)
          if (promo) setPromotionLabel(promo.nom)
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Chargement impossible')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  function updateCote(etudiantId, value) {
    if (isCloturee) return
    setNotesByEtudiant((prev) => ({
      ...prev,
      [etudiantId]: { ...prev[etudiantId], cote_obtenue: value },
    }))
  }

  async function handleSave() {
    setError('')
    setSuccess('')

    const payload = []
    for (const row of rows) {
      if (row.cote === '' || row.cote === null) continue
      const cote = Number(row.cote)
      if (Number.isNaN(cote) || cote < 0) {
        setError('Les cotes ne peuvent pas être négatives')
        return
      }
      if (cote > coteMax) {
        setError(`Une cote dépasse le maximum autorisé (/${coteMax})`)
        return
      }
      payload.push({ etudiant_id: row.etudiant.id, cote_obtenue: cote })
    }

    if (payload.length === 0) {
      setError('Encodez au moins une cote')
      return
    }

    setSaving(true)
    try {
      const result = await saveNotesEvaluationBulk(id, { notes: payload })
      const noteMap = { ...notesByEtudiant }
      result.created.forEach((n) => {
        noteMap[n.etudiant_id] = n
      })
      setNotesByEtudiant(noteMap)
      if (result.errors?.length) {
        setError(result.errors.join(' — '))
      } else {
        setSuccess('Notes enregistrées avec succès')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  async function handleCloturer() {
    if (nonCotes > 0) {
      setError(
        `Impossible de clôturer : ${nonCotes} étudiant${nonCotes > 1 ? 's' : ''} non encore coté${nonCotes > 1 ? 's' : ''}. Enregistrez toutes les notes avant de clôturer.`,
      )
      return
    }
    if (!window.confirm('Clôturer cette évaluation ? Les notes ne pourront plus être modifiées.')) return
    setSaving(true)
    setError('')
    try {
      const updated = await cloturerEvaluation(id)
      setEvaluation(updated)
      setSuccess('Évaluation clôturée')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Clôture impossible')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <EnseignantHeader title="Cotation" />
        <p className="p-6 text-ink-400">Chargement…</p>
      </>
    )
  }

  if (!evaluation) {
    return (
      <>
        <EnseignantHeader title="Cotation" />
        <p className="p-6 text-danger-500">{error || 'Évaluation introuvable'}</p>
      </>
    )
  }

  return (
    <>
      <EnseignantHeader
        title="Cotation des étudiants"
        subtitle={evaluation.libelle}
      />
      <div className="space-y-4 p-6">
        <ContentCard title="Informations de l'évaluation">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4">
              <span className="text-ink-400">Cours</span>
              <span className="text-ink-700">{coursLabel}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-ink-400">Promotion</span>
              <span className="text-ink-700">{promotionLabel}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-ink-400">Type</span>
              <span className="text-ink-700">
                {TYPE_EVALUATION_LABELS[evaluation.type_evaluation]}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-ink-400">Cote maximale</span>
              <span className="text-ink-700">/{evaluation.cote_maximale}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-ink-400">Date</span>
              <span className="text-ink-700">
                {new Date(evaluation.date_evaluation).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-ink-400">Statut</span>
              <Badge tone={isCloturee ? 'success' : 'gold'}>{evaluation.statut}</Badge>
            </div>
          </dl>
        </ContentCard>

        {nonCotes > 0 && !isCloturee && (
          <div className="rounded-xl border border-accent-gold/30 bg-accent-gold/10 px-4 py-3 text-sm text-accent-gold">
            {nonCotes} étudiant{nonCotes > 1 ? 's' : ''} non encore coté{nonCotes > 1 ? 's' : ''}.
            Tous les étudiants doivent être cotés (0 pour une absence) avant de clôturer l&apos;évaluation.
          </div>
        )}

        <SuccessBanner message={success} onClose={() => setSuccess('')} />
        {error && (
          <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-warm-100">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-white/10 bg-warm-200/50 text-xs uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3">Matricule</th>
                <th className="px-4 py-3">Nom complet</th>
                <th className="px-4 py-3">Cote obtenue</th>
                <th className="px-4 py-3">Max</th>
                <th className="px-4 py-3">%</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ etudiant, cote, pct }) => (
                <tr key={etudiant.id} className="border-b border-white/5">
                  <td className="px-4 py-2.5 font-mono text-xs text-brand-300">
                    {etudiant.matricule || '—'}
                  </td>
                  <td className="px-4 py-2.5">{formatNomComplet(etudiant)}</td>
                  <td className="px-4 py-2.5">
                    {isCloturee ? (
                      <span>{cote !== '' ? cote : '0'}</span>
                    ) : (
                      <Input
                        name={`cote-${etudiant.id}`}
                        type="number"
                        min="0"
                        max={coteMax}
                        step="0.01"
                        value={cote}
                        onChange={(e) => updateCote(etudiant.id, e.target.value)}
                        className="max-w-[100px] py-1.5"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2.5">/{coteMax}</td>
                  <td className="px-4 py-2.5">
                    {pct != null && cote !== '' ? `${pct} %` : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    {cote !== '' ? (
                      <Badge tone="success">Coté</Badge>
                    ) : (
                      <Badge tone="gold">Non coté</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3">
          {!isCloturee && (
            <>
              <Button type="button" variant="gold" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer les notes'}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleCloturer}
                disabled={saving || nonCotes > 0}
              >
                <Lock className="h-4 w-4" />
                Clôturer l&apos;évaluation
              </Button>
            </>
          )}
          <Button type="button" variant="ghost" onClick={() => navigate('/enseignant/evaluations')}>
            Retour aux évaluations
          </Button>
        </div>
      </div>
    </>
  )
}
