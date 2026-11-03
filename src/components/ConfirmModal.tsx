import Modal from './Modal'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  onClose: () => void
  onConfirm: () => void
  danger?: boolean
}

export default function ConfirmModal({ open, title, message, confirmLabel, onClose, onConfirm, danger = false }: ConfirmModalProps) {
  return (
    <Modal open={open} title={title} description={message} onClose={onClose} size="small">
      <div className="confirm-modal-actions">
        <button className="button button-quiet" type="button" onClick={onClose}>Cancel</button>
        <button className={`button ${danger ? 'button-danger-filled' : 'button-primary'}`} type="button" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  )
}
