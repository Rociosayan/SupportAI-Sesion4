import type { ImportedAnalysis } from '../components/ResultComparison'
import type { SupportCase } from '../types/case'
import type { RagFragment } from '../types/rag'

export const BACKEND_ORIGIN = import.meta.env.DEV ? 'http://localhost:3001' : ''
export const GEMINI_ANALYZE_URL = `${BACKEND_ORIGIN}/api/analizar`

export type GeminiKnowledge = {
  contextoSuficiente: boolean
  fragments: RagFragment[]
  message: string | null
}

export type GeminiAnalyzeResult =
  | { ok: true; analysis: ImportedAnalysis; knowledge: GeminiKnowledge }
  | { ok: false; message: string }

const ERROR_MESSAGES = {
  missing_api_key: 'Falta la credencial de Gemini. Configúrala en el archivo .env del backend.',
  invalid_api_key: 'La credencial de Gemini no es válida.',
  rate_limit: 'Se alcanzó el límite de uso de Gemini. Intenta más tarde.',
  network: 'No se pudo conectar con Gemini. Comprueba la conexión a internet.',
  unavailable: 'El servicio de Gemini no está disponible en este momento.',
  empty_response: 'Gemini no devolvió contenido para analizar.',
  invalid_json: 'Gemini devolvió una respuesta con formato no válido.',
  incomplete: 'La respuesta de Gemini está incompleta.',
  internal: 'El backend no pudo completar el análisis.',
  model_unavailable: 'El modelo de Gemini configurado no está disponible.',
  invalid_case: 'Faltan datos mínimos del caso (cliente, asunto o mensaje).',
  invalid_temperature:
    'La temperatura debe estar entre 0.0 y 2.0, que es el rango que acepta Gemini.',
  compare_unavailable:
    'Solo Gemini puede ejecutarse. Falta un segundo proveedor configurado para comparar modelos.',
  same_model: 'Elige dos modelos distintos. Esta comparación no cambia la temperatura.',
  backend_offline:
    'No se pudo conectar con el backend. Arráncalo con npm run backend en http://localhost:3001.',
} as const

function looksLikeSecret(text: string) {
  return /AIza[0-9A-Za-z_-]{10,}|GEMINI_API_KEY\s*=\s*\S+/i.test(text)
}

function sanitizePublicText(value: unknown, fallback: string) {
  const text = String(value ?? '').trim()
  if (!text || looksLikeSecret(text)) {
    return fallback
  }
  return text
}

function messageForError(error: unknown, fallbackMessage: unknown) {
  if (typeof error === 'string' && error in ERROR_MESSAGES) {
    return ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES]
  }
  return sanitizePublicText(fallbackMessage, ERROR_MESSAGES.internal)
}

export function readAnalysis(value: unknown): ImportedAnalysis | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  const fields = [
    'categoria',
    'prioridad',
    'sentimiento',
    'intencion',
    'resumen',
    'respuestaSugerida',
  ] as const

  const analysis = {} as ImportedAnalysis
  for (const field of fields) {
    if (typeof record[field] !== 'string' || !record[field].trim()) {
      return null
    }
    analysis[field] = record[field]
  }
  return analysis
}

function readKnowledge(value: unknown): GeminiKnowledge {
  const empty: GeminiKnowledge = { contextoSuficiente: false, fragments: [], message: null }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return empty
  }
  const record = value as Record<string, unknown>
  const fragments = Array.isArray(record.fragments)
    ? record.fragments.flatMap((item) => {
        if (item === null || typeof item !== 'object' || Array.isArray(item)) {
          return []
        }
        const row = item as Record<string, unknown>
        if (
          typeof row.source !== 'string' ||
          typeof row.content !== 'string' ||
          typeof row.chunkIndex !== 'number' ||
          typeof row.score !== 'number'
        ) {
          return []
        }
        return [
          {
            source: row.source,
            chunkIndex: row.chunkIndex,
            content: row.content,
            score: row.score,
          },
        ]
      })
    : []
  return {
    contextoSuficiente: record.contextoSuficiente === true && fragments.length > 0,
    fragments,
    message: typeof record.message === 'string' ? record.message : null,
  }
}

