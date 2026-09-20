import type { CaseStatus } from '../types/case'

type StatusBadgeProps = {
  status: CaseStatus
}

const statusClass: Record<CaseStatus, string> = {
  Pendiente: 'badge badge-pending',
  'En proceso': 'badge badge-progress',
  Resuelto: 'badge badge-resolved',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={statusClass[status]}>{status}</span>
}
