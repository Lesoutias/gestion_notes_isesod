import { useEffect, useMemo, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { EnseignantHeader } from '../../components/enseignant/EnseignantHeader'
import { Badge } from '../../components/ui/Badge'
import { ApiError } from '../../services/api'
import { getMesCours, getMesPromotions } from '../../services/enseignantService'

export default function MesCoursPage() {
  const [cours, setCours] = useState([])
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const promotionById = useMemo(
    () => Object.fromEntries(promotions.map((p) => [p.id, p])),
    [promotions],
  )

  useEffect(() => {
    Promise.all([getMesCours(), getMesPromotions()])
      .then(([coursData, promos]) => {
        setCours(coursData)
        setPromotions(promos)
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Chargement impossible')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <EnseignantHeader
        title="Mes cours"
        subtitle="Cours octroyés par l'administrateur — volume horaire et crédits"
      />
      <div className="space-y-4 p-6">
        {error && (
          <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        )}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-warm-100">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-warm-200/50 text-xs uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Intitulé</th>
                <th className="px-4 py-3">Promotion</th>
                <th className="px-4 py-3">Volume</th>
                <th className="px-4 py-3">Crédits</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-ink-400">
                    Chargement…
                  </td>
                </tr>
              ) : cours.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <BookOpen className="mx-auto mb-3 h-10 w-10 text-ink-400" />
                    <p className="text-ink-400">Aucun cours ne vous est encore octroyé</p>
                  </td>
                </tr>
              ) : (
                cours.map((c) => {
                  const promo = promotionById[c.promotion_id]
                  return (
                    <tr key={c.id} className="border-b border-white/5 text-ink-500">
                      <td className="px-4 py-3 font-mono text-brand-300">{c.code || '—'}</td>
                      <td className="px-4 py-3 font-medium text-ink-700">{c.intitule}</td>
                      <td className="px-4 py-3">{promo?.nom || '—'}</td>
                      <td className="px-4 py-3">{c.volume_horaire ?? '—'} h</td>
                      <td className="px-4 py-3">
                        <Badge tone="brand">{c.credits ?? 0} cr.</Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
