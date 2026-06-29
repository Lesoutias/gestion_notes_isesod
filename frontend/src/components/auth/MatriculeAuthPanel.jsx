import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { UserPlus, LogIn, CheckCircle2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { ContentCard } from '../ui/ContentCard'
import { cn } from '../../lib/cn'
import { ApiError } from '../../lib/api'
import { clearAuthError, authStart, authFailure, authIdle } from '../../features/auth/authSlice'
import { useAuthActions } from '../../hooks/useAuthActions'
import {
  registerEnseignant,
  registerEtudiant,
  verifyMatriculeEnseignant,
  verifyMatriculeEtudiant,
} from '../../services/auth'

export function MatriculeAuthPanel({ role, roleLabel, accentDescription }) {
  const dispatch = useDispatch()
  const { handleLogin, handleAuthResponse } = useAuthActions()
  const authError = useSelector((state) => state.auth.error)
  const isLoading = useSelector((state) => state.auth.status === 'loading')

  const [mode, setMode] = useState('login')
  const [matricule, setMatricule] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [verifiedProfile, setVerifiedProfile] = useState(null)
  const [registerStep, setRegisterStep] = useState(1)

  const verifyFn = role === 'enseignant' ? verifyMatriculeEnseignant : verifyMatriculeEtudiant
  const registerFn = role === 'enseignant' ? registerEnseignant : registerEtudiant

  function switchMode(next) {
    setMode(next)
    setErrors({})
    setFormError('')
    setVerifiedProfile(null)
    setRegisterStep(1)
    dispatch(clearAuthError())
    dispatch(authIdle())
  }

  async function onLoginSubmit(event) {
    event.preventDefault()
    const next = {}
    if (!matricule.trim()) next.matricule = 'Le matricule est requis'
    if (!motDePasse) next.motDePasse = 'Le mot de passe est requis'
    setErrors(next)
    if (Object.keys(next).length) return

    setFormError('')
    try {
      await handleLogin(matricule.trim(), motDePasse)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Connexion impossible')
    }
  }

  async function onVerifyMatricule(event) {
    event.preventDefault()
    if (!matricule.trim()) {
      setErrors({ matricule: 'Le matricule est requis' })
      return
    }
    setErrors({})
    setFormError('')
    dispatch(authStart())

    try {
      const profile = await verifyFn(matricule.trim())
      setVerifiedProfile(profile)
      setRegisterStep(2)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setFormError(
          error.message ||
            'Un compte existe déjà pour ce matricule. Utilisez l\'onglet Connexion avec votre matricule ou identifiant.',
        )
        setMode('login')
        return
      }
      const message = error instanceof ApiError ? error.message : 'Vérification impossible'
      setFormError(message)
    } finally {
      dispatch(authIdle())
    }
  }

  async function onRegisterSubmit(event) {
    event.preventDefault()
    const next = {}
    if (!motDePasse) next.motDePasse = 'Le mot de passe est requis'
    else if (motDePasse.length < 8) next.motDePasse = 'Minimum 8 caractères'
    if (motDePasse !== confirmPassword) next.confirmPassword = 'Les mots de passe ne correspondent pas'
    setErrors(next)
    if (Object.keys(next).length) return

    setFormError('')
    dispatch(authStart())

    try {
      const data = await registerFn({
        matricule: verifiedProfile.matricule,
        mot_de_passe: motDePasse,
      })
      handleAuthResponse(data)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Inscription impossible'
      setFormError(message)
      dispatch(authFailure(message))
    }
  }

  return (
    <ContentCard className="mx-auto max-w-md">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
          {mode === 'login' ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-ink-900">Espace {roleLabel}</h2>
          <p className="text-sm text-ink-500">{accentDescription}</p>
        </div>
      </div>

      <div className="mb-6 flex rounded-xl border border-white/10 bg-warm-50 p-1">
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            mode === 'login' ? 'bg-brand-500/25 text-brand-300' : 'text-ink-500 hover:text-ink-700',
          )}
        >
          Se connecter
        </button>
        <button
          type="button"
          onClick={() => switchMode('register')}
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            mode === 'register' ? 'bg-brand-500/25 text-brand-300' : 'text-ink-500 hover:text-ink-700',
          )}
        >
          Créer un compte
        </button>
      </div>

      {(formError || authError) && (
        <div className="mb-4 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
          {formError || authError}
        </div>
      )}

      {mode === 'login' ? (
        <form onSubmit={onLoginSubmit} className="space-y-4" noValidate>
          <Input
            label="Matricule"
            name="matricule"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            error={errors.matricule}
            placeholder="ETU-2026-0001"
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
      ) : registerStep === 1 ? (
        <form onSubmit={onVerifyMatricule} className="space-y-4" noValidate>
          <p className="text-sm text-ink-500">
            Saisissez le matricule fourni par l&apos;administration pour activer votre compte.
          </p>
          <Input
            label="Matricule"
            name="matricule"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            error={errors.matricule}
            placeholder="ETU-2026-0001"
          />
          <Button type="submit" variant="gold" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? 'Vérification…' : 'Vérifier mon matricule'}
          </Button>
        </form>
      ) : (
        <form onSubmit={onRegisterSubmit} className="space-y-4" noValidate>
          <div className="flex items-center gap-2 rounded-xl border border-success-500/30 bg-success-500/10 px-4 py-3 text-sm text-success-500">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              {verifiedProfile.prenom} {verifiedProfile.nom} — {verifiedProfile.matricule}
            </span>
          </div>
          <p className="text-sm text-ink-500">
            Choisissez un mot de passe pour activer votre compte. Vous vous connecterez ensuite
            avec votre matricule et ce mot de passe.
          </p>
          <Input
            label="Mot de passe"
            name="mot_de_passe"
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            error={errors.motDePasse}
            placeholder="Minimum 8 caractères"
            autoComplete="new-password"
          />
          <Input
            label="Confirmer le mot de passe"
            name="confirm_password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              className="flex-1"
              onClick={() => {
                setRegisterStep(1)
                dispatch(authIdle())
              }}
            >
              Retour
            </Button>
            <Button type="submit" variant="gold" size="md" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Création…' : 'Créer mon compte'}
            </Button>
          </div>
        </form>
      )}

      <p className="mt-4 text-center text-xs text-ink-400">
        <Link to="/" className="text-brand-300 hover:underline">
          Retour à l&apos;accueil
        </Link>
      </p>
    </ContentCard>
  )
}
