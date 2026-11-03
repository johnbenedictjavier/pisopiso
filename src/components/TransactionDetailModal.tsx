import { CalendarDays, Download, FileImage, FolderOpen, Pencil, Trash2, WalletCards } from 'lucide-react'
import Modal from './Modal'
import { useFinance, transactionSign, transactionTypeLabel } from '../context/FinanceContext'
import { formatDate } from '../lib/dates'
import { formatCurrency, formatSignedCurrency } from '../lib/money'
import type { Transaction } from '../types'
import CategoryIcon from './CategoryIcon'

interface TransactionDetailModalProps {
  transaction: Transaction | null
  onClose: () => void
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transaction: Transaction) => void
}

export default function TransactionDetailModal({ transaction, onClose, onEdit, onDelete }: TransactionDetailModalProps) {
  const { state, getWallet } = useFinance()
  const category = transaction ? state.categories.find((item) => item.id === transaction.categoryId) : undefined
  const wallet = transaction ? getWallet(transaction.walletId) : undefined
  const relatedWallet = transaction?.relatedWalletId ? getWallet(transaction.relatedWalletId) : undefined

  return (
    <Modal open={Boolean(transaction)} title={transaction?.merchant || 'Movement details'} description="Transaction details." onClose={onClose} size="medium">
      {transaction && (
        <div className="transaction-detail-stack">
          <div className={`transaction-detail-hero transaction-detail-${transaction.type}`}>
            <span className="transaction-detail-icon">{category ? <CategoryIcon name={category.icon} size={22} /> : <FolderOpen size={22} />}</span>
            <div><span>{transactionTypeLabel(transaction.type)}</span><strong>{formatSignedCurrency(transactionSign(transaction) * transaction.amountCents)}</strong></div>
          </div>
          <div className="transaction-detail-grid">
            <div><span>Wallet</span><strong><WalletCards size={14} /> {wallet?.name ?? 'Unknown wallet'}</strong></div>
            <div><span>Date</span><strong><CalendarDays size={14} /> {formatDate(transaction.occurredAt)}</strong></div>
            {category && <div><span>Category</span><strong><CategoryIcon name={category.icon} size={14} /> {category.name}</strong></div>}
            {relatedWallet && <div><span>{transaction.transferDirection === 'in' ? 'From wallet' : 'To wallet'}</span><strong>{relatedWallet.name}</strong></div>}
          </div>
          {transaction.note && <div className="transaction-detail-note"><span>Note</span><p>{transaction.note}</p></div>}
          <div className="receipt-detail">
            <div className="receipt-detail-heading"><span><FileImage size={17} /> Receipt</span>{transaction.receiptUrl && <a href={transaction.receiptUrl} download={transaction.receiptName ?? 'receipt.webp'} target="_blank" rel="noreferrer"><Download size={14} /> Open image</a>}</div>
            {transaction.receiptUrl ? <img src={transaction.receiptUrl} alt={transaction.receiptName ?? 'Uploaded receipt'} /> : <div className="receipt-empty"><FileImage size={20} /><span>No receipt attached to this movement.</span></div>}
           </div>
           <div className="transaction-detail-footnote">Recorded as {formatCurrency(transaction.amountCents)} · {transaction.receiptName ?? 'No attachment'}</div>
           <div className="modal-actions">
             {onEdit && <button className="button button-secondary" type="button" onClick={() => onEdit(transaction)}><Pencil size={15} /> Edit movement</button>}
             {onDelete && <button className="button button-danger" type="button" onClick={() => onDelete(transaction)}><Trash2 size={15} /> Delete movement</button>}
             <button className="button button-quiet" type="button" onClick={onClose}>Close</button>
           </div>
         </div>
      )}
    </Modal>
  )
}
