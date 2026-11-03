import { useState } from 'react'
import { Check, Download, Moon, RotateCcw, ShieldCheck, Sun, UserRound } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { downloadTransactionsCsv } from '../lib/csv'
import { useShell } from '../layout/AppShell'

export default function SettingsPage() {
  const { state, transactions, updateDisplayName, updateTheme, resetDemo } = useFinance()
  const { notify } = useShell()
  const [name, setName] = useState(state.profile.displayName)

  function saveProfile(): void {
    if (!name.trim()) return
    updateDisplayName(name)
    notify('Profile details updated.')
  }

  function reset(): void {
    if (window.confirm('Reset the local demo data to its starting story? This cannot be undone.')) {
      resetDemo()
      setName('Mika Santos')
      notify('Demo data reset.')
    }
  }

  return (
    <div className="page-stack settings-stack">
      <section className="page-intro-row"><div><p className="lead-copy">A few quiet controls for your personal money space.</p></div><span className="settings-mode"><i /> Local mode is active</span></section>
      <section className="settings-grid">
        <div className="settings-main">
          <article className="panel settings-card"><div className="settings-card-heading"><span className="settings-icon"><UserRound size={18} /></span><div><span className="section-kicker">Profile</span><h2>How should we call you?</h2><p>This stays on this device while you are in local mode.</p></div></div><label className="field"><span>Display name</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label><div className="profile-email"><span>Email</span><strong>{state.profile.email}</strong><small>Supabase auth can replace this demo profile when connected.</small></div><button className="button button-primary" type="button" onClick={saveProfile}><Check size={16} /> Save profile</button></article>
          <article className="panel settings-card"><div className="settings-card-heading"><span className="settings-icon"><Sun size={18} /></span><div><span className="section-kicker">Appearance</span><h2>Choose your atmosphere</h2><p>Light keeps things airy. Dark is easier on late-night eyes.</p></div></div><div className="theme-options"><button className={`theme-option ${state.profile.theme === 'light' ? 'theme-option-active' : ''}`} type="button" onClick={() => updateTheme('light')}><span className="theme-preview theme-preview-light"><Sun size={20} /></span><strong>Light</strong><small>Clear and bright</small></button><button className={`theme-option ${state.profile.theme === 'dark' ? 'theme-option-active' : ''}`} type="button" onClick={() => updateTheme('dark')}><span className="theme-preview theme-preview-dark"><Moon size={20} /></span><strong>Dark</strong><small>Soft on the eyes</small></button></div></article>
          <article className="panel settings-card"><div className="settings-card-heading"><span className="settings-icon"><Download size={18} /></span><div><span className="section-kicker">Your data</span><h2>Take your story with you</h2><p>Export a copy any time. Your data belongs to you.</p></div></div><div className="settings-action-row"><div><strong>Download transactions</strong><small>CSV export of {transactions.length} active movements</small></div><button className="button button-secondary" type="button" onClick={() => { downloadTransactionsCsv(transactions, state.wallets); notify('Your transaction CSV is ready.') }}><Download size={16} /> Export CSV</button></div><div className="settings-action-row settings-action-danger"><div><strong>Reset local demo</strong><small>Restore the sample wallets and movements</small></div><button className="button button-danger" type="button" onClick={reset}><RotateCcw size={16} /> Reset data</button></div></article>
        </div>
        <aside className="settings-aside"><div className="security-card"><span className="security-mark"><ShieldCheck size={21} /></span><span className="section-kicker">Private by design</span><h2>Your financial details stay yours.</h2><p>PisoPiso never asks for bank passwords, PINs, or OTPs. When Supabase is connected, row-level security keeps each profile's records separated.</p><span className="security-status"><i /> No external connection</span></div><div className="about-card"><span className="section-kicker">PisoPiso</span><strong>Every peso has a place.</strong><p>Built for the small decisions that add up.</p><span>Version 0.1.0 · Local preview</span></div></aside>
      </section>
    </div>
  )
}
