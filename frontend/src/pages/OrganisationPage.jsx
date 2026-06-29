import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ContentCard } from '../components/ui/ContentCard'
import { PageHero } from '../components/ui/PageHero'
import { ORGANISATION_HUB } from '../content/isesod'

export default function OrganisationPage() {
  return (
    <div className="space-y-8">
      <PageHero
        title="Fonctionnement de la structure"
        subtitle="Organes de gouvernance, direction et instances académiques de l'ISESOD."
        breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Organisation' }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ORGANISATION_HUB.map((org) => (
          <Link key={org.slug} to={org.path} className="group block">
            <ContentCard className="h-full transition-transform group-hover:-translate-y-0.5">
              <h2 className="font-display text-lg font-semibold text-ink-900 group-hover:text-brand-300 transition-colors">
                {org.title}
              </h2>
              <p className="mt-2 text-sm text-ink-500">{org.summary}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-300">
                En savoir plus
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </ContentCard>
          </Link>
        ))}
      </div>
    </div>
  )
}
