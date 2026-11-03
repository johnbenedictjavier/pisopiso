import { describe, expect, it } from 'vitest'
import { compareTransactionsByOccurredAt } from './dates'
import type { Transaction } from '../types'

function movement(id: string, occurredAt: string, createdAt: string): Transaction {
  return { id, occurredAt, createdAt } as Transaction
}

describe('transaction date ordering', () => {
  it('uses the movement date before the entry date', () => {
    const olderMovement = movement('older', '2024-12-31T12:00:00.000Z', '2026-11-03T12:00:00.000Z')
    const newerMovement = movement('newer', '2025-01-03T12:00:00.000Z', '2024-12-01T12:00:00.000Z')

    expect([newerMovement, olderMovement].sort(compareTransactionsByOccurredAt).map((item) => item.id)).toEqual(['older', 'newer'])
  })

  it('uses creation time and then the id for same-day movements', () => {
    const first = movement('first', '2025-01-03T12:00:00.000Z', '2025-01-03T10:00:00.000Z')
    const second = movement('second', '2025-01-03T12:00:00.000Z', '2025-01-03T11:00:00.000Z')

    expect(compareTransactionsByOccurredAt(first, second)).toBeLessThan(0)
    expect(compareTransactionsByOccurredAt({ ...second, createdAt: first.createdAt, id: 'z' }, { ...first, id: 'a' })).toBeGreaterThan(0)
  })
})
