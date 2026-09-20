import type { CasePriority } from '../types/case'

type PriorityBadgeProps = {
  priority: CasePriority
}

const priorityClass: Record<CasePriority, string> = {
  Alta: 'badge badge-high',
  Media: 'badge badge-medium',
  Baja: 'badge badge-low',
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return <span className={priorityClass[priority]}>{priority}</span>
}
