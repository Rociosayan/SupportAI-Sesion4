import type { SupportCase } from '../types/case'
import { formatDateTime } from '../utils/format'
import { PriorityBadge } from './PriorityBadge'
import { StatusBadge } from './StatusBadge'

type CaseListProps = {
  cases: SupportCase[]
  selectedId: string | null
  onSelect: (id: string) => void
  analysisLabel?: (id: string) => string
}

export function CaseList({ cases, selectedId, onSelect, analysisLabel }: CaseListProps) {
  if (cases.length === 0) {
    return <p className="empty-state">No hay casos que coincidan con la búsqueda o los filtros.</p>
  }

  return (
    <ul className="case-list">
      {cases.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className={`case-item${selectedId === item.id ? ' is-selected' : ''}${item.unread ? ' is-unread' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <div className="case-item-top">
              <span className="case-name">
                <span className={item.unread ? 'unread-dot' : 'read-dot'} aria-hidden="true" />
                <strong>{item.customerName}</strong>
              </span>
              <time dateTime={item.date}>{formatDateTime(item.date)}</time>
            </div>
            <p className="case-subject">{item.subject}</p>
            <p className="case-meta">
              {item.id} · {item.orderNumber} · {item.channel} · {item.category}
            </p>
            <p className="case-preview">{item.message}</p>
            <div className="case-item-badges">
              <StatusBadge status={item.status} />
              <PriorityBadge priority={item.priority} />
              <span className="badge">{analysisLabel ? analysisLabel(item.id) : 'Sin analizar'}</span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
