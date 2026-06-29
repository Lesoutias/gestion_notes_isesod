import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { selectClassName } from '../../components/admin/adminUi.js'
import { Button } from '../../components/ui/Button'
import { ContentCard } from '../../components/ui/ContentCard'
import { ApiError } from '../../services/api'
import {
  affecterCoursPromotion,
  computeCredits,
  getAffectationCoursById,
  getCours,
  getFilieres,
  getPromotions,
  updateAffectationCours,
} from '../../services/adminService'

export default function AffecterCoursPromotionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [catalogue, setCatalogue] = useState([])
  const [filieres, setFilieres] = useState([])
  const [promotions, setPromotions] = useState([])
  const [form, setForm] = useState({
    cours_id: '',
    filiere_id: '',
    promotion_id: '',
    volume_horaire: '45',
    semestre: '',
    type_cours: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const promotionsForFiliere = useMemo(() => {
    if (!form.filiere_id) return []
    return promotions.filter((p) => String(p.filiere_id) === form.filiere_id)
  }, [promotions, form.filiere_id])

  const credits = computeCredits(Number(form.volume_horaire) || 0)

  useEffect(() => {
    async function load() {
      try {
        const [cat, fil, prom] = await Promise.all([
          getCours(),
          getFilieres(),
          getPromotions(),
        ])
        setCatalogue(cat)
        setFilieres(fil)
        setPromotions(prom)

        if (isEdit) {
          const aff = await getAffectationCoursById(id)
          const promo = prom.find((p) => p.id === aff.promotion_id)
          setForm({
            cours_id: String(aff.source_cours_id || ''),
            filiere_id: promo ? String(promo.filiere_id) : '',
            promotion_id: String(aff.promotion_id),
            volume_horaire: String(aff.volume_horaire ?? 45),
            semestre: aff.semestre || '',
            type_cours: aff.type_cours || '',
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
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'filiere_id') next.promotion_id = ''
      return next
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      promotion_id: Number(form.promotion_id),
      volume_horaire: Number(form.volume_horaire),
      semestre: form.semestre.trim() || null,
      type_cours: form.type_cours.trim() || null,
    }
    try {
      if (isEdit) {
        await updateAffectationCours(id, payload)
      } else {
        await affecterCoursPromotion({
          cours_id: Number(form.cours_id),
          ...payload,
        })
      }
      navigate('/admin/affectations-cours')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <AdminHeader title="Affectation cours → promotion" />
        <p className="p-6 text-ink-400">Chargement…</p>
      </>
    )
  }

  return (
    <>
      <AdminHeader
        title={isEdit ? 'Modifier l\'affectation' : 'Affecter un cours à une promotion'}
        subtitle="Étape 2 — Volume horaire et crédits (15 h = 1 crédit, calcul automatique)"
      />
      <div className="max-w-2xl space-y-4 p-6">
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
                  Cours (catalogue)
                </label>
                <select
                  id="cours_id"
                  value={form.cours_id}
                  onChange={(e) => updateField('cours_id', e.target.value)}
                  required
                  className={selectClassName}
                >
                  <option value="">Sélectionner un cours…</option>
                  {catalogue.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.intitule} {c.code ? `(${c.code})` : ''}
                    </option>
                  ))}
                </select>
                {catalogue.length === 0 && (
                  <p className="text-xs text-accent-gold">
                    Créez d&apos;abord un cours dans le catalogue.
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="filiere_id" className="block text-sm font-medium text-ink-700">
                  Filière
                </label>
                <select
                  id="filiere_id"
                  value={form.filiere_id}
                  onChange={(e) => updateField('filiere_id', e.target.value)}
                  required
                  className={selectClassName}
                >
                  <option value="">Sélectionner…</option>
                  {filieres.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.sigle} — {f.nom}
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
                  value={form.promotion_id}
                  onChange={(e) => updateField('promotion_id', e.target.value)}
                  required
                  disabled={!form.filiere_id}
                  className={selectClassName}
                >
                  <option value="">Sélectionner…</option>
                  {promotionsForFiliere.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="volume_horaire" className="block text-sm font-medium text-ink-700">
                  Volume horaire (heures)
                </label>
                <input
                  id="volume_horaire"
                  type="number"
                  min={1}
                  required
                  value={form.volume_horaire}
                  onChange={(e) => updateField('volume_horaire', e.target.value)}
                  className={selectClassName}
                />
              </div>
              <div className="space-y-1.5">
                <span className="block text-sm font-medium text-ink-700">Crédits calculés</span>
                <div className="flex h-[42px] items-center rounded-xl border border-white/10 bg-warm-200/40 px-4 font-mono text-brand-300">
                  {credits} crédit{credits > 1 ? 's' : ''} (÷ 15 h)
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="semestre" className="block text-sm font-medium text-ink-700">
                  Semestre
                </label>
                <input
                  id="semestre"
                  value={form.semestre}
                  onChange={(e) => updateField('semestre', e.target.value)}
                  placeholder="S1, S2…"
                  className={selectClassName}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="type_cours" className="block text-sm font-medium text-ink-700">
                  Type de cours
                </label>
                <input
                  id="type_cours"
                  value={form.type_cours}
                  onChange={(e) => updateField('type_cours', e.target.value)}
                  placeholder="Cours magistral, TD…"
                  className={selectClassName}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="gold" disabled={saving}>
                {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer l\'affectation'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/admin/affectations-cours')}>
                Annuler
              </Button>
            </div>
          </form>
        </ContentCard>
      </div>
    </>
  )
}
