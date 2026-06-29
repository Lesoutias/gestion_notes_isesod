import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ClipboardList, BookMarked } from 'lucide-react'
import { EnseignantHeader } from '../../components/enseignant/EnseignantHeader'
import { ContentCard } from '../../components/ui/ContentCard'
import { ApiError } from '../../services/api'
import { getMesCours, getMesEvaluations } from '../../services/enseignantService'

export default function EnseignantDashboard() {
  const [stats, setStats] = useState({ cours: 0, evaluations: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMesCours(), getMesEvaluations()])
      .then(([cours, evaluations]) => {
        setStats({ cours: cours.length, evaluations: evaluations.length })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <EnseignantHeader
        title="Tableau de bord"
        subtitle="Gérez vos évaluations et le cahier des notes de vos cours"
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <ContentCard icon={BookOpen}>
            <p className="text-sm text-ink-400">Cours octroyés</p>
            <p className="font-display text-3xl font-bold text-ink-900">
              {loading ? '…' : stats.cours}
            </p>
          </ContentCard>
          <ContentCard icon={ClipboardList}>
            <p className="text-sm text-ink-400">Évaluations créées</p>
            <p className="font-display text-3xl font-bold text-ink-900">
              {loading ? '…' : stats.evaluations}
            </p>
          </ContentCard>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            to="/enseignant/cours"
            className="rounded-2xl border border-white/10 bg-warm-100 p-5 transition-colors hover:border-brand-500/30"
          >
            <BookOpen className="mb-3 h-6 w-6 text-brand-300" />
            <h2 className="font-medium text-ink-900">Mes cours</h2>
            <p className="mt-1 text-sm text-ink-400">Cours affectés par l&apos;administration</p>
          </Link>
          <Link
            to="/enseignant/evaluations"
            className="rounded-2xl border border-white/10 bg-warm-100 p-5 transition-colors hover:border-brand-500/30"
          >
            <ClipboardList className="mb-3 h-6 w-6 text-brand-300" />
            <h2 className="font-medium text-ink-900">Évaluations</h2>
            <p className="mt-1 text-sm text-ink-400">Créer et gérer TJ et examens</p>
          </Link>
          <Link
            to="/enseignant/cahier-notes"
            className="rounded-2xl border border-white/10 bg-warm-100 p-5 transition-colors hover:border-brand-500/30"
          >
            <BookMarked className="mb-3 h-6 w-6 text-brand-300" />
            <h2 className="font-medium text-ink-900">Cahier des notes</h2>
            <p className="mt-1 text-sm text-ink-400">Synthèse TJ /10 + Examen /10</p>
          </Link>
        </div>
      </div>
    </>
  )
}
