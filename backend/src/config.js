export const GEMINI_MODEL = 'gemini-3.5-flash-lite'
export const EMBEDDING_MODEL = 'gemini-embedding-001'
export const EMBEDDING_DIMENSIONS = 3072
export const CONTEXT_THRESHOLD = 0.7
export const RAG_MATCH_COUNT = 4
export const PORT = Number(process.env.PORT) || 3001
export const FRONTEND_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']

export const KNOWLEDGE_SOURCES = {
  politicas: 'supportai-politicas.txt',
  curso: 'curso.txt',
}

export const INSUFFICIENT_QUERY =
  'El conocimiento disponible no sustenta una respuesta para esta consulta.'
export const INSUFFICIENT_CASE =
  'El conocimiento disponible no sustenta una respuesta para este caso.'
