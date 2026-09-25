import { useState } from 'react'
import { CaseDetail } from '../components/CaseDetail'
import { CaseList } from '../components/CaseList'
import type { ImportedAnalysis } from '../components/ResultComparison'
import type { GeminiKnowledge } from '../utils/geminiApi'
import { PageHeader } from '../components/PageHeader'
import { SavedLlmDetail } from '../components/SavedLlmDetail'
import type { CaseStatus, SupportCase } from '../types/case'
import type { SavedLlmAnalysis } from '../types/savedAnalysis'
import type { RagResult } from '../types/rag'
import { formatDateTime } from '../utils/format'
import { sortByDateDesc } from '../utils/filters'

type HistoryProps = {
  cases: SupportCase[]
  selectedId: string | null
  onSelect: (id: string) => void
  onStatusChange: (id: string, status: CaseStatus) => void
  savedAnalyses: SavedLlmAnalysis[]
  geminiById: Record<string, ImportedAnalysis>
  geminiKnowledgeById: Record<string, GeminiKnowledge>
  geminiErrorById: Record<string, string>
  geminiAnalyzingId: string | null
  ragById: Record<string, RagResult>
  ragErrorById: Record<string, string>
  ragAnalyzingId: string | null
  onAnalyzeGemini: (caseItem: SupportCase) => void
  onAnalyzeRag: (caseItem: SupportCase) => void
  onSaveAnalysis: (record: Omit<SavedLlmAnalysis, 'id' | 'savedAt'>) => void
}

export function History({
  cases,
  selectedId,
  onSelect,
  onStatusChange,
  savedAnalyses,
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
}: HistoryProps) {
  const resolved = sortByDateDesc(cases.filter((item) => item.status === 'Resuelto'))
  const selectedCase = resolved.find((item) => item.id === selectedId) ?? null
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null)
  const selectedSaved = savedAnalyses.find((item) => item.id === selectedSavedId) ?? null

  return (
    <div className="page page-wide">
      <PageHeader
        title="Historial"
        subtitle="Análisis guardados en esta sesión y casos ya resueltos."
      />

      <h2>Análisis guardados</h2>
      <p className="result-count">{savedAnalyses.length} registros</p>
      {savedAnalyses.length === 0 ? (
        <p className="empty-state">Todavía no hay análisis guardados.</p>
      ) : (
        <div className="split-view">
          <ul className="case-list">
            {savedAnalyses.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`case-item${selectedSavedId === item.id ? ' is-selected' : ''}`}
                  onClick={() => setSelectedSavedId(item.id)}
                >
                  <p className="badge badge-unanalyzed">
                    {item.source === 'gemini'
                      ? 'ANÁLISIS GENERADO CON GEMINI API'
                      : 'ANÁLISIS IMPORTADO DESDE LLM'}
                  </p>
                  <strong>{item.customerName}</strong>
                  <p className="case-subject">{item.subject}</p>
                  <time dateTime={item.savedAt}>{formatDateTime(item.savedAt)}</time>
                </button>
              </li>
            ))}
          </ul>
          <SavedLlmDetail record={selectedSaved} />
        </div>
      )}

      <h2>Casos resueltos</h2>
      <p className="result-count">{resolved.length} casos resueltos</p>
      <div className="split-view">
        <CaseList cases={resolved} selectedId={selectedId} onSelect={onSelect} />
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
