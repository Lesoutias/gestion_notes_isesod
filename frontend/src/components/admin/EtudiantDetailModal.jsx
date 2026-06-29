import { Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Modal } from '../ui/Modal'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-ink-400">{label}</dt>
      <dd className="text-sm font-medium text-ink-700 sm:text-right">{value || '—'}</dd>
    </div>
  )
}

function AccountBadge({ userId }) {
  return userId ? (
    <Badge tone="success">Compte créé</Badge>
  ) : (
    <Badge tone="gold">Compte non créé</Badge>
  )
}

export function EtudiantDetailModal({ etudiant, filiere, promotion, annee, onClose }) {
  if (!etudiant) return null

  const fullName = `${etudiant.prenom} ${etudiant.nom} ${etudiant.postnom}`.trim()

  return (
    <Modal open={Boolean(etudiant)} onClose={onClose} title="Détails de l'étudiant" size="lg">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-xl font-semibold text-ink-900">{fullName}</p>
            <p className="mt-1 font-mono text-sm text-brand-300">{etudiant.matricule || '—'}</p>
          </div>
          <AccountBadge userId={etudiant.user_id} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <section className="space-y-3 rounded-xl border border-white/10 bg-warm-50/50 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-400">
              Informations personnelles
            </h3>
            <dl className="space-y-2">
              <DetailRow label="Sexe" value={etudiant.sexe === 'M' ? 'Masculin' : 'Féminin'} />
              <DetailRow label="Email" value={etudiant.email} />
              <DetailRow label="Téléphone" value={etudiant.telephone} />
            </dl>
          </section>

          <section className="space-y-3 rounded-xl border border-white/10 bg-warm-50/50 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-400">
              Informations académiques
            </h3>
            <dl className="space-y-2">
              <DetailRow label="Filière" value={filiere ? `${filiere.sigle} — ${filiere.nom}` : '—'} />
              <DetailRow label="Promotion" value={promotion?.nom} />
              <DetailRow label="Année académique" value={annee?.libelle} />
              <DetailRow label="Statut académique" value={etudiant.statut} />
            </dl>
          </section>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-brand-500/20 bg-brand-500/10 p-4 text-sm text-ink-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
          <p>
            Ce matricule permettra à l&apos;étudiant de créer son compte utilisateur sur l&apos;espace
            de connexion étudiant. L&apos;administrateur ne crée pas le compte ici.
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
          <Link
            to={`/admin/etudiants/${etudiant.id}/modifier`}
            className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-400"
            onClick={onClose}
          >
            Modifier
          </Link>
        </div>
      </div>
    </Modal>
  )
}
