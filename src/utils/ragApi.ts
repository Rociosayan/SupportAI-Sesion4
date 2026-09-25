import { BACKEND_ORIGIN } from './geminiApi'
import type { KnowledgeSource, RagResult } from '../types/rag'
import type { SupportCase } from '../types/case'

export type RagRequestResult = { ok: true; result: RagResult } | { ok: false; message: string }

const ERRORS = {
  backend_offline:
    'No se pudo conectar con el backend. Arráncalo con npm run backend en http://localhost:3001.',
  invalid_json: 'El backend devolvió una respuesta con formato no válido.',
  internal: 'El backend no pudo completar la consulta RAG.',
}

function asResult(record: Record<string, unknown>): RagResult | null {
  if (!Array.isArray(record.fragments) || typeof record.contextoSuficiente !== 'boolean') {
    return null
  }

  const fragments = record.fragments.flatMap((item) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      return []
    }
    const row = item as Record<string, unknown>
    if (
      typeof row.source !== 'string' ||
      typeof row.content !== 'string' ||
      typeof row.chunkIndex !== 'number' ||
      typeof row.score !== 'number'
    ) {
      return []
    }
    return [
      {
        source: row.source,
        chunkIndex: row.chunkIndex,
        content: row.content,
        score: row.score,
      },
    ]
  })

  return {
    query: typeof record.query === 'string' ? record.query : '',
    source: typeof record.source === 'string' ? record.source : '',
    store: record.store === 'supabase' ? 'supabase' : 'local',
    storeNote:
      record.storeNote === 'ready' ||
      record.storeNote === 'unconfigured' ||
      record.storeNote === 'missing_table'
        ? record.storeNote
        : undefined,
    fragments,
    bestScore: typeof record.bestScore === 'number' ? record.bestScore : 0,
    contextoSuficiente: record.contextoSuficiente,
    threshold: typeof record.threshold === 'number' ? record.threshold : 0.7,
    message: typeof record.message === 'string' ? record.message : null,
    answer: typeof record.answer === 'string' ? record.answer : null,
    sources: Array.isArray(record.sources)
      ? record.sources.filter((item): item is string => typeof item === 'string')
      : [],
  }
}

async function postRag(path: string, body: unknown): Promise<RagRequestResult> {
  let response: Response
  try {
    response = await fetch(`${BACKEND_ORIGIN}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return { ok: false, message: ERRORS.backend_offline }
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return { ok: false, message: ERRORS.invalid_json }
  }

  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, message: ERRORS.internal }
  }

  const record = payload as Record<string, unknown>
  if (record.ok === true) {
    const result = asResult(record)
    if (!result) {
      return { ok: false, message: ERRORS.internal }
    }
    return { ok: true, result }
  }

  const message =
    typeof record.message === 'string' && record.message.trim()
      ? record.message
      : ERRORS.internal
  return { ok: false, message }
}

export function retrieveRag(query: string, source: KnowledgeSource) {
  return postRag('/api/rag/retrieve', { query, source })
}

export function askRag(query: string, source: KnowledgeSource) {
  return postRag('/api/rag/ask', { query, source })
}

export function askCaseRag(supportCase: SupportCase, source: KnowledgeSource = 'supportai-politicas.txt') {
  return postRag('/api/rag/case', {
    caseId: supportCase.id,
    customerName: supportCase.customerName,
    subject: supportCase.subject,
    message: supportCase.message,
    source,
  })
}
