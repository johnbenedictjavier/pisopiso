import type { Transaction, Wallet } from '../types'
import { formatCurrency } from './money'

function escapeCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export function downloadTransactionsCsv(transactions: Transaction[], wallets: Wallet[]): void {
  const walletMap = new Map(wallets.map((wallet) => [wallet.id, wallet.name]))
  const rows = [
    ['Date', 'Type', 'Wallet', 'Merchant', 'Amount', 'Note'],
    ...transactions.map((transaction) => [
      transaction.occurredAt,
      transaction.type,
      walletMap.get(transaction.walletId) ?? 'Unknown wallet',
      transaction.merchant,
      formatCurrency(transaction.amountCents),
      transaction.note,
    ]),
  ]
  const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `pisopiso-transactions-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
