import { CASE_CATEGORIES } from '../types/case'
import type { CategoryFilter, PriorityFilter, StatusFilter } from '../utils/filters'

type CaseFiltersProps = {
  status: StatusFilter
  priority: PriorityFilter
  category: CategoryFilter
  onStatusChange: (value: StatusFilter) => void
  onPriorityChange: (value: PriorityFilter) => void
  onCategoryChange: (value: CategoryFilter) => void
}

export function CaseFilters({
  status,
  priority,
  category,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
}: CaseFiltersProps) {
  return (
    <div className="filters">
      <label>
        Estado
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
        >
          <option value="Todos">Todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En proceso">En proceso</option>
          <option value="Resuelto">Resuelto</option>
        </select>
      </label>
      <label>
        Prioridad
        <select
          value={priority}
          onChange={(event) => onPriorityChange(event.target.value as PriorityFilter)}
        >
          <option value="Todas">Todas</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
        </select>
      </label>
      <label>
        Categoría
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value as CategoryFilter)}
        >
          <option value="Todas">Todas</option>
          {CASE_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
