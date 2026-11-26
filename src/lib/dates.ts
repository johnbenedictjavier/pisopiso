import type { Transaction } from '../types'

export function toInputDate(value = new Date()): string {
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export function toInputTime(value = new Date()): string {
  const date = new Date(value)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function combineDateAndTime(date: string, time = '12:00'): string {
  const normalizedTime = /^\d{2}:\d{2}$/.test(time) ? time : '12:00'
  return new Date(`${date}T${normalizedTime}:00`).toISOString()
}

export function localDateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function isCurrentMonth(value: string): boolean {
  const date = new Date(value)
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

export function relativeLabel(value: string): string {
  const date = new Date(value)
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const difference = Math.round((startOfToday - startOfDate) / 86_400_000)

  if (difference === 0) return 'Today'
  if (difference === 1) return 'Yesterday'
  if (difference > 1 && difference < 7) return `${difference} days ago`
  return formatShortDate(value)
}

export function compareTransactionsByOccurredAtDesc(left: Transaction, right: Transaction): number {
  const occurredDifference = new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
  if (occurredDifference !== 0) return occurredDifference

  const createdDifference = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  return createdDifference !== 0 ? createdDifference : right.id.localeCompare(left.id)
}
