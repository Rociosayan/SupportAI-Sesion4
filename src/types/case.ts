export type CaseStatus = 'Pendiente' | 'En proceso' | 'Resuelto'
export type CasePriority = 'Alta' | 'Media' | 'Baja'
export type CaseChannel = 'Correo' | 'Chat' | 'Teléfono' | 'Formulario' | 'WhatsApp'
export type CaseTone =
  | 'Neutral'
  | 'Satisfecho'
  | 'Molesto'
  | 'Muy molesto'
  | 'Confundido'
  | 'Urgente'

export type CaseCategory =
  | 'Pedido retrasado'
  | 'Producto defectuoso'
  | 'Cobro duplicado'
  | 'Cambio de talla'
  | 'Devolución'
  | 'Garantía'
  | 'Dirección incorrecta'
  | 'Pedido perdido'
  | 'Consulta de stock'
  | 'Cancelación'
  | 'Reembolso'
  | 'Problema con factura'
  | 'Felicitación'
  | 'Consulta poco clara'

export const CASE_CATEGORIES: CaseCategory[] = [
  'Pedido retrasado',
  'Producto defectuoso',
  'Cobro duplicado',
  'Cambio de talla',
  'Devolución',
  'Garantía',
  'Dirección incorrecta',
  'Pedido perdido',
  'Consulta de stock',
  'Cancelación',
  'Reembolso',
  'Problema con factura',
  'Felicitación',
  'Consulta poco clara',
]

export const ANALYSIS_FIELDS = [
  'Categoría',
  'Prioridad',
  'Sentimiento',
  'Resumen',
  'Intención del cliente',
  'Respuesta sugerida',
] as const

export type AnalysisStatus = 'SIN ANALIZAR'

export type SupportCase = {
  id: string
  customerName: string
  subject: string
  orderNumber: string
  message: string
  date: string
  status: CaseStatus
  priority: CasePriority
  channel: CaseChannel
  category: CaseCategory
  tone: CaseTone
  unread: boolean
}

export type PageId =
  | 'inicio'
  | 'perfil'
  | 'casos'
  | 'diagnostico'
  | 'historial'
  | 'ia-lab'
  | 'laboratorio'
  | 'clientes'
  | 'pedidos'
  | 'documentos'
