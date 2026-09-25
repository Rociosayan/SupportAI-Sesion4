import path from 'path'
import { fileURLToPath } from 'url'
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from './config.js'
import { loadEnv } from './loadEnv.js'
import { supabaseConfigStatus } from './supabase.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv(path.join(__dirname, '../.env'))

const status = supabaseConfigStatus()
const urlSet = Boolean(
  process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
)
const keySet = Boolean(
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
)
const geminiSet = Boolean(process.env.GEMINI_API_KEY?.trim())

console.log(`embedding_model=${EMBEDDING_MODEL}`)
console.log(`outputDimensionality=${EMBEDDING_DIMENSIONS}`)
console.log(`GEMINI_API_KEY=${geminiSet ? 'configurada' : 'ausente'}`)
console.log(`SUPABASE_URL=${urlSet ? 'configurada' : 'ausente'}`)
console.log(`SUPABASE_SERVICE_ROLE_KEY=${keySet ? 'configurada' : 'ausente'}`)
console.log(`backend_reconoce_supabase=${status.configured}`)
console.log(`tabla_objetivo=knowledge_chunks`)
console.log(`columna_embedding=vector(${EMBEDDING_DIMENSIONS})`)
console.log('indice_hnsw=no')
if (!status.configured) {
  console.log('Pendiente: coloca SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en backend/.env')
  console.log('y ejecuta backend/sql/setup.sql en el SQL Editor de Supabase.')
  process.exitCode = 1
}
