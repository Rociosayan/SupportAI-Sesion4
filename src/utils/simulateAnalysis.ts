export type SimulatedAnalysis = {
  category: string
  priority: string
  sentiment: string
  intent: string
  summary: string
  suggestedResponse: string
}

type AnalysisRule = {
  category: string
  intent: string
  response: string
  test: (text: string) => boolean
}

function includesAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word))
}

const RULES: AnalysisRule[] = [
  {
    category: 'Cobro duplicado',
    intent: 'Solicitar revisión de un cargo duplicado',
    response:
      'Lamentamos el inconveniente. Revisaremos la información del cobro duplicado para orientarte sobre los siguientes pasos.',
    test: (text) =>
      includesAny(text, ['duplicad', 'dos veces', 'dos cargos', 'cargo repetido', 'segundo cobro']),
  },
  {
    category: 'Cambio de talla',
    intent: 'Solicitar un cambio de talla',
    response:
      'Podemos revisar la solicitud de cambio de talla. Confirmaremos las opciones disponibles a partir de lo indicado en tu mensaje.',
    test: (text) => includesAny(text, ['talla', 'talle', 'queda corta', 'me quedaron pequeñas']),
  },
  {
    category: 'Producto defectuoso',
    intent: 'Reportar un producto con falla',
    response:
      'Lamentamos la falla del producto. Revisaremos el reporte de defecto con la descripción que enviaste.',
    test: (text) =>
      includesAny(text, [
        'roto',
        'defect',
        'no enciende',
        'intermitente',
        'mancha',
        'teclas',
        'micrófono',
        'microfono',
        'no arranca',
      ]),
  },
  {
    category: 'Devolución',
    intent: 'Iniciar una devolución',
    response:
      'Registramos tu pedido de devolución. Te indicaremos los siguientes pasos con base en la información que enviaste.',
    test: (text) =>
      includesAny(text, ['devolver', 'devolución', 'devuelvo']) &&
      !includesAny(text, ['no para devolver', 'no quiero devolver']),
  },
  {
    category: 'Garantía',
    intent: 'Hacer válida la garantía',
    response:
      'Revisaremos la solicitud de garantía con los datos del mensaje. Te confirmaremos el siguiente paso cuando esté validado.',
    test: (text) => includesAny(text, ['garantía', 'garantia', 'motor quemado']),
  },
  {
    category: 'Dirección incorrecta',
    intent: 'Corregir o aclarar la dirección de entrega',
    response:
      'Revisaremos el dato de dirección que mencionas. Por ahora solo podemos trabajar con la información incluida en tu mensaje.',
    test: (text) =>
      includesAny(text, ['dirección', 'direccion', 'otro distrito', 'dirección vieja', 'dirección está mal']),
  },
  {
    category: 'Pedido perdido',
    intent: 'Localizar o reponer un pedido no recibido',
    response:
      'Lamentamos que el pedido no haya llegado. Revisaremos el reporte de extravío con lo que indicaste en el mensaje.',
    test: (text) =>
      includesAny(text, ['no recibí', 'no recibi', 'perdido', 'nadie sabe', 'entregado y no', 'no hay paquete']),
  },
  {
    category: 'Pedido retrasado',
    intent: 'Obtener una actualización de un envío retrasado',
    response:
      'Entendemos la urgencia del retraso. Revisaremos el seguimiento a partir de lo que describes y te indicaremos el siguiente paso.',
    test: (text) =>
      includesAny(text, ['retraso', 'retras', 'no se mueve', 'en tránsito', 'en transito', 'debía llegar', 'debia llegar']),
  },
  {
    category: 'Consulta de stock',
    intent: 'Consultar disponibilidad de un producto',
    response:
      'Recibimos tu consulta de disponibilidad. Te responderemos con la información que sí consta en el mensaje, sin inventar fechas de stock.',
    test: (text) => includesAny(text, ['stock', 'tienen', 'reservo', 'vuelve esta semana']),
  },
  {
    category: 'Cancelación',
    intent: 'Cancelar un pedido',
    response:
      'Registramos tu solicitud de cancelación. Continuaremos solo con lo que aparece en el mensaje.',
    test: (text) => includesAny(text, ['cancelar', 'cancelación', 'cancelacion']),
  },
  {
    category: 'Reembolso',
    intent: 'Solicitar o completar un reembolso',
    response:
      'Revisaremos la solicitud de reembolso con los montos o plazos que mencionas. No confirmaremos operaciones que no estén en el mensaje.',
    test: (text) => includesAny(text, ['reembolso', 'reverso', 'me devolvieron', 'falta el envío']),
  },
  {
    category: 'Problema con factura',
    intent: 'Resolver un problema con la factura',
    response:
      'Revisaremos el problema de facturación descrito. Te orientaremos con base en el detalle que enviaste.',
    test: (text) => includesAny(text, ['factura', 'pdf', 'xml', 'desglose', 'contabilidad']),
  },
  {
    category: 'Felicitación',
    intent: 'Agradecer la atención recibida',
    response:
      'Gracias por tu comentario. Registramos tu felicitación para el equipo mencionado en el mensaje.',
    test: (text) => includesAny(text, ['gracias', 'perfecto', 'excelente', 'sigan así', 'sigan asi']),
  },
  {
    category: 'Consulta poco clara',
    intent: 'Aclarar el motivo del contacto',
    response:
      'Para ayudarte con precisión necesitamos que concretes el pedido o el problema. El mensaje actual no alcanza para avanzar.',
    test: (text) =>
      includesAny(text, ['??', 'sobre lo de ayer', 'me dijeron que me iban a escribir', 'o sea, lo del paquete']),
  },
]