export async function requestGeminiAnalysis(
  supportCase: SupportCase,
): Promise<GeminiAnalyzeResult> {
  let response: Response
  try {
    response = await fetch(GEMINI_ANALYZE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: supportCase.customerName,
        subject: supportCase.subject,
        message: supportCase.message,
        priority: supportCase.priority,
        status: supportCase.status,
      }),
    })
  } catch {
    return { ok: false, message: ERROR_MESSAGES.backend_offline }
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    return { ok: false, message: ERROR_MESSAGES.invalid_json }
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, message: ERROR_MESSAGES.internal }
  }

  const record = body as {
    ok?: unknown
    analysis?: unknown
    message?: unknown
    error?: unknown
    knowledge?: unknown
  }
  if (record.ok === true) {
    const analysis = readAnalysis(record.analysis)
    if (!analysis) {
      return { ok: false, message: ERROR_MESSAGES.incomplete }
    }
    return { ok: true, analysis, knowledge: readKnowledge(record.knowledge) }
  }

  return {
    ok: false,
    message: messageForError(record.error, record.message),
  }
}

export type LabRun = {
  temperature: number
  analysis: ImportedAnalysis | null
  error: string | null
}

export type LabBatch =
  | { ok: true; model: string; promptId: string; runs: LabRun[] }
  | { ok: false; message: string }

function casePayload(supportCase: SupportCase) {
  return {
    customerName: supportCase.customerName,
    subject: supportCase.subject,
    message: supportCase.message,
    priority: supportCase.priority,
    status: supportCase.status,
  }
}

async function postAnalyze(body: Record<string, unknown>): Promise<
  | { ok: true; record: Record<string, unknown> }
  | { ok: false; message: string }
> {
  let response: Response
  try {
    response = await fetch(GEMINI_ANALYZE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return { ok: false, message: ERROR_MESSAGES.backend_offline }
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return { ok: false, message: ERROR_MESSAGES.invalid_json }
  }

  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, message: ERROR_MESSAGES.internal }
  }

  return { ok: true, record: payload as Record<string, unknown> }
}

function readLabMeta(record: Record<string, unknown>) {
  const model = typeof record.model === 'string' ? record.model : 'Gemini'
  const promptId = typeof record.promptId === 'string' ? record.promptId : ''
  return { model, promptId }
}

export async function requestLabTemperature(
  supportCase: SupportCase,
  temperature: number,
): Promise<LabBatch> {
  const posted = await postAnalyze({ ...casePayload(supportCase), temperature })
  if (!posted.ok) {
    return posted
  }

  const record = posted.record
  if (record.ok !== true) {
    return { ok: false, message: messageForError(record.error, record.message) }
  }

  const analysis = readAnalysis(record.analysis)
  if (!analysis) {
    return { ok: false, message: ERROR_MESSAGES.incomplete }
  }

  const meta = readLabMeta(record)
  const echoed =
    typeof record.temperature === 'number' ? record.temperature : temperature

  return {
    ok: true,
    model: meta.model,
    promptId: meta.promptId,
    runs: [{ temperature: echoed, analysis, error: null }],
  }
}

export async function requestLabComparison(
  supportCase: SupportCase,
  temperatures: number[],
): Promise<LabBatch> {
  const posted = await postAnalyze({ ...casePayload(supportCase), temperatures })
  if (!posted.ok) {
    return posted
  }

  const record = posted.record
  if (record.ok !== true || !Array.isArray(record.results)) {
    return { ok: false, message: messageForError(record.error, record.message) }
  }

  const meta = readLabMeta(record)
  const runs: LabRun[] = []
  for (const item of record.results) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      continue
    }
    const row = item as Record<string, unknown>
    const temperature = typeof row.temperature === 'number' ? row.temperature : Number.NaN
    if (!Number.isFinite(temperature)) {
      continue
    }
    if (row.ok === true) {
      runs.push({ temperature, analysis: readAnalysis(row.analysis), error: null })
      continue
    }
    runs.push({
      temperature,
      analysis: null,
      error: messageForError(row.error, row.message),
    })
  }

  if (runs.length === 0) {
    return { ok: false, message: ERROR_MESSAGES.internal }
  }

  return { ok: true, model: meta.model, promptId: meta.promptId, runs }
}

export type LabModelOption = {
  id: string
  label: string
  model: string
}

