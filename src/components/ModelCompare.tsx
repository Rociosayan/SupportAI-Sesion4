import { useEffect, useState } from 'react'
import type { ImportedAnalysis } from './ResultComparison'
import type { SupportCase } from '../types/case'
import {
  fetchLabModels,
  requestModelCompare,
  type LabModelCatalog,
  type LabModelCompare,
  type LabModelResult,
} from '../utils/geminiApi'

const TEMPERATURES = [0, 0.3, 0.7, 1, 1.2] as const

const FIELDS: { key: keyof ImportedAnalysis; label: string }[] = [
  { key: 'categoria', label: 'Categoría' },
  { key: 'prioridad', label: 'Prioridad' },
  { key: 'sentimiento', label: 'Sentimiento' },
  { key: 'intencion', label: 'Intención' },
  { key: 'resumen', label: 'Resumen' },
  { key: 'respuestaSugerida', label: 'Respuesta sugerida' },
]

const QUESTIONS = [
  '¿Las respuestas mantienen la misma categoría?',
  '¿Cambió la prioridad?',
  '¿Cambió el tono?',
  '¿Cuál respuesta es más extensa?',
  '¿Qué diferencias encuentras entre los modelos?',
  '¿La temperatura utilizada fue la misma?',
]

type ModelCompareProps = {
  cases: SupportCase[]
  onBack: () => void
}

type PendingRun = {
  id: string
  label: string
  model: string
}

function formatTemperature(value: number) {
  return value.toFixed(1)
}

function formatLatency(value: number | null) {
  if (value === null) {
    return '—'
  }
  return `${(value / 1000).toFixed(2)} s`
}

function ResultCard({ item, pending }: { item?: LabModelResult; pending?: PendingRun }) {
  const label = item?.label ?? pending?.label ?? 'Modelo'
  const model = item?.model ?? pending?.model ?? ''
  const status = pending ? 'Ejecutando...' : item?.success ? 'Completado' : 'Error'

  return (
    <article className="llm-result">
      <h3>{label}</h3>
      <p className="llm-meta">{model}</p>
      <p className={item && !item.success ? 'llm-error' : 'llm-meta'}>
        {pending ? 'Ejecutando...' : item?.success ? 'Completado' : 'Error'}
      </p>
      {item?.error ? <p className="llm-error">{item.error}</p> : null}
      {item?.analysis
        ? FIELDS.map((field) => (
            <div key={field.key}>
              <p className="llm-field-label">{field.label}</p>
              <p>{item.analysis?.[field.key]}</p>
            </div>
          ))
        : null}
      {item ? (
        <p className="llm-meta">Tiempo: {formatLatency(item.latencyMs)}</p>
      ) : null}
      <span className="sr-only">{status}</span>
    </article>
  )
}

