import { Cloud } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { SavedLlmAnalysis } from '../types/savedAnalysis'
import { readAnalysis, type GeminiKnowledge } from '../utils/geminiApi'
import { AnalysisCards } from './AnalysisCards'
import type { ImportedAnalysis } from './ResultComparison'

type GeminiAnalyzeProps = {
  caseId: string
  analysis: ImportedAnalysis | null
  knowledge?: GeminiKnowledge | null
  error: string | null
  analyzing: boolean
  onAnalyze: () => void
  onSave: (record: Omit<SavedLlmAnalysis, 'id' | 'savedAt'>) => void
  customerName: string
  subject: string
}

function EvidenceToggle({
  count,
  emptyMessage,
  children,
}: {
  count: number
  emptyMessage: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const label = count > 0 ? `${count} fuentes utilizadas` : emptyMessage

  return (
    <div className="panel">
      <h3>Evidencia de conocimiento</h3>
      <p className="result-count">{label}</p>
      <button type="button" className="button-secondary" onClick={() => setOpen((value) => !value)}>
        {open ? 'Ocultar evidencia' : 'Ver evidencia'}
      </button>
      {open ? children : null}
    </div>
  )
}

function toCardValues(data: ImportedAnalysis) {
  return {
    category: data.categoria,
    priority: data.prioridad,
    sentiment: data.sentimiento,
    intent: data.intencion,
    summary: data.resumen,
    suggestedResponse: data.respuestaSugerida,
  }
}

export function GeminiAnalyze({
  caseId,
  analysis,
  knowledge = null,
  error,
  analyzing,
  onAnalyze,
  onSave,
  customerName,
  subject,
}: GeminiAnalyzeProps) {
  const [saved, setSaved] = useState(false)
  const visibleAnalysis = !analyzing && !error ? readAnalysis(analysis) : null
  const canSave = visibleAnalysis !== null

  useEffect(() => {
    setSaved(false)
  }, [caseId, analysis])

  useEffect(() => {
    if (error) {
      console.error(error)
    }
  }, [error])

  function handleSave() {
    const current = readAnalysis(analysis)
    if (analyzing || error || !current) {
      return
    }

    onSave({
      caseId,
      customerName,
      subject,
      source: 'gemini',
      categoria: current.categoria,
      prioridad: current.prioridad,
      sentimiento: current.sentimiento,
      intencion: current.intencion,
      resumen: current.resumen,
      respuestaSugerida: current.respuestaSugerida,
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section className="work-section gemini-section">
      <h3>Análisis inteligente</h3>
      <div className="analyze-action">
        <button
          type="button"
          className="analyze-button"
          onClick={onAnalyze}
          disabled={analyzing}
        >
          <Cloud size={16} aria-hidden="true" />
          {analyzing ? 'Analizando...' : 'Analizar con IA'}
        </button>
      </div>
      {analyzing ? (
        <p className="notice" role="status">
          Analizando...
        </p>
      ) : null}
      {error && !analyzing ? (
        <p className="notice notice-error" role="alert">
          No pudimos analizar el caso. Inténtalo nuevamente.
        </p>
      ) : null}
      {analyzing ? (
        <AnalysisCards source="gemini" phase="analyzing" analysis={null} />
      ) : null}
      {visibleAnalysis ? (
        <>
          <AnalysisCards source="gemini" phase="done" analysis={toCardValues(visibleAnalysis)} />
          <div className="panel">
            <h3>Respuesta sugerida para el agente</h3>
            <p className="case-message">{visibleAnalysis.respuestaSugerida}</p>
            <button
              type="button"
              className="button-secondary"
              onClick={() => {
                void navigator.clipboard.writeText(visibleAnalysis.respuestaSugerida)
              }}
            >
              Copiar respuesta
            </button>
          </div>
          <EvidenceToggle
            count={knowledge?.fragments.length ?? 0}
            emptyMessage={
              knowledge?.message ||
              'El conocimiento disponible no sustenta una respuesta para este caso.'
            }
          >
            {knowledge && knowledge.fragments.length > 0 ? (
              <ul className="rag-fragments">
                {knowledge.fragments.map((item) => (
                  <li key={`${item.source}-${item.chunkIndex}`}>
                    <p>
                      <strong>{item.source}</strong> · chunk {item.chunkIndex} · score{' '}
                      {item.score.toFixed(3)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="notice" role="status">
                {knowledge?.message ||
                  'El conocimiento disponible no sustenta una respuesta para este caso.'}
              </p>
            )}
          </EvidenceToggle>
        </>
      ) : null}
      <button type="button" className="button-secondary" onClick={handleSave} disabled={!canSave}>
        Guardar en el historial de esta sesión
      </button>
      {saved ? (
        <p className="notice" role="status">
          ✓ Análisis guardado
        </p>
      ) : null}
    </section>
  )
}
