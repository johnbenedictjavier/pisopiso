export const APP_LOCK_TIMEOUT_MS = 2 * 60 * 1000

export function shouldLockAfterBackground(hiddenAt: number | null, now = Date.now()): boolean {
  return hiddenAt !== null && now - hiddenAt >= APP_LOCK_TIMEOUT_MS
}
