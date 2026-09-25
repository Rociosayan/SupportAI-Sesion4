import { createHash } from 'crypto'
import { ERROR_MESSAGES, mapProviderError, sanitizePublicText } from './errors.js'
import { isCompareTemperature, listLabModels, runLabModel } from './labProviders.js'
import { parseGeminiAnalysis } from './parseAnalysis.js'
import { buildPrompt } from './prompt.js'
import { initialCases } from '../../src/data/cases.ts'

function asText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function readTemperature(value) {
  const number = typeof value === 'number' ? value : Number.NaN
  if (!Number.isFinite(number)) {
    return null
  }
  return Math.round(number * 10) / 10
}

export function findLabCase(caseId) {
  return initialCases.find((item) => item.id === caseId) ?? null
}

export function buildComparePrompt(caseData) {
  return buildPrompt({
    customerName: caseData.customerName,
    subject: caseData.subject,
    message: caseData.message,
    priority: caseData.priority,
    status: caseData.status,
    knowledge: [],
  })
}

async function runModel(modelId, prompt, temperature) {
  const started = Date.now()
  const known = listLabModels().find((item) => item.id === modelId)
  if (!known) {
    return {
      id: modelId,
      label: modelId,
      model: modelId,
      temperature,
      success: false,
      latencyMs: Date.now() - started,
      error: 'Ese modelo no está configurado.',
    }
  }
  try {
    const generated = await runLabModel(modelId, prompt, temperature)
    const latencyMs = Date.now() - started
    const parsed = parseGeminiAnalysis(generated.text)
    if (!parsed.ok) {
      return {
        id: generated.model.id,
        label: generated.model.label,
        model: generated.model.model,
        temperature,
        success: false,
        latencyMs,
        error: sanitizePublicText(parsed.message, ERROR_MESSAGES.invalid_json),
      }
    }
    return {
      id: generated.model.id,
      label: generated.model.label,
      model: generated.model.model,
      temperature,
      success: true,
      latencyMs,
      analysis: parsed.analysis,
    }
  } catch (error) {
    const mapped = mapProviderError(error)
    return {
      id: modelId,
      label: known?.label ?? modelId,
      model: known?.model ?? modelId,
      temperature,
      success: false,
      latencyMs: Date.now() - started,
      error: mapped.body.message,
    }
  }
}

export async function compareModels(body) {
  const caseId = asText(body.caseId)
  const supportCase = findLabCase(caseId)
  const temperature = readTemperature(body.temperature)
  const requested = Array.isArray(body.models) ? body.models.map(asText).filter(Boolean) : []

  if (!supportCase) {
    return {
      status: 400,
      body: { ok: false, error: 'invalid_case', message: ERROR_MESSAGES.invalid_case },
    }
  }

  if (temperature === null || !isCompareTemperature(temperature)) {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'invalid_temperature',
        message: 'La comparación admite temperatura 0.0, 0.3, 0.7, 1.0 o 1.2.',
      },
    }
  }

  const available = listLabModels()
  if (available.length === 0) {
    return {
      status: 503,
      body: {
        ok: false,
        error: 'model_unavailable',
        message: 'No hay ningún modelo configurado para ejecutar.',
      },
    }
  }

  if (requested.length === 0) {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'model_unavailable',
        message: 'Selecciona al menos un modelo disponible.',
      },
    }
  }

  const prompt = buildComparePrompt(supportCase)
  const promptId = createHash('sha256').update(prompt).digest('hex').slice(0, 12)
  console.log(
    `[lab-compare] caseId=${caseId} temperature=${temperature} models=${requested.join(',')} promptId=${promptId}`,
  )

  const results = await Promise.all(requested.map((modelId) => runModel(modelId, prompt, temperature)))

  return {
    status: 200,
    body: {
      ok: true,
      caseId,
      subject: supportCase.subject,
      temperature,
      prompt,
      promptId,
      results,
    },
  }
}
