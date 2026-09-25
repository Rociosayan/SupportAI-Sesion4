import path from 'path'
import { fileURLToPath } from 'url'
import { GEMINI_MODEL } from './config.js'
import { generationRequest, generateText } from './geminiService.js'
import { loadEnv } from './loadEnv.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv(path.join(__dirname, '../.env'))

const request = generationRequest('Responde solo OK.', { temperature: 0 })
if (request.model !== GEMINI_MODEL) {
  console.error('model_mismatch')
  process.exitCode = 1
} else if (request.config?.temperature !== 0) {
  console.error('temperature_missing')
  process.exitCode = 1
} else {
  console.log(`request_model=${request.model}`)
  console.log(`request_temperature=${request.config.temperature}`)
}

const omitted = generationRequest('Responde solo OK.')
if (omitted.config) {
  console.error('default_request_should_omit_temperature')
  process.exitCode = 1
} else {
  console.log('default_request_omits_temperature=true')
}

if (!process.env.GEMINI_API_KEY?.trim()) {
  console.log('live_call=skipped_missing_key')
  process.exit(process.exitCode ?? 0)
}

try {
  const text = await generateText('Responde solo con la palabra OK.', { temperature: 0 })
  console.log(`live_call=ok temperature=0 chars=${text.length}`)
} catch (error) {
  console.error(`live_call=fail code=${error.code || 'internal'}`)
  process.exitCode = 1
}
