import type { RagFragment } from '../types/rag'

export function RagFragments({ fragments }: { fragments: RagFragment[] }) {
  if (fragments.length === 0) {
    return <p className="empty-state">No se recuperaron fragmentos.</p>
  }

  return (
    <ul className="rag-fragments">
      {fragments.map((item) => (
        <li key={`${item.source}-${item.chunkIndex}`}>
          <p>
            <strong>{item.source}</strong> · chunk {item.chunkIndex} · score {item.score.toFixed(3)}
          </p>
          <pre>{item.content}</pre>
        </li>
      ))}
    </ul>
  )
}
