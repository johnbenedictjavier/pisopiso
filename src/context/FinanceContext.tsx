import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createId } from '../lib/ids'
import { isCurrentMonth } from '../lib/dates'
import { parseAmountToCents } from '../lib/money'
import { calculateWalletBalance, canSpend, transactionEffect } from '../lib/ledger'
import { loadAppState, saveAppState } from '../lib/storage'
import type {
  AddTransactionInput,
  AddTransferInput,
  AddWalletInput,
  AppState,
  Transaction,
  TransactionType,
  UpdateWalletInput,
  Wallet,
} from '../types'

interface FinanceContextValue {
  state: AppState
  activeWallets: Wallet[]
  transactions: Transaction[]
  totalBalanceCents: number
  monthIncomeCents: number
  monthExpensesCents: number
  monthNetCents: number
  getWalletBalance: (walletId: string) => number
  getWallet: (walletId: string) => Wallet | undefined
  addTransaction: (input: AddTransactionInput) => void
  addTransfer: (input: AddTransferInput) => void
  addWallet: (input: AddWalletInput) => void
  updateWallet: (walletId: string, input: UpdateWalletInput) => void
  archiveWallet: (walletId: string) => void
  deleteTransaction: (transactionId: string) => void
  updateTheme: (theme: AppState['profile']['theme']) => void
  updateDisplayName: (displayName: string) => void
  updateProfileIdentity: (id: string, email: string) => void
  updateAvatar: (avatarUrl: string | null, avatarName: string | null, avatarScale: number) => void
  startFresh: () => void
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

function createTransaction(
  input: Omit<Transaction, 'id' | 'createdAt' | 'deletedAt'>,
): Transaction {
  return {
    ...input,
    id: createId('txn'),
    createdAt: new Date().toISOString(),
    deletedAt: null,
  }
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadAppState())

  useEffect(() => {
    saveAppState(state)
    document.documentElement.dataset.theme = state.profile.theme
  }, [state])

  const activeWallets = useMemo(() => state.wallets.filter((wallet) => !wallet.isArchived), [state.wallets])
  const transactions = useMemo(
    () => state.transactions.filter((transaction) => !transaction.deletedAt),
    [state.transactions],
  )
  const getWalletBalance = (walletId: string) => {
    const wallet = state.wallets.find((item) => item.id === walletId)
    return wallet ? calculateWalletBalance(wallet, state.transactions) : 0
  }

