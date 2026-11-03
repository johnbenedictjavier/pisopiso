import { createEmptyState, createSeedState } from '../data/seed'
import type { AppState } from '../types'

const STORAGE_KEY = 'pisopiso:local-state:v2'
const LEGACY_STORAGE_KEY = 'pisopiso:local-state:v1'

function clampImagePosition(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(50, Math.max(-50, value)) : 0
}

export function loadAppState(): AppState {
  if (typeof window === 'undefined') return createSeedState()
  const stored = window.localStorage.getItem(STORAGE_KEY)
  const legacyStored = window.localStorage.getItem(LEGACY_STORAGE_KEY)
  if (!stored && legacyStored) {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
    return createEmptyState()
  }
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
    profile: {
      ...seed.profile,
      ...(value.profile ?? {}),
      avatarUrl: value.profile?.avatarUrl ?? null,
      avatarName: value.profile?.avatarName ?? null,
      avatarScale: typeof value.profile?.avatarScale === 'number' && Number.isFinite(value.profile.avatarScale) ? Math.min(1.5, Math.max(0.5, value.profile.avatarScale)) : 1,
      avatarPositionX: clampImagePosition(value.profile?.avatarPositionX),
      avatarPositionY: clampImagePosition(value.profile?.avatarPositionY),
    },
    wallets: (value.wallets ?? seed.wallets).map((wallet) => ({
      ...wallet,
      cardTheme: wallet.cardTheme ?? 'emerald',
      logoUrl: wallet.logoUrl ?? null,
      logoName: wallet.logoName ?? null,
      logoScale: typeof wallet.logoScale === 'number' && Number.isFinite(wallet.logoScale) ? Math.min(1.5, Math.max(0.5, wallet.logoScale)) : 1,
      logoPositionX: clampImagePosition(wallet.logoPositionX),
      logoPositionY: clampImagePosition(wallet.logoPositionY),
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
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
}
