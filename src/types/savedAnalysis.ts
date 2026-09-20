import type { ImportedAnalysis } from '../components/ResultComparison'

export type SavedAnalysisSource = 'imported' | 'gemini'

export type SavedLlmAnalysis = ImportedAnalysis & {
  id: string
  caseId: string
  customerName: string
  subject: string
  savedAt: string
  source?: SavedAnalysisSource
}
