import { Sparkles } from 'lucide-react'

type AnalyzeActionProps = {
  onAnalyze?: () => void
  analyzing?: boolean
}

export function AnalyzeAction({ onAnalyze, analyzing = false }: AnalyzeActionProps) {
  return (
    <div className="analyze-action">
      <button type="button" className="analyze-button" onClick={onAnalyze} disabled={analyzing || !onAnalyze}>
        <Sparkles size={16} />
        {analyzing ? 'ANALIZANDO...' : 'Analizar con IA'}
      </button>
    </div>
  )
}
