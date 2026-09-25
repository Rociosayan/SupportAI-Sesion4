import { useState } from 'react'
import type { KnowledgeSource, RagResult } from '../types/rag'
import { retrieveRag } from '../utils/ragApi'
import { RagFragments } from './RagFragments'

const POLITICAS_PRESETS = [
  { id: 'A', label: 'A. Devolución', query: '¿Cuántos días tengo para devolver un producto?' },
  { id: 'B', label: 'B. Pedido retrasado', query: 'Mi pedido está muy retrasado, ¿qué corresponde hacer?' },
  { id: 'C', label: 'C. Cursos de inglés', query: '¿La tienda ofrece cursos de inglés?' },
] as const

const CURSO_PRESETS = [
  { id: '1', label: '1. Duración', query: '¿Cuántas horas dura el curso?' },
  { id: '2', label: '2. Bloques', query: '¿Qué contenidos o bloques se desarrollan?' },
  { id: '3', label: '3. Power BI', query: '¿El curso incluye Power BI?' },
] as const

const SOURCES: { id: KnowledgeSource; label: string }[] = [
  { id: 'supportai-politicas.txt', label: 'supportai-politicas.txt' },
  { id: 'curso.txt', label: 'curso.txt' },
]

function presetsFor(source: KnowledgeSource) {
  return source === 'curso.txt' ? CURSO_PRESETS : POLITICAS_PRESETS
}

export function RagLab() {
  const [source, setSource] = useState<KnowledgeSource>('supportai-politicas.txt')
  const [query, setQuery] = useState<string>(POLITICAS_PRESETS[0].query)
  const [retrieved, setRetrieved] = useState<RagResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)

  function clearResult() {
    setRetrieved(null)
    setError(null)
  }

  function applySource(nextSource: KnowledgeSource) {
    if (nextSource === source) {
      return
    }
    setSource(nextSource)
    setQuery(presetsFor(nextSource)[0].query)
    clearResult()
  }

  function applyPreset(nextQuery: string) {
    setQuery(nextQuery)
    clearResult()
  }

  async function handleRetrieve() {
    setSearching(true)
    clearResult()
    const result = await retrieveRag(query, source)
    setSearching(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setRetrieved(result.result)
  }

  const presets = presetsFor(source)

  return (
    <section className="panel lab-form rag-lab">
      <h2>Prueba de recuperación RAG</h2>
      <p className="notice">
        El backend busca solo en {source}. No mezcla políticas de atención con el temario del curso.
      </p>

      <div className="lab-presets">
        <span>Fuente</span>
        <div>
          {SOURCES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={source === item.id ? 'is-active' : ''}
              onClick={() => applySource(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

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
        <textarea
          rows={3}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            clearResult()
          }}
        />
      </label>

      <button type="button" className="analyze-button" onClick={() => void handleRetrieve()}>
        Buscar contexto
      </button>

      {searching ? (
        <p className="notice" role="status">
          Buscando contexto...
        </p>
      ) : null}
      {error ? (
        <p className="notice error-notice" role="alert">
          {error}
        </p>
      ) : null}
      {retrieved ? (
        <>
          <p className="result-count">
            contextoSuficiente = {String(retrieved.contextoSuficiente)} · mejor score{' '}
            {retrieved.bestScore.toFixed(3)} · umbral {retrieved.threshold.toFixed(2)} · fuente{' '}
            {retrieved.source}
          </p>
          {!retrieved.contextoSuficiente ? (
            <p className="notice" role="status">
              {retrieved.message}
            </p>
          ) : null}
          <RagFragments fragments={retrieved.fragments} />
        </>
      ) : null}
    </section>
  )
}
