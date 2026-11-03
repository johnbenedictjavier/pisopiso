import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string
  note: string
  icon: LucideIcon
  tone?: 'sage' | 'blue' | 'amber' | 'violet'
}

export default function MetricCard({ label, value, note, icon: Icon, tone = 'sage' }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-icon-${tone}`}><Icon size={18} strokeWidth={1.8} /></div>
      <div className="metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  )
}
