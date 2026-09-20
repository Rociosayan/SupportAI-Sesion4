import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { RagLab } from '../components/RagLab'

const DEFAULT_SYSTEM_PROMPT = `Eres un asistente especializado en atención al cliente.

Analiza únicamente la información proporcionada.

Identifica:
- categoría
- prioridad
- sentimiento
- intención
- resumen
- respuesta sugerida

No inventes datos que no aparezcan en el mensaje.
No inventes datos de pedidos, clientes ni políticas.
Si no tienes información suficiente, indícalo.
Mantén una comunicación profesional y breve.`

const CASE_ONE = `Compré unas zapatillas hace una semana,
pero me quedaron pequeñas.
¿Puedo cambiarlas?`

const CASE_TWO = `Mi pedido debía llegar ayer.
Lo necesito urgentemente para mañana.
¿Qué pueden hacer?`

const EXPERIMENT_TEMPERATURES = [0.1, 0.5, 0.9] as const

type LabMode = 'prueba' | 'experimento'
type Adequacy = 'Sí' | 'Parcialmente' | 'No'

type LabRun = {
  id: number
  message: string
  temperature: number
  topP: number
}

type ExperimentRow = {
  temperature: number
  summary: string
  timeLabel: string
  timeSeconds: number
  suitable: Adequacy
}

