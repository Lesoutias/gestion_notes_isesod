import { Link } from 'react-router-dom'
import { ButtonLink } from '../components/ui/Button'
import { PageHero } from '../components/ui/PageHero'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <PageHero title="Page introuvable" subtitle="La page que vous recherchez n'existe pas ou a été déplacée." />
      <ButtonLink to="/" variant="primary" size="lg" className="mt-6">
        Retour à l'accueil
      </ButtonLink>
      <Link to="/" className="sr-only">
        Accueil
      </Link>
    </div>
  )
}
