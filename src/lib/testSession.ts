const E2E_SESSION_KEY = 'pisopiso:e2e-session'

export interface TestSessionUser {
  id: string
  email: string
}

export function getTestSessionUser(): TestSessionUser | null {
  if (import.meta.env.VITE_E2E !== 'true' || typeof window === 'undefined') return null
  return window.localStorage.getItem(E2E_SESSION_KEY) === 'true'
    ? { id: 'e2e-user', email: 'e2e@example.com' }
    : null
}
