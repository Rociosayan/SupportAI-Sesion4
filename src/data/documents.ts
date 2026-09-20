export type PolicyDocument = {
  id: string
  title: string
  summary: string
}

export const policyDocuments: PolicyDocument[] = [
  {
    id: 'DOC-DEV',
    title: 'Política de devoluciones',
    summary:
      'Documento interno de ejemplo sobre plazos y condiciones de devolución. Todavía no se usa como fuente de consulta automática.',
  },
  {
    id: 'DOC-ENV',
    title: 'Política de envíos',
    summary:
      'Documento interno de ejemplo sobre tiempos de despacho y operadores logísticos. Todavía no se consulta por IA.',
  },
  {
    id: 'DOC-GAR',
    title: 'Garantías',
    summary:
      'Documento interno de ejemplo sobre cobertura de productos. Todavía no alimenta ninguna respuesta del modelo.',
  },
  {
    id: 'DOC-FAQ',
    title: 'Preguntas frecuentes',
    summary:
      'Documento interno de ejemplo con respuestas habituales de soporte. La búsqueda en documentos se incorporará más adelante.',
  },
]
