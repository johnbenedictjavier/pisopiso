import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from './Modal'
import { useFinance } from '../context/FinanceContext'
import { toInputDate, toInputTime } from '../lib/dates'
import { parseAmountToCents } from '../lib/money'
import type { JarTransaction } from '../types'
import { jarExpenseFormSchema, type JarExpenseFormValues } from '../lib/validation'

interface JarExpenseModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  expense?: JarTransaction | null
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="field-error">{message}</span> : null
}

export default function JarExpenseModal({ open, onClose, onSuccess, expense = null }: JarExpenseModalProps) {
  const { addJarExpense, updateJarExpense } = useFinance()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const form = useForm<JarExpenseFormValues>({
    resolver: zodResolver(jarExpenseFormSchema),
    defaultValues: {
      amount: expense ? (expense.amountCents / 100).toFixed(2) : '',
      merchant: expense?.merchant ?? '',
      note: expense?.note ?? '',
      occurredAt: expense ? toInputDate(new Date(expense.occurredAt)) : toInputDate(),
      occurredTime: expense ? toInputTime(new Date(expense.occurredAt)) : toInputTime(),
    },
  })

  useEffect(() => {
    if (!open) return
    setSubmitError(null)
    form.reset({
      amount: expense ? (expense.amountCents / 100).toFixed(2) : '',
      merchant: expense?.merchant ?? '',
      note: expense?.note ?? '',
      occurredAt: expense ? toInputDate(new Date(expense.occurredAt)) : toInputDate(),
      occurredTime: expense ? toInputTime(new Date(expense.occurredAt)) : toInputTime(),
    })
  }, [open, expense?.id])

  function submit(values: JarExpenseFormValues): void {
    setSubmitError(null)
    const amountCents = parseAmountToCents(values.amount)
    if (!amountCents) {
      setSubmitError('Enter an amount greater than zero.')
      return
    }

    try {
      const input = {
        amountCents,
        merchant: values.merchant,
        note: values.note,
        occurredAt: values.occurredAt,
        occurredTime: values.occurredTime,
      }
      if (expense) {
        updateJarExpense(expense.id, input)
      } else {
        addJarExpense(input)
      }
      onSuccess(expense ? 'Jar expense updated.' : 'Jar expense added.')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save this jar expense.')
    }
  }

  return (
    <Modal
      open={open}
      title={expense ? 'Edit jar expense' : 'Add jar expense'}
      description="Take coins out of the jar without changing your wallet balances."
      onClose={onClose}
      size="small"
    >
      <form className="form-stack jar-expense-form" onSubmit={form.handleSubmit(submit)}>
        <div className="form-grid form-grid-two">
          <div className="field">
            <span>Amount</span>
            <div className="input-prefix"><span>₱</span><input aria-label="Amount" inputMode="decimal" placeholder="0.00" {...form.register('amount')} /></div>
            <FieldError message={form.formState.errors.amount?.message} />
          </div>
          <label className="field">
            <span>Date</span>
            <input aria-label="Date" type="date" {...form.register('occurredAt')} />
            <FieldError message={form.formState.errors.occurredAt?.message} />
          </label>
        </div>
        <label className="field">
          <span>Time</span>
          <input aria-label="Time" type="time" {...form.register('occurredTime')} />
          <FieldError message={form.formState.errors.occurredTime?.message} />
        </label>
        <label className="field">
          <span>What did you spend it on?</span>
          <input placeholder="e.g. Snack or small treat" autoComplete="off" {...form.register('merchant')} />
          <FieldError message={form.formState.errors.merchant?.message} />
        </label>
        <label className="field">
          <span>Note <small>Optional</small></span>
          <textarea rows={2} placeholder="Add a little context" {...form.register('note')} />
          <FieldError message={form.formState.errors.note?.message} />
        </label>
        {submitError && <div className="form-alert">{submitError}</div>}
        <div className="modal-actions">
          <button className="button button-quiet" type="button" onClick={onClose}>Cancel</button>
          <button className="button button-primary" type="submit" disabled={form.formState.isSubmitting}><Send size={16} /> {expense ? 'Update jar expense' : 'Save jar expense'}</button>
        </div>
      </form>
    </Modal>
  )
}
