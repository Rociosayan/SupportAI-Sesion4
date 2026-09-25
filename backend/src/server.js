import { createHash } from 'crypto'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { GEMINI_MODEL, INSUFFICIENT_CASE, isAllowedOrigin, KNOWLEDGE_SOURCES, PORT } from './config.js'
import { ERROR_MESSAGES, mapProviderError, sanitizePublicText } from './errors.js'
import { generateText } from './geminiService.js'
import { compareModels } from './labCompare.js'
import { labCatalog } from './labProviders.js'
import { listKnowledgeSources, readKnowledgeSource } from './knowledge.js'
import { loadEnv } from './loadEnv.js'
import { parseGeminiAnalysis } from './parseAnalysis.js'
import { buildPrompt } from './prompt.js'
import { answerWithRag, buildCaseQuery, indexAllSources, retrieveContext } from './rag.js'
import { knowledgeTableReady, supabaseConfigStatus } from './supabase.js'

async function resolveKnowledgeStore() {
  if (!supabaseConfigStatus().configured) {
    return { store: 'local', storeNote: 'unconfigured' }
  }
  if (await knowledgeTableReady()) {
    return { store: 'supabase', storeNote: 'ready' }
  }
  return { store: 'local', storeNote: 'missing_table' }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv(path.join(__dirname, '../.env'))

function asText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function corsHeaders(req) {
  const origin = req.headers.origin
  const headers = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  if (isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

function sendJson(req, res, status, body) {
  const json = JSON.stringify(body)
  res.writeHead(status, {
    ...corsHeaders(req),
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
  })
  res.end(json)
}

function sendHtml(req, res, status, html) {
  res.writeHead(status, {
    ...corsHeaders(req),
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html),
  })
  res.end(html)
}

const TEMPERATURE_MIN = 0
const TEMPERATURE_MAX = 2
const INVALID_TEMPERATURE = Symbol('invalid_temperature')

function readTemperature(value) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  const number = typeof value === 'number' ? value : Number.NaN
  if (!Number.isFinite(number) || number < TEMPERATURE_MIN || number > TEMPERATURE_MAX) {
    return INVALID_TEMPERATURE
  }
  return Math.round(number * 10) / 10
}

function readTemperatureList(value) {
  if (value === undefined || value === null) {
    return undefined
  }
  if (!Array.isArray(value) || value.length < 1 || value.length > 3) {
    return INVALID_TEMPERATURE
  }
  const temperatures = []
  for (const item of value) {
    const temperature = readTemperature(item)
    if (temperature === undefined || temperature === INVALID_TEMPERATURE) {
      return INVALID_TEMPERATURE
    }
    temperatures.push(temperature)
  }
  return temperatures
}

async function runTemperatureAnalysis(prompt, temperature) {
  const text = await generateText(
    prompt,
    temperature === undefined ? {} : { temperature },
  )
  const parsed = parseGeminiAnalysis(text)
  if (!parsed.ok) {
    return {
      ok: false,
      temperature,
      error: parsed.error,
      message: sanitizePublicText(parsed.message, ERROR_MESSAGES.internal),
    }
  }
  return {
    ok: true,
    temperature,
    analysis: parsed.analysis,
  }
}

function statusPage() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SupportAI backend</title>
  <style>
    body { font-family: Segoe UI, sans-serif; max-width: 42rem; margin: 3rem auto; padding: 0 1.25rem; color: #1f2937; }
    h1 { font-size: 1.5rem; margin-bottom: 0.35rem; }
    p { line-height: 1.5; }
    code { background: #f3f4f6; padding: 0.1rem 0.35rem; border-radius: 4px; }
    a { color: #1d4ed8; }
  </style>
</head>
<body>
  <h1>SupportAI backend en marcha</h1>
  <p>Este puerto no es la aplicación. La interfaz está en <a href="http://localhost:5173/SupportAI-Sesion4/">http://localhost:5173/SupportAI-Sesion4/</a>.</p>
  <p>Comprobación: <a href="/api/health">GET /api/health</a></p>
  <p>Análisis: <code>POST /api/analizar</code></p>
  <p>RAG: <code>POST /api/rag/retrieve</code> y <code>POST /api/rag/ask</code></p>
</body>
</html>`
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body)
  }

  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) {
    return {}
  }
  return JSON.parse(raw)
}

function mapRagError(error) {
  if (error?.code === 'missing_supabase') {
    return {
      status: 503,
      body: {
        ok: false,
        error: 'missing_supabase',
        message: 'Faltan las credenciales de Supabase en el archivo .env del backend.',
      },
    }
  }
  if (error?.code === 'missing_local_index') {
    return {
      status: 503,
      body: {
        ok: false,
        error: 'missing_local_index',
        message:
          'Falta completar la indexación local. No hay embeddings válidos en data/embeddings.json.',
      },
    }
  }
  if (error?.code === 'invalid_source' || error?.code === 'missing_source') {
    return {
      status: 400,
      body: {
        ok: false,
        error: error.code,
        message: sanitizePublicText(error.message, 'La fuente de conocimiento no es válida.'),
      },
    }
  }
  if (error?.code === 'invalid_query') {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'invalid_query',
        message: 'Escribe una consulta para buscar en el conocimiento.',
      },
    }
  }
  if (error?.code === 'invalid_case') {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'invalid_case',
        message: ERROR_MESSAGES.invalid_case,
      },
    }
  }
  if (error?.code === 'supabase') {
    return {
      status: 503,
      body: {
        ok: false,
        error: 'supabase',
        message: 'No se pudo consultar la base de conocimiento. Revisa la tabla knowledge_chunks.',
      },
    }
  }
  return mapProviderError(error)
}

async function handleAnalyze(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    sendJson(req, res, 400, {
      ok: false,
      error: 'invalid_json',
      message: 'El backend recibió un cuerpo con formato no válido.',
    })
    return
  }

  const customerName = asText(body.customerName)
  const subject = asText(body.subject)
  const message = asText(body.message)
  const priority = asText(body.priority)
  const status = asText(body.status)
  const temperature = readTemperature(body.temperature)
  const temperatures = readTemperatureList(body.temperatures)

  if (!customerName || !subject || !message) {
    sendJson(req, res, 400, {
      ok: false,
      error: 'invalid_case',
      message: ERROR_MESSAGES.invalid_case,
    })
    return
  }

  if (temperature === INVALID_TEMPERATURE || temperatures === INVALID_TEMPERATURE) {
    sendJson(req, res, 400, {
      ok: false,
      error: 'invalid_temperature',
      message: ERROR_MESSAGES.invalid_temperature,
    })
    return
  }

  try {
    const selection = await resolveKnowledgeStore()
    const retrieved = await retrieveContext(
      buildCaseQuery({ customerName, subject, message }),
      KNOWLEDGE_SOURCES.politicas,
      { store: selection.store },
    )
    const knowledge = retrieved.fragments.filter((item) => item.score >= retrieved.threshold)
    const prompt = buildPrompt({
      customerName,
      subject,
      message,
      priority,
      status,
      knowledge,
    })
    const promptId = createHash('sha256').update(prompt).digest('hex').slice(0, 12)
    const knowledgePayload = {
      contextoSuficiente: knowledge.length > 0,
      fragments: knowledge,
      message: knowledge.length > 0 ? null : INSUFFICIENT_CASE,
    }

    if (temperatures) {
      const results = []
      for (const value of temperatures) {
        try {
          results.push(await runTemperatureAnalysis(prompt, value))
        } catch (error) {
          const mapped = mapProviderError(error)
          results.push({
            ok: false,
            temperature: value,
            error: mapped.body.error,
            message: mapped.body.message,
          })
        }
      }
      sendJson(req, res, 200, {
        ok: true,
        model: GEMINI_MODEL,
        promptId,
        knowledge: knowledgePayload,
        results,
      })
      return
    }

    const parsed = await runTemperatureAnalysis(prompt, temperature)
    if (!parsed.ok) {
      sendJson(req, res, 502, {
        ok: false,
        error: parsed.error,
        message: sanitizePublicText(parsed.message, ERROR_MESSAGES.internal),
        ...(temperature === undefined
          ? {}
          : { model: GEMINI_MODEL, temperature, promptId }),
      })
      return
    }

    sendJson(req, res, 200, {
      ok: true,
      analysis: parsed.analysis,
      knowledge: knowledgePayload,
      ...(temperature === undefined
        ? {}
        : { model: GEMINI_MODEL, temperature, promptId }),
    })
  } catch (error) {
    const mapped = mapProviderError(error)
    console.error('[analizar]', mapped.body.error)
    sendJson(req, res, mapped.status, mapped.body)
  }
}

async function handleKnowledgeStatus(req, res) {
  try {
    const politicas = readKnowledgeSource(KNOWLEDGE_SOURCES.politicas)
    const supabase = supabaseConfigStatus()
    const tableReady = supabase.configured ? await knowledgeTableReady() : false
    sendJson(req, res, 200, {
      ok: true,
      source: politicas.source,
      found: true,
      bytes: politicas.bytes,
      lines: politicas.lines,
      content: politicas.content,
      sources: listKnowledgeSources(),
      supabase: { ...supabase, tableReady },
    })
  } catch (error) {
    const mapped = mapRagError(error)
    sendJson(req, res, mapped.status, mapped.body)
  }
}

async function handleIndex(req, res) {
  try {
    const result = await indexAllSources()
    sendJson(req, res, 200, { ok: true, ...result })
  } catch (error) {
    const mapped = mapRagError(error)
    console.error('[rag-index]', mapped.body.error)
    sendJson(req, res, mapped.status, mapped.body)
  }
}

async function handleRetrieve(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    sendJson(req, res, 400, {
      ok: false,
      error: 'invalid_json',
      message: 'El backend recibió un cuerpo con formato no válido.',
    })
    return
  }

  try {
    const selection = await resolveKnowledgeStore()
    const result = await retrieveContext(body.query, body.source || KNOWLEDGE_SOURCES.politicas, {
      store: selection.store,
    })
    sendJson(req, res, 200, { ok: true, storeNote: selection.storeNote, ...result })
  } catch (error) {
    const mapped = mapRagError(error)
    console.error('[rag-retrieve]', mapped.body.error)
    sendJson(req, res, mapped.status, mapped.body)
  }
}

async function handleAsk(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    sendJson(req, res, 400, {
      ok: false,
      error: 'invalid_json',
      message: 'El backend recibió un cuerpo con formato no válido.',
    })
    return
  }

  try {
    const selection = await resolveKnowledgeStore()
    const result = await answerWithRag(body.query, body.source || KNOWLEDGE_SOURCES.politicas, {
      store: selection.store,
    })
    sendJson(req, res, 200, { ok: true, storeNote: selection.storeNote, ...result })
  } catch (error) {
    const mapped = mapRagError(error)
    console.error('[rag-ask]', mapped.body.error)
    sendJson(req, res, mapped.status, mapped.body)
  }
}

async function handleCaseRag(req, res) {
  let body
  try {
    body = await readJsonBody(req)
  } catch {
    sendJson(req, res, 400, {
      ok: false,
      error: 'invalid_json',
      message: 'El backend recibió un cuerpo con formato no válido.',
    })
    return
  }

  try {
    const query = buildCaseQuery(body)
    const selection = await resolveKnowledgeStore()
    const result = await answerWithRag(query, KNOWLEDGE_SOURCES.politicas, {
      caseMode: true,
      store: selection.store,
    })
    sendJson(req, res, 200, {
      ok: true,
      caseId: asText(body.caseId) || null,
      storeNote: selection.storeNote,
      ...result,
    })
  } catch (error) {
    const mapped = mapRagError(error)
    console.error('[rag-case]', mapped.body.error)
    sendJson(req, res, mapped.status, mapped.body)
  }
}

export async function handleApiRequest(req, res) {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  if (url.pathname !== '/' && url.pathname !== '/index.html' && !url.pathname.startsWith('/api/')) {
    url.pathname = `/api${url.pathname.startsWith('/') ? url.pathname : `/${url.pathname}`}`
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders(req))
    res.end()
    return
  }

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    sendHtml(req, res, 200, statusPage())
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(req, res, 200, { ok: true, service: 'supportai-backend' })
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/knowledge/status') {
    handleKnowledgeStatus(req, res)
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/analizar') {
    await handleAnalyze(req, res)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/lab/models') {
    sendJson(req, res, 200, labCatalog())
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/lab/compare') {
    let body
    try {
      body = await readJsonBody(req)
    } catch {
      sendJson(req, res, 400, {
        ok: false,
        error: 'invalid_json',
        message: 'El backend recibió un cuerpo con formato no válido.',
      })
      return
    }
    const result = await compareModels(body)
    sendJson(req, res, result.status, result.body)
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/rag/index') {
    await handleIndex(req, res)
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/rag/retrieve') {
    await handleRetrieve(req, res)
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/rag/ask') {
    await handleAsk(req, res)
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/rag/case') {
    await handleCaseRag(req, res)
    return
  }

  sendJson(req, res, 404, {
    ok: false,
    error: 'not_found',
    message: 'Ruta no encontrada.',
  })
}

const invokedAsMain =
  process.argv[1] &&
  path.normalize(fileURLToPath(import.meta.url)) === path.normalize(path.resolve(process.argv[1]))

if (invokedAsMain && !process.env.VERCEL) {
  const server = http.createServer((req, res) => {
    void handleApiRequest(req, res)
  })

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SupportAI backend en http://localhost:${PORT}`)
    console.log('Comprobación: GET /api/health')
    console.log('Análisis: POST /api/analizar')
    console.log('RAG: POST /api/rag/retrieve y POST /api/rag/ask')
  })
}

export default async function handler(req, res) {
  await handleApiRequest(req, res)
}