function detectSentiment(text: string): string {
  if (includesAny(text, ['gracias', 'perfecto', 'excelente', 'sigan así', 'sigan asi'])) {
    return 'Satisfecho'
  }
  if (
    includesAny(text, [
      'inaceptable',
      'indecopi',
      'no me escriban',
      'tercera vez',
      'reemplazo hoy',
      'no un crédito',
    ])
  ) {
    return 'Muy molesto'
  }
  if (includesAny(text, ['urgente', 'urgentemente', 'necesito hoy', 'bloqueó', 'bloqueo', 'preocup'])) {
    return 'Preocupado'
  }
  if (includesAny(text, ['molest', 'ya no quiero', 'inconveniente', 'no reconozco'])) {
    return 'Preocupado'
  }
  if (includesAny(text, ['??', 'no sé', 'no se', 'confund'])) {
    return 'Confundido'
  }
  return 'Neutral'
}

function detectPriority(text: string, category: string): string {
  if (
    includesAny(text, [
      'urgente',
      'hoy',
      'bloqueó',
      'bloqueo',
      'supervisor',
      'inaceptable',
      'indecopi',
      'no recibí',
      'no recibi',
    ]) ||
    category === 'Cobro duplicado' ||
    category === 'Pedido perdido'
  ) {
    return 'Alta'
  }
  if (category === 'Felicitación' || category === 'Consulta de stock' || category === 'Consulta poco clara') {
    return 'Baja'
  }
  return 'Media'
}

function buildSummary(message: string, category: string): string {
  const compact = message.replace(/\s+/g, ' ').trim()
  const excerpt = compact.length > 160 ? `${compact.slice(0, 157)}…` : compact
  return `El cliente plantea un caso de ${category.toLowerCase()}. ${excerpt}`
}

export function simulateAnalysis(message: string, subject: string): SimulatedAnalysis {
  const text = `${subject} ${message}`.toLowerCase()
  const matched = RULES.find((rule) => rule.test(text))
  const category = matched?.category ?? 'Consulta poco clara'
  const sentiment = detectSentiment(text)
  const angryOverride = sentiment === 'Muy molesto'

  return {
    category,
    priority: detectPriority(text, category),
    sentiment,
    intent:
      angryOverride && category !== 'Felicitación'
        ? 'Escalar el caso y obtener una solución inmediata'
        : (matched?.intent ?? 'Aclarar el motivo del contacto'),
    summary: buildSummary(message, category),
    suggestedResponse:
      matched?.response ??
      'Recibimos tu mensaje. Para continuar necesitamos más detalle, porque la información actual no alcanza para confirmar datos de pedido o política.',
  }
}
