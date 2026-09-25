import path from 'path'
import { fileURLToPath } from 'url'
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, KNOWLEDGE_SOURCES } from './config.js'
import { indexSource } from './rag.js'
import { loadEnv } from './loadEnv.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv(path.join(__dirname, '../.env'))

const source = KNOWLEDGE_SOURCES.politicas

try {
  const first = await indexSource(source)
  if (first.chunkCount !== 6 || first.storedCount !== 6) {
    throw new Error('La indexación no dejó 6 chunks de supportai-politicas.txt.')
  }
  if (first.chunks.some((chunk) => chunk.embeddingDimensions !== EMBEDDING_DIMENSIONS)) {
    throw new Error(`Un chunk no tiene embedding de ${EMBEDDING_DIMENSIONS} dimensiones.`)
  }

  const second = await indexSource(source)
  if (second.storedCount !== first.storedCount) {
    const error = new Error('La segunda indexación duplicó chunks.')
    error.code = 'duplicate_chunks'
    throw error
  }

  console.log(`ok=true`)
  console.log(`modelo=${EMBEDDING_MODEL}`)
  console.log(`outputDimensionality=${EMBEDDING_DIMENSIONS}`)
  console.log(`taskType=RETRIEVAL_DOCUMENT`)
  console.log(`source=${first.source}`)
  console.log(`chunkCount=${first.chunkCount}`)
  console.log(`storedCount=${second.storedCount}`)
  console.log(`segunda_indexacion_duplico=false`)
  for (const chunk of first.chunks) {
    console.log(`chunkIndex=${chunk.chunkIndex} source=${chunk.source} dims=${chunk.embeddingDimensions}`)
  }
} catch (error) {
  console.error(`ok=false`)
  console.error(`error=${error.code || 'internal'}`)
  console.error(error.message)
  process.exitCode = 1
}
