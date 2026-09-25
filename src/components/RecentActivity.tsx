import type { SupportCase } from '../types/case'
import { formatDate } from '../utils/format'
import { sortByDateDesc } from '../utils/filters'
import { PriorityBadge } from './PriorityBadge'
import { StatusBadge } from './StatusBadge'

type RecentActivityProps = {
  cases: SupportCase[]
  onOpenCase: (id: string) => void
}

export function RecentActivity({ cases, onOpenCase }: RecentActivityProps) {
  const recent = sortByDateDesc(cases).slice(0, 8)

  return (
    <section className="panel activity-panel">
      <header>
        <h2>Actividad reciente</h2>
        <p>Casos reales de la bandeja, del más reciente al más antiguo.</p>
      </header>
      <ul className="activity-list">
        {recent.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => onOpenCase(item.id)}>
              <div>
                <strong>{item.customerName}</strong>
                <p>{item.subject}</p>
              </div>
              <div className="activity-meta">
                <time dateTime={item.date}>{formatDate(item.date)}</time>
                <StatusBadge status={item.status} />
                <PriorityBadge priority={item.priority} />
                <span className="badge">Ver caso</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
