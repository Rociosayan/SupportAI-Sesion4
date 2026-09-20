import { useEffect, useMemo, useState } from 'react'
import { CaseDetail } from '../components/CaseDetail'
import { CaseFilters } from '../components/CaseFilters'
import { CaseList } from '../components/CaseList'
import { InboxPagination } from '../components/InboxPagination'
import { PageHeader } from '../components/PageHeader'
import { SearchBox } from '../components/SearchBox'
import type { ImportedAnalysis } from '../components/ResultComparison'
import type { CaseStatus, SupportCase } from '../types/case'
import type { SavedLlmAnalysis } from '../types/savedAnalysis'
import {
  filterCases,
  sortByDateDesc,
  type CategoryFilter,
  type PriorityFilter,
  type StatusFilter,
} from '../utils/filters'
import type { HumanReview, RagResult } from '../types/rag'
import type { SimulatedAnalysis } from '../utils/simulateAnalysis'

const PAGE_SIZE = 8

type CasesProps = {
  cases: SupportCase[]
  selectedId: string | null
  onSelect: (id: string) => void
  onStatusChange: (id: string, status: CaseStatus) => void
  onSaveAnalysis: (record: Omit<SavedLlmAnalysis, 'id' | 'savedAt'>) => void
  simulatedById: Record<string, SimulatedAnalysis>
  importedById: Record<string, ImportedAnalysis>
  geminiById: Record<string, ImportedAnalysis>
  geminiErrorById: Record<string, string>
  analyzingId: string | null
  geminiAnalyzingId: string | null
  ragById: Record<string, RagResult>
  ragErrorById: Record<string, string>
  ragAnalyzingId: string | null
  ragReviewById: Record<string, HumanReview>
  onAnalyze: (caseItem: SupportCase) => void
  onAnalyzeGemini: (caseItem: SupportCase) => void
  onAnalyzeRag: (caseItem: SupportCase) => void
  onRagReview: (caseId: string, value: HumanReview) => void
  onApplyImported: (caseId: string, data: ImportedAnalysis) => void
}

export function Cases({
  cases,
  selectedId,
  onSelect,
  onStatusChange,
  simulatedById,
  importedById,
  geminiById,
  geminiErrorById,
  analyzingId,
  geminiAnalyzingId,
  ragById,
  ragErrorById,
  ragAnalyzingId,
  ragReviewById,
  onAnalyze,
  onAnalyzeGemini,
  onAnalyzeRag,
  onRagReview,
  onApplyImported,
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
        subtitle="Bandeja operativa de atención al cliente. Los 30 casos son datos locales del laboratorio."
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
        {visibleCases.length} casos · {unreadCount} no leídos · todos SIN ANALIZAR
      </p>
      <div className="split-view">
        <div className="inbox-pane">
          <CaseList cases={pagedCases} selectedId={selectedId} onSelect={onSelect} />
          <InboxPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
        <CaseDetail
          key={selectedCase?.id ?? 'empty'}
          supportCase={selectedCase}
          onStatusChange={onStatusChange}
          simulated={selectedCase ? simulatedById[selectedCase.id] ?? null : null}
          imported={selectedCase ? importedById[selectedCase.id] ?? null : null}
          gemini={selectedCase ? geminiById[selectedCase.id] ?? null : null}
          geminiError={selectedCase ? geminiErrorById[selectedCase.id] ?? null : null}
          analyzing={Boolean(selectedCase && analyzingId === selectedCase.id)}
          geminiAnalyzing={Boolean(selectedCase && geminiAnalyzingId === selectedCase.id)}
          rag={selectedCase ? ragById[selectedCase.id] ?? null : null}
          ragError={selectedCase ? ragErrorById[selectedCase.id] ?? null : null}
          ragAnalyzing={Boolean(selectedCase && ragAnalyzingId === selectedCase.id)}
          ragReview={selectedCase ? ragReviewById[selectedCase.id] ?? null : null}
          onAnalyze={() => {
            if (selectedCase) {
              onAnalyze(selectedCase)
            }
          }}
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
          onRagReview={(value) => {
            if (selectedCase) {
              onRagReview(selectedCase.id, value)
            }
          }}
          onApplyImported={(data) => {
            if (selectedCase) {
              onApplyImported(selectedCase.id, data)
            }
          }}
          onSaveAnalysis={onSaveAnalysis}
        />
      </div>
    </div>
  )
}
