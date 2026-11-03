export type Theme = 'light' | 'dark'

export type WalletType =
  | 'bank'
  | 'digital_bank'
  | 'e_wallet'
  | 'cash'
  | 'savings'
  | 'emergency_fund'
  | 'investment'
  | 'custom'

export type TransactionType = 'expense' | 'income' | 'transfer'

export type TransferDirection = 'out' | 'in'

export type WalletCardTheme = 'emerald' | 'ocean' | 'sunset' | 'violet' | 'midnight' | 'sand'

export interface Profile {
  id: string
  displayName: string
  email: string
  theme: Theme
  currency: 'PHP'
  avatarUrl: string | null
  avatarName: string | null
}

export interface Wallet {
  id: string
  userId: string
  name: string
  type: WalletType
  openingBalanceCents: number
  allowOverdraft: boolean
  color: string
  cardTheme: WalletCardTheme
  logoUrl: string | null
  logoName: string | null
  isArchived: boolean
  createdAt: string
}

export interface Category {
  id: string
  name: string
  type: 'expense' | 'income' | 'both'
  color: string
  icon: string
}

export interface Transaction {
  id: string
  userId: string
  walletId: string
  type: TransactionType
  amountCents: number
  categoryId: string | null
  merchant: string
  note: string
  occurredAt: string
  transferGroupId: string | null
  transferDirection: TransferDirection | null
  relatedWalletId: string | null
  receiptName: string | null
  receiptUrl: string | null
  createdAt: string
  deletedAt: string | null
}

export interface AppState {
  profile: Profile
  wallets: Wallet[]
  categories: Category[]
  transactions: Transaction[]
}

export interface AddTransactionInput {
  walletId: string
  type: Exclude<TransactionType, 'transfer'>
  amountCents: number
  categoryId: string | null
  merchant: string
  note: string
  occurredAt: string
  receiptName?: string | null
  receiptUrl?: string | null
}

export interface AddTransferInput {
  fromWalletId: string
  toWalletId: string
  amountCents: number
  note: string
  occurredAt: string
}

export interface AddWalletInput {
  name: string
  type: WalletType
  openingBalanceCents: number
  allowOverdraft: boolean
  color: string
  cardTheme: WalletCardTheme
  logoUrl: string | null
  logoName: string | null
}

export type UpdateWalletInput = AddWalletInput

export const walletTypeLabels: Record<WalletType, string> = {
  bank: 'Traditional bank',
  digital_bank: 'Digital bank',
  e_wallet: 'E-wallet',
  cash: 'Cash',
  savings: 'Personal savings',
  emergency_fund: 'Emergency fund',
  investment: 'Investment account',
  custom: 'Custom account',
}

export const walletCardThemes: Array<{ value: WalletCardTheme; label: string; color: string }> = [
  { value: 'emerald', label: 'Emerald', color: '#2f7d57' },
  { value: 'ocean', label: 'Ocean', color: '#2c6b89' },
  { value: 'sunset', label: 'Sunset', color: '#b9654f' },
  { value: 'violet', label: 'Violet', color: '#7563a6' },
  { value: 'midnight', label: 'Midnight', color: '#243b4d' },
  { value: 'sand', label: 'Sand', color: '#ac7b43' },
]
