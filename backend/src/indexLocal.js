import path from 'path'
import { fileURLToPath } from 'url'
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, KNOWLEDGE_SOURCES } from './config.js'
import { loadEnv } from './loadEnv.js'
import { writeLocalEmbeddings } from './localEmbeddings.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv(path.join(__dirname, '../.env'))

const source = process.argv[2]?.trim() || KNOWLEDGE_SOURCES.politicas

try {
  const result = await writeLocalEmbeddings(source)
  console.log(`ok=true`)
  console.log(`modelo=${EMBEDDING_MODEL}`)
  console.log(`outputDimensionality=${EMBEDDING_DIMENSIONS}`)
  console.log(`taskType=RETRIEVAL_DOCUMENT`)
  console.log(`source=${result.source}`)
  console.log(`chunkCount=${result.chunkCount}`)
  console.log(`path=${result.path}`)
} catch (error) {
  console.error(`ok=false`)
  console.error(`error=${error.code || 'internal'}`)
  console.error(error.message)
  process.exitCode = 1
}
