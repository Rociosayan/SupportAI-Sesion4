import path from 'path'
import { fileURLToPath } from 'url'
import { generateText } from './geminiService.js'
import { loadEnv } from './loadEnv.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const withoutKey = process.argv.includes('--sin-clave')

if (withoutKey) {
  delete process.env.GEMINI_API_KEY
} else {
  loadEnv(path.join(__dirname, '../.env'))
}

const MINIMAL_PROMPT = 'Responde solo con la palabra OK.'

try {
  const text = await generateText(MINIMAL_PROMPT)
  console.log('ok')
  console.log(`modelo_respondio=${text.length > 0}`)
  console.log(`vista_previa=${text.slice(0, 80)}`)
} catch (error) {
  console.error(`error=${error.code || 'internal'}`)
  console.error(error.message)
  process.exitCode = 1
}
