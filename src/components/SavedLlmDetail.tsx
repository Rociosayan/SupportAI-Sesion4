import type { SavedLlmAnalysis } from '../types/savedAnalysis'
import { formatDateTime } from '../utils/format'

type SavedLlmDetailProps = {
  record: SavedLlmAnalysis | null
}

export function SavedLlmDetail({ record }: SavedLlmDetailProps) {
  if (!record) {
    return (
      <div className="panel empty-panel">
        <p>Selecciona un análisis guardado para ver el detalle.</p>
      </div>
    )
  }

  return (
    <article className="panel">
      <p className="badge badge-unanalyzed">
        {record.source === 'gemini'
          ? 'ANÁLISIS GENERADO CON GEMINI API'
          : 'ANÁLISIS IMPORTADO DESDE LLM'}
      </p>
      <dl className="detail-grid">
        <div>
          <dt>Cliente</dt>
          <dd>{record.customerName}</dd>
        </div>
        <div>
          <dt>Asunto</dt>
          <dd>{record.subject}</dd>
        </div>
        <div>
          <dt>Categoría</dt>
          <dd>{record.categoria}</dd>
        </div>
        <div>
          <dt>Prioridad</dt>
          <dd>{record.prioridad}</dd>
        </div>
        <div>
          <dt>Sentimiento</dt>
          <dd>{record.sentimiento}</dd>
        </div>
        <div>
          <dt>Intención</dt>
          <dd>{record.intencion}</dd>
        </div>
        <div>
          <dt>Fecha y hora</dt>
          <dd>
            <time dateTime={record.savedAt}>{formatDateTime(record.savedAt)}</time>
          </dd>
        </div>
      </dl>
      <div>
        <h3>Resumen</h3>
        <p className="case-message">{record.resumen}</p>
      </div>
      <div className="panel">
        <h3>Respuesta sugerida</h3>
        <p className="case-message">{record.respuestaSugerida}</p>
      </div>
    </article>
  )
}
