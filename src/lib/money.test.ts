import { describe, expect, it } from 'vitest'
import { formatCurrency, formatSignedCurrency, parseAmountToCents } from './money'

describe('money utilities', () => {
  it('parses decimal strings without floating point drift', () => {
    expect(parseAmountToCents('1,234.50')).toBe(123450)
    expect(parseAmountToCents('0.9')).toBe(90)
    expect(parseAmountToCents('100.999')).toBeNull()
  })

  it('formats PHP amounts with two decimal places', () => {
    expect(formatCurrency(123450)).toBe('₱1,234.50')
    expect(formatCurrency(-90)).toBe('-₱0.90')
    expect(formatSignedCurrency(5000)).toBe('+₱50.00')
  })
})
