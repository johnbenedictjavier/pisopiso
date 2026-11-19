import { localDateKey } from './dates'
import type { Transaction } from '../types'

export interface CashflowPoint {
  label: string
  income: number
  expenses: number
}

export function buildCashflowData(transactions: Transaction[], now = new Date()): CashflowPoint[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    const key = localDateKey(date)
    const dayTransactions = transactions.filter((transaction) => localDateKey(transaction.occurredAt) === key)
    return {
      label: new Intl.DateTimeFormat('en-PH', { weekday: 'short' }).format(date),
      income: dayTransactions.filter((transaction) => transaction.type === 'income').reduce((sum, item) => sum + item.amountCents, 0),
      expenses: dayTransactions.filter((transaction) => transaction.type === 'expense').reduce((sum, item) => sum + item.amountCents, 0),
    }
  })
}
