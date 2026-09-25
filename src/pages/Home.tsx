import { AlertTriangle, CircleDot, Clock3, FolderOpen } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { RecentActivity } from '../components/RecentActivity'
import { StatCard } from '../components/StatCard'
import type { PageId, SupportCase } from '../types/case'
import { getCaseStats } from '../utils/stats'

type HomeProps = {
  cases: SupportCase[]
  analyzedCount: number
  onOpenCase: (id: string) => void
  onNavigate: (page: PageId) => void
}

export function Home({ cases, analyzedCount, onOpenCase, onNavigate }: HomeProps) {
  const stats = getCaseStats(cases)
  const unanalyzed = Math.max(0, cases.length - analyzedCount)

  return (
    <div className="page">
        <PageHeader
          title="Inicio"
          subtitle="Centro de Atención"
        />
        <div className="quick-actions">
          <button type="button" className="button-secondary" onClick={() => onNavigate('casos')}>
            Ver casos
          </button>
          <button type="button" className="button-secondary" onClick={() => onNavigate('clientes')}>
            Ver clientes
          </button>
          <button type="button" className="button-secondary" onClick={() => onNavigate('pedidos')}>
            Ver pedidos
          </button>
        </div>

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
        <StatCard
          label="Sin analizar"
          value={unanalyzed}
          hint="Aún sin análisis de Gemini"
          icon={<CircleDot size={18} />}
        />
      </section>

      <RecentActivity cases={cases} onOpenCase={onOpenCase} />
    </div>
  )
}
