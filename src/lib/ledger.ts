import type { Transaction, Wallet } from '../types'

export function transactionEffect(transaction: Transaction, walletId: string): number {
  if (transaction.walletId !== walletId || transaction.deletedAt) return 0
  if (transaction.type === 'income') return transaction.amountCents
  if (transaction.type === 'expense') return -transaction.amountCents
  return transaction.transferDirection === 'in' ? transaction.amountCents : -transaction.amountCents
}

export function calculateWalletBalance(wallet: Wallet, transactions: Transaction[]): number {
  return transactions.reduce((balance, transaction) => balance + transactionEffect(transaction, wallet.id), wallet.openingBalanceCents)
}

export function canSpend(wallet: Wallet, transactions: Transaction[], amountCents: number): boolean {
  return wallet.allowOverdraft || calculateWalletBalance(wallet, transactions) >= amountCents
}
