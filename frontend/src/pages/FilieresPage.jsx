import { GraduationCap } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { ContentCard } from '../components/ui/ContentCard'
import { PageHero } from '../components/ui/PageHero'
import { FILIERES } from '../content/isesod'

function FiliereGrid({ filieres }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filieres.items.map((filiere) => (
        <ContentCard key={filiere.sigle}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-medium text-ink-900">{filiere.name}</h3>
            </div>
            <Badge tone="gold">{filiere.sigle}</Badge>
          </div>
        </ContentCard>
      ))}
    </div>
  )
}

export default function FilieresPage() {
  return (
    <div className="space-y-10">
      <PageHero
        title="Filières organisées"
        subtitle="Programmes Licence (3 ans) et Master (2 ans) — système LMD."
        breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Filières' }]}
      />

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-brand-300" />
          <h2 className="font-display text-2xl font-semibold text-ink-900">
            {FILIERES.licence.title}
          </h2>
        </div>
        <FiliereGrid filieres={FILIERES.licence} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-accent-gold" />
          <h2 className="font-display text-2xl font-semibold text-ink-900">
            {FILIERES.master.title}
          </h2>
        </div>
        <FiliereGrid filieres={FILIERES.master} />
      </section>
    </div>
  )
}
