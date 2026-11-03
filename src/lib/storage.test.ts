import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyState } from '../data/defaults'
import { loadAppState, saveAppState } from './storage'

describe('account storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('starts a user with no demo wallets or movements', () => {
    const state = loadAppState('user-one', 'one@example.com')

    expect(state.profile.id).toBe('user-one')
    expect(state.profile.email).toBe('one@example.com')
    expect(state.wallets).toHaveLength(0)
    expect(state.transactions).toHaveLength(0)
  })

  it('keeps each user in a separate local storage key', () => {
    const first = createEmptyState('user-one', 'one@example.com')
    first.wallets.push({
      id: 'wallet-one',
      userId: 'user-one',
      name: 'My wallet',
      type: 'cash',
      openingBalanceCents: 1000,
      allowOverdraft: false,
      color: '#2f7d57',
      cardTheme: 'emerald',
      logoUrl: null,
      logoName: null,
      logoScale: 1,
      logoPositionX: 0,
      logoPositionY: 0,
      isArchived: false,
      createdAt: new Date().toISOString(),
    })
    saveAppState(first, 'user-one')

    expect(loadAppState('user-one', 'one@example.com').wallets).toHaveLength(1)
    expect(loadAppState('user-two', 'two@example.com').wallets).toHaveLength(0)
  })

  it('adds new catalog categories to an existing account', () => {
    const state = createEmptyState('user-one', 'one@example.com')
    state.categories = state.categories.filter((category) => category.id !== 'allowance')
    saveAppState(state, 'user-one')

    expect(loadAppState('user-one', 'one@example.com').categories).toContainEqual(expect.objectContaining({ id: 'allowance', name: 'Allowance', type: 'income' }))
  })

  it('removes legacy demo records while preserving personal records', () => {
    window.localStorage.setItem('pisopiso:local-state:v2', JSON.stringify({
      profile: { id: 'demo-user', displayName: 'Mika Santos', email: 'mika@pisopiso.local' },
      wallets: [
        { id: 'wallet-bpi', userId: 'demo-user', name: 'BPI Everyday' },
        { id: 'wallet-personal', userId: 'old-user', name: 'My account', isArchived: false },
      ],
      transactions: [],
    }))

    const state = loadAppState('user-one', 'one@example.com')

    expect(state.wallets.map((wallet) => wallet.id)).toEqual(['wallet-personal'])
    expect(state.profile.id).toBe('user-one')
    expect(state.profile.displayName).toBe('one')
  })
})
