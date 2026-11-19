import { useEffect, useMemo, useState } from 'react'
import { Archive, ArrowLeft, CalendarDays, Pencil, Plus } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import ConfirmModal from '../components/ConfirmModal'
import TransactionDetailModal from '../components/TransactionDetailModal'
import TransactionModal from '../components/TransactionModal'
import TransactionPagination from '../components/TransactionPagination'
import AnimatedNumber from '../components/AnimatedNumber'
import TransactionRow from '../components/TransactionRow'
import WalletCard from '../components/WalletCard'
import WalletModal from '../components/WalletModal'
import { useFinance } from '../context/FinanceContext'
import { compareTransactionsByOccurredAtDesc } from '../lib/dates'
import { formatCurrency } from '../lib/money'
import { useShell } from '../layout/AppShell'
import { walletTypeLabels, type Transaction } from '../types'

const WALLET_TRANSACTION_PAGE_SIZE = 5

export default function WalletDetailPage() {
  const { walletId } = useParams()
  const navigate = useNavigate()
  const { transactions, getWallet, getWalletBalance, archiveWallet, deleteTransaction: removeTransaction } = useFinance()
  const { openQuickAdd, notify } = useShell()
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [page, setPage] = useState(0)
  const wallet = walletId ? getWallet(walletId) : undefined
  const walletTransactions = useMemo(() => transactions
    .filter((transaction) => transaction.walletId === walletId)
    .sort(compareTransactionsByOccurredAtDesc), [transactions, walletId])
  const income = walletTransactions.filter((transaction) => transaction.type === 'income').reduce((sum, transaction) => sum + transaction.amountCents, 0)
  const expenses = walletTransactions.filter((transaction) => transaction.type === 'expense').reduce((sum, transaction) => sum + transaction.amountCents, 0)

  useEffect(() => {
    setPage(0)
  }, [walletId])

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(walletTransactions.length / WALLET_TRANSACTION_PAGE_SIZE) - 1)
    setPage((current) => Math.min(current, lastPage))
  }, [walletTransactions.length])

  function editTransaction(transaction: Transaction): void {
    setSelectedTransaction(null)
    setEditTarget(transaction)
  }

  function confirmDelete(): void {
    if (!deleteTarget) return
    removeTransaction(deleteTarget.id)
    notify('Movement removed.')
    setDeleteTarget(null)
  }

  if (!wallet) return <EmptyState title="Wallet not found" description="This wallet may have been archived or does not exist." action={{ label: 'Back to wallets', onClick: () => navigate('/wallets') }} />

  const visibleTransactions = walletTransactions.slice(page * WALLET_TRANSACTION_PAGE_SIZE, (page + 1) * WALLET_TRANSACTION_PAGE_SIZE)

  return (
    <div className="page-stack wallet-detail-page">
       <div className="detail-back-row"><Link to="/wallets" className="icon-button detail-back-button" aria-label="Back to wallets" title="Back to wallets"><ArrowLeft size={18} /></Link><div className="detail-actions">{!wallet.isArchived && <><button className="icon-button detail-action-edit" type="button" onClick={() => setEditOpen(true)} aria-label="Edit wallet" title="Edit wallet"><Pencil size={17} /></button><button className="icon-button detail-action-archive" type="button" onClick={() => setArchiveOpen(true)} aria-label="Archive wallet" title="Archive wallet"><Archive size={17} /></button></>}{!wallet.isArchived && <button className="icon-button detail-action-add" type="button" onClick={() => openQuickAdd(wallet.id)} aria-label="Add movement" title="Add movement"><Plus size={19} /></button>}</div></div>
      <section className="wallet-detail-hero">
        <div className="wallet-detail-card"><WalletCard wallet={wallet} featured /><div className="wallet-card-glow" /></div>
        <div className="wallet-detail-copy"><span className="section-kicker">{wallet.isArchived ? 'Archived' : 'Wallet'}</span><h2>{wallet.name}</h2><p>{walletTypeLabels[wallet.type]} account details and activity</p></div>
      </section>
       <section className="wallet-detail-metrics"><div><strong><AnimatedNumber value={getWalletBalance(wallet.id)} format={(amount) => formatCurrency(Math.round(amount))} /></strong><span>Current balance</span></div><div><strong className="amount-positive"><AnimatedNumber value={income} format={(amount) => formatCurrency(Math.round(amount))} /></strong><span>Money in</span></div><div><strong className="amount-negative"><AnimatedNumber value={expenses} format={(amount) => formatCurrency(Math.round(amount))} /></strong><span>Money out</span></div><div><strong><AnimatedNumber value={walletTransactions.length} format={(amount) => String(Math.round(amount))} /></strong><span>Transactions</span></div></section>
        <section className="panel wallet-history-panel"><div className="section-heading-row"><div><span className="section-kicker">Activity</span><h2>Transaction history</h2></div><span className="wallet-history-count"><CalendarDays size={14} /> {walletTransactions.length} transactions</span></div>{visibleTransactions.length ? <div className="transaction-list transaction-list-full">{visibleTransactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} onOpen={setSelectedTransaction} />)}</div> : <EmptyState title="No transactions yet" description="Add a transaction to start tracking this wallet." action={!wallet.isArchived ? { label: 'Add transaction', onClick: () => openQuickAdd(wallet.id) } : undefined} />}<TransactionPagination total={walletTransactions.length} page={page} onPageChange={setPage} pageSize={WALLET_TRANSACTION_PAGE_SIZE} /></section>
       <TransactionDetailModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} onEdit={editTransaction} onDelete={(transaction) => { setSelectedTransaction(null); setDeleteTarget(transaction) }} />
       <TransactionModal open={Boolean(editTarget)} transaction={editTarget} onClose={() => setEditTarget(null)} onSuccess={(message) => { setEditTarget(null); notify(message) }} />
       <WalletModal open={editOpen} wallet={wallet} onClose={() => setEditOpen(false)} onSuccess={() => setEditOpen(false)} />
       <ConfirmModal open={archiveOpen} title="Archive wallet?" message={`${wallet.name} will leave active wallets, but its history will remain.`} confirmLabel="Archive" danger onClose={() => setArchiveOpen(false)} onConfirm={() => { archiveWallet(wallet.id); setArchiveOpen(false); navigate('/wallets') }} />
       <ConfirmModal open={Boolean(deleteTarget)} title="Remove movement?" message={deleteTarget?.type === 'transfer' ? 'Both wallet entries for this transfer will be hidden from your active list.' : 'This movement will be hidden from your active list.'} confirmLabel="Remove" danger onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </div>
  )
}
