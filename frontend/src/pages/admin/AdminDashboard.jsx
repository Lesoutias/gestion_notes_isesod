import { useEffect, useState } from 'react'
import {
  AlertCircle,
  GraduationCap,
  Info,
  Plus,
  UserCheck,
  UserCog,
  UserMinus,
  Users,
} from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { DashboardCharts } from '../../components/admin/DashboardCharts'
import { ButtonLink } from '../../components/ui/Button'
import { ContentCard } from '../../components/ui/ContentCard'
import { ApiError } from '../../services/api'
import { getAdminDashboardData } from '../../services/adminService'

const STAT_CARDS = [
  { key: 'etudiantsTotal', label: 'Étudiants inscrits', icon: GraduationCap },
  { key: 'enseignantsTotal', label: 'Enseignants inscrits', icon: UserCog },
  { key: 'etudiantsAvecCompte', label: 'Étudiants avec compte', icon: UserCheck },
  { key: 'etudiantsSansCompte', label: 'Étudiants sans compte', icon: UserMinus },
  { key: 'enseignantsAvecCompte', label: 'Enseignants avec compte', icon: UserCheck },
  { key: 'enseignantsSansCompte', label: 'Enseignants sans compte', icon: UserMinus },
]

const QUICK_ACTIONS = [
  { to: '/admin/etudiants/nouveau', label: 'Ajouter un étudiant', icon: Plus, variant: 'gold' },
  { to: '/admin/enseignants/nouveau', label: 'Ajouter un enseignant', icon: Plus, variant: 'primary' },
  { to: '/admin/etudiants', label: 'Voir les étudiants', icon: Users, variant: 'outline' },
  { to: '/admin/enseignants', label: 'Voir les enseignants', icon: UserCog, variant: 'outline' },
]

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-warm-100 p-6">
      <div className="mb-4 h-10 w-10 rounded-xl bg-warm-200" />
      <div className="mb-2 h-4 w-24 rounded bg-warm-200" />
      <div className="h-8 w-12 rounded bg-warm-200" />
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminDashboardData()
      .then(setData)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Impossible de charger le tableau de bord')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <AdminHeader
        title="Tableau de bord"
        subtitle="Gestion des personnes académiques et suivi des comptes utilisateurs"
      />

      <div className="space-y-8 p-6">
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Statistiques</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {loading
              ? STAT_CARDS.map(({ key }) => <StatCardSkeleton key={key} />)
              : STAT_CARDS.map(({ key, label, icon: Icon }) => (
                  <ContentCard key={key} icon={Icon}>
                    <p className="text-sm text-ink-400">{label}</p>
                    <p className="font-display text-3xl font-bold text-ink-900">
                      {data?.stats[key] ?? 0}
                    </p>
                  </ContentCard>
                ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Actions rapides</h2>
          <div className="flex flex-wrap gap-3">
            {QUICK_ACTIONS.map(({ to, label, icon: Icon, variant }) => (
              <ButtonLink key={to} to={to} variant={variant} size="md">
                <Icon className="h-4 w-4" />
                {label}
              </ButtonLink>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-brand-500/20 bg-brand-500/10 p-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300">
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-2 text-sm text-ink-500">
              <p className="font-medium text-ink-700">Comment fonctionne l&apos;inscription ?</p>
              <p>
                L&apos;administrateur ajoute d&apos;abord les étudiants et les enseignants dans le
                système. Après leur enregistrement, un matricule leur est attribué automatiquement.
                Ce matricule leur permettra ensuite de créer leur propre compte utilisateur et
                d&apos;accéder au système selon leur rôle.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Analyses visuelles</h2>
          <DashboardCharts charts={data?.charts} loading={loading} />
        </section>
      </div>
    </>
  )
}
