import { AlertTriangle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

export function DeleteEtudiantDialog({ etudiant, deleting, onConfirm, onCancel }) {
  if (!etudiant) return null

  const hasAccount = Boolean(etudiant.user_id)
  const fullName = `${etudiant.prenom} ${etudiant.nom} ${etudiant.postnom}`.trim()

  return (
    <Modal open={Boolean(etudiant)} onClose={onCancel} title="Confirmer la suppression" size="md">
      <div className="space-y-4">
        <p className="text-sm text-ink-500">
          Voulez-vous vraiment supprimer l&apos;étudiant{' '}
          <strong className="text-ink-700">{fullName}</strong>
          {etudiant.matricule ? (
            <>
              {' '}
              (<span className="font-mono text-brand-300">{etudiant.matricule}</span>)
            </>
          ) : null}{' '}
          ?
        </p>

        {hasAccount && (
          <div className="flex items-start gap-3 rounded-xl border border-danger-500/30 bg-danger-500/10 p-4 text-sm text-danger-500">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              <strong>Attention :</strong> cet étudiant possède déjà un compte utilisateur lié.
              Sa suppression peut échouer si des données académiques y sont associées, ou
              entraîner la perte de son accès au système.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={deleting}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={deleting}
            className="bg-danger-500 hover:bg-danger-600"
          >
            {deleting ? 'Suppression…' : 'Supprimer'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
