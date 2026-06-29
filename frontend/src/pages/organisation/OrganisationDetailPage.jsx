import { useParams, Navigate } from 'react-router-dom'
import { ContentCard } from '../../components/ui/ContentCard'
import { PageHero } from '../../components/ui/PageHero'
import { BulletList, SectionBlock } from '../../components/ui/SectionBlock'
import { ORGANISATION_PAGES } from '../../content/isesod'

export default function OrganisationDetailPage() {
  const { slug } = useParams()
  const page = ORGANISATION_PAGES[slug]

  if (!page) {
    return <Navigate to="/organisation" replace />
  }

  return (
    <div className="space-y-8">
      <PageHero
        title={page.title}
        subtitle={page.subtitle}
        breadcrumbs={[
          { label: 'Accueil', to: '/' },
          { label: 'Organisation', to: '/organisation' },
          { label: page.title },
        ]}
      />

      <div className="space-y-6">
        {page.sections.map((section, index) => (
          <ContentCard key={index} title={section.title}>
            {section.paragraphs?.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {section.bullets && (
              <SectionBlock>
                <BulletList items={section.bullets} />
              </SectionBlock>
            )}
          </ContentCard>
        ))}
      </div>
    </div>
  )
}
