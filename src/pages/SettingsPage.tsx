import { useRef, useState } from 'react'
import { Camera, Check, Download, ImagePlus, Moon, RotateCcw, ShieldCheck, Sun, Trash2, UserRound } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import ProfileAvatar from '../components/ProfileAvatar'
import { useFinance } from '../context/FinanceContext'
import { downloadTransactionsCsv } from '../lib/csv'
import { blobToDataUrl, compressImage, validateImage } from '../lib/images'
import { useShell } from '../layout/AppShell'

function positionLabel(value: number): string {
  return `${value > 0 ? '+' : ''}${value}%`
}

export default function SettingsPage() {
  const { state, transactions, updateDisplayName, updateTheme, updateAvatar, startFresh } = useFinance()
  const { notify } = useShell()
  const [name, setName] = useState(state.profile.displayName)
  const [avatarUrl, setAvatarUrl] = useState(state.profile.avatarUrl)
  const [avatarName, setAvatarName] = useState(state.profile.avatarName)
  const [avatarScale, setAvatarScale] = useState(state.profile.avatarScale)
  const [avatarPositionX, setAvatarPositionX] = useState(state.profile.avatarPositionX)
  const [avatarPositionY, setAvatarPositionY] = useState(state.profile.avatarPositionY)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const previewProfile = { ...state.profile, avatarUrl, avatarName, avatarScale, avatarPositionX, avatarPositionY }

  function saveProfile(): void {
    if (!name.trim()) return
    updateDisplayName(name)
    updateAvatar(avatarUrl, avatarName, avatarScale, avatarPositionX, avatarPositionY)
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
      setAvatarScale(1)
      setAvatarPositionX(0)
      setAvatarPositionY(0)
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Could not process this photo.')
    } finally {
      setAvatarBusy(false)
    }
  }

  function resetAvatarPosition(): void {
    setAvatarPositionX(0)
    setAvatarPositionY(0)
  }

  function reset(): void {
    startFresh()
    setResetOpen(false)
    notify('You are starting fresh.')
  }

  return (
    <div className="page-stack settings-stack">
      <section className="page-intro-row"><div><h2 className="page-section-title">Settings</h2><span className="section-subtitle">Personalize your space</span></div></section>
      <section className="settings-grid">
        <div className="settings-main">
          <article className="panel settings-card">
            <div className="settings-card-heading"><span className="settings-icon"><UserRound size={18} /></span><div><span className="section-kicker">Profile</span><h2>Your details</h2></div></div>
            <div className="profile-photo-field">
              <ProfileAvatar profile={previewProfile} size="large" />
              <div>
                <strong>Profile picture</strong>
                <small>{avatarUrl ? 'Custom photo added.' : 'Add a photo to make the space yours.'}</small>
                <div className="profile-photo-actions">
                  <button className="button button-secondary button-small" type="button" onClick={() => fileInput.current?.click()} disabled={avatarBusy}><ImagePlus size={14} /> Choose</button>
                  <button className="button button-quiet button-small" type="button" onClick={() => cameraInput.current?.click()} disabled={avatarBusy}><Camera size={14} /> Camera</button>
                  {avatarUrl && <button className="icon-button icon-button-small" type="button" aria-label="Remove profile picture" onClick={() => { setAvatarUrl(null); setAvatarName(null); setAvatarScale(1); resetAvatarPosition() }}><Trash2 size={15} /></button>}
                </div>
              </div>
              <input ref={fileInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void handleAvatar(event.target.files?.[0]); event.currentTarget.value = '' }} />
              <input ref={cameraInput} className="sr-only" type="file" accept="image/*" capture="user" onChange={(event) => { void handleAvatar(event.target.files?.[0]); event.currentTarget.value = '' }} />
            </div>
            {avatarBusy && <div className="upload-status">Preparing photo...</div>}
            {avatarError && <div className="form-alert">{avatarError}</div>}
            {avatarUrl && <div className="image-adjustments">
              <label className="field avatar-size-field"><span><span>Photo size</span><output>{Math.round(avatarScale * 100)}%</output></span><input type="range" min="0.5" max="1.5" step="0.05" value={avatarScale} aria-label="Profile picture size" onChange={(event) => setAvatarScale(Number(event.target.value))} /><small className="field-hint">Adjust the crop size.</small></label>
              <label className="field image-position-field"><span><span>Horizontal position</span><output>{positionLabel(avatarPositionX)}</output></span><input type="range" min="-50" max="50" step="1" value={avatarPositionX} aria-label="Profile picture horizontal position" onChange={(event) => setAvatarPositionX(Number(event.target.value))} /></label>
              <label className="field image-position-field"><span><span>Vertical position</span><output>{positionLabel(avatarPositionY)}</output></span><input type="range" min="-50" max="50" step="1" value={avatarPositionY} aria-label="Profile picture vertical position" onChange={(event) => setAvatarPositionY(Number(event.target.value))} /></label>
              <button className="button button-quiet button-small image-position-reset" type="button" onClick={resetAvatarPosition}>Center photo</button>
            </div>}
            <label className="field"><span>Display name</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <button className="button button-primary" type="button" onClick={saveProfile}><Check size={16} /> Save profile</button>
          </article>
          <article className="panel settings-card"><div className="settings-card-heading"><span className="settings-icon"><Sun size={18} /></span><div><span className="section-kicker">Appearance</span><h2>Theme</h2></div></div><div className="theme-options"><button className={`theme-option ${state.profile.theme === 'light' ? 'theme-option-active' : ''}`} type="button" onClick={() => updateTheme('light')}><span className="theme-preview theme-preview-light"><Sun size={20} /></span><strong>Light</strong><small>Clear and bright</small></button><button className={`theme-option ${state.profile.theme === 'dark' ? 'theme-option-active' : ''}`} type="button" onClick={() => updateTheme('dark')}><span className="theme-preview theme-preview-dark"><Moon size={20} /></span><strong>Dark</strong><small>Soft on the eyes</small></button></div></article>
          <article className="panel settings-card"><div className="settings-card-heading"><span className="settings-icon"><Download size={18} /></span><div><span className="section-kicker">Data</span><h2>Export and reset</h2></div></div><div className="settings-action-row"><div><strong>Download transactions</strong><small>{transactions.length} active movements</small></div><button className="button button-secondary" type="button" onClick={() => { downloadTransactionsCsv(transactions, state.wallets); notify('CSV export ready.') }}><Download size={16} /> Export CSV</button></div><div className="settings-action-row settings-action-danger"><div><strong>Start fresh</strong><small>Remove local wallets and movements</small></div><button className="button button-danger" type="button" onClick={() => setResetOpen(true)}><RotateCcw size={16} /> Start fresh</button></div></article>
        </div>
        <aside className="settings-aside"><div className="security-card"><span className="security-mark"><ShieldCheck size={21} /></span><span className="section-kicker">Private by design</span><h2>Your financial details stay yours.</h2><p>PisoPiso is designed to keep your money details personal.</p></div><div className="about-card"><span className="section-kicker">PisoPiso</span><strong>Every peso has a place.</strong><p>Built for the small decisions that add up.</p><span>Version 0.1.0</span></div></aside>
      </section>
      <ConfirmModal open={resetOpen} title="Start fresh?" message="This will remove your local wallets and movements. Synced data will not be changed." confirmLabel="Start fresh" danger onClose={() => setResetOpen(false)} onConfirm={reset} />
    </div>
  )
}
