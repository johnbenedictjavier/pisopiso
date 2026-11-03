import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Delete, LockKeyhole, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { useFinance } from '../context/FinanceContext'
import { useAuthLock } from '../context/AuthLockContext'
import { buildAuthPassword } from '../lib/auth'
import { getSupabase } from '../lib/supabase'

const PIN_LENGTH = 6
const LAST_EMAIL_STORAGE_KEY = 'pisopiso:last-auth-email'
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
type AuthMode = 'sign-in' | 'sign-up'
type AuthStep = 'email' | 'pin' | 'confirm-pin'

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, PIN_LENGTH)
}

function getRememberedEmail(): string {
  if (typeof window === 'undefined') return ''
  const email = window.localStorage.getItem(LAST_EMAIL_STORAGE_KEY)?.trim().toLowerCase() ?? ''
  return emailPattern.test(email) ? email : ''
}

function rememberEmail(email: string): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(LAST_EMAIL_STORAGE_KEY, email)
}

function describeAuthError(message: string, mode: AuthMode): string {
  const normalized = message.toLowerCase()
  if (mode === 'sign-up' && /already|registered|exists/.test(normalized)) return 'An account with this email already exists. Try signing in.'
  if (/invalid api key|invalid api_key/.test(normalized)) return 'Supabase rejected the API key. Copy the publishable key from the same Supabase project into VITE_SUPABASE_PUBLISHABLE_KEY.'
  if (/email not confirmed|not confirmed/.test(normalized)) return 'Email confirmation is enabled in Supabase. Turn off Confirm email in Authentication > Providers > Email, then try again.'
  if (/email signups are disabled|signup is disabled/.test(normalized)) return 'Email signup is disabled in Supabase. Enable the Email provider to create an account.'
  if (/rate limit|too many requests/.test(normalized)) return 'Too many signup attempts. Wait a moment and try again.'
  if (/error sending confirmation|sending.*email|smtp/.test(normalized)) return 'The account was not created because the confirmation email could not be sent. Check Supabase email settings.'
  if (/password/.test(normalized)) return 'Supabase rejected the account credentials. Try creating the account again.'
  return mode === 'sign-in' ? `That email and PIN combination did not work. (${message})` : `Account creation failed: ${message}`
}

