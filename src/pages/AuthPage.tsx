import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Delete, LockKeyhole, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { useFinance } from '../context/FinanceContext'
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

export default function AuthPage() {
  const navigate = useNavigate()
  const { updateProfileIdentity } = useFinance()
  const initialEmail = getRememberedEmail()
  const [authMode, setAuthMode] = useState<AuthMode>(initialEmail ? 'sign-in' : 'sign-up')
  const [step, setStep] = useState<AuthStep>(initialEmail ? 'pin' : 'email')
  const [email, setEmail] = useState(initialEmail)
  const [pin, setPin] = useState('')
  const [confirmationPin, setConfirmationPin] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  function changeMode(nextMode: AuthMode): void {
    setAuthMode(nextMode)
    setStep('email')
    setPin('')
    setConfirmationPin('')
    setError('')
    setNotice('')
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
    setNotice('')
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
    setNotice('')
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
    setNotice('')
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
    setNotice('')
    try {
      const client = await getSupabase()
      if (!client) {
        setError('Account access is not configured yet. Add your Supabase credentials to continue.')
        return
      }
      const normalizedEmail = email.trim().toLowerCase()
      rememberEmail(normalizedEmail)
      const result = authMode === 'sign-in'
        ? await client.auth.signInWithPassword({ email: normalizedEmail, password: pin })
        : await client.auth.signUp({
            email: normalizedEmail,
            password: pin,
            options: { emailRedirectTo: `${window.location.origin}/login` },
          })
      if (result.error) {
        const duplicateAccount = authMode === 'sign-up' && /already|registered|exists/i.test(result.error.message)
        setError(duplicateAccount ? 'An account with this email already exists. Try signing in.' : authMode === 'sign-in' ? 'That email and PIN combination did not work.' : 'We could not create that account. Check your details and try again.')
        return
      }
      if (result.data.user) updateProfileIdentity(result.data.user.id, result.data.user.email ?? normalizedEmail)
      if (authMode === 'sign-up' && !result.data.session) {
        setNotice('Check your email to finish creating your account, then sign in with your PIN.')
        setStep('email')
        setPin('')
        setConfirmationPin('')
        return
      }
      navigate('/overview')
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
    <main className="auth-page auth-keypad-page">
      <section className="auth-art">
        <div className="auth-art-top"><BrandMark /></div>
        <div className="auth-art-copy"><span className="eyebrow">Your calmer money space</span><h1>Every peso has a place.</h1><p>Simple enough for today. Clear enough for tomorrow.</p></div>
        <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
        <div className="auth-art-note"><span>₱</span><div><strong>Your money space.</strong><small>Built around your rhythm.</small></div></div>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
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
                <label className="field"><span>Email address</span><div className="input-icon"><Mail size={16} /><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); setNotice('') }} placeholder="you@example.com" autoComplete="email" autoFocus /></div></label>
                {error && <div className="form-alert" role="alert">{error}</div>}
                {notice && <div className="form-success" role="status">{notice}</div>}
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
