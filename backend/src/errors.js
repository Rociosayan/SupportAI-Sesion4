export const ERROR_MESSAGES = {
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
}

function looksLikeSecret(text) {
  return /AIza[0-9A-Za-z_-]{10,}|GEMINI_API_KEY\s*=\s*\S+|SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S+|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\./i.test(
    text,
  )
}

export function sanitizePublicText(value, fallback) {
  const text = String(value ?? '').trim()
  if (!text || looksLikeSecret(text)) {
    return fallback
  }
  return text
}

export function publicError(error, status, message) {
  return {
    status,
    body: {
      ok: false,
      error,
      message: sanitizePublicText(message, ERROR_MESSAGES.internal),
    },
  }
}

export function mapProviderError(error) {
  const code = error?.code
  const status = error?.status ?? error?.statusCode

  if (code === 'missing_api_key') {
    return publicError('missing_api_key', 503, ERROR_MESSAGES.missing_api_key)
  }
  if (code === 'invalid_api_key' || status === 401 || status === 403) {
    return publicError('invalid_api_key', 401, ERROR_MESSAGES.invalid_api_key)
  }
  if (code === 'rate_limit' || status === 429) {
    return publicError('rate_limit', 429, ERROR_MESSAGES.rate_limit)
  }
  if (code === 'empty_response') {
    return publicError('empty_response', 502, ERROR_MESSAGES.empty_response)
  }
  if (code === 'invalid_json') {
    return publicError('invalid_json', 502, ERROR_MESSAGES.invalid_json)
  }
  if (code === 'incomplete') {
    return publicError('incomplete', 502, ERROR_MESSAGES.incomplete)
  }
  if (code === 'model_unavailable' || status === 404) {
    return publicError('model_unavailable', 502, ERROR_MESSAGES.model_unavailable)
  }
  if (code === 'network') {
    return publicError('network', 503, ERROR_MESSAGES.network)
  }
  if (code === 'unavailable' || status === 500 || status === 503) {
    return publicError('unavailable', 503, ERROR_MESSAGES.unavailable)
  }

  return publicError('internal', 500, ERROR_MESSAGES.internal)
}
