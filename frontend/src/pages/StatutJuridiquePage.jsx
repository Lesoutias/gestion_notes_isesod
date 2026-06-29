import { Scale, UserCheck } from 'lucide-react'
import { ContentCard } from '../components/ui/ContentCard'
import { PageHero } from '../components/ui/PageHero'
import { STATUT_JURIDIQUE } from '../content/isesod'

export default function StatutJuridiquePage() {
  return (
    <div className="space-y-8">
      <PageHero
        title={STATUT_JURIDIQUE.title}
        subtitle="Institution d'enseignement supérieur privé autorisée de fonctionner."
        breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Statut juridique' }]}
      />

      <ContentCard title="Agrément définitif" icon={Scale}>
        <p>{STATUT_JURIDIQUE.description}</p>
        <p className="mt-2 font-mono text-lg text-brand-300">{STATUT_JURIDIQUE.agrement}</p>
      </ContentCard>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-ink-900">Promoteurs principaux</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {STATUT_JURIDIQUE.promoteurs.map((p) => (
            <ContentCard key={p.name} title={p.name} icon={UserCheck}>
              <p>{p.role}</p>
            </ContentCard>
          ))}
        </div>
      </section>
    </div>
  )
}