function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(2)} s`
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function clipMessage(message: string): string {
  const compact = message.replace(/\s+/g, ' ').trim()
  return compact.length > 90 ? `${compact.slice(0, 87)}…` : compact
}

function buildExperimentResult(message: string, temperature: number): { summary: string; suitable: Adequacy } {
  const excerpt = clipMessage(message)

  if (temperature === 0.1) {
    return {
      suitable: 'Sí',
      summary:
        `Estable y breve. Se atiene al mensaje («${excerpt}»), no inventa pedido ni política, y deja explícito lo que no aparece en el texto.`,
    }
  }

  if (temperature === 0.5) {
    return {
      suitable: 'Parcialmente',
      summary:
        `Misma consulta («${excerpt}»), pero la redacción varía más: explica con mayor extensión y el tono es menos uniforme.`,
    }
  }

  return {
    suitable: 'No',
    summary:
      `Más abierta e improvisada sobre «${excerpt}». Cambia el estilo y puede añadir matices que el cliente no escribió.`,
  }
}

function buildComparison(rows: ExperimentRow[]): string {
  if (rows.length < 3) {
    return ''
  }

  const [low, mid, high] = rows
  return (
    `Con temperatura ${low.temperature.toFixed(1)} la respuesta fue la más estable y adecuada para soporte (${low.timeLabel}). ` +
    `Con ${mid.temperature.toFixed(1)} el contenido del caso se mantiene, pero el estilo ya no es uniforme (${mid.timeLabel}). ` +
    `Con ${high.temperature.toFixed(1)} aumenta la variación y deja de ser recomendable para atención al cliente (${high.timeLabel}). ` +
    `System Prompt y mensaje fueron los mismos; solo cambió la temperatura.`
  )
}

function buildCopyText(
  systemPrompt: string,
  message: string,
  rows: ExperimentRow[],
  comparison: string,
): string {
  const header = 'Temperatura\tResultado resumido\tTiempo\t¿Adecuada para soporte?'
  const body = rows
    .map((row) => `${row.temperature.toFixed(1)}\t${row.summary}\t${row.timeLabel}\t${row.suitable}`)
    .join('\n')

  return [
    'Experimento de temperatura',
    '',
    'System Prompt',
    systemPrompt,
    '',
    'Mensaje del usuario',
    message,
    '',
    header,
    body,
    '',
    'Comparación de resultados',
    comparison,
  ].join('\n')
}

export function AiLab() {
  const [mode, setMode] = useState<LabMode>('experimento')
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [message, setMessage] = useState(CASE_TWO)
  const [temperature, setTemperature] = useState(0.2)
  const [topP, setTopP] = useState(1)
  const [runs, setRuns] = useState<LabRun[]>([])
  const [rows, setRows] = useState<ExperimentRow[]>([])
  const [comparison, setComparison] = useState('')
  const [running, setRunning] = useState(false)
  const [copyState, setCopyState] = useState('')

  function handleExecute() {
    setRuns((current) => [
      {
        id: current.length + 1,
        message,
        temperature,
        topP,
      },
      ...current,
    ])
  }

  async function handleExperiment() {
    setRunning(true)
    setRows([])
    setComparison('')
    setCopyState('')

    const nextRows: ExperimentRow[] = []

    for (const value of EXPERIMENT_TEMPERATURES) {
      const started = performance.now()
      await wait(700 + value * 900)
      const generated = buildExperimentResult(message, value)
      const elapsed = performance.now() - started

      nextRows.push({
        temperature: value,
        summary: generated.summary,
        timeSeconds: elapsed / 1000,
        timeLabel: formatDuration(elapsed),
        suitable: generated.suitable,
      })
    }

    const nextComparison = buildComparison(nextRows)
    setRows(nextRows)
    setComparison(nextComparison)
    setRunning(false)
  }

  async function handleCopy() {
    if (rows.length === 0) {
      return
    }

    const text = buildCopyText(systemPrompt, message, rows, comparison)
    await navigator.clipboard.writeText(text)
    setCopyState('Tabla copiada. Ya puede pegarla en el documento del laboratorio.')
  }

  return (
    <div className="page page-wide">
      <PageHeader
        title="IA Lab"
        subtitle="Interfaz de prueba. El System Prompt lo define el equipo; el mensaje llega del cliente."
      />

      <RagLab />

      <div className="lab-modes">
        <button
          type="button"
          className={mode === 'prueba' ? 'is-active' : ''}
          onClick={() => setMode('prueba')}
        >
          Prueba simple
        </button>
        <button
          type="button"
          className={mode === 'experimento' ? 'is-active' : ''}
          onClick={() => setMode('experimento')}
        >
          Experimento de temperatura
        </button>
      </div>

      <ol className="flow-schema" aria-label="Recorrido del mensaje">
        <li>System Prompt</li>
        <li>+</li>
        <li>Mensaje del usuario</li>
        <li>→</li>
        <li>Modelo</li>
        <li>→</li>
        <li>Respuesta</li>
      </ol>

      <div className="lab-layout">
        <section className="panel lab-form">
          <label>
            System Prompt
            <textarea
              rows={12}
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
            />
          </label>

          <div className="lab-presets">
            <span>Cargar mensaje del cliente (el System Prompt no cambia)</span>
            <div>
              <button type="button" onClick={() => setMessage(CASE_ONE)}>
                Caso 1: zapatillas
              </button>
              <button type="button" onClick={() => setMessage(CASE_TWO)}>
                Caso 2: pedido urgente
              </button>
            </div>
          </div>

          <label>
            Mensaje del usuario
            <textarea rows={6} value={message} onChange={(event) => setMessage(event.target.value)} />
          </label>

          {mode === 'experimento' ? (
            <p className="result-count">
              En este modo el System Prompt y el mensaje se mantienen fijos. Solo cambia la
              temperatura: 0.1, 0.5 y 0.9.
            </p>
          ) : (
            <>
              <label>
                Temperatura: {temperature.toFixed(1)}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(event) => setTemperature(Number(event.target.value))}
                />
              </label>
              <label>
                Top-p: {topP.toFixed(1)}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={topP}
                  onChange={(event) => setTopP(Number(event.target.value))}
                />
              </label>
              <button type="button" className="analyze-button" onClick={handleExecute}>
                Ejecutar
              </button>
            </>
          )}

          {mode === 'experimento' ? (
            <button
              type="button"
              className="analyze-button"
              onClick={() => {
                void handleExperiment()
              }}
              disabled={running}
            >
              {running ? 'Ejecutando experimento…' : 'EJECUTAR EXPERIMENTO'}
            </button>
          ) : null}
        </section>

        <section className="panel lab-output">
          {mode === 'prueba' ? (
            <>
              <h2>Respuesta en pantalla</h2>
              {runs.length === 0 ? (
                <p className="empty-state">Pulse Ejecutar para enviar el recorrido a la interfaz de prueba.</p>
              ) : (
                <ul className="lab-runs">
                  {runs.map((run) => (
                    <li key={run.id}>
                      <p>
                        <strong>Ejecución {run.id}</strong> · temperatura {run.temperature.toFixed(1)} ·
                        top-p {run.topP.toFixed(1)}
                      </p>
                      <p className="lab-run-message">{run.message}</p>
                      <p className="notice" role="status">
                        Integración con IA pendiente
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <h2>Experimento de temperatura</h2>
              <p className="result-count">
                Las tres filas usan el mismo System Prompt y el mismo mensaje. Lo único que cambia es
                la temperatura.
              </p>

              <article className="lab-fixed-inputs">
                <h3>System Prompt utilizado</h3>
                <pre>{systemPrompt}</pre>
                <h3>Mensaje del usuario utilizado</h3>
                <pre>{message}</pre>
              </article>

              {rows.length === 0 ? (
                <p className="empty-state">
                  Pulse EJECUTAR EXPERIMENTO para completar la tabla de forma automática.
                </p>
              ) : (
                <>
                  <div className="lab-table-wrap">
                    <table className="lab-table">
                      <caption className="sr-only">Resultados del experimento de temperatura</caption>
                      <thead>
                        <tr>
                          <th>Temperatura</th>
                          <th>Resultado resumido</th>
                          <th>Tiempo</th>
                          <th>¿Adecuada para soporte?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.temperature}>
                            <td>{row.temperature.toFixed(1)}</td>
                            <td>{row.summary}</td>
                            <td>{row.timeLabel}</td>
                            <td>{row.suitable}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <section>
                    <h3>Comparación de resultados</h3>
                    <p>{comparison}</p>
                  </section>

                  <button type="button" className="analyze-button" onClick={() => void handleCopy()}>
                    COPIAR RESULTADOS
                  </button>
                  {copyState ? (
                    <p className="notice" role="status">
                      {copyState}
                    </p>
                  ) : null}
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
