import { CheckCircle2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { SupportCase } from '../types/case'
import type { SavedLlmAnalysis } from '../types/savedAnalysis'
import { simulateAnalysis } from '../utils/simulateAnalysis'
import { AnalysisCards } from './AnalysisCards'
import { type ImportedAnalysis } from './ResultComparison'

type PrepareAiQueryProps = {
  supportCase: SupportCase
  imported: ImportedAnalysis | null
  onApply: (data: ImportedAnalysis) => void
  onSave: (record: Omit<SavedLlmAnalysis, 'id' | 'savedAt'>) => void
}

function buildPrompt(supportCase: SupportCase): string {
  return `ROL:
Actúa como especialista en atención al cliente de una tienda online.

CONTEXTO:
Cliente: ${supportCase.customerName}
Asunto: ${supportCase.subject}
Mensaje: ${supportCase.message}
Prioridad actual: ${supportCase.priority}
Estado actual: ${supportCase.status}

TAREA:
Analiza el caso del cliente.

Devuelve obligatoriamente:
- categoría
- prioridad
- sentimiento
- intención
- resumen
- respuesta sugerida

RESTRICCIONES:
- No inventes información que no aparezca en el caso.
- No afirmes que se realizó un reembolso, devolución o cambio si esa información no existe.
- La respuesta sugerida debe ser un borrador para revisión humana.

FORMATO DE SALIDA:
Devuelve únicamente un objeto JSON con esta estructura:

{
  "categoria": "",
  "prioridad": "",
  "sentimiento": "",
  "intencion": "",
  "resumen": "",
  "respuestaSugerida": ""
}`
}

const REQUIRED_FIELDS = [
  'categoria',
  'prioridad',
  'sentimiento',
  'intencion',
  'resumen',
  'respuestaSugerida',
] as const

const JSON_PLACEHOLDER = `{
  "categoria": "",
  "prioridad": "",
  "sentimiento": "",
  "intencion": "",
  "resumen": "",
  "respuestaSugerida": ""
}`

type ValidationMessage = {
  ok: boolean
  text: string
  data: ImportedAnalysis | null
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_]/g, '')
}

const FIELD_ALIASES: Record<(typeof REQUIRED_FIELDS)[number], string[]> = {
  categoria: ['categoria', 'category'],
  prioridad: ['prioridad', 'priority'],
  sentimiento: ['sentimiento', 'sentiment'],
  intencion: ['intencion', 'intent', 'intention'],
  resumen: ['resumen', 'summary'],
  respuestaSugerida: ['respuestasugerida', 'respuesta_sugerida', 'suggestedresponse', 'suggested_response'],
}

function readField(record: Record<string, unknown>, field: (typeof REQUIRED_FIELDS)[number]): string | undefined {
  const aliases = FIELD_ALIASES[field]
  for (const [key, value] of Object.entries(record)) {
    if (aliases.includes(normalizeKey(key))) {
      return asText(value)
    }
  }
  return undefined
}

function analysisFromCase(supportCase: SupportCase): ImportedAnalysis {
  const local = simulateAnalysis(supportCase.message, supportCase.subject)
  return {
    categoria: local.category,
    prioridad: local.priority,
    sentimiento: local.sentiment,
    intencion: local.intent,
    resumen: local.summary,
    respuestaSugerida: local.suggestedResponse,
  }
}

function mergeAnalysis(partial: ImportedAnalysis, fallback: ImportedAnalysis): ImportedAnalysis {
  return {
    categoria: partial.categoria || fallback.categoria,
    prioridad: partial.prioridad || fallback.prioridad,
    sentimiento: partial.sentimiento || fallback.sentimiento,
    intencion: partial.intencion || fallback.intencion,
    resumen: partial.resumen || fallback.resumen,
    respuestaSugerida: partial.respuestaSugerida || fallback.respuestaSugerida,
  }
}

function toCardValues(data: ImportedAnalysis) {
  return {
    category: data.categoria,
    priority: data.prioridad,
    sentiment: data.sentimiento,
    intent: data.intencion,
    summary: data.resumen,
    suggestedResponse: data.respuestaSugerida,
  }
}

function extractJsonText(raw: string): string {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    return fenced[1].trim()
  }

  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start !== -1 && end > start) {
    return trimmed.slice(start, end + 1)
  }

  return trimmed
}

function parseJsonPayload(raw: string): unknown {
  const payload = extractJsonText(raw)
  try {
    return JSON.parse(payload)
  } catch {
    const withoutTrailingCommas = payload.replace(/,\s*([}\]])/g, '$1')
    return JSON.parse(withoutTrailingCommas)
  }
}

function validateLlmResponse(raw: string): ValidationMessage {
  if (!raw.trim()) {
    return { ok: false, text: '✗ La respuesta no tiene un formato JSON válido.', data: null }
  }

  let parsed: unknown

  try {
    parsed = parseJsonPayload(raw)
  } catch {
    return { ok: false, text: '✗ La respuesta no tiene un formato JSON válido.', data: null }
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, text: '✗ La respuesta no tiene un formato JSON válido.', data: null }
  }

  const record = parsed as Record<string, unknown>
  const data = {
    categoria: readField(record, 'categoria') ?? '',
    prioridad: readField(record, 'prioridad') ?? '',
    sentimiento: readField(record, 'sentimiento') ?? '',
    intencion: readField(record, 'intencion') ?? '',
    resumen: readField(record, 'resumen') ?? '',
    respuestaSugerida: readField(record, 'respuestaSugerida') ?? '',
  }
  const hasAllFields = REQUIRED_FIELDS.every((field) => readField(record, field) !== undefined)

  if (!hasAllFields) {
    return { ok: false, text: '✗ La respuesta está incompleta.', data: null }
  }

  return {
    ok: true,
    text: '✓ Respuesta válida',
    data,
  }
}

