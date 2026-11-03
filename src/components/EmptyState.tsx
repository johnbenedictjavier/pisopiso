import { Inbox, type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  secondaryAction?: { label: string; onClick: () => void }
  icon?: LucideIcon
}

export default function EmptyState({ title, description, action, secondaryAction, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon size={23} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      {(action || secondaryAction) && <div className="empty-state-actions">{action && <button className="button button-secondary" type="button" onClick={action.onClick}>{action.label}</button>}{secondaryAction && <button className="button button-quiet" type="button" onClick={secondaryAction.onClick}>{secondaryAction.label}</button>}</div>}
    </div>
  )
}
