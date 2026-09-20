import { Cloud } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { SavedLlmAnalysis } from '../types/savedAnalysis'
import { readAnalysis } from '../utils/geminiApi'
import { AnalysisCards } from './AnalysisCards'
import type { ImportedAnalysis } from './ResultComparison'

type GeminiAnalyzeProps = {
  caseId: string
  analysis: ImportedAnalysis | null
  error: string | null
  analyzing: boolean
  onAnalyze: () => void
  onSave: (record: Omit<SavedLlmAnalysis, 'id' | 'savedAt'>) => void
  customerName: string
  subject: string
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
    <section className="lab-form gemini-section">
      <h3>Análisis con Gemini API</h3>
      <p className="notice">
        SupportAI envía este caso al backend. El backend llama a Gemini. La clave nunca sale de
        ese servidor.
      </p>
      <div className="analyze-action">
        <button
          type="button"
          className="analyze-button"
          onClick={onAnalyze}
          disabled={analyzing}
        >
          <Cloud size={16} aria-hidden="true" />
          {analyzing ? 'ANALIZANDO CON GEMINI...' : 'Analizar con Gemini API'}
        </button>
      </div>
      {analyzing ? (
        <p className="notice" role="status">
          ANALIZANDO CON GEMINI...
        </p>
      ) : null}
      {error && !analyzing ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
      {analyzing ? (
        <AnalysisCards source="gemini" phase="analyzing" analysis={null} />
      ) : null}
      {visibleAnalysis ? (
        <>
          <AnalysisCards source="gemini" phase="done" analysis={toCardValues(visibleAnalysis)} />
          <div className="panel">
            <h3>Respuesta sugerida</h3>
            <p className="case-message">{visibleAnalysis.respuestaSugerida}</p>
          </div>
        </>
      ) : null}
      <button type="button" className="analyze-button" onClick={handleSave} disabled={!canSave}>
        Guardar análisis
      </button>
      {saved ? (
        <p className="notice" role="status">
          ✓ Análisis guardado
        </p>
      ) : null}
    </section>
  )
}
