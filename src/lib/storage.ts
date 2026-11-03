import { categoryCatalog } from '../data/categories'
import { createEmptyState } from '../data/defaults'
import type { AppState, Profile, Transaction, Wallet } from '../types'

const STORAGE_KEY_PREFIX = 'pisopiso:local-state:v3:'
const LEGACY_STORAGE_KEY = 'pisopiso:local-state:v2'
const OLDEST_STORAGE_KEY = 'pisopiso:local-state:v1'
const DEMO_USER_ID = 'demo-user'
const DEMO_WALLET_IDS = new Set(['wallet-bpi', 'wallet-maya', 'wallet-cash', 'wallet-gcash'])

function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${encodeURIComponent(userId)}`
}

function clampImagePosition(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(50, Math.max(-50, value)) : 0
}

function parseStoredState(value: string): Partial<AppState> | null {
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed as Partial<AppState> : null
  } catch {
    return null
  }
}

function readLegacyState(): Partial<AppState> | null {
  const stored = window.localStorage.getItem(LEGACY_STORAGE_KEY) ?? window.localStorage.getItem(OLDEST_STORAGE_KEY)
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
  window.localStorage.removeItem(OLDEST_STORAGE_KEY)
  return stored ? parseStoredState(stored) : null
}

function isDemoProfile(profile: Partial<Profile> | undefined): boolean {
  return profile?.id === DEMO_USER_ID || profile?.email === 'mika@pisopiso.local'
}

function isDemoWallet(wallet: Wallet): boolean {
  return wallet.userId === DEMO_USER_ID || DEMO_WALLET_IDS.has(wallet.id)
}

function migrateAppState(value: Partial<AppState>, userId: string, email: string): AppState {
  const emptyState = createEmptyState(userId, email)
  const sourceProfile = value.profile
  const demoProfile = isDemoProfile(sourceProfile)
  const wallets = (value.wallets ?? []).filter((wallet) => !isDemoWallet(wallet))
  const walletIds = new Set(wallets.map((wallet) => wallet.id))
  const storedCategories = value.categories ?? []
  const categories = storedCategories.length
    ? [...storedCategories, ...categoryCatalog.filter((category) => !storedCategories.some((storedCategory) => storedCategory.id === category.id))]
    : categoryCatalog
  const transactions = (value.transactions ?? []).filter(
    (transaction) => transaction.userId !== DEMO_USER_ID && walletIds.has(transaction.walletId),
  )

  return {
    ...emptyState,
    profile: {
      ...emptyState.profile,
      ...(sourceProfile ?? {}),
      id: userId,
      email,
      displayName: demoProfile ? emptyState.profile.displayName : sourceProfile?.displayName?.trim() || emptyState.profile.displayName,
      avatarUrl: sourceProfile?.avatarUrl ?? null,
      avatarName: sourceProfile?.avatarName ?? null,
      avatarScale: typeof sourceProfile?.avatarScale === 'number' && Number.isFinite(sourceProfile.avatarScale) ? Math.min(1.5, Math.max(0.5, sourceProfile.avatarScale)) : 1,
      avatarPositionX: clampImagePosition(sourceProfile?.avatarPositionX),
      avatarPositionY: clampImagePosition(sourceProfile?.avatarPositionY),
    },
    categories,
    wallets: wallets.map((wallet) => ({
      ...wallet,
      userId,
      cardTheme: wallet.cardTheme ?? 'emerald',
      logoUrl: wallet.logoUrl ?? null,
      logoName: wallet.logoName ?? null,
      logoScale: typeof wallet.logoScale === 'number' && Number.isFinite(wallet.logoScale) ? Math.min(1.5, Math.max(0.5, wallet.logoScale)) : 1,
      logoPositionX: clampImagePosition(wallet.logoPositionX),
      logoPositionY: clampImagePosition(wallet.logoPositionY),
    })),
    transactions: transactions.map((transaction: Transaction) => ({
      ...transaction,
      userId,
      receiptUrl: transaction.receiptUrl ?? null,
    })),
  }
}

export function loadAppState(userId = '', email = ''): AppState {
  if (typeof window === 'undefined' || !userId) return createEmptyState(userId, email)

  const key = storageKey(userId)
  const stored = window.localStorage.getItem(key)
  const legacyState = readLegacyState()
  const source = stored ? parseStoredState(stored) : legacyState
  const state = source ? migrateAppState(source, userId, email) : createEmptyState(userId, email)

  if (!stored && legacyState) window.localStorage.setItem(key, JSON.stringify(state))
  if (stored) window.localStorage.setItem(key, JSON.stringify(state))
  return state
}

export function saveAppState(state: AppState, userId: string): void {
  if (!userId) return
  window.localStorage.setItem(storageKey(userId), JSON.stringify(state))
}

export function clearAppState(userId: string): void {
  if (typeof window === 'undefined') return
  if (userId) window.localStorage.removeItem(storageKey(userId))
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
  window.localStorage.removeItem(OLDEST_STORAGE_KEY)
}
