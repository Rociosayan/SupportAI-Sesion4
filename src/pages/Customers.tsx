import { PageHeader } from '../components/PageHeader'
import type { SupportCase } from '../types/case'
import { getCustomersFromCases } from '../utils/catalog'
import { formatDateTime } from '../utils/format'

type CustomersProps = {
  cases: SupportCase[]
}

export function Customers({ cases }: CustomersProps) {
  const customers = getCustomersFromCases(cases)

  return (
    <div className="page page-wide">
      <PageHeader
        title="Clientes"
        subtitle="Clientes asociados a los casos locales de la bandeja. Sin autenticación ni base de datos externa."
      />
      <p className="result-count">{customers.length} clientes · {cases.length} casos</p>
      <div className="lab-table-wrap panel">
        <table className="lab-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Casos</th>
              <th>Pedidos</th>
              <th>Canales</th>
              <th>Última actividad</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.name}>
                <td>{customer.name}</td>
                <td>{customer.caseCount}</td>
                <td>{customer.orderCount}</td>
                <td>{customer.channels.join(', ')}</td>
                <td>{formatDateTime(customer.lastDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
