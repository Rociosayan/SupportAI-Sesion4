import { useState } from 'react'
import { ManualLab } from '../components/ManualLab'
import { ModelCompare } from '../components/ModelCompare'
import { PageHeader } from '../components/PageHeader'
import type { ImportedAnalysis } from '../components/ResultComparison'
import type { SavedLlmAnalysis } from '../types/savedAnalysis'
import type { SimulatedAnalysis } from '../utils/simulateAnalysis'
import type { SupportCase } from '../types/case'
import {
  requestLabComparison,
  requestLabTemperature,
  type LabRun,
} from '../utils/geminiApi'

const TEMPERATURE_PRESETS = [0, 0.3, 0.7, 1, 1.2] as const
const COMPARISON_TEMPERATURES = [0, 0.7, 1.2] as const

const FIELD_LABELS: { key: keyof ImportedAnalysis; label: string }[] = [
  { key: 'categoria', label: 'Categoría' },
  { key: 'prioridad', label: 'Prioridad' },
  { key: 'sentimiento', label: 'Sentimiento' },
  { key: 'intencion', label: 'Intención' },
  { key: 'resumen', label: 'Resumen' },
  { key: 'respuestaSugerida', label: 'Respuesta sugerida' },
]

type LabView = 'inicio' | 'manual' | 'temperatura' | 'modelos'

type LabProps = {
  cases: SupportCase[]
  simulatedById: Record<string, SimulatedAnalysis>
  importedById: Record<string, ImportedAnalysis>
  analyzingId: string | null
  onAnalyze: (caseItem: SupportCase) => void
  onApplyImported: (caseId: string, data: ImportedAnalysis) => void
  onSaveAnalysis: (record: Omit<SavedLlmAnalysis, 'id' | 'savedAt'>) => void
}

function formatTemperature(value: number) {
  return value.toFixed(1)
}

function changedFields(runs: LabRun[]) {
  const complete = runs.filter((run) => run.analysis)
  if (complete.length < 2) {
    return []
  }
  return FIELD_LABELS.filter(({ key }) => {
    const values = new Set(complete.map((run) => run.analysis?.[key]))
    return values.size > 1
  }).map((field) => field.label)
}

