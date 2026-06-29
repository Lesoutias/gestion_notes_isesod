import { PageHero } from '../../components/ui/PageHero'
import { MatriculeAuthPanel } from '../../components/auth/MatriculeAuthPanel'
import { RedirectIfAuthenticated } from '../../components/auth/RedirectIfAuthenticated'

export default function EnseignantLoginPage() {
  return (
    <RedirectIfAuthenticated expectedRole="enseignant">
      <div className="space-y-8">
        <PageHero
          title="Connexion enseignant"
          subtitle="Connectez-vous avec votre matricule ou créez votre compte."
          breadcrumbs={[
            { label: 'Accueil', to: '/' },
            { label: 'Connexion enseignant' },
          ]}
        />
        <MatriculeAuthPanel
          role="enseignant"
          roleLabel="Enseignant"
          accentDescription="Utilisez le matricule fourni par l'administration."
        />
      </div>
    </RedirectIfAuthenticated>
  )
}
