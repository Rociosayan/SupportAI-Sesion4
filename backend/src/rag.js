import {
  CONTEXT_THRESHOLD,
  INSUFFICIENT_CASE,
  INSUFFICIENT_QUERY,
  KNOWLEDGE_SOURCES,
  RAG_MATCH_COUNT,
} from './config.js'
import { chunkKnowledgeSource } from './chunker.js'
import { embedDocument, embedQuery } from './embeddings.js'
import { generateText } from './geminiService.js'
import { resolveSourceName } from './knowledge.js'
import { matchLocalChunks } from './localEmbeddings.js'
import { countChunksBySource, matchChunks, upsertChunk } from './supabase.js'

function applyContextRule(fragments) {
  const bestScore = fragments.reduce((best, item) => Math.max(best, item.score), 0)
  const contextoSuficiente = fragments.length > 0 && bestScore >= CONTEXT_THRESHOLD
  return { contextoSuficiente, bestScore }
}

export async function indexSource(source) {
  const name = resolveSourceName(source)
  const chunks = chunkKnowledgeSource(name)
  const saved = []

  for (const chunk of chunks) {
    const embedding = await embedDocument(chunk.content)
    const row = await upsertChunk({ ...chunk, embedding })
    saved.push({
      source: row.source,
      chunkIndex: row.chunkIndex,
      content: row.content,
      embeddingDimensions: row.embeddingDimensions,
    })
  }

  return {
    source: name,
    chunkCount: saved.length,
    storedCount: await countChunksBySource(name),
    chunks: saved,
  }
}

export async function indexAllSources() {
  const politicas = await indexSource(KNOWLEDGE_SOURCES.politicas)
  const curso = await indexSource(KNOWLEDGE_SOURCES.curso)
  return { sources: [politicas, curso] }
}

export async function retrieveContext(query, source, { store = 'local' } = {}) {
  const name = resolveSourceName(source)
  const text = String(query ?? '').trim()
  if (!text) {
    const error = new Error('Falta la consulta.')
    error.code = 'invalid_query'
    throw error
  }

  const embedding = await embedQuery(text)
  const fragments =
    store === 'local'
      ? matchLocalChunks(embedding, name, RAG_MATCH_COUNT)
      : await matchChunks(embedding, name, RAG_MATCH_COUNT)
  const { contextoSuficiente, bestScore } = applyContextRule(fragments)

  return {
    query: text,
    source: name,
    store,
    fragments,
    bestScore,
    contextoSuficiente,
    threshold: CONTEXT_THRESHOLD,
    message: contextoSuficiente ? null : INSUFFICIENT_QUERY,
  }
}

function buildRagPrompt(question, fragments) {
  const context = fragments
    .map(
      (item) =>
        `[fuente=${item.source} chunk=${item.chunkIndex} score=${item.score.toFixed(3)}]\n${item.content}`,
    )
    .join('\n\n')

  return [
    'ROL',
    'Eres un asistente de SupportAI. Respondes solo con el conocimiento interno recuperado.',
    '',
    'PREGUNTA',
    question,
    '',
    'CONTEXTO RECUPERADO',
    context,
    '',
    'RESTRICCIONES',
    '- Las políticas internas o datos del curso solo pueden afirmarse si están sustentados por el contexto.',
    '- No inventes plazos, garantías, bloques, horas ni reglas ausentes.',
    '- No uses conocimiento general para completar huecos.',
    '- Menciona la fuente cuando cites una regla.',
    '- Responde en español, de forma breve y profesional.',
  ].join('\n')
}

export async function answerWithRag(query, source, { caseMode = false, store = 'local' } = {}) {
  const retrieved = await retrieveContext(query, source, { store })
  const insufficientMessage = caseMode ? INSUFFICIENT_CASE : INSUFFICIENT_QUERY

  if (!retrieved.contextoSuficiente) {
    return {
      ...retrieved,
      message: insufficientMessage,
      answer: null,
      sources: [],
    }
  }

  const answer = await generateText(buildRagPrompt(retrieved.query, retrieved.fragments))
  const sources = [...new Set(retrieved.fragments.map((item) => item.source))]

  return {
    ...retrieved,
    message: null,
    answer,
    sources,
  }
}

export function buildCaseQuery(supportCase) {
  const customerName = String(supportCase?.customerName ?? '').trim()
  const subject = String(supportCase?.subject ?? '').trim()
  const message = String(supportCase?.message ?? '').trim()
  if (!subject || !message) {
    const error = new Error('Faltan asunto o mensaje del caso.')
    error.code = 'invalid_case'
    throw error
  }

  return [
    customerName ? `Cliente: ${customerName}` : null,
    `Asunto: ${subject}`,
    `Mensaje: ${message}`,
  ]
    .filter(Boolean)
    .join('\n')
}
