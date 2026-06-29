import { Modal } from '../ui/Modal'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Download, FileText } from 'lucide-react'
import { formatNomComplet } from '../../services/adminService'

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-ink-400">{label}</dt>
      <dd className="text-sm font-medium text-ink-700 sm:text-right">{value ?? '—'}</dd>
    </div>
  )
}

export function ReleveCotesModal({
  releve,
  promotionLabel,
  anneeLabel,
  onClose,
  onDownloadRelevePdf,
  onDownloadBulletinPdf,
  downloadingPdf = false,
}) {
  if (!releve) return null

  const etu = releve.etudiant
  const lignes = releve.lignes ?? []

  return (
    <Modal open={Boolean(releve)} onClose={onClose} title="Relevé de cotes" size="lg">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl font-semibold text-ink-900">
              {formatNomComplet(etu)}
            </p>
            <p className="mt-1 font-mono text-sm text-brand-300">{etu?.matricule || '—'}</p>
            <p className="mt-1 text-sm text-ink-500">
              {promotionLabel} — {anneeLabel}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">Rang {releve.rang}</Badge>
            <Badge tone={releve.decision === 'Admis' ? 'success' : 'gold'}>{releve.decision}</Badge>
          </div>
        </div>

        <section className="grid gap-3 rounded-xl border border-white/10 bg-warm-50/50 p-4 sm:grid-cols-2">
          <DetailRow label="Points obtenus" value={`${releve.total_points_obtenus} / ${releve.total_points_max}`} />
          <DetailRow label="Pourcentage" value={`${releve.pourcentage} %`} />
          <DetailRow label="Crédits" value={releve.total_credits} />
          <DetailRow label="Mention" value={releve.mention} />
        </section>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-warm-200/50 text-xs uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-3 py-2">Cours</th>
                <th className="px-3 py-2">Cr.</th>
                <th className="px-3 py-2">/20</th>
                <th className="px-3 py-2">Pts pond.</th>
                <th className="px-3 py-2">Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne) => (
                <tr key={ligne.id} className="border-b border-white/5 text-ink-500">
                  <td className="px-3 py-2">{ligne.intitule_cours}</td>
                  <td className="px-3 py-2">{ligne.credits}</td>
                  <td className="px-3 py-2">{ligne.cote_sur_20}</td>
                  <td className="px-3 py-2">{ligne.points_ponderes}</td>
                  <td className="px-3 py-2">{ligne.appreciation || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(onDownloadRelevePdf || onDownloadBulletinPdf) && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4">
            {onDownloadRelevePdf && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={downloadingPdf}
                onClick={() => onDownloadRelevePdf(releve.id)}
              >
                <Download className="h-4 w-4" />
                {downloadingPdf ? 'Téléchargement…' : 'PDF relevé'}
              </Button>
            )}
            {onDownloadBulletinPdf && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={downloadingPdf}
                onClick={() => onDownloadBulletinPdf(releve.id)}
              >
                <FileText className="h-4 w-4" />
                PDF bulletin
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
