import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, Info } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { Button } from '../../components/ui/Button'
import { ContentCard } from '../../components/ui/ContentCard'
import { Input } from '../../components/ui/Input'
import { ApiError } from '../../services/api'
import {
  createEtudiant,
  getActiveAnneeAcademique,
  getEtudiantById,
  getFilieres,
  getPromotions,
  updateEtudiant,
} from '../../services/adminService'

const EMPTY_FORM = {
  nom: '',
  postnom: '',
  prenom: '',
  sexe: 'M',
  email: '',
  telephone: '',
  filiere_id: '',
  promotion_id: '',
  statut: 'actif',
}

const selectClassName =
  'w-full rounded-xl border border-white/10 bg-warm-100 px-4 py-2.5 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30'

export default function EtudiantFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [filieres, setFilieres] = useState([])
  const [promotions, setPromotions] = useState([])
  const [activeAnnee, setActiveAnnee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const promotionsForFiliere = useMemo(() => {
    if (!form.filiere_id) return []
    return promotions.filter((p) => String(p.filiere_id) === form.filiere_id)
  }, [promotions, form.filiere_id])

  useEffect(() => {
    async function loadReferenceData() {
      try {
        const [filieresData, promotionsData] = await Promise.all([
          getFilieres(),
          getPromotions(),
        ])
        setFilieres(filieresData)
        setPromotions(promotionsData)

        const active = await getActiveAnneeAcademique()
        setActiveAnnee(active)
      } catch {
        setError('Impossible de charger les données de référence')
      }
    }
    loadReferenceData()
  }, [])

  useEffect(() => {
    if (!isEdit) {
      setLoading(false)
      return
    }

    getEtudiantById(id)
      .then((data) => {
        const promo = promotions.find((p) => p.id === data.promotion_id)
        setForm({
          nom: data.nom,
          postnom: data.postnom,
          prenom: data.prenom,
          sexe: data.sexe,
          email: data.email || '',
          telephone: data.telephone || '',
          filiere_id: promo ? String(promo.filiere_id) : '',
          promotion_id: String(data.promotion_id),
          statut: data.statut,
        })
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Étudiant introuvable')
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, promotions])

  function updateField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'filiere_id') next.promotion_id = ''
      return next
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!isEdit && !activeAnnee) {
      setError('Aucune année académique active. Activez une année avant d\'inscrire un étudiant.')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      nom: form.nom.trim(),
      postnom: form.postnom.trim(),
      prenom: form.prenom.trim(),
      sexe: form.sexe,
      email: form.email.trim() || null,
      telephone: form.telephone.trim() || null,
      promotion_id: Number(form.promotion_id),
      statut: form.statut,
    }

    try {
      if (isEdit) {
        await updateEtudiant(id, payload)
      } else {
        await createEtudiant(payload)
      }
      navigate('/admin/etudiants')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <AdminHeader title={isEdit ? 'Modifier un étudiant' : 'Nouvel étudiant'} />
        <p className="p-6 text-ink-400">Chargement…</p>
      </>
    )
  }

  const canCreate = isEdit || Boolean(activeAnnee)

  return (
    <>
      <AdminHeader
        title={isEdit ? 'Modifier un étudiant' : 'Ajouter un étudiant'}
        subtitle="Inscription académique uniquement — aucun compte utilisateur n'est créé ici"
      />
      <div className="max-w-2xl space-y-4 p-6">
        {!isEdit && !activeAnnee && (
          <div className="flex items-start gap-3 rounded-xl border border-accent-gold/30 bg-accent-gold/10 px-4 py-3 text-sm text-accent-gold">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Aucune année académique active. L&apos;étudiant doit être inscrit dans une promotion
              pour une année donnée.{' '}
              <Link to="/admin/annees-academiques" className="underline hover:text-accent-gold/80">
                Créez et activez d&apos;abord une année académique
              </Link>
              .
            </p>
          </div>
        )}

        {activeAnnee && (
          <div className="flex items-start gap-3 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-ink-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
            <p>
              Année académique d&apos;inscription :{' '}
              <strong className="text-brand-300">{activeAnnee.libelle}</strong>. Le matricule sera
              généré automatiquement après l&apos;enregistrement.
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="sexe" className="block text-sm font-medium text-ink-700">
                  Sexe
                </label>
                <select
                  id="sexe"
                  value={form.sexe}
                  onChange={(e) => updateField('sexe', e.target.value)}
                  className={selectClassName}
                >
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="statut" className="block text-sm font-medium text-ink-700">
                  Statut académique
                </label>
                <select
                  id="statut"
                  value={form.statut}
                  onChange={(e) => updateField('statut', e.target.value)}
                  className={selectClassName}
                >
                  <option value="actif">Actif</option>
                  <option value="suspendu">Suspendu</option>
                  <option value="termine">Terminé</option>
                </select>
              </div>
            </div>

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
                  <option value="">Sélectionner une filière…</option>
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
                  <option value="">
                    {form.filiere_id ? 'Sélectionner une promotion…' : 'Choisir d\'abord une filière'}
                  </option>
                  {promotionsForFiliere.map((promo) => (
                    <option key={promo.id} value={promo.id}>
                      {promo.nom}
                    </option>
                  ))}
                </select>
              </div>
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

            <p className="text-xs text-ink-400">
              Aucun mot de passe n&apos;est demandé. L&apos;étudiant créera son compte plus tard avec
              le matricule qui lui sera attribué.
            </p>

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="gold" disabled={saving || !canCreate}>
                {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Enregistrer l\'étudiant'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/admin/etudiants')}>
                Annuler
              </Button>
            </div>
          </form>
        </ContentCard>
      </div>
    </>
  )
}
