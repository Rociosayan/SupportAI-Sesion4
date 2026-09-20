import path from 'path'
import { fileURLToPath } from 'url'
import { indexAllSources } from './rag.js'
import { loadEnv } from './loadEnv.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv(path.join(__dirname, '../.env'))

try {
  const result = await indexAllSources()
  for (const source of result.sources) {
    console.log(`source=${source.source} chunks=${source.chunkCount} stored=${source.storedCount}`)
  }
} catch (error) {
  console.error(`error=${error.code || 'internal'}`)
  console.error(error.message)
  process.exitCode = 1
}