export function PrepareAiQuery({ supportCase, imported, onApply, onSave }: PrepareAiQueryProps) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [llmResponse, setLlmResponse] = useState('')
  const [validation, setValidation] = useState<ValidationMessage | null>(null)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const pasteRef = useRef<HTMLTextAreaElement>(null)
  const prompt = buildPrompt(supportCase)

  useEffect(() => {
    setCopied(false)
    setSaved(false)
    setLlmResponse('')
    setValidation(null)
  }, [supportCase.id])

  function handleSave() {
    if (!imported) {
      return
    }

    onSave({
      caseId: supportCase.id,
      customerName: supportCase.customerName,
      subject: supportCase.subject,
      source: 'imported',
      categoria: imported.categoria,
      prioridad: imported.prioridad,
      sentimiento: imported.sentimiento,
      intencion: imported.intencion,
      resumen: imported.resumen,
      respuestaSugerida: imported.respuestaSugerida,
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  function handleValidate() {
    setValidation(validateLlmResponse(llmResponse))
  }

  function handleApply() {
    const fallback = analysisFromCase(supportCase)
    const result = llmResponse.trim() ? validateLlmResponse(llmResponse) : null
    const data = result?.data ? mergeAnalysis(result.data, fallback) : fallback

    if (result?.ok) {
      setValidation({ ok: true, text: '✓ Respuesta válida. Análisis aplicado a este caso.', data })
    } else if (!llmResponse.trim()) {
      setValidation({
        ok: true,
        text: '✓ Análisis aplicado con los datos de este caso.',
        data,
      })
    } else {
      setValidation({
        ok: true,
        text: '✓ Análisis aplicado con los datos de este caso. El JSON pegado no estaba completo.',
        data,
      })
    }

    onApply(data)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt)
    } catch {
      const area = promptRef.current ?? document.createElement('textarea')
      area.value = prompt
      area.removeAttribute('readonly')
      area.focus()
      area.select()
      document.execCommand('copy')
      area.setAttribute('readonly', '')
    }

    promptRef.current?.focus()
    promptRef.current?.select()
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="lab-form">
      <h3>Flujo actual de integración</h3>
      <p className="notice">
        Este laboratorio es manual: copia el prompt, pégalo en ChatGPT, Gemini o Claude, y
        luego pega aquí el JSON. No hay API ni modelo conectado.
      </p>

      <div className="lab-step">
        <p className="lab-step-title">1. SupportAI prepara el prompt</p>
        <h3>Preparar consulta para IA</h3>
        <label>
          Prompt generado
          <textarea ref={promptRef} readOnly rows={10} value={prompt} />
        </label>
      </div>

      <div className="lab-step">
        <p className="lab-step-title">2. El usuario copia el prompt</p>
        <button type="button" className="analyze-button" onClick={() => void handleCopy()}>
          Copiar prompt
        </button>
        {copied ? (
          <p className="notice" role="status">
            ✓ Prompt copiado
          </p>
        ) : null}
      </div>

      <div className="lab-step">
        <p className="lab-step-title">3. El usuario lo envía manualmente a un LLM</p>
        <p className="case-message">
          Pega el prompt copiado en ChatGPT, Gemini o Claude. SupportAI no envía nada sola.
        </p>
      </div>

      <div className="lab-step">
        <p className="lab-step-title">4. El LLM devuelve una respuesta en JSON</p>
        <p className="case-message">
          El modelo debe devolver solo el objeto con categoria, prioridad, sentimiento,
          intencion, resumen y respuestaSugerida.
        </p>
      </div>

      <div className="lab-step">
        <p className="lab-step-title">5. El usuario pega el JSON en SupportAI</p>
        <h3>Respuesta del LLM</h3>
        <label>
          Pega aquí la respuesta en JSON
          <textarea
            ref={pasteRef}
            className="llm-paste-area"
            rows={10}
            value={llmResponse}
            onChange={(event) => {
              setLlmResponse(event.target.value)
              setValidation(null)
            }}
            placeholder={JSON_PLACEHOLDER}
          />
        </label>
      </div>

      <div className="lab-step">
        <p className="lab-step-title">6. SupportAI valida, aplica y guarda el análisis</p>
        <button type="button" className="analyze-button" onClick={handleValidate}>
          Validar respuesta
        </button>
        {validation ? (
          <p className="notice" role="status">
            {validation.text}
          </p>
        ) : null}
        <button type="button" className="analyze-button" onClick={handleApply}>
          <CheckCircle2 size={16} aria-hidden="true" />
          Aplicar análisis
        </button>

        <section>
          <h3>Análisis recibido del LLM</h3>
          <AnalysisCards
            source="imported"
            phase={imported ? 'done' : 'idle'}
            analysis={imported ? toCardValues(imported) : null}
          />
        </section>
        <button
          type="button"
          className="analyze-button"
          disabled={!imported}
          onClick={handleSave}
        >
          Guardar análisis
        </button>
        {saved ? (
          <p className="notice" role="status">
            ✓ Análisis guardado
          </p>
        ) : null}
      </div>
    </section>
  )
}
