import { chunkKnowledgeSource } from './chunker.js'
import { KNOWLEDGE_SOURCES } from './config.js'

const chunks = chunkKnowledgeSource(KNOWLEDGE_SOURCES.politicas)
console.log(`source=${KNOWLEDGE_SOURCES.politicas}`)
console.log(`chunkCount=${chunks.length}`)
console.log('--- chunks ---')
for (const chunk of chunks) {
  console.log(`source=${chunk.source} chunkIndex=${chunk.chunkIndex}`)
  console.log(chunk.content)
  console.log('---')
}
