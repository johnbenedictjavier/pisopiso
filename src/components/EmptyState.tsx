import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Inbox size={23} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <button className="button button-secondary" type="button" onClick={action.onClick}>{action.label}</button>}
    </div>
  )
}
