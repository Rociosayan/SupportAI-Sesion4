import type { ReactNode } from 'react'

type StatCardProps = {
  label: string
  value: number
  hint: string
  icon: ReactNode
  tone?: 'default' | 'warning' | 'success' | 'danger'
}

export function StatCard({ label, value, hint, icon, tone = 'default' }: StatCardProps) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        <p className="stat-hint">{hint}</p>
      </div>
    </article>
  )
}
