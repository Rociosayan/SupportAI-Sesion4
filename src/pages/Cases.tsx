import { useEffect, useMemo, useState } from 'react'
import { CaseDetail } from '../components/CaseDetail'
import { CaseFilters } from '../components/CaseFilters'
import { CaseList } from '../components/CaseList'
import { InboxPagination } from '../components/InboxPagination'
import { PageHeader } from '../components/PageHeader'
import { SearchBox } from '../components/SearchBox'
import type { ImportedAnalysis } from '../components/ResultComparison'
import type { GeminiKnowledge } from '../utils/geminiApi'
import type { CaseStatus, SupportCase } from '../types/case'
import type { SavedLlmAnalysis } from '../types/savedAnalysis'
import {
  filterCases,
  sortByDateDesc,
  type CategoryFilter,
  type PriorityFilter,
  type StatusFilter,
} from '../utils/filters'
import type { RagResult } from '../types/rag'

const PAGE_SIZE = 8

type CasesProps = {
  cases: SupportCase[]
  selectedId: string | null
  onSelect: (id: string) => void
  onStatusChange: (id: string, status: CaseStatus) => void
  onSaveAnalysis: (record: Omit<SavedLlmAnalysis, 'id' | 'savedAt'>) => void
  geminiById: Record<string, ImportedAnalysis>
  geminiKnowledgeById: Record<string, GeminiKnowledge>
  geminiErrorById: Record<string, string>
  geminiAnalyzingId: string | null
  ragById: Record<string, RagResult>
  ragErrorById: Record<string, string>
  ragAnalyzingId: string | null
  onAnalyzeGemini: (caseItem: SupportCase) => void
  onAnalyzeRag: (caseItem: SupportCase) => void
}

export function Cases({
  cases,
  selectedId,
  onSelect,
  onStatusChange,
  geminiById,
  geminiKnowledgeById,
  geminiErrorById,
  geminiAnalyzingId,
  ragById,
  ragErrorById,
  ragAnalyzingId,
  onAnalyzeGemini,
  onAnalyzeRag,
  onSaveAnalysis,
}: CasesProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('Todos')
  const [priority, setPriority] = useState<PriorityFilter>('Todas')
  const [category, setCategory] = useState<CategoryFilter>('Todas')
  const [page, setPage] = useState(1)

  const visibleCases = useMemo(
    () => sortByDateDesc(filterCases(cases, query, status, priority, category)),
    [cases, query, status, priority, category],
  )

  const totalPages = Math.max(1, Math.ceil(visibleCases.length / PAGE_SIZE))
  const pagedCases = visibleCases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const unreadCount = cases.filter((item) => item.unread).length
  const selectedCase = cases.find((item) => item.id === selectedId) ?? null

  useEffect(() => {
    setPage(1)
  }, [query, status, priority, category])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  return (
    <div className="page page-wide">
      <PageHeader
        title="Casos"
        subtitle="Gestiona y analiza las solicitudes de los clientes."
      />
      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} />
        <CaseFilters
          status={status}
          priority={priority}
          category={category}
          onStatusChange={setStatus}
          onPriorityChange={setPriority}
          onCategoryChange={setCategory}
        />
      </div>
      <p className="result-count">
        {visibleCases.length} casos · {unreadCount} no leídos
      </p>
      <div className="split-view">
        <div className="inbox-pane">
          <CaseList
            cases={pagedCases}
            selectedId={selectedId}
            onSelect={onSelect}
            analysisLabel={(id) => {
              if (geminiAnalyzingId === id) {
                return 'Analizando'
              }
              if (geminiById[id]) {
                return 'Respuesta disponible'
              }
              return 'Sin analizar'
            }}
          />
          <InboxPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
        <CaseDetail
          key={selectedCase?.id ?? 'empty'}
          supportCase={selectedCase}
          onStatusChange={onStatusChange}
          gemini={selectedCase ? geminiById[selectedCase.id] ?? null : null}
          geminiKnowledge={selectedCase ? geminiKnowledgeById[selectedCase.id] ?? null : null}
          geminiError={selectedCase ? geminiErrorById[selectedCase.id] ?? null : null}
          geminiAnalyzing={Boolean(selectedCase && geminiAnalyzingId === selectedCase.id)}
          rag={selectedCase ? ragById[selectedCase.id] ?? null : null}
          ragError={selectedCase ? ragErrorById[selectedCase.id] ?? null : null}
          ragAnalyzing={Boolean(selectedCase && ragAnalyzingId === selectedCase.id)}
          onAnalyzeGemini={() => {
            if (selectedCase) {
              onAnalyzeGemini(selectedCase)
            }
          }}
          onAnalyzeRag={() => {
            if (selectedCase) {
              onAnalyzeRag(selectedCase)
            }
          }}
          onSaveAnalysis={onSaveAnalysis}
        />
      </div>
    </div>
  )
}
