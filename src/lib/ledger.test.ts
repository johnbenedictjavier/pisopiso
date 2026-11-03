import { describe, expect, it } from 'vitest'
import { calculateWalletBalance, canSpend } from './ledger'
import type { Transaction, Wallet } from '../types'

const wallet: Wallet = {
  id: 'wallet-a',
  userId: 'user-a',
  name: 'Test wallet',
  type: 'cash',
  openingBalanceCents: 10000,
  allowOverdraft: false,
  color: '#5f8068',
  cardTheme: 'emerald',
  logoUrl: null,
  logoName: null,
  logoScale: 1,
  logoPositionX: 0,
  logoPositionY: 0,
  isArchived: false,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const transaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'transaction',
  userId: 'user-a',
  walletId: 'wallet-a',
  type: 'expense',
  amountCents: 2500,
  categoryId: 'food',
  merchant: 'Test',
  note: '',
  occurredAt: '2026-01-01T00:00:00.000Z',
  transferGroupId: null,
  transferDirection: null,
  relatedWalletId: null,
  receiptName: null,
  receiptUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  deletedAt: null,
  ...overrides,
})

describe('ledger rules', () => {
  it('derives a balance from opening balance and signed entries', () => {
    expect(calculateWalletBalance(wallet, [transaction({}), transaction({ id: 'income', type: 'income', amountCents: 4000 })])).toBe(11500)
    expect(calculateWalletBalance(wallet, [transaction({ deletedAt: '2026-01-02T00:00:00.000Z' })])).toBe(10000)
  })

  it('rejects spending that would overdraw protected wallets', () => {
    expect(canSpend(wallet, [], 10001)).toBe(false)
    expect(canSpend(wallet, [], 10000)).toBe(true)
    expect(canSpend({ ...wallet, allowOverdraft: true }, [], 999999)).toBe(true)
  })
})
