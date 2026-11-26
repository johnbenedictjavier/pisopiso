import { ArrowDownRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import Modal from './Modal'
import ConfirmModal from './ConfirmModal'
import JarExpenseModal from './JarExpenseModal'
import { useFinance } from '../context/FinanceContext'
import { formatDateTime } from '../lib/dates'
import { formatCurrency } from '../lib/money'
import type { JarTransaction } from '../types'
import { useShell } from '../layout/AppShell'

interface JarHistoryModalProps {
  open: boolean
  onClose: () => void
}

export default function JarHistoryModal({ open, onClose }: JarHistoryModalProps) {
  const { jarBalanceCents, jarTransactions, state, getWallet, deleteJarExpense } = useFinance()
  const { notify } = useShell()
  const [expenseFormOpen, setExpenseFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<JarTransaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<JarTransaction | null>(null)
  const entries = [...jarTransactions].sort((left, right) => {
    const dateDifference = new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
    return dateDifference || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })

  function openAddExpense(): void {
    setEditingExpense(null)
    setExpenseFormOpen(true)
  }

  function openEditExpense(expense: JarTransaction): void {
    setEditingExpense(expense)
    setExpenseFormOpen(true)
  }

  function closeExpenseForm(): void {
    setExpenseFormOpen(false)
    setEditingExpense(null)
  }

  function confirmDelete(): void {
    if (!deleteTarget) return
    deleteJarExpense(deleteTarget.id)
    notify('Jar expense removed.')
    setDeleteTarget(null)
  }

  return (
    <Modal
      open={open}
      title="Coin jar history"
      description="Coins back and jar expenses stay separate from your wallet balances and regular ledger."
      onClose={onClose}
      size="medium"
    >
      <div className="jar-history-toolbar">
        <div className="jar-history-balance">
          <span>Jar balance</span>
          <strong className={jarBalanceCents < 0 ? 'amount-negative' : 'amount-positive'}>{formatCurrency(jarBalanceCents)}</strong>
        </div>
        <button className="button button-secondary button-small" type="button" onClick={openAddExpense}><Plus size={15} /> Add expense</button>
      </div>
      {entries.length ? (
        <div className="jar-history-list">
          {entries.map((entry) => {
            const isExpense = entry.kind === 'expense'
            const source = entry.sourceTransactionId
              ? state.transactions.find((transaction) => transaction.id === entry.sourceTransactionId)
              : undefined
            const wallet = source ? getWallet(source.walletId) : undefined
            const sourceLabel = entry.sourceType === 'income' ? 'Income coins back' : 'Expense coins back'
            const title = isExpense ? entry.merchant || 'Jar expense' : source?.merchant || sourceLabel
            const description = isExpense
              ? `Jar expense · ${formatDateTime(entry.occurredAt)}`
              : `${sourceLabel} · ${wallet?.name ?? 'Wallet'} · ${formatDateTime(entry.occurredAt)}`
            return (
              <article className="jar-history-row" key={entry.id}>
                <span className={`jar-history-coin ${isExpense ? 'jar-history-coin-expense' : ''}`} aria-hidden="true">
                  {isExpense ? <ArrowDownRight size={17} /> : '₱'}
                </span>
                <div className="jar-history-copy">
                  <strong>{title}</strong>
                  <span>{description}</span>
                  {isExpense && entry.note && <small>{entry.note}</small>}
                </div>
                <strong className={isExpense ? 'amount-negative' : 'amount-positive'}>{isExpense ? '-' : '+'}{formatCurrency(entry.amountCents)}</strong>
                {isExpense && (
                  <div className="jar-history-actions">
                    <button className="icon-button jar-history-action jar-history-action-edit" type="button" onClick={() => openEditExpense(entry)} aria-label={`Edit jar expense ${title}`} title="Edit jar expense"><Pencil size={15} /></button>
                    <button className="icon-button jar-history-action jar-history-action-delete" type="button" onClick={() => setDeleteTarget(entry)} aria-label={`Delete jar expense ${title}`} title="Delete jar expense"><Trash2 size={15} /></button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="jar-history-empty">
          <span className="jar-history-empty-icon" aria-hidden="true">₱</span>
          <strong>No coins in the jar yet</strong>
          <p>Add an optional coins-back amount to an income or expense, then use the jar for small expenses.</p>
        </div>
      )}
      <JarExpenseModal open={expenseFormOpen} expense={editingExpense} onClose={closeExpenseForm} onSuccess={(message) => { closeExpenseForm(); notify(message) }} />
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Remove jar expense?"
        message="This expense will be removed from your coin jar history and the amount will return to the jar balance."
        confirmLabel="Remove"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </Modal>
  )
}
