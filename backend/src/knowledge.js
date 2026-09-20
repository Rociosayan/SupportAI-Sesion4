import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { KNOWLEDGE_SOURCES } from './config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const KNOWLEDGE_DIR = path.join(__dirname, '../../knowledge')

const ALLOWED = new Set(Object.values(KNOWLEDGE_SOURCES))

export function resolveSourceName(source) {
  const name = String(source ?? '').trim()
  if (!ALLOWED.has(name)) {
    const error = new Error('Fuente de conocimiento no permitida.')
    error.code = 'invalid_source'
    throw error
  }
  return name
}

export function knowledgePath(source) {
  return path.join(KNOWLEDGE_DIR, resolveSourceName(source))
}

export function readKnowledgeSource(source) {
  const name = resolveSourceName(source)
  const filePath = knowledgePath(name)
  if (!existsSync(filePath)) {
    const error = new Error(`No se encontró ${name} en knowledge/.`)
    error.code = 'missing_source'
    throw error
  }

  const content = readFileSync(filePath, 'utf8')
  return {
    source: name,
    path: filePath,
    content,
    bytes: Buffer.byteLength(content, 'utf8'),
    lines: content.split(/\r?\n/).length,
  }
}

export function listKnowledgeSources() {
  return Object.values(KNOWLEDGE_SOURCES).map((source) => {
    try {
      const file = readKnowledgeSource(source)
      return {
        source: file.source,
        exists: true,
        bytes: file.bytes,
        lines: file.lines,
      }
    } catch {
      return { source, exists: false, bytes: 0, lines: 0 }
    }
  })
}
