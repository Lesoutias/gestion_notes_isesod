import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Award,
  Calendar,
  FileText,
  GraduationCap,
  Percent,
  Trophy,
} from 'lucide-react'
import { EtudiantHeader } from '../../components/etudiant/EtudiantHeader'
import { Badge } from '../../components/ui/Badge'
import { ContentCard } from '../../components/ui/ContentCard'
import { ApiError } from '../../services/api'
import {
  formatNomComplet,
  getEtudiantDashboard,
  promotionLabel,
  STATUT_ETUDIANT_LABELS,
} from '../../services/etudiantService'

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-warm-100 p-6">
      <div className="mb-4 h-10 w-10 rounded-xl bg-warm-200" />
      <div className="mb-2 h-4 w-24 rounded bg-warm-200" />
      <div className="h-8 w-16 rounded bg-warm-200" />
    </div>
  )
}

export default function EtudiantDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEtudiantDashboard()
      .then(setData)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Chargement impossible')
      })
      .finally(() => setLoading(false))
  }, [])

  const dernierReleve = useMemo(() => data?.releves?.[0] ?? null, [data])

  const stats = useMemo(
    () => ({
      releves: data?.releves?.length ?? 0,
      pourcentage: dernierReleve?.pourcentage ?? null,
      mention: dernierReleve?.mention ?? '—',
      rang: dernierReleve?.rang ?? null,
    }),
    [data, dernierReleve],
  )

  const etudiant = data?.etudiant
  const promoLabel = data ? promotionLabel(data.filiere, data.promotion) : '—'
  const anneeLabel = data?.annee_academique?.libelle ?? '—'

  return (
    <>
      <EtudiantHeader
        title="Tableau de bord"
        subtitle="Consultez vos résultats académiques et relevés de cotes"
      />

      <div className="space-y-8 p-6">
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="animate-pulse rounded-2xl border border-white/10 bg-warm-100 p-6">
            <div className="mb-3 h-6 w-48 rounded bg-warm-200" />
            <div className="h-4 w-64 rounded bg-warm-200" />
          </div>
        ) : etudiant ? (
          <section className="rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 via-warm-100 to-warm-100 p-6">
            <p className="text-sm text-ink-400">Bienvenue</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900">
              {formatNomComplet(etudiant)}
            </h2>
            <p className="mt-2 font-mono text-sm text-brand-300">{etudiant.matricule || '—'}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge tone="brand">
                <GraduationCap className="mr-1 inline h-3.5 w-3.5" />
                {promoLabel}
              </Badge>
              <Badge tone="gold">
                <Calendar className="mr-1 inline h-3.5 w-3.5" />
                {anneeLabel}
              </Badge>
              <Badge tone="success">
                {STATUT_ETUDIANT_LABELS[etudiant.statut] || etudiant.statut}
              </Badge>
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Vue d&apos;ensemble</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <ContentCard icon={FileText}>
                  <p className="text-sm text-ink-400">Relevés disponibles</p>
                  <p className="font-display text-3xl font-bold text-ink-900">{stats.releves}</p>
                </ContentCard>
                <ContentCard icon={Percent}>
                  <p className="text-sm text-ink-400">Dernier pourcentage</p>
                  <p className="font-display text-3xl font-bold text-ink-900">
                    {stats.pourcentage != null ? `${stats.pourcentage} %` : '—'}
                  </p>
                </ContentCard>
                <ContentCard icon={Award}>
                  <p className="text-sm text-ink-400">Mention</p>
                  <p className="font-display text-2xl font-bold text-ink-900">{stats.mention}</p>
                </ContentCard>
                <ContentCard icon={Trophy}>
                  <p className="text-sm text-ink-400">Rang promotion</p>
                  <p className="font-display text-3xl font-bold text-ink-900">
                    {stats.rang != null ? stats.rang : '—'}
                  </p>
                </ContentCard>
              </>
            )}
          </div>
        </section>

        {!loading && (
          <section>
            <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">
              Dernier relevé de cotes
            </h2>
            {dernierReleve ? (
              <ContentCard>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-ink-400">Année académique {anneeLabel}</p>
                    <p className="mt-1 font-display text-xl font-semibold text-ink-900">
                      {dernierReleve.total_points_obtenus} / {dernierReleve.total_points_max} points
                    </p>
                    <p className="mt-1 text-sm text-ink-500">
                      {dernierReleve.total_credits} crédits — {dernierReleve.pourcentage} %
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="brand">Rang {dernierReleve.rang}</Badge>
                    <Badge tone="gold">{dernierReleve.mention}</Badge>
                    <Badge tone={dernierReleve.decision === 'Admis' ? 'success' : 'gold'}>
                      {dernierReleve.decision}
                    </Badge>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    to="/etudiant/releves"
                    className="inline-flex items-center gap-2 text-sm font-medium text-brand-300 transition-colors hover:text-brand-200"
                  >
                    <FileText className="h-4 w-4" />
                    Voir le détail du relevé
                  </Link>
                </div>
              </ContentCard>
            ) : (
              <ContentCard>
                <p className="text-sm text-ink-500">
                  Aucun relevé de cotes n&apos;est encore disponible pour votre promotion.
                </p>
                <p className="mt-2 text-sm text-ink-400">
                  Vos résultats apparaîtront ici une fois la fiche synthétique validée par
                  l&apos;administration.
                </p>
              </ContentCard>
            )}
          </section>
        )}

        <section>
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Accès rapide</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              to="/etudiant/releves"
              className="rounded-2xl border border-white/10 bg-warm-100 p-5 transition-colors hover:border-brand-500/30"
            >
              <FileText className="mb-3 h-6 w-6 text-brand-300" />
              <h3 className="font-medium text-ink-900">Relevés de cotes</h3>
              <p className="mt-1 text-sm text-ink-400">
                Consultez vos notes par cours, mentions et décisions
              </p>
            </Link>
            <div className="rounded-2xl border border-dashed border-white/10 bg-warm-50/50 p-5 opacity-70">
              <GraduationCap className="mb-3 h-6 w-6 text-ink-400" />
              <h3 className="font-medium text-ink-700">Bulletins</h3>
              <p className="mt-1 text-sm text-ink-400">Bientôt disponible</p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
