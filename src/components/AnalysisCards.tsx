import type { SimulatedAnalysis } from '../utils/simulateAnalysis'

type AnalysisPhase = 'idle' | 'analyzing' | 'done'

type AnalysisCardsProps = {
  phase?: AnalysisPhase
  analysis?: SimulatedAnalysis | null
  source?: 'simulated' | 'imported' | 'gemini'
}

const EMPTY: SimulatedAnalysis = {
  category: '—',
  priority: '—',
  sentiment: '—',
  intent: '—',
  summary: '—',
  suggestedResponse: '—',
}

function sentimentSignal(sentiment: string): string {
  if (sentiment === 'Satisfecho') {
    return 'signal-green'
  }
  if (sentiment === 'Neutral' || sentiment === 'Confundido') {
    return 'signal-yellow'
  }
  if (sentiment === 'Preocupado' || sentiment === 'Molesto' || sentiment === 'Muy molesto') {
    return 'signal-red'
  }
  return ''
}

function prioritySignal(priority: string): string {
  if (priority === 'Baja') {
    return 'signal-green'
  }
  if (priority === 'Media') {
    return 'signal-yellow'
  }
  if (priority === 'Alta') {
    return 'signal-red'
  }
  return ''
}

export function AnalysisCards({
  phase = 'idle',
  analysis = null,
  source = 'simulated',
}: AnalysisCardsProps) {
  const values = analysis ?? EMPTY
  const showSignals = phase === 'done'
  const imported = source === 'imported'
  const gemini = source === 'gemini'
  const loadingLabel = gemini ? 'ANALIZANDO CON GEMINI...' : 'ANALIZANDO...'
  const sectionLabel = gemini
    ? 'Análisis generado con Gemini API'
    : imported
      ? 'Análisis recibido del LLM'
      : 'Resultado de análisis'

  return (
    <section className="analysis-section" aria-label={sectionLabel}>
      <div className="analysis-status">
        {phase === 'analyzing' && gemini ? (
          <span className="badge badge-unanalyzed">ANALIZANDO CON GEMINI...</span>
        ) : null}
        {phase === 'analyzing' && !gemini ? (
          <span className="badge badge-unanalyzed">ANALIZANDO...</span>
        ) : null}
        {phase === 'idle' ? <span className="badge badge-unanalyzed">SIN ANALIZAR</span> : null}
        {phase === 'done' && !imported && !gemini ? (
          <>
            <span className="badge badge-unanalyzed">ANÁLISIS SIMULADO</span>
            <p>
              <strong>SIMULACIÓN DIDÁCTICA</strong>
            </p>
            <p>Este análisis no ha sido generado por un modelo de IA real.</p>
          </>
        ) : null}
        {phase === 'done' && imported ? (
          <span className="badge badge-unanalyzed">RESULTADO IMPORTADO DESDE UN LLM</span>
        ) : null}
        {phase === 'done' && gemini ? (
          <span className="badge badge-unanalyzed">ANÁLISIS GENERADO CON GEMINI API</span>
        ) : null}
      </div>
      <div className="analysis-grid">
        <article className="analysis-card">
          <h3>Categoría</h3>
          <p>{phase === 'analyzing' ? loadingLabel : values.category}</p>
        </article>
        <article className={`analysis-card${showSignals ? ` ${prioritySignal(values.priority)}` : ''}`}>
          <h3>Prioridad</h3>
          <p>{phase === 'analyzing' ? loadingLabel : values.priority}</p>
        </article>
        <article className={`analysis-card${showSignals ? ` ${sentimentSignal(values.sentiment)}` : ''}`}>
          <h3>Sentimiento</h3>
          <p>{phase === 'analyzing' ? loadingLabel : values.sentiment}</p>
        </article>
        <article className="analysis-card">
          <h3>Intención</h3>
          <p>{phase === 'analyzing' ? loadingLabel : values.intent}</p>
        </article>
        <article className="analysis-card">
          <h3>Resumen</h3>
          <p>{phase === 'analyzing' ? loadingLabel : values.summary}</p>
        </article>
        <article className="analysis-card">
          <h3>Respuesta sugerida</h3>
          <p>{phase === 'analyzing' ? loadingLabel : values.suggestedResponse}</p>
        </article>
      </div>
    </section>
  )
}
