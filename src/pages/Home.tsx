import { AlertTriangle, CircleDot, Clock3, FolderOpen } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { RecentActivity } from '../components/RecentActivity'
import { StatCard } from '../components/StatCard'
import type { SupportCase } from '../types/case'
import { getCaseStats } from '../utils/stats'

type HomeProps = {
  cases: SupportCase[]
  onOpenCase: (id: string) => void
}

export function Home({ cases, onOpenCase }: HomeProps) {
  const stats = getCaseStats(cases)

  return (
    <div className="page">
      <PageHeader
        title="Inicio"
        subtitle="Centro de Atención"
      />

      <section className="stats-grid" aria-label="Indicadores de la bandeja">
        <StatCard
          label="Casos abiertos"
          value={stats.open}
          hint="Pendiente + En proceso"
          icon={<FolderOpen size={22} />}
          tone="warning"
        />
        <StatCard
          label="Casos urgentes"
          value={stats.urgent}
          hint="Prioridad alta y aún no resueltos"
          icon={<AlertTriangle size={22} />}
          tone="danger"
        />
        <StatCard
          label="Casos pendientes"
          value={stats.pending}
          hint="Estado Pendiente"
          icon={<Clock3 size={22} />}
        />
        <StatCard
          label="Casos en proceso"
          value={stats.inProgress}
          hint="Estado En proceso"
          icon={<CircleDot size={18} />}
        />
      </section>

      <RecentActivity cases={cases} onOpenCase={onOpenCase} />
    </div>
  )
}
