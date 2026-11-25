import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, Paperclip, Send, UploadCloud } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
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

const amountPresets = [20, 50, 100, 150, 200, 300]
const expenseQuickCategories = [
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'bills', label: 'Bills' },
  { value: 'education', label: 'Education' },
]
const incomeQuickCategories = [
  { value: 'allowance', label: 'Allowance' },
  { value: 'interest', label: 'Interest' },
  { value: 'gift', label: 'Gift' },
  { value: 'scholar', label: 'Scholar' },
  { value: 'freelance', label: 'Freelance' },
]

interface TransactionModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  transaction?: Transaction | null
  walletId?: string
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="field-error">{message}</span> : null
}

function AmountPresets({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="amount-presets" aria-label="Common values">
      {amountPresets.map((amount) => {
        const selected = parseAmountToCents(value) === amount * 100
        return (
          <button
            className={`amount-preset ${selected ? 'amount-preset-active' : ''}`}
            key={amount}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(String(amount))}
          >
            ₱{amount}
          </button>
        )
      })}
    </div>
  )
}

function CapsulePicker({
  label,
  value,
  options,
  moreOptions,
  moreOpen,
  onMoreToggle,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  moreOptions: Array<{ value: string; label: string }>
  moreOpen: boolean
  onMoreToggle: () => void
  onChange: (value: string) => void
}) {
  const selectedMore = !options.some((option) => option.value === value)
  const showMoreSelect = moreOpen || selectedMore
  const moreSelectValue = selectedMore ? value : moreOptions[0]?.value ?? ''

  return (
    <div className="field capsule-picker">
      <span>{label}</span>
      <div className="capsule-options" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            className={`capsule-option ${value === option.value ? 'capsule-option-active' : ''}`}
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
        <button
          className={`capsule-option capsule-option-more ${showMoreSelect ? 'capsule-option-active' : ''}`}
          type="button"
          aria-expanded={showMoreSelect}
          onClick={onMoreToggle}
        >
          More
        </button>
      </div>
      {showMoreSelect && (
        <select
          className="capsule-more-select"
          aria-label={`${label} more options`}
          value={moreSelectValue}
          onChange={(event) => onChange(event.target.value)}
        >
          {moreOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      )}
    </div>
  )
}

export default function TransactionModal({ open, onClose, onSuccess, transaction = null, walletId }: TransactionModalProps) {
  const { state, activeWallets, jarTransactions, addTransaction, addTransfer, updateTransaction, updateTransfer } = useFinance()
  const editingTransaction = transaction
  const editingMovement = editingTransaction && editingTransaction.type !== 'transfer' ? editingTransaction : null
  const editingTransfer = editingTransaction?.type === 'transfer' ? editingTransaction : null
  const [tab, setTab] = useState<MovementTab>('expense')
  const [moreCategoryOpen, setMoreCategoryOpen] = useState(false)
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
  const transferReceiptName = editingTransfer?.receiptName ?? transferPartner?.receiptName ?? null
  const transferReceiptUrl = editingTransfer?.receiptUrl ?? transferPartner?.receiptUrl ?? null
  const transferFromWalletId = editingTransfer
    ? editingTransfer.transferDirection === 'out' ? editingTransfer.walletId : editingTransfer.relatedWalletId ?? transferPartner?.walletId ?? ''
    : formWallets[0]?.id ?? ''
  const transferToWalletId = editingTransfer
    ? editingTransfer.transferDirection === 'out' ? editingTransfer.relatedWalletId ?? transferPartner?.walletId ?? '' : editingTransfer.walletId
    : walletId
      ? formWallets.find((wallet) => wallet.id !== walletId)?.id ?? formWallets[0]?.id ?? ''
      : formWallets[1]?.id ?? formWallets[0]?.id ?? ''
  const defaultWalletId = walletId && formWallets.some((wallet) => wallet.id === walletId) ? walletId : formWallets[0]?.id ?? ''
  const defaultTransferFromWalletId = walletId && !editingTransfer ? defaultWalletId : transferFromWalletId
  const categoryIdFor = (type: 'expense' | 'income', currentId: string | null | undefined) => {
    const current = state.categories.find((category) => category.id === currentId && (category.type === type || category.type === 'both'))
    const preferredId = type === 'expense' ? 'food' : 'allowance'
    return current?.id
      ?? state.categories.find((category) => category.id === preferredId && (category.type === type || category.type === 'both'))?.id
      ?? state.categories.find((category) => category.type === type || category.type === 'both')?.id
      ?? ''
  }
  const editingJarTransaction = editingMovement
    ? jarTransactions.find((item) => item.sourceTransactionId === editingMovement.id)
    : undefined
  const transactionQuickCategories = tab === 'income' ? incomeQuickCategories : expenseQuickCategories
  const categoryRecords = state.categories.filter((category) => category.type === tab || category.type === 'both')
  const categoryOptions = transactionQuickCategories.filter((option) => categoryRecords.some((category) => category.id === option.value))
  const moreCategoryOptions = categoryRecords
    .filter((category) => !categoryOptions.some((option) => option.value === category.id))
    .map((category) => ({ value: category.id, label: category.name }))

  const transactionForm = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: 'expense',
      walletId: editingMovement?.walletId ?? defaultWalletId,
      amount: editingMovement ? (editingMovement.amountCents / 100).toFixed(2) : '',
      coinsBack: editingJarTransaction ? (editingJarTransaction.amountCents / 100).toFixed(2) : '',
      categoryId: categoryIdFor(editingMovement?.type === 'income' ? 'income' : 'expense', editingMovement?.categoryId),
      merchant: editingMovement?.merchant ?? '',
      note: editingMovement?.note ?? '',
      occurredAt: editingMovement ? toInputDate(new Date(editingMovement.occurredAt)) : toInputDate(),
    },
  })
  const transferForm = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      fromWalletId: defaultTransferFromWalletId,
      toWalletId: transferToWalletId,
      amount: editingTransfer ? (editingTransfer.amountCents / 100).toFixed(2) : '',
      note: editingTransfer?.note ?? '',
      occurredAt: editingTransfer ? toInputDate(new Date(editingTransfer.occurredAt)) : toInputDate(),
    },
  })
  const transactionAmount = useWatch({ control: transactionForm.control, name: 'amount' })
  const transactionCategoryId = useWatch({ control: transactionForm.control, name: 'categoryId' })
  const transferAmount = useWatch({ control: transferForm.control, name: 'amount' })

  useEffect(() => {
    if (!open) return
    setSubmitError(null)
    setReceipt(null)
    setReceiptError(null)
    setTab(editingTransaction?.type ?? 'expense')
    setMoreCategoryOpen(Boolean(
      editingMovement?.categoryId
      && !(editingMovement.type === 'income' ? incomeQuickCategories : expenseQuickCategories)
        .some((option) => option.value === editingMovement.categoryId),
    ))
    transactionForm.reset({
      type: editingTransaction?.type === 'income' ? 'income' : 'expense',
      walletId: editingMovement?.walletId ?? defaultWalletId,
      amount: editingMovement ? (editingMovement.amountCents / 100).toFixed(2) : '',
      coinsBack: editingJarTransaction ? (editingJarTransaction.amountCents / 100).toFixed(2) : '',
      categoryId: categoryIdFor(editingMovement?.type === 'income' ? 'income' : 'expense', editingMovement?.categoryId),
      merchant: editingMovement?.merchant ?? '',
      note: editingMovement?.note ?? '',
      occurredAt: editingMovement ? toInputDate(new Date(editingMovement.occurredAt)) : toInputDate(),
    })
    transferForm.reset({
      fromWalletId: defaultTransferFromWalletId,
      toWalletId: transferToWalletId,
      amount: editingTransfer ? (editingTransfer.amountCents / 100).toFixed(2) : '',
      note: editingTransfer?.note ?? '',
      occurredAt: editingTransfer ? toInputDate(new Date(editingTransfer.occurredAt)) : toInputDate(),
    })
  }, [open, editingTransaction?.id, walletId])

  function changeTab(nextTab: MovementTab): void {
    setTab(nextTab)
    setSubmitError(null)
    if (nextTab !== 'transfer') {
      transactionForm.setValue('type', nextTab)
      const nextCategoryId = categoryIdFor(nextTab, transactionForm.getValues('categoryId'))
      transactionForm.setValue('categoryId', nextCategoryId)
      setMoreCategoryOpen(!(nextTab === 'income' ? incomeQuickCategories : expenseQuickCategories)
        .some((option) => option.value === nextCategoryId))
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
    const coinsBackCents = values.coinsBack.trim() ? parseAmountToCents(values.coinsBack) : 0
    if (coinsBackCents === null) {
      setSubmitError('Enter a valid coins-back amount.')
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
        coinsBackCents,
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

  async function submitTransfer(values: TransferFormValues): Promise<void> {
    setSubmitError(null)
    const cents = parseAmountToCents(values.amount)
    if (!cents) {
      setSubmitError('Enter an amount greater than zero.')
      return
    }
    try {
      const receiptUrl = receipt ? await blobToDataUrl(await compressReceipt(receipt)) : transferReceiptUrl
      const input = {
        fromWalletId: values.fromWalletId,
        toWalletId: values.toWalletId,
        amountCents: cents,
        note: values.note,
        occurredAt: values.occurredAt,
        receiptName: receipt?.name ?? transferReceiptName,
        receiptUrl,
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

  function selectCategory(value: string): void {
    transactionForm.setValue('categoryId', value, { shouldDirty: true, shouldValidate: true })
    setMoreCategoryOpen(!categoryOptions.some((option) => option.value === value))
  }

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
            <div className="field">
                <span>Amount</span>
                <div className="input-prefix"><span>₱</span><input aria-label="Amount" inputMode="decimal" placeholder="0.00" {...transferForm.register('amount')} /></div>
                <AmountPresets value={transferAmount} onChange={(value) => transferForm.setValue('amount', value, { shouldDirty: true, shouldValidate: true })} />
                <FieldError message={transferForm.formState.errors.amount?.message} />
              </div>
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
          <div className="receipt-upload-block">
            <div className="receipt-upload-heading"><span>{receipt || transferReceiptName ? <Paperclip size={18} /> : <UploadCloud size={19} />}<span><strong>{receipt?.name ?? transferReceiptName ?? 'Attach a receipt'}</strong><small>{receipt ? 'Ready to compress and attach' : transferReceiptName ? 'Existing receipt will be kept unless replaced' : 'JPG, PNG, or WebP up to 8 MB'}</small></span></span></div>
            <div className="receipt-upload-actions"><button className="button button-secondary button-small" type="button" onClick={() => receiptInput.current?.click()}><ImagePlus size={15} /> Choose image</button><button className="button button-quiet button-small" type="button" onClick={() => cameraInput.current?.click()}><Camera size={15} /> Use camera</button></div>
            <input ref={receiptInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { handleReceiptChange(event.target.files?.[0]); event.currentTarget.value = '' }} />
            <input ref={cameraInput} className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => { handleReceiptChange(event.target.files?.[0]); event.currentTarget.value = '' }} />
          </div>
          {receiptError && <div className="form-alert">{receiptError}</div>}
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
             <div className="movement-amount-field">
               <div className="movement-amount-row">
                 <label className="movement-amount-cell">
                   <span>Amount</span>
                   <div className="input-prefix"><span>₱</span><input aria-label="Amount" inputMode="decimal" placeholder="0.00" {...transactionForm.register('amount')} /></div>
                 </label>
                 <label className="movement-amount-cell">
                   <span>Coins back <small>Optional</small></span>
                   <div className="input-prefix"><span>₱</span><input aria-label="Coins back" inputMode="decimal" placeholder="0.00" {...transactionForm.register('coinsBack')} /></div>
                 </label>
               </div>
               <AmountPresets value={transactionAmount} onChange={(value) => transactionForm.setValue('amount', value, { shouldDirty: true, shouldValidate: true })} />
               <FieldError message={transactionForm.formState.errors.amount?.message} />
               <FieldError message={transactionForm.formState.errors.coinsBack?.message} />
             </div>
           </div>
           <div className="form-grid form-grid-two">
             <CapsulePicker
               label={tab === 'expense' ? 'Category' : 'Income type'}
               value={transactionCategoryId}
               options={categoryOptions}
               moreOptions={moreCategoryOptions}
               moreOpen={moreCategoryOpen}
               onMoreToggle={() => setMoreCategoryOpen((current) => !current)}
               onChange={selectCategory}
             />
              <label className="field">
                <span>Date</span>
                <input aria-label="Date" type="date" {...transactionForm.register('occurredAt')} />
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