export default function AuthPage() {
  const navigate = useNavigate()
  const { loadUserState } = useFinance()
  const { unlock } = useAuthLock()
  const initialEmail = getRememberedEmail()
  const [authMode, setAuthMode] = useState<AuthMode>(initialEmail ? 'sign-in' : 'sign-up')
  const [step, setStep] = useState<AuthStep>(initialEmail ? 'pin' : 'email')
  const [email, setEmail] = useState(initialEmail)
  const [pin, setPin] = useState('')
  const [confirmationPin, setConfirmationPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function changeMode(nextMode: AuthMode): void {
    setAuthMode(nextMode)
    setStep('email')
    setPin('')
    setConfirmationPin('')
    setError('')
  }

  function continueWithEmail(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!emailPattern.test(normalizedEmail)) {
      setError('Enter a valid email address.')
      return
    }
    setEmail(normalizedEmail)
    rememberEmail(normalizedEmail)
    setError('')
    setStep('pin')
  }

  function setActivePin(value: string): void {
    const digits = onlyDigits(value)
    if (authMode === 'sign-up' && step === 'confirm-pin') {
      setConfirmationPin(digits)
    } else {
      setPin(digits)
    }
    setError('')
  }

  function addDigit(digit: string): void {
    const current = authMode === 'sign-up' && step === 'confirm-pin' ? confirmationPin : pin
    if (current.length >= PIN_LENGTH) return
    setActivePin(`${current}${digit}`)
  }

  function removeDigit(): void {
    const current = authMode === 'sign-up' && step === 'confirm-pin' ? confirmationPin : pin
    setActivePin(current.slice(0, -1))
  }

  function goBackFromPin(): void {
    if (authMode === 'sign-up' && step === 'confirm-pin') {
      setStep('pin')
      setConfirmationPin('')
      setError('')
      return
    }
    setStep('email')
    setPin('')
    setConfirmationPin('')
    setError('')
  }

  async function submitPin(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (pin.length !== PIN_LENGTH) {
      setError(`Enter all ${PIN_LENGTH} digits to continue.`)
      return
    }
    if (authMode === 'sign-up' && step === 'pin') {
      setError('')
      setStep('confirm-pin')
      return
    }
    if (authMode === 'sign-up' && confirmationPin !== pin) {
      setError('Those PINs do not match. Try again.')
      setConfirmationPin('')
      return
    }
    setBusy(true)
    setError('')
    try {
      const client = await getSupabase()
      if (!client) {
        setError('Account access is not configured yet. Add your Supabase credentials to continue.')
        return
      }
      const normalizedEmail = email.trim().toLowerCase()
      rememberEmail(normalizedEmail)
      const authPassword = buildAuthPassword(normalizedEmail, pin)
      const result = authMode === 'sign-in'
        ? await client.auth.signInWithPassword({ email: normalizedEmail, password: authPassword })
        : await client.auth.signUp({
            email: normalizedEmail,
            password: authPassword,
          })
      let authResult = result
      if (authMode === 'sign-in' && authResult.error && /invalid login credentials/i.test(authResult.error.message)) {
        authResult = await client.auth.signInWithPassword({ email: normalizedEmail, password: pin })
      }
      if (authResult.error) {
        setError(describeAuthError(authResult.error.message, authMode))
        return
      }
      if (authMode === 'sign-up' && !authResult.data.session) {
        setError('Email confirmation is enabled in Supabase. Turn off Confirm email in Authentication > Providers > Email, then try again.')
        setStep('email')
        setPin('')
        setConfirmationPin('')
        return
      }
      if (!authResult.data.user || !authResult.data.session) {
        setError('Account access could not be completed. Please try again.')
        return
      }
      loadUserState(authResult.data.user.id, authResult.data.user.email ?? normalizedEmail)
      unlock()
      navigate('/overview', { replace: true })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const activePin = authMode === 'sign-up' && step === 'confirm-pin' ? confirmationPin : pin
  const pinTitle = authMode === 'sign-up' && step === 'confirm-pin' ? 'Confirm your PIN.' : authMode === 'sign-in' ? 'Enter your PIN.' : 'Choose a six-digit PIN.'
  const pinDescription = authMode === 'sign-up' && step === 'confirm-pin' ? 'Enter it one more time so there are no surprises.' : authMode === 'sign-in' ? 'Use the PIN linked to your account.' : 'You will use this PIN whenever you return.'
  const pinButtonLabel = authMode === 'sign-up' && step === 'pin' ? 'Continue' : authMode === 'sign-in' ? 'Sign in' : 'Create account'

  return (
    <main className={`auth-page auth-keypad-page auth-${authMode}-${step}`}>
      <section className="auth-art">
        <div className="auth-art-top"><BrandMark /></div>
        <div className="auth-art-copy"><span className="eyebrow">Your calmer money space</span><h1>Every peso has a place.</h1><p>Simple enough for today. Clear enough for tomorrow.</p></div>
        <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
        <div className="auth-art-note"><span>₱</span><div><strong>Your money space.</strong><small>Built around your rhythm.</small></div></div>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-entry-badge"><span className="auth-entry-icon"><LockKeyhole size={17} /></span><div className="auth-entry-copy"><strong>{authMode === 'sign-in' ? 'Private return' : 'A private place for your money'}</strong><small>{authMode === 'sign-in' ? 'Your account is ready when you are.' : 'Set up your own calm money space.'}</small></div></div>
          <div className="auth-mode-tabs" role="tablist" aria-label="Account access">
            <button className={authMode === 'sign-up' ? 'auth-mode-active' : ''} type="button" role="tab" aria-selected={authMode === 'sign-up'} onClick={() => changeMode('sign-up')}>Create account</button>
            <button className={authMode === 'sign-in' ? 'auth-mode-active' : ''} type="button" role="tab" aria-selected={authMode === 'sign-in'} onClick={() => changeMode('sign-in')}>Sign in</button>
          </div>
          {step === 'email' ? (
            <>
              <span className="section-kicker">{authMode === 'sign-in' ? 'Welcome back' : 'Start here'}</span>
              <h2>{authMode === 'sign-in' ? 'Keep your money close.' : 'Create your money space.'}</h2>
              <p className="auth-lede">Use your email and a six-digit PIN to continue.</p>
              <form className="form-stack auth-email-form" onSubmit={continueWithEmail}>
                <label className="field"><span>Email address</span><div className="input-icon"><Mail size={16} /><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder="you@example.com" autoComplete="email" autoFocus /></div></label>
                {error && <div className="form-alert" role="alert">{error}</div>}
                <button className="button button-primary auth-submit" type="submit">Continue <ArrowRight size={17} /></button>
              </form>
            </>
          ) : (
            <>
              <button className="auth-back-button auth-email-pill" type="button" onClick={goBackFromPin}><ArrowLeft size={15} /> <span>{authMode === 'sign-up' && step === 'confirm-pin' ? 'Back to PIN' : email}</span></button>
              <span className="section-kicker">{authMode === 'sign-up' && step === 'confirm-pin' ? 'Double-check' : authMode === 'sign-in' ? 'Your PIN' : 'Secure your account'}</span>
              <h2>{pinTitle}</h2>
              <p className="auth-lede">{pinDescription}</p>
              <form className="pin-form" onSubmit={submitPin} onKeyDown={(event) => { if (/^\d$/.test(event.key)) { event.preventDefault(); addDigit(event.key) } if (event.key === 'Backspace') { event.preventDefault(); removeDigit() } }}>
                <input className="sr-only" type="tel" inputMode="numeric" autoComplete="one-time-code" maxLength={PIN_LENGTH} value={activePin} aria-label="PIN keyboard input" onChange={(event) => setActivePin(event.target.value)} autoFocus />
                <div className="pin-dots" aria-label={`${activePin.length} of ${PIN_LENGTH} PIN digits entered`}>{Array.from({ length: PIN_LENGTH }, (_, index) => <span key={index} className={index < activePin.length ? 'pin-dot-filled' : ''}>{index < activePin.length ? '•' : ''}</span>)}</div>
                <div className="pin-keypad" aria-label="PIN keypad">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => <button key={digit} type="button" onClick={() => addDigit(digit)}>{digit}</button>)}
                  <span aria-hidden="true" />
                  <button type="button" onClick={() => addDigit('0')}>0</button>
                  <button type="button" aria-label="Delete last PIN digit" onClick={removeDigit}><Delete size={19} /></button>
                </div>
                {error && <div className="form-alert" role="alert">{error}</div>}
                <button className="button button-primary auth-submit" type="submit" disabled={busy || activePin.length !== PIN_LENGTH}>{busy ? 'Working...' : pinButtonLabel === 'Create account' ? <><Check size={16} /> Create account</> : pinButtonLabel === 'Sign in' ? <><LockKeyhole size={16} /> Sign in</> : <><ArrowRight size={16} /> Continue</>}</button>
              </form>
            </>
          )}
          <p className="auth-footnote">Your account details stay private and your PIN is never displayed.</p>
        </div>
      </section>
    </main>
  )
}
