import { PageHero } from '../../components/ui/PageHero'
import { AdminLoginForm } from '../../components/auth/AdminLoginForm'
import { RedirectIfAuthenticated } from '../../components/auth/RedirectIfAuthenticated'

export default function AdminLoginPage() {
  return (
    <RedirectIfAuthenticated expectedRole="admin">
      <div className="space-y-8">
        <PageHero
          title="Connexion administrateur"
          subtitle="Accédez à l'administration de la plateforme de gestion des notes."
          breadcrumbs={[
            { label: 'Accueil', to: '/' },
            { label: 'Connexion administrateur' },
          ]}
        />
        <AdminLoginForm />
      </div>
    </RedirectIfAuthenticated>
  )
}
