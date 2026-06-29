import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { SuccessBanner } from '../../components/admin/adminUi.js'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { ApiError } from '../../services/api'
import { deleteCours, getCours } from '../../services/adminService'

export default function CoursPage() {
  const [cours, setCours] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    if (!search.trim()) return cours
    const q = search.trim().toLowerCase()
    return cours.filter(
      (c) =>
        c.intitule?.toLowerCase().includes(q) ||
        c.code?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q),
    )
  }, [cours, search])

  async function loadCours() {
    setLoading(true)
    setError('')
    try {
      setCours(await getCours())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCours()
  }, [])

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCours(deleteTarget.id)
      setCours((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setSuccess('Cours supprimé du catalogue')
      setDeleteTarget(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression impossible')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <AdminHeader
        title="Cours"
        subtitle="Catalogue des cours — intitulé, code et description (sans affectation)"
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              name="search"
              placeholder="Rechercher par intitulé, code, description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <ButtonLink to="/admin/cours/nouveau" variant="gold" size="md">
            <Plus className="h-4 w-4" />
            Ajouter un cours
          </ButtonLink>
        </div>

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
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Intitulé</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-ink-400">
                    Chargement…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <BookOpen className="mx-auto mb-3 h-10 w-10 text-ink-400" />
                    <p className="text-ink-400">
                      {cours.length === 0 ? 'Aucun cours au catalogue' : 'Aucun résultat'}
                    </p>
                    {cours.length === 0 && (
                      <ButtonLink to="/admin/cours/nouveau" variant="gold" size="sm" className="mt-4">
                        Créer un cours
                      </ButtonLink>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 text-ink-500">
                    <td className="px-4 py-3 font-mono text-brand-300">{item.code || '—'}</td>
                    <td className="px-4 py-3 font-medium text-ink-700">{item.intitule}</td>
                    <td className="max-w-xs truncate px-4 py-3">{item.description || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/admin/cours/${item.id}/modifier`}
                          className="inline-flex items-center rounded-lg p-2 text-brand-300 hover:bg-brand-500/10"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(item)}
                          className="text-danger-500 hover:bg-danger-500/10"
                          title="Supprimer"
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

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer le cours"
      >
        <p className="mb-4 text-sm text-ink-500">
          Voulez-vous vraiment supprimer le cours{' '}
          <strong className="text-ink-700">{deleteTarget?.intitule}</strong> du catalogue ?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={confirmDelete}
            disabled={deleting}
            className="bg-danger-500 hover:bg-danger-600"
          >
            {deleting ? 'Suppression…' : 'Supprimer'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
