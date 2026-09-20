export const REQUIRED_FIELDS = [
  'categoria',
  'prioridad',
  'sentimiento',
  'intencion',
  'resumen',
  'respuestaSugerida',
]

const EMPTY_MESSAGE = 'Gemini no devolvió contenido para analizar.'
const INVALID_MESSAGE = 'Gemini devolvió una respuesta con formato no válido.'
const INCOMPLETE_MESSAGE = 'La respuesta de Gemini está incompleta.'

export function extractJsonText(raw) {
  const trimmed = String(raw ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
  if (!trimmed) {
    return ''
  }

  const fences = [...trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)]
  if (fences.length > 0) {
    const inner = String(fences[fences.length - 1][1] ?? '').trim()
    if (inner) {
      return inner
    }
  }

  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start !== -1 && end > start) {
    return trimmed.slice(start, end + 1)
  }

  return trimmed
}

export function parseGeminiAnalysis(raw) {
  const payload = extractJsonText(raw)
  if (!payload) {
    return {
      ok: false,
      error: 'empty_response',
      message: EMPTY_MESSAGE,
    }
  }

  let parsed
  try {
    parsed = JSON.parse(payload)
  } catch {
    return {
      ok: false,
      error: 'invalid_json',
      message: INVALID_MESSAGE,
    }
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ok: false,
      error: 'invalid_json',
      message: INVALID_MESSAGE,
    }
  }

  const analysis = {}
  for (const field of REQUIRED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(parsed, field)) {
      return {
        ok: false,
        error: 'incomplete',
        message: INCOMPLETE_MESSAGE,
      }
    }

    const value = parsed[field]
    if (typeof value !== 'string' || !value.trim()) {
      return {
        ok: false,
        error: 'incomplete',
        message: INCOMPLETE_MESSAGE,
      }
    }

    analysis[field] = value.trim()
  }

  return { ok: true, analysis }
}
