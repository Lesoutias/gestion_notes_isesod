import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const COLORS = {
  brand: '#6378e5',
  gold: '#d69e2e',
  success: '#22c55e',
  muted: '#64748b',
  grid: 'rgba(255,255,255,0.08)',
  axis: '#94a3b8',
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-white/10 bg-warm-200 px-3 py-2 text-sm shadow-soft">
      {label && <p className="mb-1 font-medium text-ink-700">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="text-ink-500">
          {entry.name} : <span className="font-mono font-medium text-ink-900">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

function ChartCard({ title, subtitle, children, empty, emptyMessage }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-warm-100">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
      </div>
      <div className="p-4 sm:p-5">
        {empty ? (
          <div className="flex h-64 items-center justify-center text-sm text-ink-400">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}

function ChartSkeleton() {
  return (
    <div className="flex h-64 animate-pulse items-end gap-3 px-4 pb-4">
      {[40, 65, 50, 80, 55, 70].map((h, i) => (
        <div key={i} className="flex-1 rounded-t-lg bg-warm-200" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

export function DashboardCharts({ charts, loading }) {
  if (loading) {
    return (
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Chargement…">
          <ChartSkeleton />
        </ChartCard>
        <ChartCard title="Chargement…">
          <ChartSkeleton />
        </ChartCard>
        <ChartCard title="Chargement…">
          <ChartSkeleton />
        </ChartCard>
      </div>
    )
  }

  const {
    accountActivation = [],
    etudiantsParPromotion = [],
    effectifs = [],
  } = charts ?? {}

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ChartCard
        title="Activation des comptes"
        subtitle="Comparaison étudiants / enseignants"
        empty={!accountActivation.some((d) => d.avecCompte + d.sansCompte > 0)}
        emptyMessage="Aucune donnée disponible"
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={accountActivation} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
            <XAxis dataKey="role" tick={{ fill: COLORS.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: COLORS.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend wrapperStyle={{ fontSize: 12, color: COLORS.axis }} />
            <Bar dataKey="avecCompte" name="Compte créé" fill={COLORS.success} radius={[6, 6, 0, 0]} maxBarSize={48} />
            <Bar dataKey="sansCompte" name="Compte non créé" fill={COLORS.gold} radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Effectifs globaux"
        subtitle="Population académique enregistrée"
        empty={effectifs.every((d) => d.total === 0)}
        emptyMessage="Aucun enregistrement"
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={effectifs} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: COLORS.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: COLORS.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="total" name="Total" fill={COLORS.brand} radius={[6, 6, 0, 0]} maxBarSize={72} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="xl:col-span-2">
        <ChartCard
          title="Étudiants par promotion"
          subtitle="Répartition des inscriptions (top 8)"
          empty={etudiantsParPromotion.length === 0}
          emptyMessage="Aucun étudiant enregistré"
        >
          <ResponsiveContainer width="100%" height={Math.max(240, etudiantsParPromotion.length * 44)}>
            <BarChart
              data={etudiantsParPromotion}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: COLORS.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="promotion"
                width={72}
                tick={{ fill: COLORS.axis, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="total" name="Étudiants" fill={COLORS.brand} radius={[0, 6, 6, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
