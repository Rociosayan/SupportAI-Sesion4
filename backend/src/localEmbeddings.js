import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chunkKnowledgeSource } from './chunker.js'
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from './config.js'
import { cosineSimilarity, embedDocument } from './embeddings.js'
import { resolveSourceName } from './knowledge.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const LOCAL_EMBEDDINGS_PATH = path.join(__dirname, '../../data/embeddings.json')

function missingIndexError() {
  const error = new Error(
    'Falta completar la indexación local. No hay embeddings válidos en data/embeddings.json.',
  )
  error.code = 'missing_local_index'
  return error
}

function isValidVector(embedding) {
  return (
    Array.isArray(embedding) &&
    embedding.length === EMBEDDING_DIMENSIONS &&
    embedding.every((value) => Number.isFinite(Number(value)))
  )
}

function asStoredChunk(item) {
  if (item === null || typeof item !== 'object' || Array.isArray(item)) {
    return null
  }
  if (typeof item.source !== 'string' || typeof item.content !== 'string') {
    return null
  }
  if (typeof item.chunkIndex !== 'number' || !isValidVector(item.embedding)) {
    return null
  }
  return {
    source: item.source,
    chunkIndex: item.chunkIndex,
    content: item.content,
    embedding: item.embedding.map((value) => Number(value)),
  }
}

export function loadLocalEmbeddings() {
  if (!existsSync(LOCAL_EMBEDDINGS_PATH)) {
    throw missingIndexError()
  }

  let payload
  try {
    payload = JSON.parse(readFileSync(LOCAL_EMBEDDINGS_PATH, 'utf8'))
  } catch {
    throw missingIndexError()
  }

  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.chunks)
      ? payload.chunks
      : []

  const chunks = rows.map(asStoredChunk).filter(Boolean)
  if (chunks.length === 0) {
    throw missingIndexError()
  }

  return {
    model: payload?.model ?? EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    chunks,
  }
}

export function matchLocalChunks(queryEmbedding, source, matchCount) {
  if (!isValidVector(queryEmbedding)) {
    const error = new Error(`El embedding de consulta debe tener ${EMBEDDING_DIMENSIONS} dimensiones.`)
    error.code = 'invalid_embedding'
    throw error
  }

  const name = resolveSourceName(source)
  const indexed = loadLocalEmbeddings().chunks.filter((chunk) => chunk.source === name)
  if (indexed.length === 0) {
    throw missingIndexError()
  }

  return indexed
    .map((chunk) => ({
      source: chunk.source,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, matchCount)
}

export async function writeLocalEmbeddings(source) {
  const name = resolveSourceName(source)
  const sections = chunkKnowledgeSource(name)
  const nextChunks = []

  for (const chunk of sections) {
    const embedding = await embedDocument(chunk.content)
    nextChunks.push({
      source: chunk.source,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      embedding,
    })
  }

  let previous = []
  if (existsSync(LOCAL_EMBEDDINGS_PATH)) {
    try {
      previous = loadLocalEmbeddings().chunks.filter((chunk) => chunk.source !== name)
    } catch {
      previous = []
    }
  }

  mkdirSync(path.dirname(LOCAL_EMBEDDINGS_PATH), { recursive: true })
  writeFileSync(
    LOCAL_EMBEDDINGS_PATH,
    `${JSON.stringify(
      {
        model: EMBEDDING_MODEL,
        dimensions: EMBEDDING_DIMENSIONS,
        taskType: 'RETRIEVAL_DOCUMENT',
        chunks: [...previous, ...nextChunks],
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  return {
    source: name,
    chunkCount: nextChunks.length,
    storedCount: nextChunks.length,
    path: LOCAL_EMBEDDINGS_PATH,
  }
}