export function LlmLab({
  cases,
  simulatedById,
  importedById,
  analyzingId,
  onAnalyze,
  onApplyImported,
  onSaveAnalysis,
}: LabProps) {
  const [view, setView] = useState<LabView>('inicio')
  const [caseId, setCaseId] = useState(cases[0]?.id ?? '')
  const [temperature, setTemperature] = useState(0.7)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [model, setModel] = useState('')
  const [promptId, setPromptId] = useState('')
  const [runs, setRuns] = useState<LabRun[]>([])

  const selected = cases.find((item) => item.id === caseId) ?? cases[0]

  async function execute(mode: 'single' | 'compare') {
    if (!selected || running) {
      return
    }
    setRunning(true)
    setError('')
    setRuns([])
    setModel('')
    setPromptId('')

    const result =
      mode === 'single'
        ? await requestLabTemperature(selected, temperature)
        : await requestLabComparison(selected, [...COMPARISON_TEMPERATURES])

    setRunning(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setModel(result.model)
    setPromptId(result.promptId)
    setRuns(result.runs)
  }

  if (view === 'inicio') {
    return (
      <div className="page page-wide">
        <PageHeader
          title="Laboratorio LLM"
          subtitle="Experimenta con modelos de lenguaje utilizando los mismos casos de SupportAI."
        />
        <section className="llm-experiments" aria-label="Experimentos">
          <article className="llm-card">
            <p className="llm-kicker">Experimento</p>
            <h2>Integración manual</h2>
            <p>Aprende el flujo de integración manual con un LLM.</p>
            <button type="button" className="button-secondary" onClick={() => setView('manual')}>
              Entrar al experimento
            </button>
          </article>
          <article className="llm-card">
            <p className="llm-kicker">Experimento</p>
            <h2>Temperatura</h2>
            <p>
              Mantén el mismo caso, prompt y modelo. Solo cambia la temperatura para observar cómo
              varía la respuesta.
            </p>
            <button type="button" className="button-secondary" onClick={() => setView('temperatura')}>
              Experimentar
            </button>
          </article>
          <article className="llm-card">
            <p className="llm-kicker">Experimento</p>
            <h2>Comparación de modelos</h2>
            <p>Prueba el mismo caso con diferentes modelos manteniendo constantes el prompt y la temperatura.</p>
            <button type="button" className="button-secondary" onClick={() => setView('modelos')}>
              Comparar modelos
            </button>
          </article>
        </section>
      </div>
    )
  }

  if (view === 'manual') {
    return (
      <ManualLab
        cases={cases}
        simulatedById={simulatedById}
        importedById={importedById}
        analyzingId={analyzingId}
        onAnalyze={onAnalyze}
        onApplyImported={onApplyImported}
        onSaveAnalysis={onSaveAnalysis}
        onBack={() => setView('inicio')}
      />
    )
  }

  if (view === 'modelos') {
    return <ModelCompare cases={cases} onBack={() => setView('inicio')} />
  }

  const differences = changedFields(runs)

  return (
    <div className="page page-wide">
      <PageHeader
          title="Experimento de temperatura"
          subtitle="Mismo caso, mismo prompt y mismo modelo. La única variable es la temperatura."
      />
      <button type="button" className="button-secondary" onClick={() => setView('inicio')}>
        Volver
      </button>

      <section className="llm-panel">
        <label className="llm-field" htmlFor="lab-case">
          Caso
          <select
            id="lab-case"
            value={selected?.id ?? ''}
            onChange={(event) => setCaseId(event.target.value)}
            disabled={running}
          >
            {cases.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} · {item.customerName}
              </option>
            ))}
          </select>
        </label>
        {selected ? (
          <dl className="detail-grid">
            <div>
              <dt>Caso seleccionado</dt>
              <dd>{selected.id}</dd>
            </div>
            <div>
              <dt>Cliente</dt>
              <dd>{selected.customerName}</dd>
            </div>
            <div>
              <dt>Asunto</dt>
              <dd>{selected.subject}</dd>
            </div>
            <div>
              <dt>Mensaje</dt>
              <dd className="llm-message">{selected.message}</dd>
            </div>
          </dl>
        ) : null}
      </section>

      <section className="llm-panel">
        <h2>Configuración</h2>
        <p className="llm-meta">Modelo: Gemini</p>
        <div className="llm-temperature">
          <div className="llm-temperature-head">
            <span>Temperatura</span>
            <strong>{formatTemperature(temperature)}</strong>
          </div>
          <input
            type="range"
            min={0}
            max={1.2}
            step={0.1}
            value={temperature}
            aria-label="Temperatura"
            disabled={running}
            onChange={(event) => setTemperature(Number(event.target.value))}
          />
          <div className="llm-presets">
            {TEMPERATURE_PRESETS.map((value) => (
              <button
                key={value}
                type="button"
                className={temperature === value ? 'is-active' : ''}
                disabled={running}
                onClick={() => setTemperature(value)}
              >
                {formatTemperature(value)}
              </button>
            ))}
          </div>
        </div>
        <div className="rag-actions">
          <button
            type="button"
            className="analyze-button"
            disabled={running || !selected}
            onClick={() => void execute('single')}
          >
            {running ? 'Ejecutando…' : 'Ejecutar'}
          </button>
          <button
            type="button"
            className="button-secondary"
            disabled={running || !selected}
            onClick={() => void execute('compare')}
          >
            {running ? 'Ejecutando…' : 'Ejecutar comparación'}
          </button>
        </div>
        <p className="llm-meta">Comparación fija: 0.0, 0.7 y 1.2 sobre el caso seleccionado.</p>
      </section>

      {running ? <p className="llm-status">Consultando Gemini…</p> : null}
      {error ? (
        <p className="llm-error" role="alert">
          {error}
        </p>
      ) : null}

      {runs.length > 0 ? (
        <section className="llm-results" aria-label="Resultados">
          {model || promptId ? (
            <p className="llm-meta">
              Modelo {model || 'Gemini'}
              {promptId ? ` · mismo prompt ${promptId}` : ''}
            </p>
          ) : null}
          <div className="llm-result-grid">
            {runs.map((run) => (
              <article key={run.temperature} className="llm-result">
                <h3>Temperatura {formatTemperature(run.temperature)}</h3>
                {run.error ? <p className="llm-error">{run.error}</p> : null}
                {run.analysis
                  ? FIELD_LABELS.map((field) => (
                      <div key={field.key}>
                        <p className="llm-field-label">{field.label}</p>
                        <p>{run.analysis?.[field.key]}</p>
                      </div>
                    ))
                  : null}
              </article>
            ))}
          </div>
          {runs.length > 1 ? (
            <div className="llm-observe">
              <h3>¿Qué cambió?</h3>
              <p>
                {differences.length > 0
                  ? `Campos distintos entre las respuestas: ${differences.join(', ')}.`
                  : 'Los campos devueltos coinciden en las respuestas obtenidas.'}
              </p>
              <p>Observa variación, consistencia, redacción y nivel de detalle.</p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
