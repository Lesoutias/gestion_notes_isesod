import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Shield } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { ContentCard } from '../ui/ContentCard'
import { ApiError } from '../../lib/api'
import { useAuthActions } from '../../hooks/useAuthActions'

export function AdminLoginForm() {
  const { handleLogin } = useAuthActions()
  const isLoading = useSelector((state) => state.auth.status === 'loading')

  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const next = {}
    if (!identifiant.trim()) next.identifiant = "L'identifiant est requis"
    if (!motDePasse) next.motDePasse = 'Le mot de passe est requis'
    setErrors(next)
    if (Object.keys(next).length) return

    setFormError('')
    try {
      await handleLogin(identifiant.trim(), motDePasse)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Connexion impossible')
    }
  }

  return (
    <ContentCard title="Espace Administrateur" icon={Shield} className="mx-auto max-w-md">
      <p className="mb-6 text-sm text-ink-500">
        Connectez-vous avec le compte administrateur fourni par l&apos;institution
        (ex.&nbsp;: login <span className="font-mono text-brand-300">admin</span>).
      </p>

      {formError && (
        <div className="mb-4 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Identifiant"
          name="identifiant"
          value={identifiant}
          onChange={(e) => setIdentifiant(e.target.value)}
          error={errors.identifiant}
          placeholder="admin"
          autoComplete="username"
        />
        <Input
          label="Mot de passe"
          name="mot_de_passe"
          type="password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          error={errors.motDePasse}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-ink-400">
        <Link to="/" className="text-brand-300 hover:underline">
          Retour à l&apos;accueil
        </Link>
      </p>
    </ContentCard>
  )
}