export type LabModelCatalog = {
  models: LabModelOption[]
  compareReady: boolean
  notice: string | null
}

export type LabModelResult = {
  id: string
  label: string
  model: string
  temperature: number
  success: boolean
  latencyMs: number | null
  analysis: ImportedAnalysis | null
  error: string | null
}

export type LabModelCompare =
  | {
      ok: true
      caseId: string
      subject: string
      temperature: number
      prompt: string
      promptId: string
      results: LabModelResult[]
    }
  | { ok: false; message: string }

function readModelResult(value: unknown): LabModelResult | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  const row = value as Record<string, unknown>
  const temperature = typeof row.temperature === 'number' ? row.temperature : Number.NaN
  if (!Number.isFinite(temperature) || typeof row.id !== 'string' || typeof row.label !== 'string') {
    return null
  }
  const model = typeof row.model === 'string' ? row.model : row.id
  const latencyMs = typeof row.latencyMs === 'number' ? row.latencyMs : null
  if (row.success === true) {
    const analysis = readAnalysis(row.analysis)
    if (!analysis) {
      return {
        id: row.id,
        label: row.label,
        model,
        temperature,
        success: false,
        latencyMs,
        analysis: null,
        error: ERROR_MESSAGES.incomplete,
      }
    }
    return {
      id: row.id,
      label: row.label,
      model,
      temperature,
      success: true,
      latencyMs,
      analysis,
      error: null,
    }
  }
  return {
    id: row.id,
    label: row.label,
    model,
    temperature,
    success: false,
    latencyMs,
    analysis: null,
    error: messageForError(row.error, row.error),
  }
}

export async function fetchLabModels(): Promise<LabModelCatalog | { ok: false; message: string }> {
  let response: Response
  try {
    response = await fetch(`${BACKEND_ORIGIN}/api/lab/models`)
  } catch {
    return { ok: false, message: ERROR_MESSAGES.backend_offline }
  }
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return { ok: false, message: ERROR_MESSAGES.invalid_json }
  }
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, message: ERROR_MESSAGES.internal }
  }
  const record = payload as Record<string, unknown>
  const models = Array.isArray(record.models)
    ? record.models.flatMap((item) => {
        if (item === null || typeof item !== 'object' || Array.isArray(item)) {
          return []
        }
        const row = item as Record<string, unknown>
        if (typeof row.id !== 'string' || typeof row.label !== 'string' || typeof row.model !== 'string') {
          return []
        }
        return [{ id: row.id, label: row.label, model: row.model }]
      })
    : []
  return {
    models,
    compareReady: record.compareReady === true && models.length >= 1,
    notice: typeof record.notice === 'string' ? record.notice : null,
  }
}

export async function requestModelCompare(
  caseId: string,
  temperature: number,
  models: string[],
): Promise<LabModelCompare> {
  const posted = await postAnalyzeBody(`${BACKEND_ORIGIN}/api/lab/compare`, {
    caseId,
    temperature,
    models,
  })
  if (!posted.ok) {
    return posted
  }
  const record = posted.record
  if (record.ok !== true || !Array.isArray(record.results)) {
    return { ok: false, message: messageForError(record.error, record.message) }
  }
  const results = record.results.flatMap((item) => {
    const parsed = readModelResult(item)
    return parsed ? [parsed] : []
  })
  if (results.length === 0) {
    return { ok: false, message: ERROR_MESSAGES.incomplete }
  }
  return {
    ok: true,
    caseId: typeof record.caseId === 'string' ? record.caseId : caseId,
    subject: typeof record.subject === 'string' ? record.subject : '',
    temperature: typeof record.temperature === 'number' ? record.temperature : temperature,
    prompt: typeof record.prompt === 'string' ? record.prompt : '',
    promptId: typeof record.promptId === 'string' ? record.promptId : '',
    results,
  }
}

async function postAnalyzeBody(url: string, body: Record<string, unknown>) {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return { ok: false as const, message: ERROR_MESSAGES.backend_offline }
  }
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return { ok: false as const, message: ERROR_MESSAGES.invalid_json }
  }
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false as const, message: ERROR_MESSAGES.internal }
  }
  return { ok: true as const, record: payload as Record<string, unknown> }
}
