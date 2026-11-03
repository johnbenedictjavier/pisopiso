import { describe, expect, it } from 'vitest'
import { buildAuthPassword } from './auth'

describe('auth password adapter', () => {
  it('creates a policy-compliant password from the email and PIN', () => {
    const password = buildAuthPassword('User@example.com', '123456')

    expect(password).toBe('PisoPiso-user@example.com-123456-access')
    expect(password).not.toBe('123456')
    expect(password.length).toBeGreaterThan(6)
  })
})
