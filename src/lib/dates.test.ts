import { describe, expect, it } from 'vitest'
import { combineDateAndTime, compareTransactionsByOccurredAtDesc, formatDate, formatDateTime, formatShortDate } from './dates'
import type { Transaction } from '../types'

function movement(id: string, occurredAt: string, createdAt: string): Transaction {
  return { id, occurredAt, createdAt } as Transaction
}

describe('transaction date ordering', () => {
  it('uses the movement date before the entry date', () => {
    const olderMovement = movement('older', '2024-12-31T12:00:00.000Z', '2026-11-03T12:00:00.000Z')
    const newerMovement = movement('newer', '2025-01-03T12:00:00.000Z', '2024-12-01T12:00:00.000Z')

    expect([olderMovement, newerMovement].sort(compareTransactionsByOccurredAtDesc).map((item) => item.id)).toEqual(['newer', 'older'])
  })

  it('uses creation time and then the id for same-day movements', () => {
    const first = movement('first', '2025-01-03T12:00:00.000Z', '2025-01-03T10:00:00.000Z')
    const second = movement('second', '2025-01-03T12:00:00.000Z', '2025-01-03T11:00:00.000Z')

    expect(compareTransactionsByOccurredAtDesc(first, second)).toBeGreaterThan(0)
    expect(compareTransactionsByOccurredAtDesc({ ...second, createdAt: first.createdAt, id: 'z' }, { ...first, id: 'a' })).toBeLessThan(0)
  })

  it('keeps years out of list dates but includes them in detail dates', () => {
    const occurredAt = '2026-11-03T12:00:00.000Z'

    expect(formatShortDate(occurredAt)).toBe('Nov 3')
    expect(formatDate(occurredAt)).toBe('Nov 3, 2026')
    expect(formatDateTime(occurredAt)).toMatch(/\d{1,2}:\d{2}/)
  })

  it('combines a local date and time into the stored timestamp', () => {
    const occurredAt = combineDateAndTime('2026-11-03', '08:45')

    expect(new Date(occurredAt).getHours()).toBe(8)
    expect(new Date(occurredAt).getMinutes()).toBe(45)
  })
})
