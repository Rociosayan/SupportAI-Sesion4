import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import type { SupportCase } from '../types/case'
import { getCustomersFromCases } from '../utils/catalog'
import { formatDateTime } from '../utils/format'

type CustomersProps = {
  cases: SupportCase[]
  onOpenCase: (id: string) => void
}

export function Customers({ cases, onOpenCase }: CustomersProps) {
  const customers = getCustomersFromCases(cases)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const selected = customers.find((item) => item.name === selectedName) ?? null
  const related = selected ? cases.filter((item) => item.customerName === selected.name) : []

  return (
    <div className="page page-wide">
      <PageHeader
        title="Clientes"
        subtitle="Clientes que aparecen en los casos actuales. No hay una base de clientes aparte."
      />
      <div className="split-view">
        <div className="lab-table-wrap panel">
          <table className="lab-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Casos</th>
                <th>Pedidos</th>
                <th>Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.name}
                  className={selectedName === customer.name ? 'is-selected' : undefined}
                  onClick={() => setSelectedName(customer.name)}
                >
                  <td>{customer.name}</td>
                  <td>{customer.caseCount}</td>
                  <td>{customer.orderCount}</td>
                  <td>{formatDateTime(customer.lastDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <section className="panel">
          {selected ? (
            <>
              <h2>{selected.name}</h2>
              <dl className="detail-grid">
                <div>
                  <dt>Casos</dt>
                  <dd>{selected.caseCount}</dd>
                </div>
                <div>
                  <dt>Pedidos</dt>
                  <dd>{selected.orderCount}</dd>
                </div>
                <div>
                  <dt>Canales</dt>
                  <dd>{selected.channels.join(', ')}</dd>
                </div>
                <div>
                  <dt>Última actividad</dt>
                  <dd>{formatDateTime(selected.lastDate)}</dd>
                </div>
              </dl>
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
            <p className="empty-state">Selecciona un cliente para ver sus casos y pedidos.</p>
          )}
        </section>
      </div>
    </div>
  )
}
