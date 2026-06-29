import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { Button } from '../../components/ui/Button'
import { ContentCard } from '../../components/ui/ContentCard'
import { Input } from '../../components/ui/Input'
import { ApiError } from '../../services/api'
import {
  createEnseignant,
  getEnseignantById,
  updateEnseignant,
} from '../../services/adminService'

const EMPTY_FORM = {
  nom: '',
  postnom: '',
  prenom: '',
  sexe: 'M',
  email: '',
  telephone: '',
  statut: 'actif',
}

export default function EnseignantFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    getEnseignantById(id)
      .then((data) => {
        setForm({
          nom: data.nom,
          postnom: data.postnom,
          prenom: data.prenom,
          sexe: data.sexe,
          email: data.email || '',
          telephone: data.telephone || '',
          statut: data.statut,
        })
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Enseignant introuvable')
      })
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      nom: form.nom.trim(),
      postnom: form.postnom.trim(),
      prenom: form.prenom.trim(),
      sexe: form.sexe,
      email: form.email.trim() || null,
      telephone: form.telephone.trim() || null,
      statut: form.statut,
    }

    try {
      if (isEdit) {
        await updateEnseignant(id, payload)
      } else {
        await createEnseignant(payload)
      }
      navigate('/admin/enseignants')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <AdminHeader title={isEdit ? 'Modifier un enseignant' : 'Nouvel enseignant'} />
        <p className="p-6 text-ink-400">Chargement…</p>
      </>
    )
  }

  return (
    <>
      <AdminHeader
        title={isEdit ? 'Modifier un enseignant' : 'Nouvel enseignant'}
        subtitle="Enregistrement d'un membre du corps enseignant"
      />
      <div className="max-w-2xl p-6">
        {error && (
          <div className="mb-4 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        )}
        <ContentCard>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Prénom"
                name="prenom"
                value={form.prenom}
                onChange={(e) => updateField('prenom', e.target.value)}
                required
              />
              <Input
                label="Nom"
                name="nom"
                value={form.nom}
                onChange={(e) => updateField('nom', e.target.value)}
                required
              />
            </div>
            <Input
              label="Postnom"
              name="postnom"
              value={form.postnom}
              onChange={(e) => updateField('postnom', e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label htmlFor="sexe" className="block text-sm font-medium text-ink-700">
                Sexe
              </label>
              <select
                id="sexe"
                value={form.sexe}
                onChange={(e) => updateField('sexe', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-warm-100 px-4 py-2.5 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
            <Input
              label="Téléphone"
              name="telephone"
              value={form.telephone}
              onChange={(e) => updateField('telephone', e.target.value)}
            />
            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="gold" disabled={saving}>
                {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/admin/enseignants')}>
                Annuler
              </Button>
            </div>
          </form>
        </ContentCard>
      </div>
    </>
  )
}
