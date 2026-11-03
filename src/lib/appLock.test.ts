import { describe, expect, it } from 'vitest'
import { APP_LOCK_TIMEOUT_MS, shouldLockAfterBackground } from './appLock'

describe('app lock timeout', () => {
  it('does not lock before two minutes away', () => {
    const hiddenAt = 10_000

    expect(shouldLockAfterBackground(hiddenAt, hiddenAt + APP_LOCK_TIMEOUT_MS - 1)).toBe(false)
  })

  it('locks at or after two minutes away', () => {
    const hiddenAt = 10_000

    expect(shouldLockAfterBackground(hiddenAt, hiddenAt + APP_LOCK_TIMEOUT_MS)).toBe(true)
    expect(shouldLockAfterBackground(hiddenAt, hiddenAt + APP_LOCK_TIMEOUT_MS + 1)).toBe(true)
  })

  it('does not lock without a background timestamp', () => {
    expect(shouldLockAfterBackground(null, APP_LOCK_TIMEOUT_MS * 10)).toBe(false)
  })
})
