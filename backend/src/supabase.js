import { EMBEDDING_DIMENSIONS } from './config.js'

function requireSupabase() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, '')
  const key =
    process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) {
    const error = new Error('Faltan SUPABASE_URL o SUPABASE_SECRET_KEY en el .env del backend.')
    error.code = 'missing_supabase'
    throw error
  }
  return { url, key }
}

async function supabaseRequest(pathname, init = {}) {
  const { url, key } = requireSupabase()
  const response = await fetch(`${url}${pathname}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers ?? {}),
    },
  })

  const text = await response.text()
  let body = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }

  if (!response.ok) {
    const error = new Error('Supabase rechazó la solicitud.')
    error.code = 'supabase'
    error.status = response.status
    error.cause = body
    throw error
  }

  return body
}

export function supabaseConfigStatus() {
  try {
    requireSupabase()
    return {
      configured: true,
      embeddingDimensions: EMBEDDING_DIMENSIONS,
    }
  } catch (error) {
    return {
      configured: false,
      embeddingDimensions: EMBEDDING_DIMENSIONS,
      error: error.code,
    }
  }
}

export async function upsertChunk(chunk) {
  if (!Array.isArray(chunk.embedding) || chunk.embedding.length !== EMBEDDING_DIMENSIONS) {
    const error = new Error(`El embedding debe tener ${EMBEDDING_DIMENSIONS} dimensiones.`)
    error.code = 'invalid_embedding'
    throw error
  }

  const rows = await supabaseRequest('/rest/v1/knowledge_chunks?on_conflict=source,chunk_index', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      source: chunk.source,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      embedding: chunk.embedding,
    }),
  })

  const row = Array.isArray(rows) ? rows[0] : rows
  return {
    source: row.source,
    chunkIndex: row.chunk_index,
    content: row.content,
    embeddingDimensions: Array.isArray(row.embedding) ? row.embedding.length : EMBEDDING_DIMENSIONS,
  }
}

export async function matchChunks(queryEmbedding, source, matchCount) {
  const rows = await supabaseRequest('/rest/v1/rpc/match_knowledge_chunks', {
    method: 'POST',
    body: JSON.stringify({
      query_embedding: queryEmbedding,
      match_source: source,
      match_count: matchCount,
    }),
  })

  if (!Array.isArray(rows)) {
    return []
  }

  return rows.map((row) => ({
    source: row.source,
    chunkIndex: Number(row.chunk_index),
    content: row.content,
    score: Number(row.score),
  }))
}

export async function knowledgeTableReady() {
  try {
    const { url, key } = requireSupabase()
    const response = await fetch(`${url}/rest/v1/knowledge_chunks?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })
    return response.ok
  } catch {
    return false
  }
}

export async function countChunksBySource(source) {
  const { url, key } = requireSupabase()
  const response = await fetch(
    `${url}/rest/v1/knowledge_chunks?source=eq.${encodeURIComponent(source)}&select=id`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'count=exact',
      },
    },
  )
  const countHeader = response.headers.get('content-range')
  const match = countHeader?.match(/\/(\d+)$/)
  return match ? Number(match[1]) : 0
}
