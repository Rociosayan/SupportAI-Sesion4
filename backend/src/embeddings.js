import { GoogleGenAI } from '@google/genai'
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from './config.js'

function requireApiKey() {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    const error = new Error('missing_api_key')
    error.code = 'missing_api_key'
    throw error
  }
  return apiKey
}

function readEmbedding(response) {
  const first = response?.embeddings?.[0] ?? response?.embedding
  const values = first?.values
  if (!Array.isArray(values)) {
    return []
  }
  return values.map((value) => Number(value))
}

export async function embedText(text, taskType) {
  const apiKey = requireApiKey()
  const ai = new GoogleGenAI({ apiKey })

  let response
  try {
    response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
      config: {
        taskType,
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    })
  } catch (cause) {
    if (cause?.code === 'missing_api_key') {
      throw cause
    }
    const error = new Error('No se pudo generar el embedding.')
    error.code = cause?.status === 429 ? 'rate_limit' : 'provider'
    error.status = cause?.status ?? 502
    error.cause = cause
    throw error
  }

  const values = readEmbedding(response)
  if (values.length !== EMBEDDING_DIMENSIONS) {
    const error = new Error(
      `El embedding no tiene ${EMBEDDING_DIMENSIONS} dimensiones.`,
    )
    error.code = 'invalid_embedding'
    error.status = 502
    throw error
  }

  return values
}

export function embedDocument(text) {
  return embedText(text, 'RETRIEVAL_DOCUMENT')
}

export function embedQuery(text) {
  return embedText(text, 'RETRIEVAL_QUERY')
}
