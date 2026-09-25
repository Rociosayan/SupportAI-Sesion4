import type { RagResult } from '../types/rag'
import { RagFragments } from './RagFragments'

type RagCasePanelProps = {
  analyzing: boolean
  error: string | null
  result: RagResult | null
  onConsult: () => void
}

export function RagCasePanel({ analyzing, error, result, onConsult }: RagCasePanelProps) {
  const showResult = Boolean(result && !analyzing && !error)
  const canShowPolicy = Boolean(result?.contextoSuficiente && result.answer)

  return (
    <section className="work-section rag-case">
      <h3>Conocimiento relacionado</h3>
      <button type="button" className="button-secondary" onClick={onConsult} disabled={analyzing}>
        {analyzing ? 'Consultando conocimiento...' : 'Consultar conocimiento'}
      </button>
      {analyzing ? (
        <p className="notice" role="status">
          Consultando conocimiento...
        </p>
      ) : null}
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
      {showResult && result ? (
        <div className="rag-case-result">
          <h3>Conocimiento utilizado</h3>
          {canShowPolicy ? (
            <div>
              <h4>Respuesta sugerida para el agente</h4>
              <p className="case-message">{result.answer}</p>
              <button
                type="button"
                className="analyze-button"
                onClick={() => {
                  if (result.answer) {
                    void navigator.clipboard.writeText(result.answer)
                  }
                }}
              >
                Copiar respuesta
              </button>
            </div>
          ) : (
            <p className="notice" role="status">
              {result.message ||
                'El conocimiento disponible no sustenta una respuesta para este caso.'}
            </p>
          )}
          <p className="result-count">
            Almacén:{' '}
            {result.store === 'supabase'
              ? 'Supabase (knowledge_chunks)'
              : result.storeNote === 'missing_table'
                ? 'Índice local. Supabase está conectado, pero falta la tabla knowledge_chunks.'
                : 'Índice local. Supabase no está configurado.'}
          </p>
          <p className="result-count">
            Fuente: {result.sources.join(', ') || result.source || 'ninguna'}
          </p>
          <p className="result-count">
            Mejor score: {result.bestScore.toFixed(3)} · umbral {result.threshold.toFixed(2)}
          </p>
          <h4>Fragmentos recuperados</h4>
          <RagFragments fragments={result.fragments} />
        </div>
      ) : null}
    </section>
  )
}