  const totals = useMemo(() => {
    const monthTransactions = transactions.filter((transaction) => isCurrentMonth(transaction.occurredAt))
    const monthIncomeCents = monthTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amountCents, 0)
    const monthExpensesCents = monthTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amountCents, 0)
    return {
      totalBalanceCents: activeWallets.reduce((sum, wallet) => sum + calculateWalletBalance(wallet, state.transactions), 0),
      monthIncomeCents,
      monthExpensesCents,
      monthNetCents: monthIncomeCents - monthExpensesCents,
    }
  }, [activeWallets, state, transactions])

  function addTransaction(input: AddTransactionInput): void {
    if (input.amountCents <= 0) throw new Error('Amount must be greater than zero.')
    const wallet = state.wallets.find((item) => item.id === input.walletId)
    if (!wallet || wallet.isArchived) throw new Error('Choose an active wallet.')
    if (input.type === 'expense' && !wallet.allowOverdraft) {
      if (!canSpend(wallet, state.transactions, input.amountCents)) throw new Error('This expense would overdraw the wallet.')
    }

    const transaction = createTransaction({
      userId: state.profile.id,
      walletId: input.walletId,
      type: input.type,
      amountCents: input.amountCents,
      categoryId: input.categoryId,
      merchant: input.merchant.trim(),
      note: input.note.trim(),
      occurredAt: new Date(`${input.occurredAt}T12:00:00`).toISOString(),
      transferGroupId: null,
      transferDirection: null,
      relatedWalletId: null,
      receiptName: input.receiptName ?? null,
      receiptUrl: input.receiptUrl ?? null,
    })
    setState((current) => ({ ...current, transactions: [transaction, ...current.transactions] }))
  }

  function addTransfer(input: AddTransferInput): void {
    if (input.amountCents <= 0) throw new Error('Amount must be greater than zero.')
    if (input.fromWalletId === input.toWalletId) throw new Error('Choose two different wallets.')
    const fromWallet = state.wallets.find((wallet) => wallet.id === input.fromWalletId)
    const toWallet = state.wallets.find((wallet) => wallet.id === input.toWalletId)
    if (!fromWallet || !toWallet || fromWallet.isArchived || toWallet.isArchived) {
      throw new Error('Choose two active wallets.')
    }
    if (!canSpend(fromWallet, state.transactions, input.amountCents)) {
      throw new Error('The source wallet does not have enough available balance.')
    }

    const groupId = createId('transfer')
    const occurredAt = new Date(`${input.occurredAt}T12:00:00`).toISOString()
    const shared = {
      userId: state.profile.id,
      type: 'transfer' as const,
      amountCents: input.amountCents,
      categoryId: null,
      merchant: 'Wallet transfer',
      note: input.note.trim(),
      occurredAt,
      transferGroupId: groupId,
      receiptName: null,
      receiptUrl: null,
    }
    const outgoing = createTransaction({
      ...shared,
      walletId: input.fromWalletId,
      transferDirection: 'out',
      relatedWalletId: input.toWalletId,
    })
    const incoming = createTransaction({
      ...shared,
      walletId: input.toWalletId,
      transferDirection: 'in',
      relatedWalletId: input.fromWalletId,
    })
    setState((current) => ({ ...current, transactions: [outgoing, incoming, ...current.transactions] }))
  }

  function addWallet(input: AddWalletInput): void {
    const wallet: Wallet = {
      id: createId('wallet'),
      userId: state.profile.id,
      name: input.name.trim(),
      type: input.type,
      openingBalanceCents: input.openingBalanceCents,
      allowOverdraft: input.allowOverdraft,
      color: input.color,
      cardTheme: input.cardTheme,
      logoUrl: input.logoUrl,
      logoName: input.logoName,
      logoScale: input.logoScale,
      isArchived: false,
      createdAt: new Date().toISOString(),
    }
    setState((current) => ({ ...current, wallets: [wallet, ...current.wallets] }))
  }

  function updateWallet(walletId: string, input: UpdateWalletInput): void {
    const existing = state.wallets.find((wallet) => wallet.id === walletId)
    if (!existing) throw new Error('Wallet not found.')
    setState((current) => ({
      ...current,
      wallets: current.wallets.map((wallet) => wallet.id === walletId ? {
        ...wallet,
        name: input.name.trim(),
        type: input.type,
        openingBalanceCents: input.openingBalanceCents,
        allowOverdraft: input.allowOverdraft,
        color: input.color,
        cardTheme: input.cardTheme,
        logoUrl: input.logoUrl,
        logoName: input.logoName,
        logoScale: input.logoScale,
      } : wallet),
    }))
  }

  function archiveWallet(walletId: string): void {
    setState((current) => ({
      ...current,
      wallets: current.wallets.map((wallet) => (wallet.id === walletId ? { ...wallet, isArchived: true } : wallet)),
    }))
  }

  function deleteTransaction(transactionId: string): void {
    const transaction = state.transactions.find((item) => item.id === transactionId)
    if (!transaction) return
    setState((current) => ({
      ...current,
      transactions: current.transactions.map((item) =>
        item.transferGroupId && item.transferGroupId === transaction.transferGroupId
          ? { ...item, deletedAt: new Date().toISOString() }
          : item.id === transactionId
            ? { ...item, deletedAt: new Date().toISOString() }
            : item,
      ),
    }))
  }

  function updateTheme(theme: AppState['profile']['theme']): void {
    setState((current) => ({ ...current, profile: { ...current.profile, theme } }))
  }

  function updateDisplayName(displayName: string): void {
    setState((current) => ({ ...current, profile: { ...current.profile, displayName: displayName.trim() } }))
  }

  function updateProfileIdentity(id: string, email: string): void {
    setState((current) => ({ ...current, profile: { ...current.profile, id, email } }))
  }

  function updateAvatar(avatarUrl: string | null, avatarName: string | null, avatarScale: number): void {
    setState((current) => ({ ...current, profile: { ...current.profile, avatarUrl, avatarName, avatarScale } }))
  }

  function startFresh(): void {
    setState((current) => ({ ...current, wallets: [], transactions: [] }))
  }

  const value: FinanceContextValue = {
    state,
    activeWallets,
    transactions,
    ...totals,
    getWalletBalance,
    getWallet: (walletId) => state.wallets.find((wallet) => wallet.id === walletId),
    addTransaction,
    addTransfer,
    addWallet,
    updateWallet,
    archiveWallet,
    deleteTransaction,
    updateTheme,
    updateDisplayName,
    updateProfileIdentity,
    updateAvatar,
    startFresh,
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance(): FinanceContextValue {
  const context = useContext(FinanceContext)
  if (!context) throw new Error('useFinance must be used inside FinanceProvider')
  return context
}

export function transactionAffectsBalance(transaction: Transaction, walletId: string): number {
  return transactionEffect(transaction, walletId)
}

export function transactionTypeLabel(type: TransactionType): string {
  return type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : 'Transfer'
}

export function transactionSign(transaction: Transaction): number {
  return transaction.type === 'income' || (transaction.type === 'transfer' && transaction.transferDirection === 'in') ? 1 : -1
}

export function amountFromInput(value: string): number {
  return parseAmountToCents(value) ?? 0
}
