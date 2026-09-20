import { AnalysisCards } from '../components/AnalysisCards'
import { AnalyzeAction } from '../components/AnalyzeAction'
import { CaseList } from '../components/CaseList'
import { PageHeader } from '../components/PageHeader'
import type { SupportCase } from '../types/case'
import { sortByDateDesc } from '../utils/filters'
import type { SimulatedAnalysis } from '../utils/simulateAnalysis'

type DiagnosisProps = {
  cases: SupportCase[]
  selectedId: string | null
  onSelect: (id: string) => void
  simulatedById: Record<string, SimulatedAnalysis>
  analyzingId: string | null
  onAnalyze: (caseItem: SupportCase) => void
}

export function Diagnosis({
  cases,
  selectedId,
  onSelect,
  simulatedById,
  analyzingId,
  onAnalyze,
}: DiagnosisProps) {
  const selectedCase = cases.find((item) => item.id === selectedId) ?? null
  const visibleCases = sortByDateDesc(cases)
  const simulated = selectedCase ? simulatedById[selectedCase.id] ?? null : null
  const analyzing = Boolean(selectedCase && analyzingId === selectedCase.id)
  const phase = analyzing ? 'analyzing' : simulated ? 'done' : 'idle'

  return (
    <div className="page page-wide">
      <PageHeader
        title="Diagnóstico"
        subtitle="Los casos inician sin análisis. Esta pantalla queda lista para una API de IA real."
      />

      <div className="split-view">
        <CaseList cases={visibleCases} selectedId={selectedId} onSelect={onSelect} />

        {selectedCase ? (
          <article className="panel diagnosis-panel">
            <header>
              <p className="case-id">{selectedCase.id}</p>
              <h2>{selectedCase.subject}</h2>
              <p>{selectedCase.customerName}</p>
            </header>
            <p className="case-message">{selectedCase.message}</p>
            <AnalyzeAction
              onAnalyze={() => onAnalyze(selectedCase)}
              analyzing={analyzing}
            />
            <AnalysisCards phase={phase} analysis={simulated} />
          </article>
        ) : (
          <div className="panel empty-panel">
            <p>Selecciona un caso. El estado de análisis es SIN ANALIZAR.</p>
          </div>
        )}
      </div>
    </div>
  )
}
