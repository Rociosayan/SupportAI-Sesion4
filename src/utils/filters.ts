import type { CaseCategory, CasePriority, CaseStatus, SupportCase } from '../types/case'

export type StatusFilter = CaseStatus | 'Todos'
export type PriorityFilter = CasePriority | 'Todas'
export type CategoryFilter = CaseCategory | 'Todas'

export function filterCases(
  cases: SupportCase[],
  query: string,
  status: StatusFilter,
  priority: PriorityFilter,
  category: CategoryFilter = 'Todas',
): SupportCase[] {
  const normalized = query.trim().toLowerCase()

  return cases.filter((item) => {
    const matchesQuery =
      normalized.length === 0 ||
      item.customerName.toLowerCase().includes(normalized) ||
      item.subject.toLowerCase().includes(normalized) ||
      item.message.toLowerCase().includes(normalized) ||
      item.orderNumber.toLowerCase().includes(normalized)

    const matchesStatus = status === 'Todos' || item.status === status
    const matchesPriority = priority === 'Todas' || item.priority === priority
    const matchesCategory = category === 'Todas' || item.category === category

    return matchesQuery && matchesStatus && matchesPriority && matchesCategory
  })
}

export function sortByDateDesc(cases: SupportCase[]): SupportCase[] {
  return [...cases].sort((a, b) => b.date.localeCompare(a.date))
}
