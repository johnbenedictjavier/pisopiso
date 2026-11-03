export function parseAmountToCents(value: string | number): number | null {
  const raw = String(value).trim().replace(/,/g, '')
  if (!/^\d+(?:\.\d{0,2})?$/.test(raw)) return null

  const [whole, fraction = ''] = raw.split('.')
  const cents = Number(`${whole}${fraction.padEnd(2, '0')}`)
  return Number.isSafeInteger(cents) ? cents : null
}

export function formatCurrency(cents: number): string {
  const negative = cents < 0
  const absolute = Math.abs(cents)
  const whole = Math.floor(absolute / 100)
  const fraction = String(absolute % 100).padStart(2, '0')
  return `${negative ? '-' : ''}₱${whole.toLocaleString('en-PH')}.${fraction}`
}

export function formatSignedCurrency(cents: number): string {
  if (cents === 0) return formatCurrency(0)
  return cents > 0 ? `+${formatCurrency(cents)}` : formatCurrency(cents)
}

export function compactCurrency(cents: number): string {
  const absolute = Math.abs(cents)
  if (absolute >= 1_000_000) {
    return `${cents < 0 ? '-' : ''}₱${(absolute / 100_000).toFixed(1)}k`
  }
  return formatCurrency(cents)
}
