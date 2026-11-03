import { CheckCircle2, X } from 'lucide-react'

interface ToastProps {
  message: string
  onClose: () => void
}

export default function Toast({ message, onClose }: ToastProps) {
  return (
    <div className="toast" role="status" aria-live="polite">
      <CheckCircle2 size={18} />
      <span>{message}</span>
      <button className="toast-close" type="button" aria-label="Dismiss notification" onClick={onClose}>
        <X size={15} />
      </button>
    </div>
  )
}
