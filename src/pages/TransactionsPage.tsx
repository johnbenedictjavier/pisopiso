import { useMemo, useState } from 'react'
import { Download, Filter, Plus, Search, SlidersHorizontal } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import TransactionRow from '../components/TransactionRow'
import TransactionDetailModal from '../components/TransactionDetailModal'
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

  const filteredTransactions = useMemo(() => transactions.filter((transaction) => {
    const matchesType = filter === 'all' || transaction.type === filter
    const matchesWallet = walletFilter === 'all' || transaction.walletId === walletFilter
    const category = state.categories.find((item) => item.id === transaction.categoryId)
    const text = `${transaction.merchant} ${transaction.note} ${category?.name ?? ''}`.toLowerCase()
    return matchesType && matchesWallet && text.includes(query.toLowerCase())
  }), [filter, query, state.categories, transactions, walletFilter])

  function deleteTransaction(transaction: Transaction): void {
    if (window.confirm('Remove this movement from your active history? Its record will remain preserved in the ledger.')) {
      removeTransaction(transaction.id)
      notify('Movement removed from active history.')
    }
  }

  const expenseTotal = filteredTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amountCents, 0)
  const incomeTotal = filteredTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amountCents, 0)

  return (
    <div className="page-stack">
      <section className="page-intro-row"><div><p className="lead-copy">A searchable, honest record of where your money has been.</p></div><div className="intro-actions"><button className="button button-secondary" type="button" onClick={() => { downloadTransactionsCsv(filteredTransactions, state.wallets); notify('Your CSV export is ready.') }}><Download size={16} /> Export CSV</button><button className="button button-primary" type="button" onClick={openQuickAdd}><Plus size={17} /> Add movement</button></div></section>
      <section className="transaction-overview"><div><span className="section-kicker">Showing {filteredTransactions.length} {filteredTransactions.length === 1 ? 'movement' : 'movements'}</span><strong>{formatCurrency(incomeTotal - expenseTotal)}</strong><small>Net in the current view</small></div><div className="transaction-totals"><span><i className="dot dot-income" /> In {formatCurrency(incomeTotal)}</span><span><i className="dot dot-expenses" /> Out {formatCurrency(expenseTotal)}</span></div></section>
      <section className="panel transactions-panel">
        <div className="filter-toolbar">
          <label className="search-field search-field-wide"><Search size={17} /><span className="sr-only">Search transactions</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search merchant, note, or category" /></label>
          <div className="segmented-control" aria-label="Filter by movement type">{(['all', 'expense', 'income', 'transfer'] as FilterType[]).map((item) => <button key={item} className={filter === item ? 'segmented-active' : ''} type="button" onClick={() => setFilter(item)}>{item === 'all' ? 'All' : item[0].toUpperCase() + item.slice(1)}</button>)}</div>
          <select className="filter-select" value={walletFilter} onChange={(event) => setWalletFilter(event.target.value)} aria-label="Filter by wallet"><option value="all">All wallets</option>{state.wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select>
          <button className="icon-button filter-button" type="button" aria-label="More filters"><SlidersHorizontal size={18} /><Filter size={13} /></button>
        </div>
         {filteredTransactions.length ? <div className="transaction-list transaction-list-full">{filteredTransactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} onOpen={setSelectedTransaction} onDelete={deleteTransaction} />)}</div> : <EmptyState title="Nothing matches yet" description="Try another search or log a new movement to get your story started." action={{ label: 'Add movement', onClick: openQuickAdd }} />}
       </section>
       <TransactionDetailModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
     </div>
  )
}
