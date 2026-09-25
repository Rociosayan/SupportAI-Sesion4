import { useState } from 'react'
import type { SupportCase } from '../types/case'
import type { SavedLlmAnalysis } from '../types/savedAnalysis'
import type { SimulatedAnalysis } from '../utils/simulateAnalysis'
import { AnalysisCards } from './AnalysisCards'
import { AnalyzeAction } from './AnalyzeAction'
import { PrepareAiQuery } from './PrepareAiQuery'
import { ResultComparison, type ImportedAnalysis } from './ResultComparison'

type ManualLabProps = {
  cases: SupportCase[]
  simulatedById: Record<string, SimulatedAnalysis>
  importedById: Record<string, ImportedAnalysis>
  analyzingId: string | null
  onAnalyze: (caseItem: SupportCase) => void
  onApplyImported: (caseId: string, data: ImportedAnalysis) => void
  onSaveAnalysis: (record: Omit<SavedLlmAnalysis, 'id' | 'savedAt'>) => void
  onBack: () => void
}

export function ManualLab({
  cases,
  simulatedById,
  importedById,
  analyzingId,
  onAnalyze,
  onApplyImported,
  onSaveAnalysis,
  onBack,
}: ManualLabProps) {
  const [caseId, setCaseId] = useState(cases[0]?.id ?? '')
  const selected = cases.find((item) => item.id === caseId) ?? cases[0]
  const simulated = selected ? simulatedById[selected.id] ?? null : null
  const imported = selected ? importedById[selected.id] ?? null : null
  const analyzing = Boolean(selected && analyzingId === selected.id)

  return (
    <div className="page page-wide">
      <header className="page-header">
        <div>
          <h1>Experimento manual</h1>
          <p>Aprende el flujo de integración manual con un LLM: prompt, JSON y comparación.</p>
        </div>
      </header>
      <button type="button" className="button-secondary" onClick={onBack}>
        Volver
      </button>
      <section className="llm-panel">
        <label className="llm-field" htmlFor="manual-case">
          Caso
          <select
            id="manual-case"
            value={selected?.id ?? ''}
            onChange={(event) => setCaseId(event.target.value)}
          >
            {cases.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} · {item.subject}
              </option>
            ))}
          </select>
        </label>
        {selected ? (
          <>
            <PrepareAiQuery
              key={selected.id}
              supportCase={selected}
              imported={imported}
              onApply={(data) => onApplyImported(selected.id, data)}
              onSave={onSaveAnalysis}
            />
            <AnalyzeAction onAnalyze={() => onAnalyze(selected)} analyzing={analyzing} />
            {analyzing || simulated ? (
              <AnalysisCards phase={analyzing ? 'analyzing' : 'done'} analysis={simulated} />
            ) : null}
            {simulated && imported ? (
              <ResultComparison simulated={simulated} imported={imported} caseId={selected.id} />
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  )
}
