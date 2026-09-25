import { useEffect, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { RagFragments } from '../components/RagFragments'
import type { RagResult } from '../types/rag'
import { BACKEND_ORIGIN } from '../utils/geminiApi'
import { retrieveRag } from '../utils/ragApi'

type KnowledgeStatus = {
  source: string
  content: string
  bytes: number
  supabaseConfigured: boolean
  tableReady: boolean
}

export function Documents() {
  const [status, setStatus] = useState<KnowledgeStatus | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('¿Cuántos días hay para devolver un producto?')
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<RagResult | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const response = await fetch(`${BACKEND_ORIGIN}/api/knowledge/status`)
        const payload: unknown = await response.json()
        if (!active) {
          return
        }
        if (
          payload === null ||
          typeof payload !== 'object' ||
          Array.isArray(payload) ||
          (payload as { ok?: unknown }).ok !== true ||
          typeof (payload as { content?: unknown }).content !== 'string'
        ) {
          setLoadError('El backend no devolvió el documento de políticas.')
          return
        }
        const record = payload as {
          source?: unknown
          content: string
          bytes?: unknown
          supabase?: { configured?: unknown; tableReady?: unknown }
        }
        setStatus({
          source: typeof record.source === 'string' ? record.source : 'supportai-politicas.txt',
          content: record.content,
          bytes: typeof record.bytes === 'number' ? record.bytes : record.content.length,
          supabaseConfigured: record.supabase?.configured === true,
          tableReady: record.supabase?.tableReady === true,
        })
      } catch {
        if (active) {
          setLoadError(
            'No se pudo conectar con el backend. Arráncalo con npm run backend en http://localhost:3001.',
          )
        }
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  async function handleSearch() {
    const text = query.trim()
    if (!text || searching) {
      return
    }
    setSearching(true)
    setResult(null)
    setSearchError(null)
    const response = await retrieveRag(text, 'supportai-politicas.txt')
    setSearching(false)
    if (!response.ok) {
      setSearchError(response.message)
      return
    }
    setResult(response.result)
  }

  const storeLabel =
    result?.store === 'supabase'
      ? 'Supabase (knowledge_chunks)'
      : result?.storeNote === 'missing_table'
        ? 'índice local data/embeddings.json. Supabase está conectado, pero falta la tabla knowledge_chunks'
        : 'índice local data/embeddings.json, porque Supabase no está configurado'

  return (
    <div className="page page-wide">
      <PageHeader
        title="Conocimiento"
        subtitle="Base de conocimiento utilizada por el centro de atención."
      />

      {loadError ? (
        <p className="notice error-notice" role="alert">
          {loadError}
        </p>
      ) : null}

      {status ? (
        <section className="panel">
          <h2>Políticas internas de atención</h2>
          <p className="result-count">
            Documento {status.source} · {status.bytes} bytes ·{' '}
            {status.tableReady
              ? 'búsqueda en Supabase'
              : status.supabaseConfigured
                ? 'Supabase conectado; falta la tabla knowledge_chunks. La búsqueda sigue en el índice local'
                : 'búsqueda en el índice local, Supabase no configurado'}
          </p>
          <pre className="case-message knowledge-source">{status.content}</pre>
        </section>
      ) : null}

      <section className="panel lab-form">
        <h2>Buscar en el documento</h2>
        <p className="notice">
          La búsqueda usa el backend y el índice de este documento. No hay textos escritos a mano.
        </p>
        <label>
          Consulta
          <textarea rows={3} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <button type="button" className="analyze-button" onClick={handleSearch} disabled={searching}>
          {searching ? 'BUSCANDO...' : 'Buscar fragmentos'}
        </button>
        {searchError ? (
          <p className="notice error-notice" role="alert">
            {searchError}
          </p>
        ) : null}
        {result ? (
          <div>
            <p className="result-count">
              {`Almacén: ${storeLabel}. Mejor score: ${result.bestScore.toFixed(3)} · umbral ${result.threshold.toFixed(2)} · contexto ${result.contextoSuficiente ? 'suficiente' : 'insuficiente'}`}
            </p>
            {result.message ? (
              <p className="notice" role="status">
                {result.message}
              </p>
            ) : null}
            <RagFragments fragments={result.fragments} />
          </div>
        ) : null}
      </section>
    </div>
  )
}
