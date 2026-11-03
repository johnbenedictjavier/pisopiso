import type { LucideIcon } from 'lucide-react'
import AnimatedNumber from './AnimatedNumber'
import { formatCurrency } from '../lib/money'

interface MetricCardProps {
  label: string
  value: number
  formatValue?: (value: number) => string
  note: string
  icon: LucideIcon
  tone?: 'sage' | 'blue' | 'amber' | 'violet'
}

export default function MetricCard({ label, value, formatValue = (amount) => formatCurrency(Math.round(amount)), note, icon: Icon, tone = 'sage' }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-icon-${tone}`}><Icon size={18} strokeWidth={1.8} /></div>
      <div className="metric-copy">
        <span>{label}</span>
        <strong><AnimatedNumber value={value} format={formatValue} /></strong>
        <small>{note}</small>
      </div>
    </article>
  )
}
