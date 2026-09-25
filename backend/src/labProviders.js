import { GEMINI_MODEL } from './config.js'
import { generateText } from './geminiService.js'

const COMPARE_TEMPERATURES = [0, 0.3, 0.7, 1, 1.2]

function geminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim())
}

export function listLabModels() {
  const models = []
  if (geminiConfigured()) {
    models.push({
      id: 'gemini',
      provider: 'gemini',
      label: 'Gemini',
      model: GEMINI_MODEL,
    })
  }
  return models
}

export function labCatalog() {
  const models = listLabModels()
  return {
    ok: true,
    models,
    compareReady: models.length >= 1,
    notice:
      models.length === 1
        ? 'Solo Gemini está configurado. La comparación ejecuta ese modelo. No hay otro proveedor integrado.'
        : null,
  }
}

export function isCompareTemperature(value) {
  return COMPARE_TEMPERATURES.includes(value)
}

export async function runLabModel(modelId, prompt, temperature) {
  const model = listLabModels().find((item) => item.id === modelId)
  if (!model) {
    const error = new Error('model_unavailable')
    error.code = 'model_unavailable'
    throw error
  }

  if (model.provider === 'gemini') {
    const text = await generateText(prompt, { temperature })
    return { model, text }
  }

  const error = new Error('model_unavailable')
  error.code = 'model_unavailable'
  throw error
}
