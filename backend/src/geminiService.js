import { GoogleGenAI } from '@google/genai'
import { GEMINI_MODEL } from './config.js'

function requireApiKey() {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    const error = new Error('missing_api_key')
    error.code = 'missing_api_key'
    throw error
  }
  return apiKey
}

function providerError(code, status, message) {
  const error = new Error(message)
  error.code = code
  error.status = status
  return error
}

function readGeneratedText(response) {
  if (typeof response?.text === 'string' && response.text.trim()) {
    return response.text.trim()
  }

  const parts = response?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) {
    return ''
  }

  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim()
}

export function generationRequest(prompt, options = {}) {
  const request = {
    model: GEMINI_MODEL,
    contents: prompt,
  }
  if (typeof options.temperature === 'number') {
    request.config = { temperature: options.temperature }
  }
  return request
}

export async function generateText(prompt, options = {}) {
  const apiKey = requireApiKey()
  const ai = new GoogleGenAI({ apiKey })
  const request = generationRequest(prompt, options)

  if (typeof options.temperature === 'number') {
    console.log(
      `[gemini] model=${request.model} temperature=${request.config.temperature}`,
    )
  }

  let response
  try {
    response = await ai.models.generateContent(request)
  } catch (cause) {
    if (cause?.code === 'missing_api_key') {
      throw cause
    }

    const status = cause?.status ?? cause?.statusCode
    if (status === 401 || status === 403) {
      throw providerError('invalid_api_key', status, 'invalid_api_key')
    }
    if (status === 429) {
      throw providerError('rate_limit', 429, 'rate_limit')
    }
    if (status === 404) {
      throw providerError('model_unavailable', 404, 'model_unavailable')
    }
    if (status === 500 || status === 503) {
      throw providerError('unavailable', status, 'unavailable')
    }
    if (!status) {
      throw providerError('network', 503, 'network')
    }
    throw providerError('internal', 500, 'internal')
  }

  const text = readGeneratedText(response)
  if (!text) {
    throw providerError('empty_response', 502, 'empty_response')
  }

  return text
}
