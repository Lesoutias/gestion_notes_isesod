import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, Info, Search, UserCog } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { SuccessBanner, selectClassName } from '../../components/admin/adminUi.js'
import { Badge } from '../../components/ui/Badge'
import { Button, ButtonLink } from '../../components/ui/Button'
import { ContentCard } from '../../components/ui/ContentCard'
import { Input } from '../../components/ui/Input'
import { ApiError } from '../../services/api'
import {
  affecterEnseignantAuCours,
  getAffectationCoursById,
  getEnseignants,
  getFilieres,
  getPromotions,
  retirerEnseignantDuCours,
} from '../../services/adminService'

function formatEnseignantNom(enseignant) {
  if (!enseignant) return '—'
  return [enseignant.prenom, enseignant.nom, enseignant.postnom].filter(Boolean).join(' ')
}

function enseignantMatchesSearch(enseignant, query) {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return [enseignant.nom, enseignant.postnom, enseignant.prenom, enseignant.matricule, enseignant.email]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(q))
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-ink-400">{label}</span>
      <span className={mono ? 'font-mono text-brand-300' : 'text-ink-700'}>{value}</span>
    </div>
  )
}

export default function AffecterEnseignantCoursPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [affectation, setAffectation] = useState(null)
  const [enseignants, setEnseignants] = useState([])
  const [filiereLabel, setFiliereLabel] = useState('—')
  const [promotionLabel, setPromotionLabel] = useState('—')
  const [enseignantId, setEnseignantId] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [success, setSuccess] = useState('')

  const enseignantById = useMemo(
    () => Object.fromEntries(enseignants.map((e) => [e.id, e])),
    [enseignants],
  )

  const enseignantsActifs = useMemo(
    () => enseignants.filter((e) => e.statut === 'actif'),
    [enseignants],
  )

  const enseignantsFiltres = useMemo(
    () => enseignantsActifs.filter((e) => enseignantMatchesSearch(e, search)),
    [enseignantsActifs, search],
  )

  const enseignantActuel = affectation?.enseignant_id
    ? enseignantById[affectation.enseignant_id]
    : null

  useEffect(() => {
    async function load() {
      try {
        const [aff, ens, fil, prom] = await Promise.all([
          getAffectationCoursById(id),
          getEnseignants(),
          getFilieres(),
          getPromotions(),
        ])
        setAffectation(aff)
        setEnseignants(ens)

        const promo = prom.find((p) => p.id === aff.promotion_id)
        if (promo) {
          setPromotionLabel(promo.nom)
          const filiere = fil.find((f) => f.id === promo.filiere_id)
          if (filiere) setFiliereLabel(`${filiere.sigle} — ${filiere.nom}`)
        }

        setEnseignantId(aff.enseignant_id ? String(aff.enseignant_id) : '')
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Chargement impossible')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleAssign(event) {
    event.preventDefault()
    setError('')
    setInfo('')
    setSuccess('')

    if (!enseignantId) {
      setError('Sélectionnez un enseignant actif')
      return
    }

    const selected = enseignantById[Number(enseignantId)]
    if (!selected) {
      setError('Enseignant introuvable')
      return
    }
    if (selected.statut !== 'actif') {
      setError('Seuls les enseignants actifs peuvent recevoir un cours')
      return
    }

    if (affectation?.enseignant_id && Number(enseignantId) === affectation.enseignant_id) {
      setInfo('Cet enseignant est déjà affecté à ce cours.')
      return
    }

    setSaving(true)
    try {
      const updated = await affecterEnseignantAuCours(id, Number(enseignantId))
      setAffectation(updated)
      setSuccess('Cours octroyé à l\'enseignant avec succès.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Octroi impossible')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    if (!window.confirm('Retirer l\'enseignant de ce cours ?')) return
    setSaving(true)
    setError('')
    setInfo('')
    setSuccess('')
    try {
      const updated = await retirerEnseignantDuCours(id)
      setAffectation(updated)
      setEnseignantId('')
      setSuccess('Enseignant retiré du cours avec succès.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Opération impossible')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <AdminHeader title="Octroi enseignant" subtitle="Chargement de l'affectation…" />
        <p className="p-6 text-ink-400">Chargement…</p>
      </>
    )
  }

  if (!affectation) {
    return (
      <>
        <AdminHeader title="Octroi enseignant" />
        <div className="p-6">
          <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error || 'Affectation introuvable'}
          </div>
          <Button type="button" variant="ghost" className="mt-4" onClick={() => navigate('/admin/affectations-cours')}>
            Retour aux affectations
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader
        title="Octroi du cours à un enseignant"
        subtitle="Étape 3 — L'enseignant pourra gérer les évaluations de ce cours une fois octroyé"
      />

      <div className="max-w-2xl space-y-4 p-6">
        <ContentCard title="Détails de l'affectation">
          <dl className="space-y-3 text-sm">
            <DetailRow label="Code" value={affectation.code || '—'} mono />
            <DetailRow label="Intitulé" value={affectation.intitule} />
            <DetailRow label="Filière" value={filiereLabel} />
            <DetailRow label="Promotion" value={promotionLabel} />
            <DetailRow
              label="Volume horaire"
              value={affectation.volume_horaire != null ? `${affectation.volume_horaire} h` : '—'}
            />
            <DetailRow
              label="Crédits"
              value={affectation.credits != null ? `${affectation.credits} crédit${affectation.credits > 1 ? 's' : ''}` : '—'}
            />
            <div className="flex flex-col gap-1.5 border-t border-white/10 pt-3 sm:flex-row sm:items-start sm:justify-between">
              <span className="text-ink-400">Enseignant actuel</span>
              {enseignantActuel ? (
                <div className="text-right">
                  <p className="font-medium text-ink-900">{formatEnseignantNom(enseignantActuel)}</p>
                  {enseignantActuel.matricule && (
                    <p className="font-mono text-xs text-brand-300">{enseignantActuel.matricule}</p>
                  )}
                  {enseignantActuel.email && (
                    <p className="text-xs text-ink-400">{enseignantActuel.email}</p>
                  )}
                </div>
              ) : (
                <Badge tone="gold">Aucun enseignant affecté</Badge>
              )}
            </div>
          </dl>
        </ContentCard>

        <div className="flex items-start gap-3 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-ink-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
          <p>
            Ce cours doit d&apos;abord exister dans le référentiel, puis être affecté à une promotion
            avec un volume horaire. Les crédits sont calculés automatiquement (volume ÷ 15). Cette
            page ne modifie ni le volume horaire, ni les crédits, et ne crée pas d&apos;évaluation.
          </p>
        </div>

        <SuccessBanner message={success} onClose={() => setSuccess('')} />

        {success && (
          <div className="flex flex-wrap gap-3">
            <ButtonLink to="/admin/affectations-cours" variant="gold" size="sm">
              Voir les affectations
            </ButtonLink>
          </div>
        )}

        {info && (
          <div className="flex items-start gap-3 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-ink-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
            <span>{info}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <ContentCard title="Sélection de l'enseignant">
          {enseignantsActifs.length === 0 ? (
            <div className="flex items-start gap-3 text-sm text-accent-gold">
              <UserCog className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Aucun enseignant actif disponible. Ajoutez d&apos;abord un enseignant dans la
                section Enseignants.
              </p>
            </div>
          ) : (
            <form onSubmit={handleAssign} className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input
                  name="search"
                  placeholder="Rechercher par nom, postnom, prénom, matricule ou email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="enseignant_id" className="block text-sm font-medium text-ink-700">
                  Enseignant <span className="text-danger-500">*</span>
                </label>
                <select
                  id="enseignant_id"
                  value={enseignantId}
                  onChange={(e) => {
                    setEnseignantId(e.target.value)
                    setInfo('')
                    setError('')
                  }}
                  required
                  className={selectClassName}
                >
                  <option value="">Sélectionner un enseignant actif…</option>
                  {enseignantsFiltres.map((e) => (
                    <option key={e.id} value={e.id}>
                      {formatEnseignantNom(e)}
                      {e.matricule ? ` — ${e.matricule}` : ''}
                      {e.email ? ` — ${e.email}` : ''}
                    </option>
                  ))}
                </select>
                {search.trim() && (
                  <p className="text-xs text-ink-400">
                    {enseignantsFiltres.length} enseignant{enseignantsFiltres.length > 1 ? 's' : ''} trouvé
                    {enseignantsFiltres.length > 1 ? 's' : ''}
                  </p>
                )}
                {search.trim() && enseignantsFiltres.length === 0 && (
                  <p className="text-xs text-accent-gold">Aucun enseignant actif ne correspond à cette recherche.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" variant="gold" disabled={saving || enseignantsActifs.length === 0}>
                  {saving ? 'Octroi en cours…' : 'Octroyer ce cours'}
                </Button>
                {affectation.enseignant_id && (
                  <Button type="button" variant="ghost" onClick={handleRemove} disabled={saving}>
                    Retirer l&apos;enseignant
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/admin/affectations-cours')}
                >
                  Retour aux affectations
                </Button>
              </div>
            </form>
          )}
        </ContentCard>
      </div>
    </>
  )
}
