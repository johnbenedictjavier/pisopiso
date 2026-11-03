import { createSeedState } from '../data/seed'
import type { AppState } from '../types'

const STORAGE_KEY = 'pisopiso:local-state:v1'

export function loadAppState(): AppState {
  if (typeof window === 'undefined') return createSeedState()
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (!stored) return createSeedState()

  try {
    return migrateAppState(JSON.parse(stored) as Partial<AppState>)
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return createSeedState()
  }
}

function migrateAppState(value: Partial<AppState>): AppState {
  const seed = createSeedState()
  return {
    ...seed,
    ...value,
    wallets: (value.wallets ?? seed.wallets).map((wallet) => ({
      ...wallet,
      cardTheme: wallet.cardTheme ?? 'emerald',
      logoUrl: wallet.logoUrl ?? null,
      logoName: wallet.logoName ?? null,
    })),
    transactions: (value.transactions ?? seed.transactions).map((transaction) => ({
      ...transaction,
      receiptUrl: transaction.receiptUrl ?? null,
    })),
  }
}

export function saveAppState(state: AppState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearAppState(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}
