export function buildPrompt(caseData) {
  return `ROL:
Actúa como especialista en atención al cliente de una tienda online.

CONTEXTO:
Cliente: ${caseData.customerName}
Asunto: ${caseData.subject}
Mensaje: ${caseData.message}
Prioridad actual: ${caseData.priority}
Estado actual: ${caseData.status}

TAREA:
Analiza el caso.

RESTRICCIONES:
- No inventes información.
- No afirmes acciones que no aparecen en el caso.
- La respuesta sugerida debe ser un borrador para revisión humana.
- Devuelve únicamente JSON.

FORMATO:
{
  "categoria": "",
  "prioridad": "",
  "sentimiento": "",
  "intencion": "",
  "resumen": "",
  "respuestaSugerida": ""
}`
}