export function ModelCompare({ cases, onBack }: ModelCompareProps) {
  const [caseId, setCaseId] = useState(cases[0]?.id ?? '')
  const [temperature, setTemperature] = useState<(typeof TEMPERATURES)[number]>(0.7)
  const [catalog, setCatalog] = useState<LabModelCatalog | null>(null)
  const [catalogError, setCatalogError] = useState('')
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [pending, setPending] = useState<PendingRun[]>([])
  const [error, setError] = useState('')
  const [result, setResult] = useState<Extract<LabModelCompare, { ok: true }> | null>(null)

  const selected = cases.find((item) => item.id === caseId) ?? cases[0]
  const chosen = (catalog?.models ?? []).filter((item) => selectedModels.includes(item.id))
  const canCompare = (catalog?.models.length ?? 0) >= 2

  useEffect(() => {
    let active = true
    void fetchLabModels().then((loaded) => {
      if (!active) {
        return
      }
      if ('ok' in loaded && loaded.ok === false) {
        setCatalogError(loaded.message)
        return
      }
      if (!('models' in loaded)) {
        return
      }
      setCatalog(loaded)
      setSelectedModels(loaded.models.map((item) => item.id))
    })
    return () => {
      active = false
    }
  }, [])

  function toggleModel(id: string) {
    setSelectedModels((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  async function execute() {
    if (!selected || running || !canCompare || selectedModels.length < 2) {
      return
    }
    setRunning(true)
    setError('')
    setResult(null)
    setPending(
      chosen.map((item) => ({
        id: item.id,
        label: item.label,
        model: item.model,
      })),
    )
    const response = await requestModelCompare(selected.id, temperature, selectedModels)
    setPending([])
    setRunning(false)
    if (!response.ok) {
      setError(response.message)
      return
    }
    setResult(response)
  }

  return (
    <div className="page page-wide">
      <header className="page-header">
        <div>
          <h1>Comparación de modelos</h1>
          <p>Prueba el mismo caso con diferentes modelos manteniendo constantes el prompt y la temperatura.</p>
        </div>
      </header>
      <button type="button" className="button-secondary" onClick={onBack}>
        Volver
      </button>

      <section className="llm-panel">
        <h2>Configuración del experimento</h2>
        <label className="llm-field" htmlFor="compare-case">
          Caso
          <select
            id="compare-case"
            value={selected?.id ?? ''}
            disabled={running}
            onChange={(event) => {
              setCaseId(event.target.value)
              setResult(null)
            }}
          >
            {cases.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} · {item.subject}
              </option>
            ))}
          </select>
        </label>
        {selected ? (
          <dl className="detail-grid">
            <div>
              <dt>Caso</dt>
              <dd>
                {selected.id} · {selected.subject}
              </dd>
            </div>
            <div>
              <dt>Cliente</dt>
              <dd>{selected.customerName}</dd>
            </div>
            <div>
              <dt>Mensaje</dt>
              <dd className="llm-message">{selected.message}</dd>
            </div>
          </dl>
        ) : null}

        <div className="llm-temperature">
          <div className="llm-temperature-head">
            <span>Temperatura</span>
            <strong>{formatTemperature(temperature)}</strong>
          </div>
          <div className="llm-presets" role="group" aria-label="Temperatura">
            {TEMPERATURES.map((value) => (
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

        <fieldset className="llm-model-picks">
          <legend>Modelos disponibles</legend>
          {(catalog?.models ?? []).map((item) => (
            <label key={item.id} className="llm-check">
              <input
                type="checkbox"
                checked={selectedModels.includes(item.id)}
                disabled={running}
                onChange={() => toggleModel(item.id)}
              />
              {item.label} · {item.model}
            </label>
          ))}
        </fieldset>

        <p className="llm-meta">
          Temperatura {formatTemperature(temperature)} para {chosen.map((item) => item.label).join(', ') || 'ningún modelo'}.
        </p>
        {catalogError ? <p className="llm-error">{catalogError}</p> : null}
        {catalog && !canCompare ? (
          <p className="llm-meta">Actualmente hay un único proveedor configurado: Gemini. Se necesita otro proveedor real para comparar.</p>
        ) : null}
        {catalog?.notice && canCompare ? <p className="llm-meta">{catalog.notice}</p> : null}
        <button
          type="button"
          className="analyze-button"
          disabled={running || !canCompare || selectedModels.length < 2}
          onClick={() => void execute()}
        >
          {running ? 'Comparando modelos...' : 'Ejecutar comparación'}
        </button>
      </section>

      {running ? <p className="llm-status">Comparando modelos...</p> : null}
      {error ? (
        <p className="llm-error" role="alert">
          {error}
        </p>
      ) : null}

      {pending.length > 0 ? (
        <div className="llm-result-grid">
          {pending.map((item) => (
            <ResultCard key={item.id} pending={item} />
          ))}
        </div>
      ) : null}

      {result ? (
        <section className="llm-results" aria-label="Comparación de modelos">
          <h2>Resultados</h2>
          <dl className="detail-grid">
            <div>
              <dt>Caso</dt>
              <dd>{result.subject}</dd>
            </div>
            <div>
              <dt>Temperatura</dt>
              <dd>{formatTemperature(result.temperature)}</dd>
            </div>
            <div>
              <dt>Modelos</dt>
              <dd>{result.results.map((item) => item.label).join(', ')}</dd>
            </div>
          </dl>
          <div>
            <p className="llm-field-label">Prompt</p>
            <pre className="llm-prompt">{result.prompt}</pre>
          </div>
          <div className="llm-result-grid">
            {result.results.map((item) => (
              <ResultCard key={item.id} item={item} />
            ))}
          </div>
          {result.results.length > 1 ? (
            <div className="llm-observe">
              <h3>Observa</h3>
              <table className="llm-diff">
                <thead>
                  <tr>
                    <th>Campo</th>
                    {result.results.map((item) => (
                      <th key={item.id}>{item.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FIELDS.map((field) => (
                    <tr key={field.key}>
                      <th>{field.label}</th>
                      {result.results.map((item) => (
                        <td key={item.id}>{item.analysis?.[field.key] ?? '—'}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th>Tiempo</th>
                    {result.results.map((item) => (
                      <td key={item.id}>{formatLatency(item.latencyMs)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="llm-observe">
        <h3>Observa</h3>
        <ul className="llm-questions">
          {QUESTIONS.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
