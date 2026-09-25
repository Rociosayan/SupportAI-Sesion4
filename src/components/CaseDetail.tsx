import { useState } from 'react'
import type { CaseStatus, SupportCase } from '../types/case'
import type { SavedLlmAnalysis } from '../types/savedAnalysis'
import { productForOrder } from '../utils/catalog'
import { formatDateTime } from '../utils/format'
import type { SimulatedAnalysis } from '../utils/simulateAnalysis'
import { AnalysisCards } from './AnalysisCards'
import { AnalyzeAction } from './AnalyzeAction'
import { GeminiAnalyze } from './GeminiAnalyze'
import { RagCasePanel } from './RagCasePanel'
import type { RagResult } from '../types/rag'
import { PrepareAiQuery } from './PrepareAiQuery'
import { PriorityBadge } from './PriorityBadge'
import { ResultComparison, type ImportedAnalysis } from './ResultComparison'
import type { GeminiKnowledge } from '../utils/geminiApi'
import { StatusBadge } from './StatusBadge'

type CaseDetailProps = {
  supportCase: SupportCase | null
  onStatusChange: (id: string, status: CaseStatus) => void
  simulated: SimulatedAnalysis | null
  imported: ImportedAnalysis | null
  gemini?: ImportedAnalysis | null
  geminiKnowledge?: GeminiKnowledge | null
  geminiError?: string | null
  analyzing: boolean
  geminiAnalyzing?: boolean
  rag?: RagResult | null
  ragError?: string | null
  ragAnalyzing?: boolean
  onAnalyze: () => void
  onAnalyzeGemini?: () => void
  onAnalyzeRag?: () => void
  onApplyImported: (data: ImportedAnalysis) => void
  onSaveAnalysis: (record: Omit<SavedLlmAnalysis, 'id' | 'savedAt'>) => void
}

type AnalysisPhase = 'idle' | 'analyzing' | 'done'

export function CaseDetail({
  supportCase,
  onStatusChange,
  simulated,
  imported,
  gemini = null,
  geminiKnowledge = null,
  geminiError = null,
  analyzing,
  geminiAnalyzing = false,
  rag = null,
  ragError = null,
  ragAnalyzing = false,
  onAnalyze,
  onAnalyzeGemini,
  onAnalyzeRag,
  onApplyImported,
  onSaveAnalysis,
}: CaseDetailProps) {
  const [manualOpen, setManualOpen] = useState(false)

  if (!supportCase) {
    return (
      <div className="panel empty-panel">
        <p>Selecciona un caso para ver el detalle.</p>
      </div>
    )
  }

  const phase: AnalysisPhase = analyzing ? 'analyzing' : simulated ? 'done' : 'idle'
  const product = productForOrder(supportCase.orderNumber)
  const aiLabel = geminiAnalyzing
    ? 'Analizando'
    : gemini
      ? 'Respuesta disponible'
      : 'Sin analizar'

  return (
    <article className="panel case-detail">
      <header className="case-work-header">
        <div>
          <p className="case-id">Caso {supportCase.id}</p>
          <h2>{supportCase.subject}</h2>
          <p className="case-meta">
            {supportCase.customerName} · {supportCase.orderNumber} · {supportCase.channel}
          </p>
        </div>
        <div className="case-item-badges">
          <StatusBadge status={supportCase.status} />
          <PriorityBadge priority={supportCase.priority} />
          <span className="badge">{aiLabel}</span>
        </div>
      </header>

      <section>
        <h3>Información del cliente</h3>
        <dl className="detail-grid">
          <div>
            <dt>Cliente</dt>
            <dd>{supportCase.customerName}</dd>
          </div>
          <div>
            <dt>Pedido</dt>
            <dd>{supportCase.orderNumber}</dd>
          </div>
          {product ? (
            <div>
              <dt>Producto</dt>
              <dd>{product}</dd>
            </div>
          ) : null}
          <div>
            <dt>Fecha</dt>
            <dd>
              <time dateTime={supportCase.date}>{formatDateTime(supportCase.date)}</time>
            </dd>
          </div>
          <div>
            <dt>Canal</dt>
            <dd>{supportCase.channel}</dd>
          </div>
          <div>
            <dt>Categoría registrada</dt>
            <dd>{supportCase.category}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h3>Mensaje del cliente</h3>
        <p className="case-message">{supportCase.message}</p>
      </section>

      <section>
        <h3>Acciones del agente</h3>
        <label className="status-field">
          Estado
          <select
            value={supportCase.status}
            onChange={(event) =>
              onStatusChange(supportCase.id, event.target.value as CaseStatus)
            }
          >
            <option value="Pendiente">Pendiente</option>
            <option value="En proceso">En proceso</option>
            <option value="Resuelto">Resuelto</option>
          </select>
        </label>
      </section>

      <GeminiAnalyze
        caseId={supportCase.id}
        analysis={gemini}
        knowledge={geminiKnowledge}
        error={geminiError}
        analyzing={geminiAnalyzing}
        onAnalyze={() => onAnalyzeGemini?.()}
        onSave={onSaveAnalysis}
        customerName={supportCase.customerName}
        subject={supportCase.subject}
      />
      <RagCasePanel
        analyzing={ragAnalyzing}
        error={ragError}
        result={rag}
        onConsult={() => onAnalyzeRag?.()}
      />

      <section>
        <button
          type="button"
          className="button-secondary"
          onClick={() => setManualOpen((open) => !open)}
        >
          {manualOpen ? 'Ocultar modo manual' : 'Modo manual'}
        </button>
        {manualOpen ? (
          <div className="manual-mode">
            <p className="result-count">
              Herramienta de laboratorio. No forma parte de la atención del caso.
            </p>
            <PrepareAiQuery
              key={supportCase.id}
              supportCase={supportCase}
              imported={imported}
              onApply={onApplyImported}
              onSave={onSaveAnalysis}
            />
            <AnalyzeAction onAnalyze={onAnalyze} analyzing={phase === 'analyzing'} />
            {phase !== 'idle' ? <AnalysisCards phase={phase} analysis={simulated} /> : null}
            {simulated && imported ? (
              <ResultComparison
                simulated={simulated}
                imported={imported}
                caseId={supportCase.id}
              />
            ) : null}
          </div>
        ) : null}
      </section>
    </article>
  )
}
