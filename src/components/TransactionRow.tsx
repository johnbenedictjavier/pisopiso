import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, MoreHorizontal, Paperclip } from 'lucide-react'
import { useFinance, transactionSign, transactionTypeLabel } from '../context/FinanceContext'
import { formatShortDate } from '../lib/dates'
import { formatSignedCurrency } from '../lib/money'
import type { Transaction } from '../types'
import CategoryIcon from './CategoryIcon'

interface TransactionRowProps {
  transaction: Transaction
  compact?: boolean
  onDelete?: (transaction: Transaction) => void
  onOpen?: (transaction: Transaction) => void
}

export default function TransactionRow({ transaction, compact = false, onDelete, onOpen }: TransactionRowProps) {
  const { state, getWallet } = useFinance()
  const wallet = getWallet(transaction.walletId)
  const category = state.categories.find((item) => item.id === transaction.categoryId)
  const sign = transactionSign(transaction)
  const Icon = transaction.type === 'income' ? ArrowDownLeft : transaction.type === 'transfer' ? ArrowLeftRight : ArrowUpRight
  const title = transaction.type === 'transfer'
    ? transaction.transferDirection === 'out'
      ? `To ${getWallet(transaction.relatedWalletId ?? '')?.name ?? 'another wallet'}`
      : `From ${getWallet(transaction.relatedWalletId ?? '')?.name ?? 'another wallet'}`
    : transaction.merchant

  return (
    <article className={`transaction-row ${compact ? 'transaction-row-compact' : ''} ${onOpen ? 'transaction-row-clickable' : ''}`} role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined} onClick={() => onOpen?.(transaction)} onKeyDown={(event) => { if (onOpen && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onOpen(transaction) } }}>
      <span className={`transaction-icon transaction-icon-${transaction.type}`}>
        {transaction.type === 'transfer' ? <Icon size={18} /> : category ? <CategoryIcon name={category.icon} /> : <MoreHorizontal size={18} />}
      </span>
      <div className="transaction-main">
        <strong>{title} {transaction.receiptName && <Paperclip className="receipt-indicator" size={12} aria-label="Receipt attached" />}</strong>
        <span>{transaction.type === 'transfer' ? transaction.note || 'Internal movement' : category?.name ?? 'Uncategorized'}</span>
      </div>
      <div className="transaction-meta">
        <strong className={sign > 0 ? 'amount-positive' : 'amount-negative'}>
          {formatSignedCurrency(sign * transaction.amountCents)}
        </strong>
        <span>{compact ? formatShortDate(transaction.occurredAt) : `${formatShortDate(transaction.occurredAt)} · ${wallet?.name ?? 'Wallet'}`}</span>
      </div>
      {onDelete && (
        <button className="row-action" type="button" onClick={(event) => { event.stopPropagation(); onDelete(transaction) }} aria-label={`Delete ${transactionTypeLabel(transaction.type).toLowerCase()} ${title}`}>
          <MoreHorizontal size={18} />
        </button>
      )}
    </article>
  )
}
