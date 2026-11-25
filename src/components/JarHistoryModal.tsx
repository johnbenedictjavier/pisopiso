import Modal from './Modal'
import { useFinance } from '../context/FinanceContext'
import { formatShortDate } from '../lib/dates'
import { formatCurrency } from '../lib/money'

interface JarHistoryModalProps {
  open: boolean
  onClose: () => void
}

export default function JarHistoryModal({ open, onClose }: JarHistoryModalProps) {
  const { jarTransactions, state, getWallet } = useFinance()
  const entries = [...jarTransactions].sort((left, right) => {
    const dateDifference = new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
    return dateDifference || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })

  return (
    <Modal
      open={open}
      title="Coin jar history"
      description="Coins back are kept here separately from your wallet balances and regular ledger."
      onClose={onClose}
      size="medium"
    >
      {entries.length ? (
        <div className="jar-history-list">
          {entries.map((entry) => {
            const source = state.transactions.find((transaction) => transaction.id === entry.sourceTransactionId)
            const wallet = source ? getWallet(source.walletId) : undefined
            const sourceLabel = entry.sourceType === 'income' ? 'Income coins back' : 'Expense coins back'
            return (
              <article className="jar-history-row" key={entry.id}>
                <span className="jar-history-coin" aria-hidden="true">₱</span>
                <div className="jar-history-copy">
                  <strong>{source?.merchant || sourceLabel}</strong>
                  <span>{sourceLabel} · {wallet?.name ?? 'Wallet'} · {formatShortDate(entry.occurredAt)}</span>
                </div>
                <strong className="amount-positive">+{formatCurrency(entry.amountCents)}</strong>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="jar-history-empty">
          <span className="jar-history-empty-icon" aria-hidden="true">₱</span>
          <strong>No coins in the jar yet</strong>
          <p>Add an optional coins-back amount to an income or expense to start filling it.</p>
        </div>
      )}
    </Modal>
  )
}
