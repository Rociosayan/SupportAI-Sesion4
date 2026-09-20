import type { SupportCase } from '../types/case'

export function getCaseStats(cases: SupportCase[]) {
  const pending = cases.filter((item) => item.status === 'Pendiente').length
  const inProgress = cases.filter((item) => item.status === 'En proceso').length
  const resolved = cases.filter((item) => item.status === 'Resuelto').length
  const urgent = cases.filter(
    (item) => item.priority === 'Alta' && item.status !== 'Resuelto',
  ).length

  return {
    total: cases.length,
    pending,
    inProgress,
    resolved,
    urgent,
    open: pending + inProgress,
  }
}
