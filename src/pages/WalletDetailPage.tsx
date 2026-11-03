import { useMemo, useState } from 'react'
import { Archive, ArrowLeft, ArrowUpRight, CalendarDays, ChevronRight, Pencil, Plus, WalletCards } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import ConfirmModal from '../components/ConfirmModal'
import TransactionDetailModal from '../components/TransactionDetailModal'
import TransactionRow from '../components/TransactionRow'
import WalletCard from '../components/WalletCard'
import WalletModal from '../components/WalletModal'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../lib/money'
import { useShell } from '../layout/AppShell'
import type { Transaction } from '../types'

export default function WalletDetailPage() {
  const { walletId } = useParams()
  const navigate = useNavigate()
  const { activeWallets, transactions, getWallet, getWalletBalance, archiveWallet } = useFinance()
  const { openQuickAdd } = useShell()
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const wallet = walletId ? getWallet(walletId) : undefined
  const walletTransactions = useMemo(() => transactions.filter((transaction) => transaction.walletId === walletId), [transactions, walletId])
  const income = walletTransactions.filter((transaction) => transaction.type === 'income').reduce((sum, transaction) => sum + transaction.amountCents, 0)
  const expenses = walletTransactions.filter((transaction) => transaction.type === 'expense').reduce((sum, transaction) => sum + transaction.amountCents, 0)

  if (!wallet) return <EmptyState title="Wallet not found" description="This wallet may have been archived or does not exist in this demo." action={{ label: 'Back to wallets', onClick: () => navigate('/wallets') }} />

  return (
    <div className="page-stack wallet-detail-page">
      <div className="detail-back-row"><Link to="/wallets" className="back-link"><ArrowLeft size={16} /> Wallets</Link><div className="detail-actions">{!wallet.isArchived && <><button className="button button-secondary button-small" type="button" onClick={() => setEditOpen(true)}><Pencil size={14} /> Edit</button><button className="button button-quiet button-small" type="button" onClick={() => setArchiveOpen(true)}><Archive size={14} /> Archive</button></>}{!wallet.isArchived && <button className="button button-primary" type="button" onClick={openQuickAdd}><Plus size={16} /> Add movement</button>}</div></div>
      <section className="wallet-detail-hero">
        <div className="wallet-detail-card"><WalletCard wallet={wallet} featured /><div className="wallet-card-glow" /></div>
        <div className="wallet-detail-copy"><span className="section-kicker">{wallet.isArchived ? 'Archived' : 'Wallet'}</span><h2>{wallet.name}</h2><p>{wallet.logoName ?? 'Account details and activity'}</p></div>
      </section>
      <section className="wallet-detail-metrics"><div><span>Current balance</span><strong>{formatCurrency(getWalletBalance(wallet.id))}</strong></div><div><span>Money in</span><strong className="amount-positive">{formatCurrency(income)}</strong></div><div><span>Money out</span><strong className="amount-negative">{formatCurrency(expenses)}</strong></div><div><span>Movements</span><strong>{walletTransactions.length}</strong></div></section>
      <section className="panel wallet-history-panel"><div className="section-heading-row"><div><span className="section-kicker">Activity</span><h2>Transaction history</h2></div><span className="wallet-history-count"><CalendarDays size={14} /> {walletTransactions.length} movements</span></div>{walletTransactions.length ? <div className="transaction-list transaction-list-full">{walletTransactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} onOpen={setSelectedTransaction} />)}</div> : <EmptyState title="No movements yet" description="Add a movement to start tracking this wallet." action={!wallet.isArchived ? { label: 'Add movement', onClick: openQuickAdd } : undefined} />}</section>
      {activeWallets.length > 1 && <section className="related-wallets"><div className="section-heading-row"><div><span className="section-kicker">Your other places</span><h2>Move money with context</h2></div><Link to="/wallets" className="text-link">See all <ChevronRight size={16} /></Link></div><div className="related-wallet-list">{activeWallets.filter((item) => item.id !== wallet.id).slice(0, 3).map((item) => <Link key={item.id} to={`/wallets/${item.id}`} className="related-wallet"><WalletCards size={17} /><span>{item.name}</span><ArrowUpRight size={15} /></Link>)}</div></section>}
      <TransactionDetailModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
      <WalletModal open={editOpen} wallet={wallet} onClose={() => setEditOpen(false)} onSuccess={() => setEditOpen(false)} />
      <ConfirmModal open={archiveOpen} title="Archive wallet?" message={`${wallet.name} will leave active wallets, but its history will remain.`} confirmLabel="Archive" danger onClose={() => setArchiveOpen(false)} onConfirm={() => { archiveWallet(wallet.id); setArchiveOpen(false); navigate('/wallets') }} />
    </div>
  )
}
