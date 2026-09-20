import { FileText } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { policyDocuments } from '../data/documents'

export function Documents() {
  return (
    <div className="page page-wide">
      <PageHeader
        title="Documentos"
        subtitle="Biblioteca visual de políticas internas. Todavía no hay búsqueda ni RAG."
      />
      <div className="notice" role="status">
        El modelo de IA no consulta automáticamente estos documentos. La capacidad de recuperar
        información desde archivos (RAG) se incorporará posteriormente.
      </div>
      <section className="docs-grid">
        {policyDocuments.map((document) => (
          <article key={document.id} className="panel doc-card">
            <div className="stat-icon">
              <FileText size={22} />
            </div>
            <h2>{document.title}</h2>
            <p>{document.summary}</p>
            <p className="badge badge-unanalyzed">RAG pendiente</p>
          </article>
        ))}
      </section>
    </div>
  )
}
