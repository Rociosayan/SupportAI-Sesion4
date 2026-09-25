function formatKnowledge(fragments) {
  if (!Array.isArray(fragments) || fragments.length === 0) {
    return 'No se encontró conocimiento suficiente en las políticas internas. No inventes plazos, garantías, devoluciones ni otras políticas.'
  }

  return fragments
    .map(
      (item) =>
        `[fuente=${item.source} chunk=${item.chunkIndex} score=${Number(item.score).toFixed(3)}]\n${item.content}`,
    )
    .join('\n\n')
}

export function buildPrompt(caseData) {
  return `ROL:
Actúa como especialista en atención al cliente de una tienda online.

CONTEXTO:
Cliente: ${caseData.customerName}
Asunto: ${caseData.subject}
Mensaje: ${caseData.message}
Prioridad actual: ${caseData.priority}
Estado actual: ${caseData.status}

CONOCIMIENTO RECUPERADO:
${formatKnowledge(caseData.knowledge)}

TAREA:
Analiza el caso.

RESTRICCIONES:
- No inventes información.
- No afirmes acciones que no aparecen en el caso.
- No inventes políticas que no estén en el conocimiento recuperado.
- Si el conocimiento recuperado indica que no es suficiente, no cites una política interna.
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
