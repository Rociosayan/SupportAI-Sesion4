import { useRef, useState } from 'react'
import { Layout } from './components/Layout'
import type { ImportedAnalysis } from './components/ResultComparison'
import { initialCases } from './data/cases'
import { AiLab } from './pages/AiLab'
import { Cases } from './pages/Cases'
import { Customers } from './pages/Customers'
import { Diagnosis } from './pages/Diagnosis'
import { Documents } from './pages/Documents'
import { History } from './pages/History'
import { LlmLab } from './pages/LlmLab'
import { Home } from './pages/Home'
import { Orders } from './pages/Orders'
import { Profile } from './pages/Profile'
import type { CaseStatus, PageId, SupportCase } from './types/case'
import type { SavedLlmAnalysis } from './types/savedAnalysis'
import type { RagResult } from './types/rag'
import { readAnalysis, requestGeminiAnalysis, type GeminiKnowledge } from './utils/geminiApi'
import { askCaseRag } from './utils/ragApi'
import { simulateAnalysis, type SimulatedAnalysis } from './utils/simulateAnalysis'
import './App.css'

function App() {
  const [page, setPage] = useState<PageId>('inicio')
  const [cases, setCases] = useState<SupportCase[]>(initialCases)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [savedAnalyses, setSavedAnalyses] = useState<SavedLlmAnalysis[]>([])
  const [simulatedById, setSimulatedById] = useState<Record<string, SimulatedAnalysis>>({})
  const [importedById, setImportedById] = useState<Record<string, ImportedAnalysis>>({})
  const [geminiById, setGeminiById] = useState<Record<string, ImportedAnalysis>>({})
  const [geminiKnowledgeById, setGeminiKnowledgeById] = useState<Record<string, GeminiKnowledge>>(
    {},
  )
  const [geminiErrorById, setGeminiErrorById] = useState<Record<string, string>>({})
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [geminiAnalyzingId, setGeminiAnalyzingId] = useState<string | null>(null)
  const [ragById, setRagById] = useState<Record<string, RagResult>>({})
  const [ragErrorById, setRagErrorById] = useState<Record<string, string>>({})
  const [ragAnalyzingId, setRagAnalyzingId] = useState<string | null>(null)
  const ragRequestToken = useRef(0)

  function handleStatusChange(id: string, status: CaseStatus) {
    setCases((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    )
  }

  function clearRagState() {
    ragRequestToken.current += 1
    setRagById({})
    setRagErrorById({})
    setRagAnalyzingId(null)
  }

  function handleSelect(id: string) {
    if (selectedId && selectedId !== id) {
      clearRagState()
    }
    setSelectedId(id)
    setCases((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item)),
    )
  }

  function openCase(id: string) {
    if (selectedId && selectedId !== id) {
      clearRagState()
    }
    setSelectedId(id)
    setPage('casos')
  }

  function handleAnalyze(caseItem: SupportCase) {
    setAnalyzingId(caseItem.id)
    window.setTimeout(() => {
      const analysis = simulateAnalysis(caseItem.message, caseItem.subject)
      setSimulatedById((stored) => ({ ...stored, [caseItem.id]: analysis }))
      setAnalyzingId((current) => (current === caseItem.id ? null : current))
    }, 700)
  }

  function handleApplyImported(caseId: string, data: ImportedAnalysis) {
    setImportedById((stored) => ({ ...stored, [caseId]: data }))
  }

  async function handleAnalyzeGemini(caseItem: SupportCase) {
    const caseId = caseItem.id
    if (geminiAnalyzingId === caseId) {
      return
    }

    setGeminiAnalyzingId(caseId)
    setGeminiById((stored) => {
      const next = { ...stored }
      delete next[caseId]
      return next
    })
    setGeminiErrorById((stored) => {
      const next = { ...stored }
      delete next[caseId]
      return next
    })
    setGeminiKnowledgeById((stored) => {
      const next = { ...stored }
      delete next[caseId]
      return next
    })

    const result = await requestGeminiAnalysis(caseItem)

    if (!result.ok) {
      setGeminiById((stored) => {
        const next = { ...stored }
        delete next[caseId]
        return next
      })
      setGeminiKnowledgeById((stored) => {
        const next = { ...stored }
        delete next[caseId]
        return next
      })
      setGeminiErrorById((stored) => ({ ...stored, [caseId]: result.message }))
      setGeminiAnalyzingId((current) => (current === caseId ? null : current))
      return
    }

    setGeminiById((stored) => ({ ...stored, [caseId]: result.analysis }))
    setGeminiKnowledgeById((stored) => ({ ...stored, [caseId]: result.knowledge }))
    setGeminiAnalyzingId((current) => (current === caseId ? null : current))
  }

  async function handleAnalyzeRag(caseItem: SupportCase) {
    const caseId = caseItem.id
    if (ragAnalyzingId === caseId) {
      return
    }

    const token = ++ragRequestToken.current
    setRagAnalyzingId(caseId)
    setRagById({})
    setRagErrorById({})

    const result = await askCaseRag(caseItem)
    if (token !== ragRequestToken.current) {
      return
    }

    if (!result.ok) {
      setRagErrorById({ [caseId]: result.message })
      setRagAnalyzingId((current) => (current === caseId ? null : current))
      return
    }

    setRagById({ [caseId]: result.result })
    setRagAnalyzingId((current) => (current === caseId ? null : current))
  }

  function handleSaveAnalysis(record: Omit<SavedLlmAnalysis, 'id' | 'savedAt'>) {
    const complete = readAnalysis(record)
    if (!complete) {
      return
    }

    setSavedAnalyses((current) => [
      {
        ...record,
        ...complete,
        source: record.source === 'gemini' ? 'gemini' : 'imported',
        id: record.source === 'gemini' ? `GEM-${Date.now()}` : `LLM-${Date.now()}`,
        savedAt: new Date().toISOString(),
      },
      ...current,
    ])
  }

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {page === 'inicio' && (
        <Home
          cases={cases}
          analyzedCount={Object.keys(geminiById).length}
          onOpenCase={openCase}
          onNavigate={setPage}
        />
      )}
      {page === 'perfil' && <Profile />}
      {page === 'casos' && (
        <Cases
          cases={cases}
          selectedId={selectedId}
          onSelect={handleSelect}
          onStatusChange={handleStatusChange}
          onSaveAnalysis={handleSaveAnalysis}
          geminiById={geminiById}
          geminiKnowledgeById={geminiKnowledgeById}
          geminiErrorById={geminiErrorById}
          geminiAnalyzingId={geminiAnalyzingId}
          ragById={ragById}
          ragErrorById={ragErrorById}
          ragAnalyzingId={ragAnalyzingId}
          onAnalyzeGemini={handleAnalyzeGemini}
          onAnalyzeRag={handleAnalyzeRag}
        />
      )}
      {page === 'diagnostico' && (
        <Diagnosis
          cases={cases}
          selectedId={selectedId}
          onSelect={handleSelect}
          simulatedById={simulatedById}
          analyzingId={analyzingId}
          onAnalyze={handleAnalyze}
        />
      )}
      {page === 'historial' && (
        <History
          cases={cases}
          selectedId={selectedId}
          onSelect={handleSelect}
          onStatusChange={handleStatusChange}
          savedAnalyses={savedAnalyses}
          geminiById={geminiById}
          geminiKnowledgeById={geminiKnowledgeById}
          geminiErrorById={geminiErrorById}
          geminiAnalyzingId={geminiAnalyzingId}
          ragById={ragById}
          ragErrorById={ragErrorById}
          ragAnalyzingId={ragAnalyzingId}
          onAnalyzeGemini={handleAnalyzeGemini}
          onAnalyzeRag={handleAnalyzeRag}
          onSaveAnalysis={handleSaveAnalysis}
        />
      )}
      {page === 'ia-lab' && <AiLab />}
      {page === 'laboratorio' && (
        <LlmLab
          cases={cases}
          simulatedById={simulatedById}
          importedById={importedById}
          analyzingId={analyzingId}
          onAnalyze={handleAnalyze}
          onApplyImported={handleApplyImported}
          onSaveAnalysis={handleSaveAnalysis}
        />
      )}
      {page === 'clientes' && <Customers cases={cases} onOpenCase={openCase} />}
      {page === 'pedidos' && <Orders cases={cases} onOpenCase={openCase} />}
      {page === 'documentos' && <Documents />}
    </Layout>
  )
}

export default App
