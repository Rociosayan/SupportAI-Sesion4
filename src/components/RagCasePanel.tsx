import type { HumanReview, RagResult } from '../types/rag'
import type { ImportedAnalysis } from './ResultComparison'
import { RagFragments } from './RagFragments'

type RagCasePanelProps = {
  analyzing: boolean
  error: string | null
  result: RagResult | null
  gemini: ImportedAnalysis | null
  review: HumanReview | null
  onConsult: () => void
  onReview: (value: HumanReview) => void
}

const REVIEW_OPTIONS: { id: HumanReview; label: string }[] = [
  { id: 'rag_better', label: 'La respuesta con RAG está mejor sustentada.' },
  { id: 'no_diff', label: 'No hay diferencia relevante.' },
  { id: 'needs_review', label: 'Requiere revisión.' },
]

export function RagCasePanel({
  analyzing,
  error,
  result,
  gemini,
  review,
  onConsult,
  onReview,
}: RagCasePanelProps) {
  const showComparison = Boolean(gemini && result)

  return (
    <section className="lab-form rag-case">
      <h3>Consultar conocimiento con RAG</h3>
      <p className="notice">
        Se envían el asunto y el mensaje de este caso. No reemplaza el análisis con Gemini API.
      </p>
      <button type="button" className="analyze-button" onClick={onConsult} disabled={analyzing}>
        Consultar conocimiento con RAG
      </button>
      {analyzing ? (
        <p className="notice" role="status">
          CONSULTANDO CONOCIMIENTO...
        </p>
      ) : null}
      {error ? (
        <p className="notice error-notice" role="alert">
          ERROR DE CONSULTA. {error}
        </p>
      ) : null}
      {result && !analyzing && !error ? (
        <div className="rag-case-result">
          <p className="notice" role="status">
            ANÁLISIS CON CONOCIMIENTO RAG
          </p>
          {result.contextoSuficiente ? (
            <p className="case-message">{result.answer}</p>
          ) : (
            <p className="notice">{result.message}</p>
          )}
          <p className="result-count">
            Fuente: {result.sources.join(', ') || result.source || 'ninguna'} · mejor score{' '}
            {result.bestScore.toFixed(3)}
          </p>
          <RagFragments fragments={result.fragments} />
        </div>
      ) : null}

      {showComparison ? (
        <section className="rag-compare">
          <h3>Comparación: Gemini vs. Gemini + RAG</h3>
          <div className="analysis-grid">
            <article className="analysis-card">
              <h4>GEMINI SIN CONOCIMIENTO PROPIO</h4>
              <p>{gemini?.respuestaSugerida}</p>
            </article>
            <article className="analysis-card">
              <h4>GEMINI + RAG</h4>
              <p>{result?.contextoSuficiente ? result.answer : result?.message}</p>
              <p className="result-count">Fuentes: {result?.sources.join(', ') || result?.source}</p>
              {result ? <RagFragments fragments={result.fragments} /> : null}
            </article>
          </div>
          <fieldset className="rag-review">
            <legend>Revisión humana</legend>
            {REVIEW_OPTIONS.map((option) => (
              <label key={option.id}>
                <input
                  type="radio"
                  name="rag-review"
                  checked={review === option.id}
                  onChange={() => onReview(option.id)}
                />
                {option.label}
              </label>
            ))}
          </fieldset>
          <p className="notice">
            RAG aporta contexto recuperado, pero la decisión final sigue requiriendo verificación
            humana.
          </p>
        </section>
      ) : null}
    </section>
  )
}
