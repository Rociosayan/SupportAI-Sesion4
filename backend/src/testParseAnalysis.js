import { parseGeminiAnalysis } from './parseAnalysis.js'

function assert(condition, label) {
  if (!condition) {
    throw new Error(label)
  }
}

const valid = parseGeminiAnalysis(`\`\`\`json
{
  "categoria": "Producto defectuoso",
  "prioridad": "Alta",
  "sentimiento": "Molesto",
  "intencion": "Reemplazo",
  "resumen": "Auricular dañado",
  "respuestaSugerida": "Borrador para revisión humana."
}
\`\`\``)

assert(valid.ok === true, 'markdown válido')
assert(valid.analysis.categoria === 'Producto defectuoso', 'campo extraído')

const invalid = parseGeminiAnalysis('```json\n{categoria:}\n```')
assert(invalid.ok === false && invalid.error === 'invalid_json', 'json inválido')
assert(invalid.message === 'Gemini devolvió una respuesta con formato no válido.', 'mensaje inválido')

const incomplete = parseGeminiAnalysis('{"categoria":"X","prioridad":"Alta"}')
assert(incomplete.ok === false && incomplete.error === 'incomplete', 'incompleto')
assert(incomplete.message === 'La respuesta de Gemini está incompleta.', 'mensaje incompleto')

const empty = parseGeminiAnalysis('   ')
assert(empty.ok === false && empty.error === 'empty_response', 'vacío')
assert(empty.message === 'Gemini no devolvió contenido para analizar.', 'mensaje vacío')

console.log('ok parseAnalysis')
