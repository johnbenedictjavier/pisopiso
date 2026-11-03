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
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="field-error">{message}</span> : null
}

export default function TransactionModal({ open, onClose, onSuccess }: TransactionModalProps) {
  const { state, activeWallets, addTransaction, addTransfer } = useFinance()
  const [tab, setTab] = useState<MovementTab>('expense')
  const [receipt, setReceipt] = useState<File | null>(null)
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const receiptInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)

  const transactionForm = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: 'expense',
      walletId: activeWallets[0]?.id ?? '',
      amount: '',
      categoryId: state.categories.find((category) => category.type === 'expense')?.id ?? '',
      merchant: '',
      note: '',
      occurredAt: toInputDate(),
    },
  })
  const transferForm = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      fromWalletId: activeWallets[0]?.id ?? '',
      toWalletId: activeWallets[1]?.id ?? activeWallets[0]?.id ?? '',
      amount: '',
      note: '',
      occurredAt: toInputDate(),
    },
  })

  useEffect(() => {
    if (!open) return
    setSubmitError(null)
    setReceipt(null)
    setReceiptError(null)
    setTab('expense')
    transactionForm.reset({
      type: 'expense',
      walletId: activeWallets[0]?.id ?? '',
      amount: '',
      categoryId: state.categories.find((category) => category.type === 'expense')?.id ?? '',
      merchant: '',
      note: '',
      occurredAt: toInputDate(),
    })
    transferForm.reset({
      fromWalletId: activeWallets[0]?.id ?? '',
      toWalletId: activeWallets[1]?.id ?? activeWallets[0]?.id ?? '',
      amount: '',
      note: '',
      occurredAt: toInputDate(),
    })
  }, [open])

  function changeTab(nextTab: MovementTab): void {
    setTab(nextTab)
    setSubmitError(null)
    if (nextTab !== 'transfer') {
      transactionForm.setValue('type', nextTab)
      transactionForm.setValue('categoryId', state.categories.find((category) => category.type === nextTab)?.id ?? '')
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
      const receiptUrl = receipt ? await blobToDataUrl(await compressReceipt(receipt)) : null
      addTransaction({
        walletId: values.walletId,
        type: values.type,
        amountCents: amountFromInput(values.amount),
        categoryId: values.categoryId,
        merchant: values.merchant,
        note: values.note,
        occurredAt: values.occurredAt,
        receiptName: receipt?.name ?? null,
        receiptUrl,
      })
      onSuccess(`${values.type === 'expense' ? 'Expense' : 'Income'} added to your story.`)
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
      addTransfer({
        fromWalletId: values.fromWalletId,
        toWalletId: values.toWalletId,
        amountCents: cents,
        note: values.note,
        occurredAt: values.occurredAt,
      })
      onSuccess('Transfer recorded between your wallets.')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save this transfer.')
    }
  }

  const visibleCategories = state.categories.filter((category) => category.type === tab || category.type === 'both')

  return (
    <Modal open={open} title="Add a movement" description="Keep the small details. They make the big picture useful." onClose={onClose} size="large">
      <div className="movement-tabs" role="tablist" aria-label="Movement type">
        {(['expense', 'income', 'transfer'] as MovementTab[]).map((item) => (
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
                {activeWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
              </select>
              <FieldError message={transferForm.formState.errors.fromWalletId?.message} />
            </label>
            <label className="field">
              <span>To wallet</span>
              <select {...transferForm.register('toWalletId')}>
                {activeWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
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
            <button className="button button-primary" type="submit" disabled={transferForm.formState.isSubmitting}><Send size={16} /> Save transfer</button>
          </div>
        </form>
      ) : (
        <form className="form-stack" onSubmit={transactionForm.handleSubmit(submitTransaction)}>
          <div className="form-grid form-grid-two">
            <label className="field">
              <span>{tab === 'expense' ? 'Paid from' : 'Added to'}</span>
              <select {...transactionForm.register('walletId')}>
                {activeWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
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
            <div className="receipt-upload-heading"><span>{receipt ? <Paperclip size={18} /> : <UploadCloud size={19} />}<span><strong>{receipt ? receipt.name : 'Attach a receipt'}</strong><small>{receipt ? 'Ready to compress and attach' : 'JPG, PNG, or WebP up to 8 MB'}</small></span></span></div>
            <div className="receipt-upload-actions"><button className="button button-secondary button-small" type="button" onClick={() => receiptInput.current?.click()}><ImagePlus size={15} /> Choose image</button><button className="button button-quiet button-small" type="button" onClick={() => cameraInput.current?.click()}><Camera size={15} /> Use camera</button></div>
            <input ref={receiptInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { handleReceiptChange(event.target.files?.[0]); event.currentTarget.value = '' }} />
            <input ref={cameraInput} className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => { handleReceiptChange(event.target.files?.[0]); event.currentTarget.value = '' }} />
          </div>
          {receiptError && <div className="form-alert">{receiptError}</div>}
          {submitError && <div className="form-alert">{submitError}</div>}
          <div className="modal-actions">
            <button className="button button-quiet" type="button" onClick={onClose}>Cancel</button>
            <button className="button button-primary" type="submit" disabled={transactionForm.formState.isSubmitting}><Send size={16} /> Save {tab}</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
