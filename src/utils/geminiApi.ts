import type { ImportedAnalysis } from '../components/ResultComparison'
import type { SupportCase } from '../types/case'

export const BACKEND_ORIGIN = 'http://localhost:3001'
export const GEMINI_ANALYZE_URL = `${BACKEND_ORIGIN}/api/analizar`

export type GeminiAnalyzeResult =
  | { ok: true; analysis: ImportedAnalysis }
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
  }
  if (record.ok === true) {
    const analysis = readAnalysis(record.analysis)
    if (!analysis) {
      return { ok: false, message: ERROR_MESSAGES.incomplete }
    }
    return { ok: true, analysis }
  }

  return {
    ok: false,
    message: messageForError(record.error, record.message),
  }
}
