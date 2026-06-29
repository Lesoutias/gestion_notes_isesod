import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { EnseignantHeader } from '../../components/enseignant/EnseignantHeader'
import { selectClassName } from '../../components/admin/adminUi.js'
import { Button } from '../../components/ui/Button'
import { ContentCard } from '../../components/ui/ContentCard'
import { Input } from '../../components/ui/Input'
import { ApiError } from '../../services/api'
import {
  createEvaluation,
  getEvaluationById,
  getMesCours,
  getMesEvaluations,
  getMesPromotions,
  updateEvaluation,
} from '../../services/enseignantService'

const EMPTY_FORM = {
  cours_id: '',
  libelle: '',
  type_evaluation: 'TJ',
  cote_maximale: '10',
  date_evaluation: new Date().toISOString().slice(0, 10),
}

export default function EvaluationFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [cours, setCours] = useState([])
  const [promotions, setPromotions] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const promotionById = useMemo(
    () => Object.fromEntries(promotions.map((p) => [p.id, p])),
    [promotions],
  )

  const examenConflit = useMemo(() => {
    if (!form.cours_id) return null
    return evaluations.find(
      (ev) =>
        String(ev.cours_id) === form.cours_id &&
        ev.type_evaluation === 'EXAMEN' &&
        (!isEdit || String(ev.id) !== id),
    )
  }, [evaluations, form.cours_id, isEdit, id])

  const examenDejaPourCours = Boolean(examenConflit)
  const typeExamenBloque = examenDejaPourCours && form.type_evaluation === 'EXAMEN'

  useEffect(() => {
    if (examenDejaPourCours && form.type_evaluation === 'EXAMEN') {
      setForm((prev) => ({ ...prev, type_evaluation: 'TJ' }))
    }
  }, [examenDejaPourCours, form.cours_id, form.type_evaluation])

  useEffect(() => {
    async function load() {
      try {
        const [coursData, promos, evData] = await Promise.all([
          getMesCours(),
          getMesPromotions(),
          getMesEvaluations(),
        ])
        setCours(coursData)
        setPromotions(promos)
        setEvaluations(evData)

        if (isEdit) {
          const ev = await getEvaluationById(id)
          setForm({
            cours_id: String(ev.cours_id),
            libelle: ev.libelle,
            type_evaluation: ev.type_evaluation,
            cote_maximale: String(ev.cote_maximale),
            date_evaluation: ev.date_evaluation,
          })
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Chargement impossible')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, isEdit])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.cours_id || !form.libelle.trim()) {
      setError('Remplissez tous les champs obligatoires')
      return
    }
    const coteMax = Number(form.cote_maximale)
    if (!coteMax || coteMax <= 0) {
      setError('La cote maximale doit être supérieure à 0')
      return
    }

    const payload = {
      cours_id: Number(form.cours_id),
      libelle: form.libelle.trim(),
      type_evaluation: form.type_evaluation,
      cote_maximale: coteMax,
      date_evaluation: form.date_evaluation,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await updateEvaluation(id, {
          libelle: payload.libelle,
          type_evaluation: payload.type_evaluation,
          cote_maximale: payload.cote_maximale,
          date_evaluation: payload.date_evaluation,
        })
      } else {
        await createEvaluation(payload)
      }
      navigate('/enseignant/evaluations')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <EnseignantHeader title="Évaluation" />
        <p className="p-6 text-ink-400">Chargement…</p>
      </>
    )
  }

  return (
    <>
      <EnseignantHeader
        title={isEdit ? 'Modifier une évaluation' : 'Créer une évaluation'}
        subtitle="TJ multiples possibles — un seul examen par cours et par année"
      />
      <div className="max-w-2xl space-y-4 p-6">
        {typeExamenBloque && (
          <div className="flex items-start gap-3 rounded-xl border border-accent-gold/30 bg-accent-gold/10 px-4 py-3 text-sm text-accent-gold">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Un examen existe déjà pour ce cours : « {examenConflit.libelle} ». Un seul examen est
              autorisé par cours.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        )}

        <ContentCard>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isEdit && (
              <div className="space-y-1.5">
                <label htmlFor="cours_id" className="block text-sm font-medium text-ink-700">
                  Cours <span className="text-danger-500">*</span>
                </label>
                <select
                  id="cours_id"
                  value={form.cours_id}
                  onChange={(e) => updateField('cours_id', e.target.value)}
                  required
                  className={selectClassName}
                >
                  <option value="">Sélectionner un cours…</option>
                  {cours.map((c) => {
                    const promo = promotionById[c.promotion_id]
                    return (
                      <option key={c.id} value={c.id}>
                        {c.intitule} {promo ? `(${promo.nom})` : ''}
                      </option>
                    )
                  })}
                </select>
                {cours.length === 0 && (
                  <p className="text-xs text-accent-gold">Aucun cours ne vous est octroyé.</p>
                )}
              </div>
            )}

            <Input
              label="Libellé de l'évaluation"
              name="libelle"
              value={form.libelle}
              onChange={(e) => updateField('libelle', e.target.value)}
              placeholder="TJ1, Examen final…"
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="type_evaluation" className="block text-sm font-medium text-ink-700">
                  Type <span className="text-danger-500">*</span>
                </label>
                <select
                  id="type_evaluation"
                  value={form.type_evaluation}
                  onChange={(e) => updateField('type_evaluation', e.target.value)}
                  required
                  className={selectClassName}
                >
                  <option value="TJ">TJ — Travaux journaliers</option>
                  <option value="EXAMEN" disabled={examenDejaPourCours}>
                    EXAMEN {examenDejaPourCours ? '(déjà créé pour ce cours)' : ''}
                  </option>
                </select>
              </div>
              <Input
                label="Cote maximale"
                name="cote_maximale"
                type="number"
                min="0.01"
                step="0.01"
                value={form.cote_maximale}
                onChange={(e) => updateField('cote_maximale', e.target.value)}
                required
              />
            </div>

            <Input
              label="Date de l'évaluation"
              name="date_evaluation"
              type="date"
              value={form.date_evaluation}
              onChange={(e) => updateField('date_evaluation', e.target.value)}
              required
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="gold" disabled={saving || typeExamenBloque}>
                {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/enseignant/evaluations')}>
                Annuler
              </Button>
            </div>
          </form>
        </ContentCard>
      </div>
    </>
  )
}
