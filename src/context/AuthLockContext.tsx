import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { APP_LOCK_TIMEOUT_MS, shouldLockAfterBackground } from '../lib/appLock'
import { getTestSessionUser } from '../lib/testSession'

interface AuthLockContextValue {
  isLocked: boolean
  lock: () => void
  unlock: () => void
}

const AuthLockContext = createContext<AuthLockContextValue | null>(null)

export function AuthLockProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(() => !getTestSessionUser())
  const isLockedRef = useRef(!getTestSessionUser())
  const hiddenAtRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    isLockedRef.current = isLocked
  }, [isLocked])

  const clearBackgroundTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const lock = useCallback(() => {
    clearBackgroundTimer()
    hiddenAtRef.current = null
    isLockedRef.current = true
    setIsLocked(true)
  }, [clearBackgroundTimer])

  const unlock = useCallback(() => {
    clearBackgroundTimer()
    hiddenAtRef.current = null
    isLockedRef.current = false
    setIsLocked(false)
  }, [clearBackgroundTimer])

  useEffect(() => {
    function beginBackgroundTimer(): void {
      clearBackgroundTimer()
      if (isLockedRef.current) return
      hiddenAtRef.current = Date.now()
      timeoutRef.current = window.setTimeout(() => {
        if (shouldLockAfterBackground(hiddenAtRef.current)) lock()
      }, APP_LOCK_TIMEOUT_MS)
    }

    function resumeFromBackground(): void {
      const hiddenAt = hiddenAtRef.current
      clearBackgroundTimer()
      hiddenAtRef.current = null
      if (!isLockedRef.current && shouldLockAfterBackground(hiddenAt)) lock()
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState === 'hidden') beginBackgroundTimer()
      else resumeFromBackground()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', beginBackgroundTimer)
    window.addEventListener('pageshow', resumeFromBackground)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', beginBackgroundTimer)
      window.removeEventListener('pageshow', resumeFromBackground)
      clearBackgroundTimer()
    }
  }, [clearBackgroundTimer, lock])

  return <AuthLockContext.Provider value={{ isLocked, lock, unlock }}>{children}</AuthLockContext.Provider>
}

export function useAuthLock(): AuthLockContextValue {
  const context = useContext(AuthLockContext)
  if (!context) throw new Error('useAuthLock must be used inside AuthLockProvider')
  return context
}
