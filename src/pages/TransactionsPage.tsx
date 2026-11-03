import { useEffect, useMemo, useState } from 'react'
import { Download, Filter, Plus, Search, SearchX, SlidersHorizontal } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import ConfirmModal from '../components/ConfirmModal'
import TransactionRow from '../components/TransactionRow'
import TransactionDetailModal from '../components/TransactionDetailModal'
import TransactionModal from '../components/TransactionModal'
import TransactionPagination, { TRANSACTION_PAGE_SIZE } from '../components/TransactionPagination'
import AnimatedNumber from '../components/AnimatedNumber'
import { useFinance } from '../context/FinanceContext'
import { downloadTransactionsCsv } from '../lib/csv'
import { formatCurrency } from '../lib/money'
import { useShell } from '../layout/AppShell'
import type { Transaction, TransactionType } from '../types'

type FilterType = 'all' | TransactionType

export default function TransactionsPage() {
  const { state, transactions, deleteTransaction: removeTransaction } = useFinance()
  const { openQuickAdd, notify } = useShell()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [walletFilter, setWalletFilter] = useState('all')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [page, setPage] = useState(0)

  const filteredTransactions = useMemo(() => transactions.filter((transaction) => {
    const matchesType = filter === 'all' || transaction.type === filter
    const matchesWallet = walletFilter === 'all' || transaction.walletId === walletFilter
    const category = state.categories.find((item) => item.id === transaction.categoryId)
    const text = `${transaction.merchant} ${transaction.note} ${category?.name ?? ''}`.toLowerCase()
    return matchesType && matchesWallet && text.includes(query.toLowerCase())
  }), [filter, query, state.categories, transactions, walletFilter])

  useEffect(() => {
    setPage(0)
  }, [filter, query, walletFilter])

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredTransactions.length / TRANSACTION_PAGE_SIZE) - 1)
    setPage((current) => Math.min(current, lastPage))
  }, [filteredTransactions.length])

  function confirmDelete(): void {
    if (!deleteTarget) return
    removeTransaction(deleteTarget.id)
    notify('Movement removed.')
    setDeleteTarget(null)
  }

  function clearFilters(): void {
    setQuery('')
    setFilter('all')
    setWalletFilter('all')
  }

  function editTransaction(transaction: Transaction): void {
    setSelectedTransaction(null)
    setEditTarget(transaction)
  }

  const expenseTotal = filteredTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amountCents, 0)
  const incomeTotal = filteredTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amountCents, 0)
  const hasFilters = Boolean(query.trim() || filter !== 'all' || walletFilter !== 'all')
  const visibleTransactions = filteredTransactions.slice(page * TRANSACTION_PAGE_SIZE, (page + 1) * TRANSACTION_PAGE_SIZE)

  return (
    <div className="page-stack">
      <section className="page-intro-row"><div><span className="section-kicker">Ledger</span><h2 className="page-section-title">All movements</h2></div><div className="intro-actions"><button className="button button-secondary" type="button" onClick={() => { downloadTransactionsCsv(filteredTransactions, state.wallets); notify('Your CSV export is ready.') }}><Download size={16} /> Export CSV</button><button className="button button-primary" type="button" onClick={openQuickAdd}><Plus size={17} /> Add movement</button></div></section>
       <section className="transaction-overview"><div><span className="section-kicker">Showing {filteredTransactions.length} {filteredTransactions.length === 1 ? 'movement' : 'movements'}</span><strong><AnimatedNumber value={incomeTotal - expenseTotal} format={(amount) => formatCurrency(Math.round(amount))} /></strong><small>Net in the current view</small></div><div className="transaction-totals"><span><i className="dot dot-income" /> In <AnimatedNumber value={incomeTotal} format={(amount) => formatCurrency(Math.round(amount))} /></span><span><i className="dot dot-expenses" /> Out <AnimatedNumber value={expenseTotal} format={(amount) => formatCurrency(Math.round(amount))} /></span></div></section>
      <section className="panel transactions-panel">
        <div className="filter-toolbar">
          <label className="search-field search-field-wide"><Search size={17} /><span className="sr-only">Search transactions</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search merchant, note, or category" /></label>
          <div className="segmented-control" aria-label="Filter by movement type">{(['all', 'expense', 'income', 'transfer'] as FilterType[]).map((item) => <button key={item} className={filter === item ? 'segmented-active' : ''} type="button" onClick={() => setFilter(item)}>{item === 'all' ? 'All' : item[0].toUpperCase() + item.slice(1)}</button>)}</div>
          <select className="filter-select" value={walletFilter} onChange={(event) => setWalletFilter(event.target.value)} aria-label="Filter by wallet"><option value="all">All wallets</option>{state.wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select>
          <button className="icon-button filter-button" type="button" aria-label="More filters"><SlidersHorizontal size={18} /><Filter size={13} /></button>
        </div>
          {visibleTransactions.length ? <div className="transaction-list transaction-list-full">{visibleTransactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} onOpen={setSelectedTransaction} onDelete={setDeleteTarget} />)}</div> : <EmptyState icon={hasFilters ? SearchX : undefined} title={hasFilters ? 'No movements found' : 'No movements yet'} description={hasFilters ? 'Try a different search or clear the filters to see your full ledger.' : 'Add your first movement to start the ledger.'} action={hasFilters ? { label: 'Clear filters', onClick: clearFilters } : { label: 'Add movement', onClick: openQuickAdd }} secondaryAction={hasFilters ? { label: 'Add movement', onClick: openQuickAdd } : undefined} />}
          <TransactionPagination total={filteredTransactions.length} page={page} onPageChange={setPage} />
        </section>
        <TransactionDetailModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} onEdit={editTransaction} />
        <TransactionModal open={Boolean(editTarget)} transaction={editTarget} onClose={() => setEditTarget(null)} onSuccess={(message) => { setEditTarget(null); notify(message) }} />
       <ConfirmModal open={Boolean(deleteTarget)} title="Remove movement?" message="This movement will be hidden from your active list." confirmLabel="Remove" danger onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
     </div>
  )
}
