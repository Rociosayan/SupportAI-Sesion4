import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { FRONTEND_ORIGINS, KNOWLEDGE_SOURCES, PORT } from './config.js'
import { ERROR_MESSAGES, mapProviderError, sanitizePublicText } from './errors.js'
import { generateText } from './geminiService.js'
import { listKnowledgeSources, readKnowledgeSource } from './knowledge.js'
import { loadEnv } from './loadEnv.js'
import { parseGeminiAnalysis } from './parseAnalysis.js'
import { buildPrompt } from './prompt.js'
import { answerWithRag, buildCaseQuery, indexAllSources, retrieveContext } from './rag.js'
import { supabaseConfigStatus } from './supabase.js'

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
  if (origin && FRONTEND_ORIGINS.includes(origin)) {
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

  if (!customerName || !subject || !message) {
    sendJson(req, res, 400, {
      ok: false,
      error: 'invalid_case',
      message: ERROR_MESSAGES.invalid_case,
    })
    return
  }

  try {
    const prompt = buildPrompt({ customerName, subject, message, priority, status })
    const text = await generateText(prompt)
    const parsed = parseGeminiAnalysis(text)
    if (!parsed.ok) {
      sendJson(req, res, 502, {
        ok: false,
        error: parsed.error,
        message: sanitizePublicText(parsed.message, ERROR_MESSAGES.internal),
      })
      return
    }

    sendJson(req, res, 200, { ok: true, analysis: parsed.analysis })
  } catch (error) {
    const mapped = mapProviderError(error)
    console.error('[analizar]', mapped.body.error)
    sendJson(req, res, mapped.status, mapped.body)
  }
}

function handleKnowledgeStatus(req, res) {
  try {
    const politicas = readKnowledgeSource(KNOWLEDGE_SOURCES.politicas)
    sendJson(req, res, 200, {
      ok: true,
      source: politicas.source,
      found: true,
      bytes: politicas.bytes,
      lines: politicas.lines,
      content: politicas.content,
      sources: listKnowledgeSources(),
      supabase: supabaseConfigStatus(),
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
    const result = await retrieveContext(body.query, body.source || KNOWLEDGE_SOURCES.politicas)
    sendJson(req, res, 200, { ok: true, ...result })
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
    const result = await answerWithRag(body.query, body.source || KNOWLEDGE_SOURCES.politicas)
    sendJson(req, res, 200, { ok: true, ...result })
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
    const result = await answerWithRag(query, body.source || KNOWLEDGE_SOURCES.politicas, {
      caseMode: true,
    })
    sendJson(req, res, 200, {
      ok: true,
      caseId: asText(body.caseId) || null,
      ...result,
    })
  } catch (error) {
    const mapped = mapRagError(error)
    console.error('[rag-case]', mapped.body.error)
    sendJson(req, res, mapped.status, mapped.body)
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

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
    void handleAnalyze(req, res)
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/rag/index') {
    void handleIndex(req, res)
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/rag/retrieve') {
    void handleRetrieve(req, res)
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/rag/ask') {
    void handleAsk(req, res)
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/rag/case') {
    void handleCaseRag(req, res)
    return
  }

  sendJson(req, res, 404, {
    ok: false,
    error: 'not_found',
    message: 'Ruta no encontrada.',
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`SupportAI backend en http://localhost:${PORT}`)
  console.log('Comprobación: GET /api/health')
  console.log('Análisis: POST /api/analizar')
  console.log('RAG: POST /api/rag/retrieve y POST /api/rag/ask')
})
