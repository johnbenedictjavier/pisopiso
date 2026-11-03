import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Delete, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { getSupabase } from '../lib/supabase'

const PIN_LENGTH = 6
type AuthMode = 'sign-in' | 'sign-up'
type AuthStep = 'email' | 'pin'

export default function AuthPage() {
  const navigate = useNavigate()
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in')
  const [step, setStep] = useState<AuthStep>('email')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function changeMode(nextMode: AuthMode): void {
    setAuthMode(nextMode)
    setStep('email')
    setPin('')
    setError('')
  }

  function continueWithEmail(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    setError('')
    setStep('pin')
  }

  function addDigit(digit: string): void {
    if (pin.length >= PIN_LENGTH) return
    setError('')
    setPin((current) => `${current}${digit}`)
  }

  function removeDigit(): void {
    setError('')
    setPin((current) => current.slice(0, -1))
  }

  async function submitPin(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (pin.length !== PIN_LENGTH) {
      setError(`Enter all ${PIN_LENGTH} digits to continue.`)
      return
    }
    setBusy(true)
    setError('')
    try {
      const client = await getSupabase()
      if (!client) {
        setError('Account access is not available right now. Try the demo space instead.')
        return
      }
      const result = authMode === 'sign-in'
        ? await client.auth.signInWithPassword({ email: email.trim(), password: pin })
        : await client.auth.signUp({ email: email.trim(), password: pin })
      if (result.error) {
        setError(authMode === 'sign-in' ? 'That email and PIN combination did not work.' : result.error.message)
        return
      }
      if (authMode === 'sign-up' && !result.data.session) {
        setError('Check your email to finish creating your account.')
        setPin('')
        return
      }
      navigate('/overview')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page auth-keypad-page">
      <section className="auth-art">
        <div className="auth-art-top"><BrandMark /></div>
        <div className="auth-art-copy"><span className="eyebrow"><Sparkles size={15} /> A calmer way to track money</span><h1>Every peso has a place.</h1><p>Simple enough for today. Clear enough for tomorrow.</p></div>
        <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
        <div className="auth-art-note"><span>₱</span><div><strong>Your money space.</strong><small>Built around your rhythm.</small></div></div>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="mobile-auth-brand"><BrandMark /></div>
          <div className="auth-mode-tabs" role="tablist" aria-label="Account access">
            <button className={authMode === 'sign-in' ? 'auth-mode-active' : ''} type="button" role="tab" aria-selected={authMode === 'sign-in'} onClick={() => changeMode('sign-in')}>Sign in</button>
            <button className={authMode === 'sign-up' ? 'auth-mode-active' : ''} type="button" role="tab" aria-selected={authMode === 'sign-up'} onClick={() => changeMode('sign-up')}>Create account</button>
          </div>
          {step === 'email' ? (
            <>
              <span className="section-kicker">{authMode === 'sign-in' ? 'Welcome back' : 'Start here'}</span>
              <h2>{authMode === 'sign-in' ? 'Keep your money close.' : 'Create your money space.'}</h2>
              <p className="auth-lede">Use your email and a six-digit PIN to continue.</p>
              <form className="form-stack auth-email-form" onSubmit={continueWithEmail}>
                <label className="field"><span>Email address</span><div className="input-icon"><Mail size={16} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" autoFocus /></div></label>
                {error && <div className="form-alert">{error}</div>}
                <button className="button button-primary auth-submit" type="submit">Continue <ArrowRight size={17} /></button>
              </form>
            </>
          ) : (
            <>
              <button className="auth-back-button" type="button" onClick={() => { setStep('email'); setPin(''); setError('') }}><ArrowLeft size={15} /> {email}</button>
              <span className="section-kicker">{authMode === 'sign-in' ? 'Your PIN' : 'Secure your account'}</span>
              <h2>{authMode === 'sign-in' ? 'Enter your PIN.' : 'Choose a six-digit PIN.'}</h2>
              <p className="auth-lede">{authMode === 'sign-in' ? 'Use the PIN linked to your account.' : 'You will use this PIN whenever you return.'}</p>
              <form className="pin-form" onSubmit={submitPin}>
                <div className="pin-dots" aria-label={`${pin.length} of ${PIN_LENGTH} PIN digits entered`}>{Array.from({ length: PIN_LENGTH }, (_, index) => <span key={index} className={index < pin.length ? 'pin-dot-filled' : ''}>{index < pin.length ? '•' : ''}</span>)}</div>
                <div className="pin-keypad" aria-label="PIN keypad">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => <button key={digit} type="button" onClick={() => addDigit(digit)}>{digit}</button>)}
                  <span aria-hidden="true" />
                  <button type="button" onClick={() => addDigit('0')}>0</button>
                  <button type="button" aria-label="Delete last PIN digit" onClick={removeDigit}><Delete size={19} /></button>
                </div>
                {error && <div className="form-alert">{error}</div>}
                <button className="button button-primary auth-submit" type="submit" disabled={busy || pin.length !== PIN_LENGTH}>{busy ? 'Working…' : authMode === 'sign-in' ? <><LockKeyhole size={16} /> Sign in</> : <><Check size={16} /> Create account</>}</button>
              </form>
            </>
          )}
          <div className="auth-divider"><span>or</span></div>
          <button className="button button-secondary auth-demo-button" type="button" onClick={() => navigate('/overview')}><LockKeyhole size={16} /> Use demo space</button>
          <p className="auth-footnote">Your account details stay private and your PIN is never displayed.</p>
        </div>
      </section>
    </main>
  )
}
