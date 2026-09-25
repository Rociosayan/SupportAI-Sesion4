import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import type { SupportCase } from '../types/case'
import { getOrdersFromCases } from '../utils/catalog'
import { formatDateTime } from '../utils/format'

type OrdersProps = {
  cases: SupportCase[]
  onOpenCase: (id: string) => void
}

export function Orders({ cases, onOpenCase }: OrdersProps) {
  const orders = getOrdersFromCases(cases)
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null)
  const selected = orders.find((item) => item.orderNumber === selectedNumber) ?? null
  const related = selected ? cases.filter((item) => item.orderNumber === selected.orderNumber) : []

  return (
    <div className="page page-wide">
      <PageHeader
        title="Pedidos"
        subtitle="Pedidos asociados a los casos de atención."
      />
      <p className="result-count">
        {orders.length} pedidos asociados a los casos. No hay conexión con un sistema de pedidos externo.
      </p>
      <div className="split-view">
        <div className="lab-table-wrap panel">
          <table className="lab-table">
            <thead>
              <tr>
                <th>Número de pedido</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.orderNumber}
                  className={selectedNumber === order.orderNumber ? 'is-selected' : undefined}
                  onClick={() => setSelectedNumber(order.orderNumber)}
                >
                  <td>{order.orderNumber}</td>
                  <td>{order.customerName}</td>
                  <td>{order.product}</td>
                  <td>{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <section className="panel">
          {selected ? (
            <>
              <h2>{selected.orderNumber}</h2>
              <p className="case-meta">
                {selected.customerName} · {selected.product} · {formatDateTime(selected.date)}
              </p>
              <ul className="activity-list">
                {related.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => onOpenCase(item.id)}>
                      <div>
                        <strong>{item.id}</strong>
                        <p>{item.subject}</p>
                      </div>
                      <span className="badge">Ver caso</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="empty-state">Selecciona un pedido para ver el caso asociado.</p>
          )}
        </section>
      </div>
    </div>
  )
}
