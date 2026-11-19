import { describe, expect, it } from 'vitest'
import { buildCashflowData } from './cashflow'
import type { Transaction } from '../types'

function movement(id: string, type: Transaction['type'], amountCents: number, occurredAt: string): Transaction {
  return {
    id,
    userId: 'user',
    walletId: 'wallet',
    type,
    amountCents,
    categoryId: null,
    merchant: '',
    note: '',
    occurredAt,
    transferGroupId: null,
    transferDirection: null,
    relatedWalletId: null,
    receiptName: null,
    receiptUrl: null,
    createdAt: occurredAt,
    deletedAt: null,
  }
}

describe('seven-day cash flow', () => {
  it('groups income and expenses by the user local calendar day', () => {
    const now = new Date(2026, 10, 19, 16, 30)
    const today = new Date(2026, 10, 19, 12, 0).toISOString()
    const yesterday = new Date(2026, 10, 18, 12, 0).toISOString()

    const data = buildCashflowData([
      movement('income', 'income', 250000, today),
      movement('expense', 'expense', 12500, today),
      movement('yesterday', 'expense', 5000, yesterday),
    ], now)

    expect(data[6]).toMatchObject({ income: 250000, expenses: 12500 })
    expect(data[5]).toMatchObject({ income: 0, expenses: 5000 })
  })
})
