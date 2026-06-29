import { useEffect, useMemo, useState } from 'react'
import { Eye, FileText, Megaphone, Download } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { ReleveCotesModal } from '../../components/admin/ReleveCotesModal'
import { SuccessBanner, selectClassName } from '../../components/admin/adminUi.js'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ContentCard } from '../../components/ui/ContentCard'
import { ApiError } from '../../services/api'
import {
  formatNomComplet,
  getActiveAnneeAcademique,
  getAnneesAcademiques,
  getFilieres,
  getPromotions,
  getReleveCotesById,
  getRelevesCotes,
  proclamerRelevesCotes,
  promotionLabel,
  downloadReleveCotesPdf,
  downloadBulletinPdf,
  downloadAllRelevesCotesPdf,
  STATUT_RELEVE_LABELS,
} from '../../services/adminService'

export default function RelevesCotesPage() {
  const [filieres, setFilieres] = useState([])
  const [promotions, setPromotions] = useState([])
  const [annees, setAnnees] = useState([])
  const [filiereId, setFiliereId] = useState('')
  const [promotionId, setPromotionId] = useState('')
  const [anneeId, setAnneeId] = useState('')
  const [releves, setReleves] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingReleves, setLoadingReleves] = useState(false)
  const [proclaiming, setProclaiming] = useState(false)
  const [releveDetail, setReleveDetail] = useState(null)
  const [loadingReleveId, setLoadingReleveId] = useState(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingAllPdf, setDownloadingAllPdf] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const filiereById = useMemo(
    () => Object.fromEntries(filieres.map((f) => [f.id, f])),
    [filieres],
  )

  const promotionsFiltrees = useMemo(() => {
    if (!filiereId) return []
    return promotions
      .filter((p) => String(p.filiere_id) === filiereId)
      .sort((a, b) => a.niveau - b.niveau || a.nom.localeCompare(b.nom, 'fr'))
  }, [promotions, filiereId])

  const promotionSelectionnee = promotions.find((p) => String(p.id) === promotionId)
  const filiereSelectionnee = filiereById[Number(filiereId)]
  const anneeLabel = annees.find((a) => String(a.id) === anneeId)?.libelle
  const contextLabel = promotionLabel(promotionSelectionnee, filiereSelectionnee)

  const relevesEnAttente = useMemo(
    () => releves.filter((releve) => releve.statut === 'genere').length,
    [releves],
  )
  const tousProclames = releves.length > 0 && releves.every((releve) => releve.statut === 'publie')
  const peutProclamer = relevesEnAttente > 0

  async function loadReleves() {
    if (!promotionId || !anneeId) {
      setReleves([])
      return
    }

    setLoadingReleves(true)
    setError('')
    try {
      const data = await getRelevesCotes({
        promotion_id: promotionId,
        annee_academique_id: anneeId,
      })
      setReleves(data)
    } catch (err) {
      setReleves([])
      if (!(err instanceof ApiError && err.status === 401)) {
        setError(err instanceof ApiError ? err.message : 'Chargement des relevés impossible')
      }
    } finally {
      setLoadingReleves(false)
    }
  }

  useEffect(() => {
    Promise.all([getFilieres(), getPromotions(), getAnneesAcademiques(), getActiveAnneeAcademique()])
      .then(([filieresData, promos, anneesData, activeAnnee]) => {
        setFilieres(filieresData)
        setPromotions(promos)
        setAnnees(anneesData)
        if (activeAnnee?.id) setAnneeId(String(activeAnnee.id))
        else if (anneesData.length) setAnneeId(String(anneesData[0].id))
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Chargement impossible')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadReleves()
  }, [promotionId, anneeId])

  async function openReleve(releveId) {
    setLoadingReleveId(releveId)
    setError('')
    try {
      const detail = await getReleveCotesById(releveId)
      setReleveDetail(detail)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chargement du relevé impossible')
    } finally {
      setLoadingReleveId(null)
    }
  }

  async function handleProclamer() {
    if (!promotionId || !anneeId || !peutProclamer) return

    const confirmed = window.confirm(
      `Proclamer les relevés de cotes pour ${contextLabel} — ${anneeLabel} ?\n\n` +
        `${relevesEnAttente} étudiant(s) recevront leur relevé dans leur espace personnel.`,
    )
    if (!confirmed) return

    setProclaiming(true)
    setError('')
    setSuccess('')
    try {
      const result = await proclamerRelevesCotes({
        promotion_id: Number(promotionId),
        annee_academique_id: Number(anneeId),
      })
      setSuccess(
        `${result.total_proclames} relevé${result.total_proclames > 1 ? 's' : ''} proclamé${result.total_proclames > 1 ? 's' : ''}. Les étudiants peuvent maintenant les consulter.`,
      )
      await loadReleves()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Proclamation impossible')
    } finally {
      setProclaiming(false)
    }
  }

  async function handleDownloadRelevePdf(releveId) {
    setDownloadingPdf(true)
    setError('')
    try {
      await downloadReleveCotesPdf(releveId)
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
      await downloadBulletinPdf(releveId)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Téléchargement du bulletin impossible')
    } finally {
      setDownloadingPdf(false)
    }
  }

  async function handleDownloadAllRelevesPdf() {
    if (!promotionId || !anneeId || releves.length === 0) return
    setDownloadingAllPdf(true)
    setError('')
    try {
      await downloadAllRelevesCotesPdf({
        promotion_id: Number(promotionId),
        annee_academique_id: Number(anneeId),
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Téléchargement du PDF groupé impossible')
    } finally {
      setDownloadingAllPdf(false)
    }
  }

  return (
    <>
      <AdminHeader
        title="Relevés de cotes"
        subtitle="Générez après validation de la fiche, puis proclamez pour rendre les relevés visibles aux étudiants"
      />
      <div className="space-y-4 p-6">
        <ContentCard title="Sélection">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="filiere_id" className="block text-sm font-medium text-ink-700">
                Filière
              </label>
              <select
                id="filiere_id"
                value={filiereId}
                onChange={(e) => {
                  setFiliereId(e.target.value)
                  setPromotionId('')
                }}
                disabled={loading}
                className={selectClassName}
              >
                <option value="">Sélectionner une filière…</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.sigle ? `${f.sigle} — ${f.nom}` : f.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="promotion_id" className="block text-sm font-medium text-ink-700">
                Promotion
              </label>
              <select
                id="promotion_id"
                value={promotionId}
                onChange={(e) => setPromotionId(e.target.value)}
                disabled={loading || !filiereId}
                className={selectClassName}
              >
                <option value="">
                  {filiereId ? 'Sélectionner une promotion…' : "Choisissez d'abord une filière"}
                </option>
                {promotionsFiltrees.map((p) => (
                  <option key={p.id} value={p.id}>
                    {promotionLabel(p, filiereSelectionnee)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="annee_id" className="block text-sm font-medium text-ink-700">
                Année académique
              </label>
              <select
                id="annee_id"
                value={anneeId}
                onChange={(e) => setAnneeId(e.target.value)}
                disabled={loading}
                className={selectClassName}
              >
                <option value="">Sélectionner…</option>
                {annees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.libelle}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </ContentCard>

        {success && <SuccessBanner message={success} onDismiss={() => setSuccess('')} />}

        {error && (
          <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        )}

        {promotionId && anneeId && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <FileText className="h-4 w-4 text-brand-300" />
              <span>
                {contextLabel} — {anneeLabel}
              </span>
              {!loadingReleves && (
                <span className="text-ink-400">
                  ({releves.length} relevé{releves.length > 1 ? 's' : ''})
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {releves.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={handleDownloadAllRelevesPdf}
                  disabled={downloadingAllPdf || loadingReleves}
                >
                  <Download className="h-4 w-4" />
                  {downloadingAllPdf ? 'Export…' : 'Télécharger tous les relevés (PDF)'}
                </Button>
              )}
              {peutProclamer && (
                <Button
                  type="button"
                  variant="gold"
                  size="md"
                  onClick={handleProclamer}
                  disabled={proclaiming || loadingReleves}
                >
                  <Megaphone className="h-4 w-4" />
                  {proclaiming ? 'Proclamation…' : 'Proclamer les relevés'}
                </Button>
              )}
              {tousProclames && (
                <Badge tone="success">Relevés proclamés — visibles par les étudiants</Badge>
              )}
            </div>
          </div>
        )}

        {peutProclamer && (
          <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm text-ink-600">
            {relevesEnAttente} relevé{relevesEnAttente > 1 ? 's' : ''} en attente de proclamation.
            Les étudiants ne les verront qu&apos;après avoir cliqué sur « Proclamer les relevés ».
          </div>
        )}

        <ContentCard title="Liste des relevés">
          {loadingReleves ? (
            <p className="text-sm text-ink-400">Chargement des relevés…</p>
          ) : !promotionId || !anneeId ? (
            <p className="text-sm text-ink-400">
              Sélectionnez une filière, une promotion et une année académique.
            </p>
          ) : releves.length === 0 ? (
            <p className="text-sm text-ink-400">
              Aucun relevé pour {contextLabel} en {anneeLabel}. Validez d&apos;abord la fiche
              synthétique correspondante.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-warm-200/50 text-xs uppercase tracking-wider text-ink-400">
                  <tr>
                    <th className="px-3 py-2">Rang</th>
                    <th className="px-3 py-2">Matricule</th>
                    <th className="px-3 py-2">Étudiant</th>
                    <th className="px-3 py-2">Points</th>
                    <th className="px-3 py-2">%</th>
                    <th className="px-3 py-2">Mention</th>
                    <th className="px-3 py-2">Décision</th>
                    <th className="px-3 py-2">Statut</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {releves.map((releve) => (
                    <tr key={releve.id} className="border-b border-white/5 text-ink-500">
                      <td className="px-3 py-2 font-medium text-ink-700">{releve.rang}</td>
                      <td className="px-3 py-2 font-mono text-xs text-brand-300">
                        {releve.etudiant?.matricule || '—'}
                      </td>
                      <td className="px-3 py-2">{formatNomComplet(releve.etudiant)}</td>
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
                      <td className="px-3 py-2">
                        <Badge tone={releve.statut === 'publie' ? 'success' : 'gold'}>
                          {STATUT_RELEVE_LABELS[releve.statut] || releve.statut}
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
