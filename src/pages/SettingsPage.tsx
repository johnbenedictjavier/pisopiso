import { useRef, useState } from 'react'
import { Camera, Check, Download, ImagePlus, Moon, RotateCcw, ShieldCheck, Sun, Trash2, UserRound } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import ProfileAvatar from '../components/ProfileAvatar'
import { useFinance } from '../context/FinanceContext'
import { downloadTransactionsCsv } from '../lib/csv'
import { blobToDataUrl, compressImage, validateImage } from '../lib/images'
import { useShell } from '../layout/AppShell'

export default function SettingsPage() {
  const { state, transactions, updateDisplayName, updateTheme, updateAvatar, resetDemo } = useFinance()
  const { notify } = useShell()
  const [name, setName] = useState(state.profile.displayName)
  const [avatarUrl, setAvatarUrl] = useState(state.profile.avatarUrl)
  const [avatarName, setAvatarName] = useState(state.profile.avatarName)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const previewProfile = { ...state.profile, avatarUrl, avatarName }

  function saveProfile(): void {
    if (!name.trim()) return
    updateDisplayName(name)
    updateAvatar(avatarUrl, avatarName)
    notify('Profile saved.')
  }

  async function handleAvatar(file: File | undefined): Promise<void> {
    if (!file) return
    setAvatarError(null)
    const validationError = validateImage(file, 8 * 1024 * 1024)
    if (validationError) {
      setAvatarError(validationError)
      return
    }
    setAvatarBusy(true)
    try {
      const compressed = await compressImage(file, 700, 0.86)
      setAvatarUrl(await blobToDataUrl(compressed))
      setAvatarName(file.name)
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Could not process this photo.')
    } finally {
      setAvatarBusy(false)
    }
  }

  function reset(): void {
    resetDemo()
    setName('Mika Santos')
    setAvatarUrl(null)
    setAvatarName(null)
    setResetOpen(false)
    notify('Demo data reset.')
  }

  return (
    <div className="page-stack settings-stack">
      <section className="page-intro-row"><div><h2 className="page-section-title">Settings</h2><span className="section-subtitle">Personalize your space</span></div></section>
      <section className="settings-grid">
        <div className="settings-main">
          <article className="panel settings-card"><div className="settings-card-heading"><span className="settings-icon"><UserRound size={18} /></span><div><span className="section-kicker">Profile</span><h2>Your details</h2></div></div><div className="profile-photo-field"><ProfileAvatar profile={previewProfile} size="large" /><div><strong>Profile picture</strong><small>{avatarName ?? 'Add a photo to make the space yours.'}</small><div className="profile-photo-actions"><button className="button button-secondary button-small" type="button" onClick={() => fileInput.current?.click()} disabled={avatarBusy}><ImagePlus size={14} /> Choose</button><button className="button button-quiet button-small" type="button" onClick={() => cameraInput.current?.click()} disabled={avatarBusy}><Camera size={14} /> Camera</button>{avatarUrl && <button className="icon-button icon-button-small" type="button" aria-label="Remove profile picture" onClick={() => { setAvatarUrl(null); setAvatarName(null) }}><Trash2 size={15} /></button>}</div></div><input ref={fileInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void handleAvatar(event.target.files?.[0]); event.currentTarget.value = '' }} /><input ref={cameraInput} className="sr-only" type="file" accept="image/*" capture="user" onChange={(event) => { void handleAvatar(event.target.files?.[0]); event.currentTarget.value = '' }} /></div>{avatarBusy && <div className="upload-status">Preparing photo…</div>}{avatarError && <div className="form-alert">{avatarError}</div>}<label className="field"><span>Display name</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label><div className="profile-email"><span>Email</span><strong>{state.profile.email}</strong></div><button className="button button-primary" type="button" onClick={saveProfile}><Check size={16} /> Save profile</button></article>
          <article className="panel settings-card"><div className="settings-card-heading"><span className="settings-icon"><Sun size={18} /></span><div><span className="section-kicker">Appearance</span><h2>Theme</h2></div></div><div className="theme-options"><button className={`theme-option ${state.profile.theme === 'light' ? 'theme-option-active' : ''}`} type="button" onClick={() => updateTheme('light')}><span className="theme-preview theme-preview-light"><Sun size={20} /></span><strong>Light</strong><small>Clear and bright</small></button><button className={`theme-option ${state.profile.theme === 'dark' ? 'theme-option-active' : ''}`} type="button" onClick={() => updateTheme('dark')}><span className="theme-preview theme-preview-dark"><Moon size={20} /></span><strong>Dark</strong><small>Soft on the eyes</small></button></div></article>
          <article className="panel settings-card"><div className="settings-card-heading"><span className="settings-icon"><Download size={18} /></span><div><span className="section-kicker">Data</span><h2>Export and reset</h2></div></div><div className="settings-action-row"><div><strong>Download transactions</strong><small>{transactions.length} active movements</small></div><button className="button button-secondary" type="button" onClick={() => { downloadTransactionsCsv(transactions, state.wallets); notify('CSV export ready.') }}><Download size={16} /> Export CSV</button></div><div className="settings-action-row settings-action-danger"><div><strong>Reset demo data</strong><small>Restore the original demo data</small></div><button className="button button-danger" type="button" onClick={() => setResetOpen(true)}><RotateCcw size={16} /> Reset</button></div></article>
        </div>
        <aside className="settings-aside"><div className="security-card"><span className="security-mark"><ShieldCheck size={21} /></span><span className="section-kicker">Private by design</span><h2>Your financial details stay yours.</h2><p>PisoPiso is designed to keep your money details personal.</p></div><div className="about-card"><span className="section-kicker">PisoPiso</span><strong>Every peso has a place.</strong><p>Built for the small decisions that add up.</p><span>Version 0.1.0</span></div></aside>
      </section>
      <ConfirmModal open={resetOpen} title="Reset demo data?" message="This will restore the original wallets and movements." confirmLabel="Reset data" danger onClose={() => setResetOpen(false)} onConfirm={reset} />
    </div>
  )
}
