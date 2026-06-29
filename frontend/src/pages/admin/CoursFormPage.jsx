import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Info } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { Button } from '../../components/ui/Button'
import { ContentCard } from '../../components/ui/ContentCard'
import { Input } from '../../components/ui/Input'
import { ApiError } from '../../services/api'
import { createCours, getCoursById, updateCours } from '../../services/adminService'

const EMPTY = { intitule: '', code: '', description: '' }

export default function CoursFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    getCoursById(id)
      .then((data) =>
        setForm({
          intitule: data.intitule,
          code: data.code || '',
          description: data.description || '',
        }),
      )
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Cours introuvable'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      intitule: form.intitule.trim(),
      code: form.code.trim() || null,
      description: form.description.trim() || null,
    }
    try {
      if (isEdit) await updateCours(id, payload)
      else await createCours(payload)
      navigate('/admin/cours')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <AdminHeader title={isEdit ? 'Modifier le cours' : 'Nouveau cours'} />
        <p className="p-6 text-ink-400">Chargement…</p>
      </>
    )
  }

  return (
    <>
      <AdminHeader
        title={isEdit ? 'Modifier le cours' : 'Nouveau cours'}
        subtitle="Étape 1 — Définir le cours dans le catalogue (sans promotion ni enseignant)"
      />
      <div className="max-w-2xl space-y-4 p-6">
        <div className="flex items-start gap-3 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-ink-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
          <p>
            L&apos;affectation à une promotion et l&apos;octroi à un enseignant se font dans les
            étapes suivantes, depuis le menu « Affectations des cours ».
          </p>
        </div>
        {error && (
          <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        )}
        <ContentCard>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Intitulé"
              name="intitule"
              value={form.intitule}
              onChange={(e) => setForm((p) => ({ ...p, intitule: e.target.value }))}
              required
            />
            <Input
              label="Code"
              name="code"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              placeholder="Optionnel — généré à l'affectation si vide"
            />
            <div className="space-y-1.5">
              <label htmlFor="description" className="block text-sm font-medium text-ink-700">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-warm-100 px-4 py-2.5 text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                placeholder="Contenu, objectifs, remarques…"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="gold" disabled={saving}>
                {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le cours'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/admin/cours')}>
                Annuler
              </Button>
            </div>
          </form>
        </ContentCard>
      </div>
    </>
  )
}
