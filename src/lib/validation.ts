import { z } from 'zod'

const amount = z.string().trim().regex(/^\d+(?:\.\d{0,2})?$/, 'Enter an amount with up to 2 decimals.')

export const transactionFormSchema = z.object({
  type: z.enum(['expense', 'income']),
  walletId: z.string().min(1, 'Choose a wallet.'),
  amount,
  categoryId: z.string().min(1, 'Choose a category.'),
  merchant: z.string().trim().min(1, 'Add a merchant or source.').max(80, 'Keep this under 80 characters.'),
  note: z.string().trim().max(240, 'Keep your note under 240 characters.'),
  occurredAt: z.string().min(1, 'Choose a date.'),
})

export const transferFormSchema = z
  .object({
    fromWalletId: z.string().min(1, 'Choose the wallet to transfer from.'),
    toWalletId: z.string().min(1, 'Choose the wallet to transfer to.'),
    amount,
    note: z.string().trim().max(240, 'Keep your note under 240 characters.'),
    occurredAt: z.string().min(1, 'Choose a date.'),
  })
  .refine((value) => value.fromWalletId !== value.toWalletId, {
    path: ['toWalletId'],
    message: 'Choose a different destination wallet.',
  })

export const walletFormSchema = z.object({
  name: z.string().trim().min(1, 'Give this wallet a name.').max(60, 'Keep this under 60 characters.'),
  type: z.enum(['bank', 'digital_bank', 'e_wallet', 'cash', 'savings', 'emergency_fund', 'investment', 'custom']),
  openingBalance: amount,
  allowOverdraft: z.boolean(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  cardTheme: z.enum(['emerald', 'ocean', 'sunset', 'violet', 'midnight', 'sand']),
})

export type TransactionFormValues = z.infer<typeof transactionFormSchema>
export type TransferFormValues = z.infer<typeof transferFormSchema>
export type WalletFormValues = z.infer<typeof walletFormSchema>
