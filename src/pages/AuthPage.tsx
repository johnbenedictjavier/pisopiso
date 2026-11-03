import { useState } from 'react'
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'

export default function AuthPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in')

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password to continue.')
      return
    }

    const client = await getSupabase()
    if (!client) {
      setError('Account auth is not configured in this preview. Use the local demo below.')
      return
    }

    const result = authMode === 'sign-in'
      ? await client.auth.signInWithPassword({ email: email.trim(), password })
      : await client.auth.signUp({ email: email.trim(), password })
    if (result.error) {
      setError(result.error.message)
      return
    }
    navigate('/overview')
  }

  return (
    <main className="auth-page">
      <section className="auth-art"><div className="auth-art-top"><BrandMark /></div><div className="auth-art-copy"><span className="eyebrow"><Sparkles size={15} /> A calmer way to track money</span><h1>Every peso has a place.</h1><p>See the whole story without giving up the details that make it yours.</p></div><div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" /><div className="auth-art-note"><span>₱</span><div><strong>Small entries.</strong><small>Useful patterns.</small></div></div></section>
      <section className="auth-panel"><div className="auth-form-wrap"><div className="mobile-auth-brand"><BrandMark /></div><span className="section-kicker">{authMode === 'sign-in' ? 'Welcome back' : 'Make it yours'}</span><h2>{authMode === 'sign-in' ? 'Keep your money close.' : 'Start your money space.'}</h2><p className="auth-lede">{authMode === 'sign-in' ? 'Sign in to return to your personal money space.' : 'Create a private space for every peso you want to understand.'}</p><form className="form-stack" onSubmit={submit}><label className="field"><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></label><label className="field"><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" autoComplete={authMode === 'sign-in' ? 'current-password' : 'new-password'} /></label>{error && <div className="form-alert">{error}</div>}<button className="button button-primary auth-submit" type="submit">{authMode === 'sign-in' ? 'Continue' : 'Create account'} <ArrowRight size={17} /></button></form>{isSupabaseConfigured && <button className="auth-mode-switch" type="button" onClick={() => { setAuthMode(authMode === 'sign-in' ? 'sign-up' : 'sign-in'); setError('') }}>{authMode === 'sign-in' ? 'Need an account? Create one' : 'Already have an account? Sign in'}</button>}<div className="auth-divider"><span>or</span></div><button className="button button-secondary auth-demo-button" type="button" onClick={() => navigate('/overview')}><LockKeyhole size={16} /> Explore local demo</button><p className="auth-footnote">No banking connection required. Supabase Auth is ready to connect when configured.</p></div></section>
    </main>
  )
}
