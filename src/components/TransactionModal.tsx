import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, Paperclip, Send, UploadCloud } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from './Modal'
import { useFinance } from '../context/FinanceContext'
import { amountFromInput } from '../context/FinanceContext'
import { toInputDate } from '../lib/dates'
import { blobToDataUrl, compressReceipt, validateReceipt } from '../lib/receipts'
import { parseAmountToCents } from '../lib/money'
import type { Transaction } from '../types'
import {
  transactionFormSchema,
  transferFormSchema,
  type TransactionFormValues,
  type TransferFormValues,
} from '../lib/validation'

type MovementTab = 'expense' | 'income' | 'transfer'

interface TransactionModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  transaction?: Transaction | null
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="field-error">{message}</span> : null
}

export default function TransactionModal({ open, onClose, onSuccess, transaction = null }: TransactionModalProps) {
  const { state, activeWallets, addTransaction, addTransfer, updateTransaction, updateTransfer } = useFinance()
  const editingTransaction = transaction
  const editingMovement = editingTransaction && editingTransaction.type !== 'transfer' ? editingTransaction : null
  const editingTransfer = editingTransaction?.type === 'transfer' ? editingTransaction : null
  const [tab, setTab] = useState<MovementTab>('expense')
  const [receipt, setReceipt] = useState<File | null>(null)
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const receiptInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const transactionWalletIds = editingTransaction ? [editingTransaction.walletId, editingTransaction.relatedWalletId].filter((id): id is string => Boolean(id)) : []
  const formWallets = editingTransaction
    ? state.wallets.filter((wallet) => !wallet.isArchived || transactionWalletIds.includes(wallet.id))
    : activeWallets
  const transferPartner = editingTransfer?.transferGroupId
    ? state.transactions.find((item) => item.transferGroupId === editingTransfer.transferGroupId && item.id !== editingTransfer.id && !item.deletedAt)
    : undefined
  const transferFromWalletId = editingTransfer
    ? editingTransfer.transferDirection === 'out' ? editingTransfer.walletId : editingTransfer.relatedWalletId ?? transferPartner?.walletId ?? ''
    : formWallets[0]?.id ?? ''
  const transferToWalletId = editingTransfer
    ? editingTransfer.transferDirection === 'out' ? editingTransfer.relatedWalletId ?? transferPartner?.walletId ?? '' : editingTransfer.walletId
    : formWallets[1]?.id ?? formWallets[0]?.id ?? ''
  const categoryIdFor = (type: 'expense' | 'income', currentId: string | null | undefined) => {
    const current = state.categories.find((category) => category.id === currentId && (category.type === type || category.type === 'both'))
    return current?.id ?? state.categories.find((category) => category.type === type || category.type === 'both')?.id ?? ''
  }

  const transactionForm = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: 'expense',
      walletId: editingMovement?.walletId ?? formWallets[0]?.id ?? '',
      amount: editingMovement ? (editingMovement.amountCents / 100).toFixed(2) : '',
      categoryId: categoryIdFor(editingMovement?.type === 'income' ? 'income' : 'expense', editingMovement?.categoryId),
      merchant: editingMovement?.merchant ?? '',
      note: editingMovement?.note ?? '',
      occurredAt: editingMovement ? toInputDate(new Date(editingMovement.occurredAt)) : toInputDate(),
    },
  })
  const transferForm = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      fromWalletId: transferFromWalletId,
      toWalletId: transferToWalletId,
      amount: editingTransfer ? (editingTransfer.amountCents / 100).toFixed(2) : '',
      note: editingTransfer?.note ?? '',
      occurredAt: editingTransfer ? toInputDate(new Date(editingTransfer.occurredAt)) : toInputDate(),
    },
  })

  useEffect(() => {
    if (!open) return
    setSubmitError(null)
    setReceipt(null)
    setReceiptError(null)
    setTab(editingTransaction?.type ?? 'expense')
    transactionForm.reset({
      type: editingTransaction?.type === 'income' ? 'income' : 'expense',
      walletId: editingMovement?.walletId ?? formWallets[0]?.id ?? '',
      amount: editingMovement ? (editingMovement.amountCents / 100).toFixed(2) : '',
      categoryId: categoryIdFor(editingMovement?.type === 'income' ? 'income' : 'expense', editingMovement?.categoryId),
      merchant: editingMovement?.merchant ?? '',
      note: editingMovement?.note ?? '',
      occurredAt: editingMovement ? toInputDate(new Date(editingMovement.occurredAt)) : toInputDate(),
    })
    transferForm.reset({
      fromWalletId: transferFromWalletId,
      toWalletId: transferToWalletId,
      amount: editingTransfer ? (editingTransfer.amountCents / 100).toFixed(2) : '',
      note: editingTransfer?.note ?? '',
      occurredAt: editingTransfer ? toInputDate(new Date(editingTransfer.occurredAt)) : toInputDate(),
    })
  }, [open, editingTransaction?.id])

  function changeTab(nextTab: MovementTab): void {
    setTab(nextTab)
    setSubmitError(null)
    if (nextTab !== 'transfer') {
      transactionForm.setValue('type', nextTab)
      transactionForm.setValue('categoryId', categoryIdFor(nextTab, transactionForm.getValues('categoryId')))
    }
  }

  function handleReceiptChange(file: File | undefined): void {
    setReceiptError(null)
    if (!file) {
      setReceipt(null)
      return
    }
    const error = validateReceipt(file)
    if (error) {
      setReceiptError(error)
      setReceipt(null)
      return
    }
    setReceipt(file)
  }

  async function submitTransaction(values: TransactionFormValues): Promise<void> {
    setSubmitError(null)
    const cents = parseAmountToCents(values.amount)
    if (!cents) {
      setSubmitError('Enter an amount greater than zero.')
      return
    }
    try {
      const receiptUrl = receipt ? await blobToDataUrl(await compressReceipt(receipt)) : editingTransaction?.receiptUrl ?? null
      const input = {
        walletId: values.walletId,
        type: values.type,
        amountCents: amountFromInput(values.amount),
        categoryId: values.categoryId,
        merchant: values.merchant,
        note: values.note,
        occurredAt: values.occurredAt,
        receiptName: receipt?.name ?? editingTransaction?.receiptName ?? null,
        receiptUrl,
      }
      if (editingTransaction) {
        updateTransaction(editingTransaction.id, input)
      } else {
        addTransaction(input)
      }
      onSuccess(`${values.type === 'expense' ? 'Expense' : 'Income'} ${editingTransaction ? 'updated' : 'added'}.`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save this movement.')
    }
  }

  function submitTransfer(values: TransferFormValues): void {
    setSubmitError(null)
    const cents = parseAmountToCents(values.amount)
    if (!cents) {
      setSubmitError('Enter an amount greater than zero.')
      return
    }
    try {
      const input = {
        fromWalletId: values.fromWalletId,
        toWalletId: values.toWalletId,
        amountCents: cents,
        note: values.note,
        occurredAt: values.occurredAt,
      }
      if (editingTransfer?.transferGroupId) {
        updateTransfer(editingTransfer.transferGroupId, input)
      } else {
        addTransfer(input)
      }
      onSuccess(editingTransfer ? 'Transfer updated between your wallets.' : 'Transfer recorded between your wallets.')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save this transfer.')
    }
  }

  const visibleCategories = state.categories.filter((category) => category.type === tab || category.type === 'both')
  const movementTabs: MovementTab[] = editingTransfer ? ['transfer'] : editingTransaction ? ['expense', 'income'] : ['expense', 'income', 'transfer']

  return (
    <Modal open={open} title={editingTransaction ? 'Edit movement' : 'Add a movement'} description={editingTransaction ? 'Update the details while keeping your ledger accurate.' : 'Record a transaction with the details you want to remember.'} onClose={onClose} size="large">
      <div className="movement-tabs" role="tablist" aria-label="Movement type">
        {movementTabs.map((item) => (
          <button key={item} className={`movement-tab ${tab === item ? 'movement-tab-active' : ''}`} type="button" role="tab" aria-selected={tab === item} onClick={() => changeTab(item)}>
            {item === 'expense' ? 'Expense' : item === 'income' ? 'Income' : 'Transfer'}
          </button>
        ))}
      </div>

      {tab === 'transfer' ? (
        <form className="form-stack" onSubmit={transferForm.handleSubmit(submitTransfer)}>
          <div className="form-grid form-grid-two">
            <label className="field">
              <span>From wallet</span>
              <select {...transferForm.register('fromWalletId')}>
                {formWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
              </select>
              <FieldError message={transferForm.formState.errors.fromWalletId?.message} />
            </label>
            <label className="field">
              <span>To wallet</span>
              <select {...transferForm.register('toWalletId')}>
                {formWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
              </select>
              <FieldError message={transferForm.formState.errors.toWalletId?.message} />
            </label>
          </div>
          <div className="form-grid form-grid-two">
            <label className="field">
              <span>Amount</span>
              <div className="input-prefix"><span>₱</span><input inputMode="decimal" placeholder="0.00" {...transferForm.register('amount')} /></div>
              <FieldError message={transferForm.formState.errors.amount?.message} />
            </label>
            <label className="field">
              <span>Date</span>
              <input type="date" {...transferForm.register('occurredAt')} />
              <FieldError message={transferForm.formState.errors.occurredAt?.message} />
            </label>
          </div>
          <label className="field">
            <span>Note <small>Optional</small></span>
            <textarea rows={3} placeholder="What was this movement for?" {...transferForm.register('note')} />
            <FieldError message={transferForm.formState.errors.note?.message} />
          </label>
          {submitError && <div className="form-alert">{submitError}</div>}
          <div className="modal-actions">
            <button className="button button-quiet" type="button" onClick={onClose}>Cancel</button>
            <button className="button button-primary" type="submit" disabled={transferForm.formState.isSubmitting}><Send size={16} /> {editingTransaction ? 'Update transfer' : 'Save transfer'}</button>
          </div>
        </form>
      ) : (
        <form className="form-stack" onSubmit={transactionForm.handleSubmit(submitTransaction)}>
          <div className="form-grid form-grid-two">
            <label className="field">
              <span>{tab === 'expense' ? 'Paid from' : 'Added to'}</span>
              <select {...transactionForm.register('walletId')}>
                {formWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
              </select>
              <FieldError message={transactionForm.formState.errors.walletId?.message} />
            </label>
            <label className="field">
              <span>Amount</span>
              <div className="input-prefix"><span>₱</span><input inputMode="decimal" placeholder="0.00" {...transactionForm.register('amount')} /></div>
              <FieldError message={transactionForm.formState.errors.amount?.message} />
            </label>
          </div>
          <div className="form-grid form-grid-two">
            <label className="field">
              <span>{tab === 'expense' ? 'Category' : 'Income type'}</span>
              <select {...transactionForm.register('categoryId')}>
                {visibleCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <FieldError message={transactionForm.formState.errors.categoryId?.message} />
            </label>
            <label className="field">
              <span>Date</span>
              <input type="date" {...transactionForm.register('occurredAt')} />
              <FieldError message={transactionForm.formState.errors.occurredAt?.message} />
            </label>
          </div>
          <label className="field">
            <span>{tab === 'expense' ? 'Merchant' : 'Source'}</span>
            <input placeholder={tab === 'expense' ? 'e.g. Coffee shop' : 'e.g. Salary'} autoComplete="organization" {...transactionForm.register('merchant')} />
            <FieldError message={transactionForm.formState.errors.merchant?.message} />
          </label>
          <label className="field">
            <span>Note <small>Optional</small></span>
            <textarea rows={2} placeholder="Add a little context" {...transactionForm.register('note')} />
            <FieldError message={transactionForm.formState.errors.note?.message} />
          </label>
          <div className="receipt-upload-block">
            <div className="receipt-upload-heading"><span>{receipt || editingTransaction?.receiptName ? <Paperclip size={18} /> : <UploadCloud size={19} />}<span><strong>{receipt?.name ?? editingTransaction?.receiptName ?? 'Attach a receipt'}</strong><small>{receipt ? 'Ready to compress and attach' : editingTransaction?.receiptName ? 'Existing receipt will be kept unless replaced' : 'JPG, PNG, or WebP up to 8 MB'}</small></span></span></div>
            <div className="receipt-upload-actions"><button className="button button-secondary button-small" type="button" onClick={() => receiptInput.current?.click()}><ImagePlus size={15} /> Choose image</button><button className="button button-quiet button-small" type="button" onClick={() => cameraInput.current?.click()}><Camera size={15} /> Use camera</button></div>
            <input ref={receiptInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { handleReceiptChange(event.target.files?.[0]); event.currentTarget.value = '' }} />
            <input ref={cameraInput} className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => { handleReceiptChange(event.target.files?.[0]); event.currentTarget.value = '' }} />
          </div>
          {receiptError && <div className="form-alert">{receiptError}</div>}
          {submitError && <div className="form-alert">{submitError}</div>}
          <div className="modal-actions">
            <button className="button button-quiet" type="button" onClick={onClose}>Cancel</button>
            <button className="button button-primary" type="submit" disabled={transactionForm.formState.isSubmitting}><Send size={16} /> {editingTransaction ? `Update ${tab}` : `Save ${tab}`}</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
