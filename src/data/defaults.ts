import { categoryCatalog } from './categories'
import type { AppState } from '../types'

function defaultDisplayName(email: string): string {
  return email.split('@')[0]?.trim() ?? ''
}

export function createEmptyState(userId = '', email = ''): AppState {
  return {
    profile: {
      id: userId,
      displayName: defaultDisplayName(email),
      email,
      theme: 'light',
      currency: 'PHP',
      avatarUrl: null,
      avatarName: null,
      avatarScale: 1,
      avatarPositionX: 0,
      avatarPositionY: 0,
    },
    wallets: [],
    categories: categoryCatalog,
    transactions: [],
  }
}
