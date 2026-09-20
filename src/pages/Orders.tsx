import { PageHeader } from '../components/PageHeader'
import type { SupportCase } from '../types/case'
import { getOrdersFromCases } from '../utils/catalog'
import { formatDateTime } from '../utils/format'

type OrdersProps = {
  cases: SupportCase[]
}

export function Orders({ cases }: OrdersProps) {
  const orders = getOrdersFromCases(cases)

  return (
    <div className="page page-wide">
      <PageHeader
        title="Pedidos"
        subtitle="Pedidos relacionados con los casos existentes. Datos locales de laboratorio."
      />
      <div className="notice" role="status">
        El modelo de IA todavía no consulta automáticamente estos pedidos. No debe usarse esta
        sección como si el modelo conociera el estado del pedido. Esa integración se trabajará
        posteriormente.
      </div>
      <p className="result-count">{orders.length} pedidos vinculados a la bandeja</p>
      <div className="lab-table-wrap panel">
        <table className="lab-table">
          <thead>
            <tr>
              <th>Número de pedido</th>
              <th>Cliente</th>
              <th>Producto</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.orderNumber}>
                <td>{order.orderNumber}</td>
                <td>{order.customerName}</td>
                <td>{order.product}</td>
                <td>{formatDateTime(order.date)}</td>
                <td>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
