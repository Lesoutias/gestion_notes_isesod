import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { Badge } from '../../components/ui/Badge'
import { Button, ButtonLink } from '../../components/ui/Button'
import { ApiError } from '../../services/api'
import { deleteEnseignant, getEnseignants } from '../../services/adminService'

export default function EnseignantsPage() {
  const [enseignants, setEnseignants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadEnseignants() {
    setLoading(true)
    setError('')
    try {
      const data = await getEnseignants()
      setEnseignants(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEnseignants()
  }, [])

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cet enseignant ?')) return
    try {
      await deleteEnseignant(id)
      setEnseignants((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression impossible')
    }
  }

  return (
    <>
      <AdminHeader
        title="Enseignants"
        subtitle="Gestion du corps enseignant"
      />
      <div className="space-y-4 p-6">
        <div className="flex justify-end">
          <ButtonLink to="/admin/enseignants/nouveau" variant="gold" size="md">
            <Plus className="h-4 w-4" />
            Nouvel enseignant
          </ButtonLink>
        </div>

        {error && (
          <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-warm-100">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-warm-200/50 text-xs uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3">Matricule</th>
                <th className="px-4 py-3">Nom complet</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Compte</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-400">
                    Chargement…
                  </td>
                </tr>
              ) : enseignants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-400">
                    Aucun enseignant enregistré
                  </td>
                </tr>
              ) : (
                enseignants.map((enseignant) => (
                  <tr key={enseignant.id} className="border-b border-white/5 text-ink-500">
                    <td className="px-4 py-3 font-mono text-brand-300">
                      {enseignant.matricule || '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      {enseignant.prenom} {enseignant.nom} {enseignant.postnom}
                    </td>
                    <td className="px-4 py-3">{enseignant.email || '—'}</td>
                    <td className="px-4 py-3 capitalize">{enseignant.statut}</td>
                    <td className="px-4 py-3">
                      {enseignant.user_id ? (
                        <Badge tone="success">Compte créé</Badge>
                      ) : (
                        <Badge tone="gold">Compte non créé</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/enseignants/${enseignant.id}/modifier`}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-brand-300 hover:bg-brand-500/10"
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(enseignant.id)}
                          className="text-danger-500 hover:bg-danger-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
