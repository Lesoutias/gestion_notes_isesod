import { useEffect, useState } from 'react'
import { Eye, Download } from 'lucide-react'
import { EtudiantHeader } from '../../components/etudiant/EtudiantHeader'
import { ReleveCotesModal } from '../../components/admin/ReleveCotesModal'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ContentCard } from '../../components/ui/ContentCard'
import { ApiError } from '../../services/api'
import {
  formatNomComplet,
  getEtudiantDashboard,
  getMesRelevesCotes,
  getMonReleveCotes,
  downloadMonReleveCotesPdf,
  downloadMonBulletinPdf,
  promotionLabel,
} from '../../services/etudiantService'
import { useSelector } from 'react-redux'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function EtudiantRelevesPage() {
  const etudiant = useSelector((state) => state.auth.etudiant)
  const [contextLabel, setContextLabel] = useState('')
  const [anneeLabel, setAnneeLabel] = useState('')
  const [releves, setReleves] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [releveDetail, setReleveDetail] = useState(null)
  const [loadingReleveId, setLoadingReleveId] = useState(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  useEffect(() => {
    Promise.all([getMesRelevesCotes(), getEtudiantDashboard()])
      .then(([relevesData, dashboard]) => {
        setReleves(relevesData)
        setContextLabel(promotionLabel(dashboard.filiere, dashboard.promotion))
        setAnneeLabel(dashboard.annee_academique?.libelle ?? '')
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Chargement impossible')
      })
      .finally(() => setLoading(false))
  }, [])

  async function openReleve(releveId) {
    setLoadingReleveId(releveId)
    setError('')
    try {
      const detail = await getMonReleveCotes(releveId)
      setReleveDetail(detail)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chargement du relevé impossible')
    } finally {
      setLoadingReleveId(null)
    }
  }

  async function handleDownloadRelevePdf(releveId) {
    setDownloadingPdf(true)
    setError('')
    try {
      await downloadMonReleveCotesPdf(releveId)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Téléchargement du PDF impossible')
    } finally {
      setDownloadingPdf(false)
    }
  }

  async function handleDownloadBulletinPdf(releveId) {
    setDownloadingPdf(true)
    setError('')
    try {
      await downloadMonBulletinPdf(releveId)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Téléchargement du bulletin impossible')
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <>
      <EtudiantHeader
        title="Relevés de cotes"
        subtitle="Relevés officiels proclamés par l'administration"
      />

      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        )}

        <ContentCard>
          <p className="text-sm text-ink-500">
            <span className="font-medium text-ink-700">{formatNomComplet(etudiant)}</span>
            {contextLabel && (
              <>
                {' '}
                — {contextLabel}
                {anneeLabel ? ` (${anneeLabel})` : ''}
              </>
            )}
          </p>
        </ContentCard>

        <ContentCard title="Mes relevés">
          {loading ? (
            <p className="text-sm text-ink-400">Chargement…</p>
          ) : releves.length === 0 ? (
            <div className="space-y-2 text-sm text-ink-500">
              <p>Aucun relevé de cotes disponible pour le moment.</p>
              <p className="text-ink-400">
                Votre relevé apparaîtra ici une fois que l&apos;administration aura validé la fiche
                synthétique et proclamé les résultats.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-warm-200/50 text-xs uppercase tracking-wider text-ink-400">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Rang</th>
                    <th className="px-3 py-2">Points</th>
                    <th className="px-3 py-2">%</th>
                    <th className="px-3 py-2">Mention</th>
                    <th className="px-3 py-2">Décision</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {releves.map((releve) => (
                    <tr key={releve.id} className="border-b border-white/5 text-ink-500">
                      <td className="px-3 py-2">{formatDate(releve.date_generation)}</td>
                      <td className="px-3 py-2 font-medium text-ink-700">{releve.rang}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {releve.total_points_obtenus} / {releve.total_points_max}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{releve.pourcentage} %</td>
                      <td className="px-3 py-2">{releve.mention}</td>
                      <td className="px-3 py-2">
                        <Badge tone={releve.decision === 'Admis' ? 'success' : 'gold'}>
                          {releve.decision}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openReleve(releve.id)}
                            disabled={loadingReleveId === releve.id}
                          >
                            <Eye className="h-4 w-4" />
                            {loadingReleveId === releve.id ? '…' : 'Voir'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="Télécharger PDF"
                            onClick={() => handleDownloadRelevePdf(releve.id)}
                            disabled={downloadingPdf}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ContentCard>
      </div>

      <ReleveCotesModal
        releve={releveDetail}
        promotionLabel={contextLabel}
        anneeLabel={anneeLabel}
        onClose={() => setReleveDetail(null)}
        onDownloadRelevePdf={handleDownloadRelevePdf}
        onDownloadBulletinPdf={handleDownloadBulletinPdf}
        downloadingPdf={downloadingPdf}
      />
    </>
  )
}
