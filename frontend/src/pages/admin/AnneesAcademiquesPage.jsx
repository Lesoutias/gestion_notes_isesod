import { useEffect, useState } from 'react'
import { Calendar, CheckCircle, Lock } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { SuccessBanner } from '../../components/admin/adminUi.js'
import { Button } from '../../components/ui/Button'
import { ContentCard } from '../../components/ui/ContentCard'
import { Input } from '../../components/ui/Input'
import { ApiError } from '../../services/api'
import {
  activateAnneeAcademique,
  cloturerAnneeAcademique,
  createAnneeAcademique,
  getAnneesAcademiques,
} from '../../services/adminService'

const EMPTY_FORM = {
  libelle: '',
  date_debut: '',
  date_fin: '',
  activer: true,
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fr-FR')
}

function StatutBadge({ statut }) {
  if (statut === 'active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success-500/15 px-2.5 py-0.5 text-xs font-medium text-success-500">
        <CheckCircle className="h-3 w-3" />
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink-400/15 px-2.5 py-0.5 text-xs font-medium text-ink-400">
      <Lock className="h-3 w-3" />
      Clôturée
    </span>
  )
}

export default function AnneesAcademiquesPage() {
  const [annees, setAnnees] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadAnnees() {
    setLoading(true)
    setError('')
    try {
      setAnnees(await getAnneesAcademiques())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnees()
  }, [])

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const created = await createAnneeAcademique({
        libelle: form.libelle.trim(),
        date_debut: form.date_debut,
        date_fin: form.date_fin,
        statut: form.activer ? 'active' : 'cloturee',
      })
      setAnnees((prev) => [created, ...prev.filter((a) => a.id !== created.id)])
      if (created.statut === 'active') {
        setAnnees((prev) =>
          prev.map((a) =>
            a.id === created.id ? a : { ...a, statut: 'cloturee' },
          ),
        )
      }
      setForm(EMPTY_FORM)
      setSuccess(`Année académique « ${created.libelle} » créée`)
      await loadAnnees()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Création impossible')
    } finally {
      setSaving(false)
    }
  }

  async function handleActivate(id) {
    setActionId(id)
    setError('')
    setSuccess('')
    try {
      await activateAnneeAcademique(id)
      setSuccess('Année académique activée')
      await loadAnnees()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Activation impossible')
    } finally {
      setActionId(null)
    }
  }

  async function handleCloturer(id) {
    setActionId(id)
    setError('')
    setSuccess('')
    try {
      await cloturerAnneeAcademique(id)
      setSuccess('Année académique clôturée')
      await loadAnnees()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Clôture impossible')
    } finally {
      setActionId(null)
    }
  }

  const activeAnnee = annees.find((a) => a.statut === 'active')

  return (
    <>
      <AdminHeader
        title="Années académiques"
        subtitle="Gérez les périodes d'inscription — une seule année peut être active à la fois"
      />

      <div className="space-y-6 p-6">
        {activeAnnee ? (
          <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-ink-500">
            Année active :{' '}
            <strong className="text-brand-300">{activeAnnee.libelle}</strong>{' '}
            ({formatDate(activeAnnee.date_debut)} → {formatDate(activeAnnee.date_fin)})
          </div>
        ) : (
          <div className="rounded-xl border border-accent-gold/30 bg-accent-gold/10 px-4 py-3 text-sm text-accent-gold">
            Aucune année académique active. Créez une année ou activez une année existante
            pour pouvoir inscrire des étudiants.
          </div>
        )}

        <SuccessBanner message={success} onClose={() => setSuccess('')} />
        {error && (
          <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        )}

        <ContentCard title="Nouvelle année académique">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Libellé"
                name="libelle"
                placeholder="2026-2027"
                value={form.libelle}
                onChange={(e) => updateField('libelle', e.target.value)}
                required
              />
              <Input
                label="Date de début"
                name="date_debut"
                type="date"
                value={form.date_debut}
                onChange={(e) => updateField('date_debut', e.target.value)}
                required
              />
              <Input
                label="Date de fin"
                name="date_fin"
                type="date"
                value={form.date_fin}
                onChange={(e) => updateField('date_fin', e.target.value)}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-500">
              <input
                type="checkbox"
                checked={form.activer}
                onChange={(e) => updateField('activer', e.target.checked)}
                className="rounded border-white/20"
              />
              Activer immédiatement (clôture automatiquement l&apos;année précédente)
            </label>
            <Button type="submit" variant="gold" disabled={saving}>
              {saving ? 'Création…' : 'Créer l\'année'}
            </Button>
          </form>
        </ContentCard>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-warm-100">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-white/10 bg-warm-200/50 text-xs uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3">Libellé</th>
                <th className="px-4 py-3">Début</th>
                <th className="px-4 py-3">Fin</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-ink-400">
                    Chargement…
                  </td>
                </tr>
              ) : annees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Calendar className="mx-auto mb-3 h-10 w-10 text-ink-400" />
                    <p className="text-ink-400">Aucune année académique enregistrée</p>
                  </td>
                </tr>
              ) : (
                annees.map((annee) => (
                  <tr key={annee.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-ink-900">{annee.libelle}</td>
                    <td className="px-4 py-3">{formatDate(annee.date_debut)}</td>
                    <td className="px-4 py-3">{formatDate(annee.date_fin)}</td>
                    <td className="px-4 py-3">
                      <StatutBadge statut={annee.statut} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {annee.statut === 'active' ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={actionId === annee.id}
                          onClick={() => handleCloturer(annee.id)}
                        >
                          Clôturer
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="gold"
                          size="sm"
                          disabled={actionId === annee.id}
                          onClick={() => handleActivate(annee.id)}
                        >
                          Activer
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
