import { PageHero } from '../../components/ui/PageHero'
import { MatriculeAuthPanel } from '../../components/auth/MatriculeAuthPanel'
import { RedirectIfAuthenticated } from '../../components/auth/RedirectIfAuthenticated'

export default function EtudiantLoginPage() {
  return (
    <RedirectIfAuthenticated expectedRole="etudiant">
      <div className="space-y-8">
        <PageHero
          title="Connexion étudiant"
          subtitle="Connectez-vous avec votre matricule ou créez votre compte."
          breadcrumbs={[
            { label: 'Accueil', to: '/' },
            { label: 'Connexion étudiant' },
          ]}
        />
        <MatriculeAuthPanel
          role="etudiant"
          roleLabel="Étudiant"
          accentDescription="Utilisez le matricule fourni par l'administration."
        />
      </div>
    </RedirectIfAuthenticated>
  )
}
