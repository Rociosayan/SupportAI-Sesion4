import type { CaseStatus, SupportCase } from '../types/case'
import type { SavedLlmAnalysis } from '../types/savedAnalysis'
import { formatDateTime } from '../utils/format'
import type { SimulatedAnalysis } from '../utils/simulateAnalysis'
import { AnalysisCards } from './AnalysisCards'
import { AnalyzeAction } from './AnalyzeAction'
import { GeminiAnalyze } from './GeminiAnalyze'
import { RagCasePanel } from './RagCasePanel'
import type { HumanReview, RagResult } from '../types/rag'
import { LlmIntegrationFlow } from './LlmIntegrationFlow'
import { PrepareAiQuery } from './PrepareAiQuery'
import { PriorityBadge } from './PriorityBadge'
import { ResultComparison, type ImportedAnalysis } from './ResultComparison'
import { StatusBadge } from './StatusBadge'

type CaseDetailProps = {
  supportCase: SupportCase | null
  onStatusChange: (id: string, status: CaseStatus) => void
  simulated: SimulatedAnalysis | null
  imported: ImportedAnalysis | null
  gemini?: ImportedAnalysis | null
  geminiError?: string | null
  analyzing: boolean
  geminiAnalyzing?: boolean
  rag?: RagResult | null
  ragError?: string | null
  ragAnalyzing?: boolean
  ragReview?: HumanReview | null
  onAnalyze: () => void
  onAnalyzeGemini?: () => void
  onAnalyzeRag?: () => void
  onRagReview?: (value: HumanReview) => void
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
  geminiError = null,
  analyzing,
  geminiAnalyzing = false,
  rag = null,
  ragError = null,
  ragAnalyzing = false,
  ragReview = null,
  onAnalyze,
  onAnalyzeGemini,
  onAnalyzeRag,
  onRagReview,
  onApplyImported,
  onSaveAnalysis,
}: CaseDetailProps) {
  if (!supportCase) {
    return (
      <div className="panel empty-panel">
        <p>Selecciona un caso para ver el detalle.</p>
      </div>
    )
  }

  const phase: AnalysisPhase = analyzing ? 'analyzing' : simulated ? 'done' : 'idle'

  return (
    <article className="panel case-detail">
      <header>
        <p className="case-id">{supportCase.id}</p>
        <h2>{supportCase.subject}</h2>
        <div className="case-item-badges">
          <StatusBadge status={supportCase.status} />
          <PriorityBadge priority={supportCase.priority} />
          <span className="badge badge-unanalyzed">
            {phase === 'analyzing' ? 'ANALIZANDO...' : null}
            {phase === 'idle' ? 'SIN ANALIZAR' : null}
            {phase === 'done' ? 'ANÁLISIS SIMULADO' : null}
          </span>
        </div>
      </header>

      <dl className="detail-grid">
        <div>
          <dt>Cliente</dt>
          <dd>{supportCase.customerName}</dd>
        </div>
        <div>
          <dt>Número de pedido</dt>
          <dd>{supportCase.orderNumber}</dd>
        </div>
        <div>
          <dt>Fecha y hora</dt>
          <dd>
            <time dateTime={supportCase.date}>{formatDateTime(supportCase.date)}</time>
          </dd>
        </div>
        <div>
          <dt>Canal</dt>
          <dd>{supportCase.channel}</dd>
        </div>
        <div>
          <dt>Categoría</dt>
          <dd>{supportCase.category}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>{supportCase.status}</dd>
        </div>
      </dl>

      <section>
        <h3>Mensaje</h3>
        <p className="case-message">{supportCase.message}</p>
      </section>

      <label className="status-field">
        Cambiar estado
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

      <PrepareAiQuery
        key={supportCase.id}
        supportCase={supportCase}
        imported={imported}
        onApply={onApplyImported}
        onSave={onSaveAnalysis}
      />
      <AnalyzeAction onAnalyze={onAnalyze} analyzing={phase === 'analyzing'} />
      <AnalysisCards phase={phase} analysis={simulated} />
      {simulated && imported ? (
        <ResultComparison
          simulated={simulated}
          imported={imported}
          caseId={supportCase.id}
        />
      ) : null}
      <GeminiAnalyze
        caseId={supportCase.id}
        analysis={gemini}
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
        gemini={gemini}
        review={ragReview}
        onConsult={() => onAnalyzeRag?.()}
        onReview={(value) => onRagReview?.(value)}
      />
      <LlmIntegrationFlow />
    </article>
  )
}
