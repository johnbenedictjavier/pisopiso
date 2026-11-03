import { categoryCatalog } from './categories'
import { createId } from '../lib/ids'
import type { AppState, Transaction, Wallet } from '../types'

function daysAgo(days: number, hour = 10): string {
  const date = new Date()
  date.setHours(hour, 0, 0, 0)
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

function seedTransaction(
  walletId: string,
  type: Transaction['type'],
  amountCents: number,
  categoryId: string | null,
  merchant: string,
  note: string,
  occurredAt: string,
): Transaction {
  return {
    id: createId('txn'),
    userId: 'demo-user',
    walletId,
    type,
    amountCents,
    categoryId,
    merchant,
    note,
    occurredAt,
    transferGroupId: null,
    transferDirection: null,
    relatedWalletId: null,
    receiptName: null,
    receiptUrl: null,
    createdAt: new Date().toISOString(),
    deletedAt: null,
  }
}

export function createSeedState(): AppState {
  const wallets: Wallet[] = [
    {
      id: 'wallet-bpi',
      userId: 'demo-user',
      name: 'BPI Everyday',
      type: 'bank',
      openingBalanceCents: 6845075,
      allowOverdraft: false,
      color: '#a51d31',
      cardTheme: 'emerald',
      logoUrl: null,
      logoName: null,
      logoScale: 1,
      logoPositionX: 0,
      logoPositionY: 0,
      isArchived: false,
      createdAt: daysAgo(90),
    },
    {
      id: 'wallet-maya',
      userId: 'demo-user',
      name: 'Maya Wallet',
      type: 'e_wallet',
      openingBalanceCents: 827050,
      allowOverdraft: false,
      color: '#7b3caf',
      cardTheme: 'violet',
      logoUrl: null,
      logoName: null,
      logoScale: 1,
      logoPositionX: 0,
      logoPositionY: 0,
      isArchived: false,
      createdAt: daysAgo(65),
    },
    {
      id: 'wallet-cash',
      userId: 'demo-user',
      name: 'Cash on hand',
      type: 'cash',
      openingBalanceCents: 340000,
      allowOverdraft: false,
      color: '#6b806f',
      cardTheme: 'sand',
      logoUrl: null,
      logoName: null,
      logoScale: 1,
      logoPositionX: 0,
      logoPositionY: 0,
      isArchived: false,
      createdAt: daysAgo(120),
    },
    {
      id: 'wallet-gcash',
      userId: 'demo-user',
      name: 'GCash',
      type: 'e_wallet',
      openingBalanceCents: 175000,
      allowOverdraft: false,
      color: '#1684e8',
      cardTheme: 'ocean',
      logoUrl: null,
      logoName: null,
      logoScale: 1,
      logoPositionX: 0,
      logoPositionY: 0,
      isArchived: false,
      createdAt: daysAgo(52),
    },
  ]

  const transactions: Transaction[] = [
    seedTransaction('wallet-bpi', 'income', 6500000, 'salary', 'Monthly salary', 'June payroll', daysAgo(3, 9)),
    seedTransaction('wallet-bpi', 'expense', 285000, 'bills', 'Meralco', 'Monthly electricity bill', daysAgo(4, 16)),
    seedTransaction('wallet-maya', 'expense', 38900, 'transport', 'Grab', 'Ride home after dinner', daysAgo(1, 21)),
    seedTransaction('wallet-bpi', 'expense', 245075, 'food', 'Landers', 'Weekly groceries', daysAgo(2, 12)),
    seedTransaction('wallet-cash', 'expense', 45000, 'food', 'Salcedo market', 'Saturday breakfast', daysAgo(2, 8)),
    seedTransaction('wallet-gcash', 'expense', 15900, 'subscriptions', 'Spotify', 'Family plan', daysAgo(6, 11)),
    seedTransaction('wallet-bpi', 'income', 1250000, 'freelance', 'Studio project', 'Final milestone', daysAgo(9, 14)),
    seedTransaction('wallet-maya', 'expense', 129900, 'shopping', 'Uniqlo', 'Everyday essentials', daysAgo(12, 18)),
    seedTransaction('wallet-bpi', 'expense', 85000, 'health', 'South City Clinic', 'Annual checkup', daysAgo(15, 10)),
    seedTransaction('wallet-cash', 'expense', 18000, 'transport', 'Jeepney and train', 'Commute', daysAgo(18, 8)),
    seedTransaction('wallet-bpi', 'expense', 350000, 'home', 'IKEA', 'Desk organizer', daysAgo(21, 15)),
    seedTransaction('wallet-gcash', 'income', 500000, 'gift', 'Ate Mia', 'Birthday gift', daysAgo(25, 13)),
  ]

  return {
    profile: {
      id: 'demo-user',
      displayName: 'Mika Santos',
      email: 'mika@pisopiso.local',
      theme: 'light',
      currency: 'PHP',
      avatarUrl: null,
      avatarName: null,
      avatarScale: 1,
      avatarPositionX: 0,
      avatarPositionY: 0,
    },
    wallets,
    categories: categoryCatalog,
    transactions,
  }
}

export function createEmptyState(): AppState {
  const seed = createSeedState()
  return {
    ...seed,
    wallets: [],
    transactions: [],
  }
}
