import { readKnowledgeSource } from './knowledge.js'

function splitNaturalSections(content) {
  return content
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.replace(/\s+\n/g, '\n').trim())
    .filter(Boolean)
}

export function chunkKnowledgeSource(source) {
  const file = readKnowledgeSource(source)
  const sections = splitNaturalSections(file.content)

  return sections.map((content, chunkIndex) => ({
    source: file.source,
    chunkIndex,
    content,
  }))
}
