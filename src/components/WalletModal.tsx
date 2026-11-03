import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, Plus, Trash2, WalletCards } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from './Modal'
import { useFinance } from '../context/FinanceContext'
import { blobToDataUrl, compressImage, validateImage } from '../lib/images'
import { parseAmountToCents } from '../lib/money'
import { walletFormSchema, type WalletFormValues } from '../lib/validation'
import { walletCardThemes, walletTypeLabels } from '../types'

interface WalletModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (message: string) => void
}

const walletColors = ['#5f8068', '#3f7897', '#a76b67', '#7a6aa9', '#b28647', '#5e7791']

export default function WalletModal({ open, onClose, onSuccess }: WalletModalProps) {
  const { addWallet } = useFinance()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoName, setLogoName] = useState<string | null>(null)
  const [logoBusy, setLogoBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      name: '',
      type: 'bank',
      openingBalance: '0',
      allowOverdraft: false,
      color: walletColors[0],
      cardTheme: 'emerald',
    },
  })

  useEffect(() => {
    if (!open) return
    setSubmitError(null)
    setLogoError(null)
    setLogoUrl(null)
    setLogoName(null)
    form.reset({
      name: '',
      type: 'bank',
      openingBalance: '0',
      allowOverdraft: false,
      color: walletColors[Math.floor(Math.random() * walletColors.length)],
      cardTheme: 'emerald',
    })
  }, [open])

  async function handleLogo(file: File | undefined): Promise<void> {
    if (!file) return
    setLogoError(null)
    const error = validateImage(file, 8 * 1024 * 1024)
    if (error) {
      setLogoError(error)
      return
    }
    setLogoBusy(true)
    try {
      const compressed = await compressImage(file, 700, 0.86)
      setLogoUrl(await blobToDataUrl(compressed))
      setLogoName(file.name)
    } catch (error) {
      setLogoError(error instanceof Error ? error.message : 'Could not process this logo.')
    } finally {
      setLogoBusy(false)
    }
  }

  async function handleSubmit(values: WalletFormValues): Promise<void> {
    const openingBalanceCents = parseAmountToCents(values.openingBalance)
    if (openingBalanceCents === null) {
      setSubmitError('Enter a valid opening balance.')
      return
    }
    try {
      addWallet({ ...values, openingBalanceCents, logoUrl, logoName })
      onSuccess(`${values.name} is ready to track.`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not create this wallet.')
    }
  }

  const selectedTheme = form.watch('cardTheme')

  return (
    <Modal open={open} title="Add a wallet" description="Give every account a place, a look, and a little personality." onClose={onClose} size="large">
      <form className="form-stack" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="wallet-logo-field">
          <div className="wallet-logo-preview" style={{ '--wallet-accent': form.watch('color') } as React.CSSProperties}>
            {logoUrl ? <img src={logoUrl} alt="Wallet logo preview" /> : <WalletCards size={28} />}
          </div>
          <div className="wallet-logo-copy"><span className="section-kicker">Custom wallet logo</span><strong>{logoName ?? 'Make it unmistakably yours.'}</strong><small>Upload an image or take one with your camera. JPG, PNG, or WebP.</small><div className="wallet-logo-actions"><button className="button button-secondary button-small" type="button" onClick={() => fileInput.current?.click()} disabled={logoBusy}><ImagePlus size={15} /> Choose image</button><button className="button button-quiet button-small" type="button" onClick={() => cameraInput.current?.click()} disabled={logoBusy}><Camera size={15} /> Use camera</button>{logoUrl && <button className="icon-button icon-button-small" type="button" aria-label="Remove wallet logo" onClick={() => { setLogoUrl(null); setLogoName(null) }}><Trash2 size={15} /></button>}</div></div>
          <input ref={fileInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void handleLogo(event.target.files?.[0]); event.currentTarget.value = '' }} />
          <input ref={cameraInput} className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => { void handleLogo(event.target.files?.[0]); event.currentTarget.value = '' }} />
        </div>
        {logoBusy && <div className="upload-status">Preparing your logo…</div>}
        {logoError && <div className="form-alert">{logoError}</div>}
        <label className="field">
          <span>Wallet name</span>
          <input placeholder="e.g. BPI Everyday" autoComplete="off" {...form.register('name')} />
          {form.formState.errors.name && <span className="field-error">{form.formState.errors.name.message}</span>}
        </label>
        <label className="field">
          <span>Account type</span>
          <select {...form.register('type')}>
            {Object.entries(walletTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {form.formState.errors.type && <span className="field-error">{form.formState.errors.type.message}</span>}
        </label>
        <label className="field">
          <span>Opening balance</span>
          <div className="input-prefix"><span>₱</span><input inputMode="decimal" {...form.register('openingBalance')} /></div>
          {form.formState.errors.openingBalance && <span className="field-error">{form.formState.errors.openingBalance.message}</span>}
          <small className="field-hint">You can start with zero and add movements later.</small>
        </label>
        <div className="field">
          <span>Card style</span>
          <div className="card-theme-options" role="radiogroup" aria-label="Wallet card style">
            {walletCardThemes.map((theme) => <button key={theme.value} className={`card-theme-option card-theme-${theme.value} ${selectedTheme === theme.value ? 'card-theme-option-active' : ''}`} type="button" role="radio" aria-checked={selectedTheme === theme.value} onClick={() => form.setValue('cardTheme', theme.value)}><span />{theme.label}</button>)}
          </div>
        </div>
        <div className="field">
          <span>Accent color</span>
          <div className="color-options" role="radiogroup" aria-label="Wallet accent color">
            {walletColors.map((color) => <button key={color} className={`color-option ${form.watch('color') === color ? 'color-option-active' : ''}`} style={{ backgroundColor: color }} type="button" role="radio" aria-checked={form.watch('color') === color} aria-label={`Use ${color}`} onClick={() => form.setValue('color', color)} />)}
          </div>
        </div>
        <label className="check-field">
          <input type="checkbox" {...form.register('allowOverdraft')} />
          <span><strong>Allow a negative balance</strong><small>Useful for credit cards or accounts with a buffer.</small></span>
        </label>
        {submitError && <div className="form-alert">{submitError}</div>}
        <div className="modal-actions">
          <button className="button button-quiet" type="button" onClick={onClose}>Cancel</button>
          <button className="button button-primary" type="submit"><Plus size={17} /> Add wallet</button>
        </div>
      </form>
    </Modal>
  )
}
