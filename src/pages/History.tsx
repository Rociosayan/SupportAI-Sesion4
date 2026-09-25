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
import type { SimulatedAnalysis } from '../utils/simulateAnalysis'
import { formatDateTime } from '../utils/format'
import { sortByDateDesc } from '../utils/filters'

type HistoryProps = {
  cases: SupportCase[]
  selectedId: string | null
  onSelect: (id: string) => void
  onStatusChange: (id: string, status: CaseStatus) => void
  savedAnalyses: SavedLlmAnalysis[]
  simulatedById: Record<string, SimulatedAnalysis>
  importedById: Record<string, ImportedAnalysis>
  geminiById: Record<string, ImportedAnalysis>
  geminiKnowledgeById: Record<string, GeminiKnowledge>
  geminiErrorById: Record<string, string>
  analyzingId: string | null
  geminiAnalyzingId: string | null
  ragById: Record<string, RagResult>
  ragErrorById: Record<string, string>
  ragAnalyzingId: string | null
  onAnalyze: (caseItem: SupportCase) => void
  onAnalyzeGemini: (caseItem: SupportCase) => void
  onAnalyzeRag: (caseItem: SupportCase) => void
  onApplyImported: (caseId: string, data: ImportedAnalysis) => void
  onSaveAnalysis: (record: Omit<SavedLlmAnalysis, 'id' | 'savedAt'>) => void
}

export function History({
  cases,
  selectedId,
  onSelect,
  onStatusChange,
  savedAnalyses,
  simulatedById,
  importedById,
  geminiById,
  geminiKnowledgeById,
  geminiErrorById,
  analyzingId,
  geminiAnalyzingId,
  ragById,
  ragErrorById,
  ragAnalyzingId,
  onAnalyze,
  onAnalyzeGemini,
  onAnalyzeRag,
  onApplyImported,
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
        subtitle="Historial de esta sesión. Los análisis guardados se pierden al recargar la página."
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
          simulated={selectedCase ? simulatedById[selectedCase.id] ?? null : null}
          imported={selectedCase ? importedById[selectedCase.id] ?? null : null}
          gemini={selectedCase ? geminiById[selectedCase.id] ?? null : null}
          geminiKnowledge={selectedCase ? geminiKnowledgeById[selectedCase.id] ?? null : null}
          geminiError={selectedCase ? geminiErrorById[selectedCase.id] ?? null : null}
          analyzing={Boolean(selectedCase && analyzingId === selectedCase.id)}
          geminiAnalyzing={Boolean(selectedCase && geminiAnalyzingId === selectedCase.id)}
          rag={selectedCase ? ragById[selectedCase.id] ?? null : null}
          ragError={selectedCase ? ragErrorById[selectedCase.id] ?? null : null}
          ragAnalyzing={Boolean(selectedCase && ragAnalyzingId === selectedCase.id)}
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
