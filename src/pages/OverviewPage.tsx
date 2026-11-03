import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, BarChart3, CalendarDays, ChevronRight, CircleDollarSign, Plus, Sparkles, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFinance } from '../context/FinanceContext'
import { formatShortDate } from '../lib/dates'
import { formatCurrency, formatSignedCurrency } from '../lib/money'
import MetricCard from '../components/MetricCard'
import TransactionRow from '../components/TransactionRow'
import TransactionDetailModal from '../components/TransactionDetailModal'
import WalletCard from '../components/WalletCard'
import { useShell } from '../layout/AppShell'
import type { Transaction } from '../types'

function buildCashflowData(transactions: ReturnType<typeof useFinance>['transactions']) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    const dayTransactions = transactions.filter((transaction) => transaction.occurredAt.slice(0, 10) === key)
    return {
      label: new Intl.DateTimeFormat('en-PH', { weekday: 'short' }).format(date),
      income: dayTransactions.filter((transaction) => transaction.type === 'income').reduce((sum, item) => sum + item.amountCents, 0),
      expenses: dayTransactions.filter((transaction) => transaction.type === 'expense').reduce((sum, item) => sum + item.amountCents, 0),
    }
  })
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><strong>{label}</strong>{payload.map((item) => <span key={item.dataKey}><i className={`dot dot-${item.dataKey}`} /> {item.dataKey === 'income' ? 'Income' : 'Expenses'} <b>{formatCurrency(item.value)}</b></span>)}</div>
}

export default function OverviewPage() {
  const { state, activeWallets, transactions, totalBalanceCents, monthIncomeCents, monthExpensesCents, monthNetCents } = useFinance()
  const { openQuickAdd } = useShell()
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const chartData = useMemo(() => buildCashflowData(transactions), [transactions])
  const topWallets = activeWallets.slice(0, 3)
  const firstName = state.profile.displayName.split(' ')[0]

  return (
    <div className="page-stack">
      <section className="overview-intro">
        <div>
          <span className="section-kicker">Today</span><h2 className="page-section-title">Money at a glance</h2>
        </div>
        <button className="button button-secondary intro-action" type="button" onClick={openQuickAdd}><Plus size={16} /> Log something</button>
      </section>

      <section className="overview-grid">
        <article className="balance-card">
          <div className="balance-card-header"><span>Total balance</span><span className="balance-period"><CalendarDays size={14} /> All wallets</span></div>
          <strong className="balance-value">{formatCurrency(totalBalanceCents)}</strong>
           <div className="balance-card-footer"><span className="balance-change"><TrendingUp size={15} /> {formatSignedCurrency(monthNetCents)} this month</span><span className="balance-date">Updated just now</span></div>
        </article>
        <article className="chart-card">
          <div className="card-heading-row"><div><span className="section-kicker">Cash flow</span><h2>Last 7 days</h2></div><span className="chart-legend"><i className="dot dot-income" /> Income <i className="dot dot-expenses" /> Expenses</span></div>
          <div className="overview-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 4, left: -25, bottom: 0 }}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5f8068" stopOpacity={0.22} /><stop offset="100%" stopColor="#5f8068" stopOpacity={0} /></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d69570" stopOpacity={0.16} /><stop offset="100%" stopColor="#d69570" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={false} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="income" stroke="#5f8068" strokeWidth={2.5} fill="url(#incomeFill)" /><Area type="monotone" dataKey="expenses" stroke="#d69570" strokeWidth={2.5} fill="url(#expenseFill)" /></AreaChart></ResponsiveContainer></div>
        </article>
      </section>

      <section className="metric-grid">
        <MetricCard label="Income this month" value={formatCurrency(monthIncomeCents)} note="Money that found its way in" icon={ArrowDownLeft} tone="sage" />
        <MetricCard label="Spent this month" value={formatCurrency(monthExpensesCents)} note="Across all active wallets" icon={ArrowUpRight} tone="amber" />
        <MetricCard label="Net movement" value={formatSignedCurrency(monthNetCents)} note={monthNetCents >= 0 ? 'You are moving in the right direction' : 'A little more out than in'} icon={CircleDollarSign} tone="blue" />
      </section>

      <section className="section-block">
        <div className="section-heading-row"><div><span className="section-kicker">Your places</span><h2>Wallets at a glance</h2></div><Link to="/wallets" className="text-link">See all wallets <ChevronRight size={16} /></Link></div>
        <div className="wallet-grid">{topWallets.map((wallet) => <WalletCard key={wallet.id} wallet={wallet} />)}<Link to="/wallets" className="add-wallet-card"><span><Plus size={19} /></span><strong>Add another wallet</strong><small>Bank, e-wallet, cash, or something custom</small></Link></div>
      </section>

      <section className="content-split">
        <div className="panel activity-panel">
          <div className="section-heading-row"><div><span className="section-kicker">Recent activity</span><h2>What moved lately</h2></div><Link to="/transactions" className="text-link">View history <ChevronRight size={16} /></Link></div>
           <div className="transaction-list">{transactions.slice(0, 5).map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} compact onOpen={setSelectedTransaction} />)}</div>
        </div>
        <aside className="insight-card">
          <span className="insight-icon"><Sparkles size={19} /></span>
          <span className="section-kicker">A gentle nudge</span>
          <h2>Small notes become useful patterns.</h2>
          <p>Hi {firstName}, adding a note to your next expense will make your future self grateful.</p>
          <button className="button button-dark" type="button" onClick={openQuickAdd}>Add a note <ChevronRight size={16} /></button>
        </aside>
      </section>

       <section className="quiet-banner"><BarChart3 size={18} /><span>See the bigger picture across your money.</span><Link to="/dashboard">Open dashboard <ChevronRight size={16} /></Link></section>
      <TransactionDetailModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
    </div>
  )
}
