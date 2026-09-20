import { useState } from 'react'
import type { KnowledgeSource, RagResult } from '../types/rag'
import { askRag, retrieveRag } from '../utils/ragApi'
import { RagFragments } from './RagFragments'

const POLICY_PRESETS = [
  { id: 'A', label: 'A. Devolución', query: '¿Cuántos días tengo para devolver un producto?' },
  { id: 'B', label: 'B. Pedido retrasado', query: 'Mi pedido está muy retrasado, ¿qué corresponde hacer?' },
  { id: 'C', label: 'C. Cursos de inglés', query: '¿La tienda ofrece cursos de inglés?' },
] as const

const COURSE_PRESETS = [
  { id: '1', label: '1. Horas del curso', query: '¿Cuántas horas dura el curso?' },
  { id: '2', label: '2. Bloques', query: '¿Qué contenidos o bloques se desarrollan?' },
  { id: '3', label: '3. Power BI', query: '¿El curso incluye Power BI?' },
] as const

type RagPhase = 'idle' | 'retrieving' | 'asking' | 'done' | 'insufficient' | 'error'

export function RagLab() {
  const [source, setSource] = useState<KnowledgeSource>('supportai-politicas.txt')
  const [query, setQuery] = useState<string>(POLICY_PRESETS[0].query)
  const [retrieved, setRetrieved] = useState<RagResult | null>(null)
  const [answered, setAnswered] = useState<RagResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<RagPhase>('idle')

  function applyPreset(nextQuery: string) {
    setQuery(nextQuery)
    setRetrieved(null)
    setAnswered(null)
    setError(null)
    setPhase('idle')
  }

  async function handleRetrieve() {
    setPhase('retrieving')
    setError(null)
    setRetrieved(null)
    setAnswered(null)
    const result = await retrieveRag(query, source)
    if (!result.ok) {
      setError(result.message)
      setPhase('error')
      return
    }
    setRetrieved(result.result)
    setPhase(result.result.contextoSuficiente ? 'done' : 'insufficient')
  }

  async function handleAsk() {
    setPhase('asking')
    setError(null)
    setAnswered(null)
    const result = await askRag(query, source)
    if (!result.ok) {
      setError(result.message)
      setPhase('error')
      return
    }
    setAnswered(result.result)
    setRetrieved(result.result)
    setPhase(result.result.contextoSuficiente ? 'done' : 'insufficient')
  }

  const visible = answered ?? retrieved
  const presets = source === 'curso.txt' ? COURSE_PRESETS : POLICY_PRESETS

  return (
    <section className="panel lab-form rag-lab">
      <h2>Prueba de recuperación RAG</h2>
      <p className="notice">
        El backend recupera fragmentos de una sola fuente. Gemini solo genera respuesta si el mejor
        score es mayor o igual a 0.70.
      </p>

      <label>
        Fuente
        <select
          value={source}
          onChange={(event) => {
            const next = event.target.value as KnowledgeSource
            setSource(next)
            setRetrieved(null)
            setAnswered(null)
            setError(null)
            setPhase('idle')
            setQuery(next === 'curso.txt' ? COURSE_PRESETS[0].query : POLICY_PRESETS[0].query)
          }}
        >
          <option value="supportai-politicas.txt">supportai-politicas.txt</option>
          <option value="curso.txt">curso.txt</option>
        </select>
      </label>

      <div className="lab-presets">
        <span>Consultas de prueba</span>
        <div>
          {presets.map((item) => (
            <button key={item.id} type="button" onClick={() => applyPreset(item.query)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <label>
        Consulta
        <textarea rows={3} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>

      <div className="rag-actions">
        <button type="button" className="analyze-button" onClick={() => void handleRetrieve()}>
          Buscar contexto
        </button>
        <button type="button" className="analyze-button" onClick={() => void handleAsk()}>
          Preguntar con RAG
        </button>
      </div>

      {phase === 'retrieving' || phase === 'asking' ? (
        <p className="notice" role="status">
          CONSULTANDO CONOCIMIENTO...
        </p>
      ) : null}
      {phase === 'error' && error ? (
        <p className="notice error-notice" role="alert">
          ERROR DE CONSULTA. {error}
        </p>
      ) : null}
      {visible && !visible.contextoSuficiente ? (
        <p className="notice" role="status">
          CONTEXTO INSUFICIENTE. {visible.message}
        </p>
      ) : null}
      {answered?.contextoSuficiente ? (
        <p className="notice" role="status">
          RESPUESTA GENERADA CON RAG
        </p>
      ) : null}

      {visible ? (
        <>
          <p className="result-count">
            {visible.fragments.length} fragmentos · mejor score {visible.bestScore.toFixed(3)} ·
            umbral {visible.threshold.toFixed(2)} · fuente {visible.source}
          </p>
          {answered?.answer ? <p className="case-message">{answered.answer}</p> : null}
          {answered?.sources.length ? (
            <p className="result-count">Fuentes: {answered.sources.join(', ')}</p>
          ) : null}
          <RagFragments fragments={visible.fragments} />
        </>
      ) : null}
    </section>
  )
}
