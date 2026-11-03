import { useMemo, useState } from 'react'
import { BarChart3, CalendarRange, Download, PieChart as PieChartIcon, TrendingDown, TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../lib/money'
import { downloadTransactionsCsv } from '../lib/csv'
import { isCurrentMonth } from '../lib/dates'
import { useShell } from '../layout/AppShell'

const chartColors = ['#5f8068', '#d69570', '#687cb0', '#b47d9f', '#c09649', '#71918b', '#9a7967']

function ReportsTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><strong>{label}</strong>{payload.map((item) => <span key={item.name}>{item.name} <b>{formatCurrency(item.value)}</b></span>)}</div>
}

export default function ReportsPage() {
  const { state, transactions } = useFinance()
  const { notify } = useShell()
  const [period, setPeriod] = useState<'month' | '90' | 'all'>('month')
  const filteredTransactions = useMemo(() => {
    if (period === 'all') return transactions
    const days = period === 'month' ? 31 : 90
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return transactions.filter((transaction) => new Date(transaction.occurredAt) >= cutoff)
  }, [period, transactions])
  const expenses = filteredTransactions.filter((transaction) => transaction.type === 'expense')
  const income = filteredTransactions.filter((transaction) => transaction.type === 'income')
  const incomeTotal = income.reduce((sum, transaction) => sum + transaction.amountCents, 0)
  const expenseTotal = expenses.reduce((sum, transaction) => sum + transaction.amountCents, 0)
  const categoryData = useMemo(() => {
    const grouped = new Map<string, number>()
    expenses.forEach((transaction) => grouped.set(transaction.categoryId ?? 'other-expense', (grouped.get(transaction.categoryId ?? 'other-expense') ?? 0) + transaction.amountCents))
    return [...grouped.entries()].sort(([, left], [, right]) => right - left).map(([categoryId, amount], index) => ({ name: state.categories.find((category) => category.id === categoryId)?.name ?? 'Other expense', amount, color: chartColors[index % chartColors.length] }))
  }, [expenses, state.categories])
  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date()
      date.setDate(1)
      date.setMonth(date.getMonth() - (5 - index))
      const month = date.getMonth()
      const year = date.getFullYear()
      const rows = transactions.filter((transaction) => {
        const occurred = new Date(transaction.occurredAt)
        return occurred.getMonth() === month && occurred.getFullYear() === year
      })
      return {
        label: new Intl.DateTimeFormat('en-PH', { month: 'short' }).format(date),
        Income: rows.filter((row) => row.type === 'income').reduce((sum, row) => sum + row.amountCents, 0),
        Expenses: rows.filter((row) => row.type === 'expense').reduce((sum, row) => sum + row.amountCents, 0),
      }
    })
  }, [transactions])

  return (
    <div className="page-stack">
      <section className="page-intro-row"><div><p className="lead-copy">Patterns are easier to act on when they are easy to see.</p></div><div className="intro-actions"><div className="period-picker"><CalendarRange size={16} />{(['month', '90', 'all'] as const).map((item) => <button key={item} className={period === item ? 'period-active' : ''} type="button" onClick={() => setPeriod(item)}>{item === 'month' ? 'This month' : item === '90' ? '90 days' : 'All time'}</button>)}</div><button className="button button-secondary" type="button" onClick={() => { downloadTransactionsCsv(filteredTransactions, state.wallets); notify('Report data exported as CSV.') }}><Download size={16} /> Export data</button></div></section>
      <section className="metric-grid report-metrics"><article className="report-total-card"><span className="metric-icon metric-icon-sage"><TrendingUp size={18} /></span><div><span>Money in</span><strong>{formatCurrency(incomeTotal)}</strong><small>{income.length} income movements</small></div></article><article className="report-total-card"><span className="metric-icon metric-icon-amber"><TrendingDown size={18} /></span><div><span>Money out</span><strong>{formatCurrency(expenseTotal)}</strong><small>{expenses.length} expenses</small></div></article><article className="report-total-card"><span className="metric-icon metric-icon-blue"><BarChart3 size={18} /></span><div><span>Savings rate</span><strong>{incomeTotal ? `${Math.max(0, Math.round(((incomeTotal - expenseTotal) / incomeTotal) * 100))}%` : '—'}</strong><small>Income kept in this view</small></div></article></section>
      <section className="reports-grid">
        <article className="panel report-card report-card-large"><div className="card-heading-row"><div><span className="section-kicker">Rhythm over time</span><h2>Income vs. expenses</h2></div><span className="chart-legend"><i className="dot dot-income" /> Income <i className="dot dot-expenses" /> Expenses</span></div><div className="report-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyData} margin={{ top: 12, right: 4, left: -25, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--line)" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={false} /><Tooltip content={<ReportsTooltip />} /><Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ display: 'none' }} /><Bar dataKey="Income" fill="#5f8068" radius={[5, 5, 0, 0]} barSize={13} /><Bar dataKey="Expenses" fill="#d69570" radius={[5, 5, 0, 0]} barSize={13} /></BarChart></ResponsiveContainer></div></article>
        <article className="panel report-card"><div className="card-heading-row"><div><span className="section-kicker">Where it went</span><h2>Spending mix</h2></div><PieChartIcon size={19} className="muted-icon" /></div>{categoryData.length ? <><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="amount" nameKey="name" innerRadius="64%" outerRadius="88%" paddingAngle={3} stroke="none">{categoryData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{formatCurrency(expenseTotal)}</strong><span>Total out</span></div></div><div className="category-legend">{categoryData.slice(0, 5).map((item) => <div key={item.name}><span><i style={{ backgroundColor: item.color }} />{item.name}</span><strong>{formatCurrency(item.amount)}</strong></div>)}</div></> : <p className="muted-copy">Add expenses to see your spending mix.</p>}</article>
      </section>
      <section className="report-note"><span className="insight-icon"><TrendingUp size={17} /></span><div><strong>Reports respect your story.</strong><p>Transfers are excluded from income and expense totals so moving money between your own wallets never inflates your spending.</p></div></section>
      <div className="reports-footnote"><span>Based on {filteredTransactions.length} active movements</span><span>{period === 'month' && isCurrentMonth(new Date().toISOString()) ? 'Current month' : 'Selected period'}</span></div>
    </div>
  )
}
