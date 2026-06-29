import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Shield } from 'lucide-react'
import { motion } from 'motion/react'
import { Badge } from '../components/ui/Badge'
import { ButtonLink } from '../components/ui/Button'
import { ContentCard } from '../components/ui/ContentCard'
import { FILIERES, HOME, INSTITUTE } from '../content/isesod'

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl space-y-6"
        >
          <Badge tone="gold" className="mx-auto">
            {INSTITUTE.motto}
          </Badge>
          <h1 className="font-display text-4xl font-bold leading-tight text-ink-900 sm:text-5xl lg:text-6xl">
            {INSTITUTE.fullName}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-ink-500">{HOME.heroSubtitle}</p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <ButtonLink to="/connexion/etudiant" variant="gold" size="lg" className="w-full sm:w-auto">
              Connexion étudiant
            </ButtonLink>
            <ButtonLink to="/connexion/enseignant" variant="outline" size="lg" className="w-full sm:w-auto">
              Connexion enseignant
            </ButtonLink>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-ink-400">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{INSTITUTE.address}</span>
          </div>
        </motion.div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {HOME.highlights.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.4 }}
          >
            <ContentCard title={item.title}>
              <p>{item.description}</p>
            </ContentCard>
          </motion.div>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-warm-100 p-8 shadow-soft">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <h2 className="font-display text-2xl font-semibold text-ink-900">Filières organisées</h2>
            <p className="text-ink-500">
              Licence (3 ans) et Master (2 ans) — système LMD
            </p>
            <div className="flex flex-wrap gap-2">
              {FILIERES.licence.items.slice(0, 4).map((f) => (
                <Badge key={f.sigle} tone="brand">
                  {f.sigle}
                </Badge>
              ))}
              <Badge tone="muted">+{FILIERES.licence.items.length - 4 + FILIERES.master.items.length}</Badge>
            </div>
          </div>
          <ButtonLink to="/filieres" variant="secondary" size="lg" className="shrink-0">
            Voir toutes les filières
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-2xl border border-brand-500/20 bg-brand-500/10 p-8 text-center">
        <Shield className="h-10 w-10 text-brand-300" />
        <h2 className="font-display text-xl font-semibold text-ink-900">Institution agréée</h2>
        <p className="max-w-xl text-sm text-ink-500">
          Enseignement supérieur privé autorisé — agrément définitif{' '}
          <span className="font-mono text-brand-300">{INSTITUTE.agrement}</span>
        </p>
        <Link to="/statut-juridique" className="text-sm text-brand-300 hover:underline">
          En savoir plus sur le statut juridique
        </Link>
      </section>
    </div>
  )
}
