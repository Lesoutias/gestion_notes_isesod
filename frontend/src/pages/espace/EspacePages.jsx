import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { logout } from '../../features/auth/authSlice'
import { Button } from '../../components/ui/Button'
import { ContentCard } from '../../components/ui/ContentCard'
import { PageHero } from '../../components/ui/PageHero'

function EspacePage({ title, subtitle, breadcrumbs }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const role = useSelector((state) => state.auth.role)

  return (
    <div className="space-y-8">
      <PageHero title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} />
      <ContentCard className="max-w-lg">
        <p className="text-ink-500">
          Bienvenue, <strong className="text-ink-900">{user?.login}</strong> ({role?.nom}).
        </p>
        <p className="mt-2 text-sm text-ink-400">
          Le tableau de bord complet sera disponible prochainement.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => dispatch(logout())}>
            Se déconnecter
          </Button>
          <Link to="/" className="inline-flex items-center text-sm text-brand-300 hover:underline">
            Retour au site
          </Link>
        </div>
      </ContentCard>
    </div>
  )
}

export function EtudiantEspacePage() {
  return (
    <EspacePage
      title="Espace étudiant"
      subtitle="Vos relevés de cotes et résultats académiques."
      breadcrumbs={[
        { label: 'Accueil', to: '/' },
        { label: 'Espace étudiant' },
      ]}
    />
  )
}

export function EnseignantEspacePage() {
  return (
    <EspacePage
      title="Espace enseignant"
      subtitle="Vos cours, évaluations et cahiers de cotes."
      breadcrumbs={[
        { label: 'Accueil', to: '/' },
        { label: 'Espace enseignant' },
      ]}
    />
  )
}

export function AdminEspacePage() {
  return (
    <EspacePage
      title="Espace administrateur"
      subtitle="Gestion de la structure académique et des documents officiels."
      breadcrumbs={[
        { label: 'Accueil', to: '/' },
        { label: 'Espace administrateur' },
      ]}
    />
  )
}
