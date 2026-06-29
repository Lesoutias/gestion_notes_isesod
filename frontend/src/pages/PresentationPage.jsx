import { Building2, Compass, MapPin, Target, Users } from 'lucide-react'
import { ContentCard } from '../components/ui/ContentCard'
import { PageHero } from '../components/ui/PageHero'
import { BulletList, SectionBlock } from '../components/ui/SectionBlock'
import { PRESENTATION } from '../content/isesod'

const icons = [Target, Compass, Users, Building2]

export default function PresentationPage() {
  return (
    <div className="space-y-8">
      <PageHero
        title="Présentation de l'ISESOD-Goma"
        subtitle="Identité, mission et profil des étudiants formés à l'institut."
        breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Présentation' }]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ContentCard title={PRESENTATION.identity.title} icon={Building2}>
          <p>{PRESENTATION.identity.denomination}</p>
        </ContentCard>
        <ContentCard title={PRESENTATION.address.title} icon={MapPin}>
          <p>{PRESENTATION.address.text}</p>
        </ContentCard>
        <ContentCard title={PRESENTATION.motto.title}>
          <p className="font-display text-lg italic text-accent-gold">{PRESENTATION.motto.text}</p>
        </ContentCard>
        <ContentCard title={PRESENTATION.division.title}>
          {PRESENTATION.division.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </ContentCard>
      </div>

      <section className="space-y-6">
        <h2 className="font-display text-2xl font-semibold text-ink-900">
          Profil des étudiants formés
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {PRESENTATION.studentProfiles.map((profile, index) => {
            const Icon = icons[index] || Users
            return (
              <ContentCard key={profile.title} title={profile.title} icon={Icon}>
                <SectionBlock>
                  <BulletList items={profile.items} />
                </SectionBlock>
              </ContentCard>
            )
          })}
        </div>
      </section>
    </div>
  )
}
