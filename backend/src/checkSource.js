import path from 'path'
import { fileURLToPath } from 'url'
import { chunkKnowledgeSource } from './chunker.js'
import { KNOWLEDGE_SOURCES } from './config.js'
import { readKnowledgeSource } from './knowledge.js'
import { loadEnv } from './loadEnv.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv(path.join(__dirname, '../.env'))

const politicas = readKnowledgeSource(KNOWLEDGE_SOURCES.politicas)
console.log(`fuente=${politicas.source}`)
console.log(`encontrada=true`)
console.log(`bytes=${politicas.bytes}`)
console.log('--- contenido original ---')
console.log(politicas.content)
console.log('--- chunks ---')
const chunks = chunkKnowledgeSource(KNOWLEDGE_SOURCES.politicas)
console.log(`chunkCount=${chunks.length}`)
for (const chunk of chunks) {
  console.log(`#${chunk.chunkIndex} source=${chunk.source}`)
  console.log(chunk.content)
  console.log('---')
}
