import { useEffect, useRef, useState } from 'react'
import type { SimulatedAnalysis } from '../utils/simulateAnalysis'

export type ImportedAnalysis = {
  categoria: string
  prioridad: string
  sentimiento: string
  intencion: string
  resumen: string
  respuestaSugerida: string
}

type ResultComparisonProps = {
  simulated: SimulatedAnalysis
  imported: ImportedAnalysis
  caseId: string
}

type ReviewChoice = 'llm' | 'simulated' | 'review' | ''

type ComparisonRow = {
  field: string
  simulated: string
  imported: string
  showMatch: boolean
}

function sameValue(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function MatchMark({ left, right }: { left: string; right: string }) {
  return sameValue(left, right) ? '✓ Coinciden' : '⚠ Diferencia detectada'
}

export function ResultComparison({ simulated, imported, caseId }: ResultComparisonProps) {
  const [choice, setChoice] = useState<ReviewChoice>('')
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setChoice('')
  }, [caseId])

  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [caseId, imported, simulated])

  const rows: ComparisonRow[] = [
    {
      field: 'Categoría',
      simulated: simulated.category,
      imported: imported.categoria,
      showMatch: true,
    },
    {
      field: 'Prioridad',
      simulated: simulated.priority,
      imported: imported.prioridad,
      showMatch: true,
    },
    {
      field: 'Sentimiento',
      simulated: simulated.sentiment,
      imported: imported.sentimiento,
      showMatch: true,
    },
    {
      field: 'Intención',
      simulated: simulated.intent,
      imported: imported.intencion,
      showMatch: false,
    },
    {
      field: 'Resumen',
      simulated: simulated.summary,
      imported: imported.resumen,
      showMatch: false,
    },
    {
      field: 'Respuesta sugerida',
      simulated: simulated.suggestedResponse,
      imported: imported.respuestaSugerida,
      showMatch: false,
    },
  ]

  return (
    <section ref={sectionRef} className="comparison-section" tabIndex={-1}>
      <h3>Comparación de resultados</h3>
      <div className="comparison-table-wrap">
        <table className="comparison-table">
          <caption className="sr-only">Comparación campo por campo entre análisis simulado y análisis del LLM</caption>
          <thead>
            <tr>
              <th>Campo</th>
              <th>ANÁLISIS SIMULADO</th>
              <th>ANÁLISIS DEL LLM</th>
              <th>Comparación</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.field}>
                <th scope="row">{row.field}</th>
                <td>{row.simulated}</td>
                <td>{row.imported}</td>
                <td>
                  {row.showMatch ? (
                    <span className={sameValue(row.simulated, row.imported) ? 'match-ok' : 'match-diff'}>
                      <MatchMark left={row.simulated} right={row.imported} />
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section>
        <h3>Revisión humana</h3>
        <div className="review-options">
          <label>
            <input
              type="radio"
              name={`human-review-${caseId}`}
              checked={choice === 'llm'}
              onChange={() => setChoice('llm')}
            />{' '}
            Aceptar análisis del LLM
          </label>
          <label>
            <input
              type="radio"
              name={`human-review-${caseId}`}
              checked={choice === 'simulated'}
              onChange={() => setChoice('simulated')}
            />{' '}
            Mantener análisis simulado
          </label>
          <label>
            <input
              type="radio"
              name={`human-review-${caseId}`}
              checked={choice === 'review'}
              onChange={() => setChoice('review')}
            />{' '}
            Requiere revisión
          </label>
        </div>
        <p className="notice">
          La decisión final corresponde al agente de soporte. La IA propone un análisis, pero no
          sustituye la verificación humana.
        </p>
      </section>
    </section>
  )
}
