import type { SupportCase } from '../types/case'

export type CustomerRecord = {
  name: string
  caseCount: number
  orderCount: number
  lastDate: string
  channels: string[]
}

export type OrderRecord = {
  orderNumber: string
  customerName: string
  product: string
  date: string
  status: string
  caseCount: number
}

const PRODUCTS_FROM_CASES: Record<string, string> = {
  'PED-2026-10482': 'Chaqueta',
  'PED-2026-10491': 'Auriculares',
  'PED-2026-10502': 'Pedido del 11 de septiembre',
  'PED-2026-10511': 'Camisa oxford',
  'PED-2026-10518': 'Abrigo',
  'PED-2026-10527': 'Teclado',
  'PED-2026-10540': 'Monitor',
  'PED-2026-09811': 'Mochila urbana gris 20 L',
  'PED-2026-10555': 'Equipo 256 GB',
  'PED-2026-10590': 'Materiales de capacitación',
  'PED-2026-10597': 'Lámpara',
  'PED-2026-09920': 'Plan anual',
  'PED-2026-10610': 'Pantalón cargo',
  'PED-2026-10616': 'Set de sábanas',
  'PED-2026-09770': 'Licuadora',
  'PED-2026-10635': 'Maleta',
  'PED-2026-08801': 'Escritorio blanco 140 cm',
  'PED-2026-10648': '4 sillas',
  'PED-2026-10388': 'Chaqueta',
  'PED-2026-10455': 'Reposición del pedido',
}

function orderStatus(cases: SupportCase[]): string {
  if (cases.some((item) => item.category === 'Cancelación' && item.status === 'Resuelto')) {
    return 'Cancelado'
  }
  if (cases.every((item) => item.status === 'Resuelto')) {
    return 'Entregado'
  }
  if (cases.some((item) => item.category === 'Pedido retrasado' || item.category === 'Pedido perdido')) {
    return 'En tránsito'
  }
  return 'Registrado'
}

export function getCustomersFromCases(cases: SupportCase[]): CustomerRecord[] {
  const grouped = new Map<string, SupportCase[]>()

  for (const item of cases) {
    const list = grouped.get(item.customerName) ?? []
    list.push(item)
    grouped.set(item.customerName, list)
  }

  return [...grouped.entries()]
    .map(([name, list]) => ({
      name,
      caseCount: list.length,
      orderCount: new Set(list.map((item) => item.orderNumber)).size,
      lastDate: list.reduce((latest, item) => (item.date > latest ? item.date : latest), list[0].date),
      channels: [...new Set(list.map((item) => item.channel))],
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export function getOrdersFromCases(cases: SupportCase[]): OrderRecord[] {
  const grouped = new Map<string, SupportCase[]>()

  for (const item of cases) {
    const list = grouped.get(item.orderNumber) ?? []
    list.push(item)
    grouped.set(item.orderNumber, list)
  }

  return [...grouped.entries()]
    .map(([orderNumber, list]) => ({
      orderNumber,
      customerName: list[0].customerName,
      product: PRODUCTS_FROM_CASES[orderNumber] ?? 'No indicado en el caso',
      date: list.reduce((latest, item) => (item.date > latest ? item.date : latest), list[0].date),
      status: orderStatus(list),
      caseCount: list.length,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}
