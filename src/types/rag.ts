export type KnowledgeSource = 'supportai-politicas.txt' | 'curso.txt'

export type RagFragment = {
  source: string
  chunkIndex: number
  content: string
  score: number
}

export type RagResult = {
  query: string
  source: string
  fragments: RagFragment[]
  bestScore: number
  contextoSuficiente: boolean
  threshold: number
  message: string | null
  answer: string | null
  sources: string[]
}

export type HumanReview = 'rag_better' | 'no_diff' | 'needs_review'
