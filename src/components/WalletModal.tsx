import { useEffect, useRef, useState } from 'react'
import { Camera, Check, ChevronDown, Crop, ImagePlus, Palette, Paintbrush, Plus, Trash2, WalletCards } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from './Modal'
import ImageCropper from './ImageCropper'
import { useFinance } from '../context/FinanceContext'
import { blobToDataUrl, compressImage, imageTransform, validateImage } from '../lib/images'
import { parseAmountToCents } from '../lib/money'
import { walletFormSchema, type WalletFormValues } from '../lib/validation'
import { walletCardThemes, walletTypeLabels, type Wallet, type WalletType } from '../types'

interface WalletModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  wallet?: Wallet | null
}

const walletColors = [
  '#5f8068', '#3f7897', '#a76b67', '#7a6aa9', '#b28647', '#5e7791',
  '#2e8b67', '#2674a3', '#b55655', '#7d5bb7', '#315b89', '#ad6b2d',
  '#3e8e91', '#8d4e7d', '#4d6f3f', '#c05f42', '#5467ae', '#8b5f38',
  '#2f6d5e', '#a64e68', '#6a63a8', '#8f7a32', '#296681', '#a5558e',
  '#4b7a68', '#be6e50', '#6f789f', '#b15d85', '#3f8b82', '#c18b4d',
]
const visibleWalletColors = walletColors.slice(0, 6)
const primaryWalletTypes: Array<{ value: WalletType; label: string }> = [
  { value: 'digital_bank', label: 'Digital' },
  { value: 'e_wallet', label: 'E-wallet' },
  { value: 'cash', label: 'Cash' },
  { value: 'savings', label: 'Personal' },
  { value: 'credit', label: 'Credit' },
]
const additionalWalletTypes = (Object.keys(walletTypeLabels) as WalletType[]).filter(
  (value) => !primaryWalletTypes.some((item) => item.value === value),
)
const visibleCardThemes = walletCardThemes.slice(0, 6)

export default function WalletModal({ open, onClose, onSuccess, wallet = null }: WalletModalProps) {
  const { addWallet, updateWallet } = useFinance()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoName, setLogoName] = useState<string | null>(null)
  const [logoScale, setLogoScale] = useState(1)
  const [logoPositionX, setLogoPositionX] = useState(0)
  const [logoPositionY, setLogoPositionY] = useState(0)
  const [logoBusy, setLogoBusy] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [showMoreColors, setShowMoreColors] = useState(false)
  const [showMoreAccountTypes, setShowMoreAccountTypes] = useState(false)
  const [showMoreCardThemes, setShowMoreCardThemes] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      name: '',
      type: 'digital_bank',
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
    setCropOpen(false)
    setShowMoreColors(false)
    setShowMoreCardThemes(false)
    setLogoUrl(null)
    setLogoName(null)
    setLogoPositionX(0)
    setLogoPositionY(0)
    const openingBalance = wallet ? (wallet.openingBalanceCents / 100).toFixed(2).replace(/\.00$/, '') : '0'
    form.reset({
      name: wallet?.name ?? '',
      type: wallet?.type ?? 'digital_bank',
      openingBalance,
      allowOverdraft: wallet?.type === 'credit' ? true : wallet?.allowOverdraft ?? false,
      color: wallet?.color ?? walletColors[Math.floor(Math.random() * walletColors.length)],
      cardTheme: wallet?.cardTheme ?? 'emerald',
    })
    setLogoUrl(wallet?.logoUrl ?? null)
    setLogoName(wallet?.logoName ?? null)
    setLogoScale(wallet?.logoScale ?? 1)
    setLogoPositionX(wallet?.logoPositionX ?? 0)
    setLogoPositionY(wallet?.logoPositionY ?? 0)
    setShowMoreAccountTypes(Boolean(wallet?.type && !primaryWalletTypes.some((item) => item.value === wallet.type)))
  }, [open, wallet])

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
      setLogoScale(1)
      setLogoPositionX(0)
      setLogoPositionY(0)
      setCropOpen(true)
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
      const input = {
        ...values,
        allowOverdraft: values.type === 'credit' || values.allowOverdraft,
        openingBalanceCents,
        logoUrl,
        logoName,
        logoScale,
        logoPositionX,
        logoPositionY,
      }
      if (wallet) {
        updateWallet(wallet.id, input)
        onSuccess(`${values.name} was updated.`)
      } else {
        addWallet(input)
        onSuccess(`${values.name} was added.`)
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not create this wallet.')
    }
  }

  const selectedTheme = useWatch({ control: form.control, name: 'cardTheme' })
  const selectedColor = useWatch({ control: form.control, name: 'color' })
  const selectedType = useWatch({ control: form.control, name: 'type' })
  const colorOptions = showMoreColors || visibleWalletColors.includes(selectedColor)
    ? showMoreColors ? walletColors : visibleWalletColors
    : [selectedColor, ...visibleWalletColors]
  const selectedThemeOption = walletCardThemes.find((theme) => theme.value === selectedTheme)
  const selectedThemeIsExtra = !visibleCardThemes.some((theme) => theme.value === selectedTheme)
  const cardThemeOptions = showMoreCardThemes
    ? walletCardThemes
    : selectedThemeIsExtra && selectedThemeOption
      ? [selectedThemeOption, ...visibleCardThemes]
      : visibleCardThemes
  const selectedAdditionalWalletType = additionalWalletTypes.includes(selectedType) ? selectedType : ''

  function selectWalletType(type: WalletType): void {
    form.setValue('type', type, { shouldDirty: true, shouldValidate: true })
    if (type === 'credit') form.setValue('allowOverdraft', true, { shouldDirty: true })
    setShowMoreAccountTypes(!primaryWalletTypes.some((item) => item.value === type))
  }

  return (
    <>
      <Modal open={open} title={wallet ? 'Edit wallet' : 'Add a wallet'} description={wallet ? 'Update the details on this wallet.' : 'Set up a wallet in a few quick steps.'} onClose={() => { setCropOpen(false); onClose() }} size="large">
        <form className="form-stack" onSubmit={form.handleSubmit(handleSubmit)}>
         <div className="wallet-logo-field">
            <button className="wallet-logo-preview" type="button" style={{ '--wallet-accent': selectedColor } as React.CSSProperties} onClick={() => logoUrl && setCropOpen(true)} aria-label={logoUrl ? 'Crop wallet logo' : 'Wallet logo preview'}>
              {logoUrl ? <img src={logoUrl} alt="Wallet logo preview" style={{ transform: imageTransform(logoScale, logoPositionX, logoPositionY) }} /> : <WalletCards size={28} />}
            </button>
           <div className="wallet-logo-copy"><span className="section-kicker">Custom wallet logo</span><strong>{logoUrl ? 'Custom logo added.' : 'Make it unmistakably yours.'}</strong><small>Upload an image or take one with your camera. JPG, PNG, or WebP.</small><div className="wallet-logo-actions"><button className="button button-secondary button-small" type="button" onClick={() => fileInput.current?.click()} disabled={logoBusy}><ImagePlus size={15} /> Choose image</button><button className="icon-button icon-button-small" type="button" onClick={() => cameraInput.current?.click()} disabled={logoBusy} aria-label="Use camera" title="Use camera"><Camera size={15} /></button>{logoUrl && <><button className="icon-button icon-button-small" type="button" aria-label="Crop wallet logo" title="Crop wallet logo" onClick={() => setCropOpen(true)}><Crop size={15} /></button><button className="icon-button icon-button-small" type="button" aria-label="Remove wallet logo" title="Remove wallet logo" onClick={() => { setLogoUrl(null); setLogoName(null); setLogoScale(1); setLogoPositionX(0); setLogoPositionY(0) }}><Trash2 size={15} /></button></>}</div></div>
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
         <div className="field">
           <span>Account type</span>
           <div className="account-type-options" role="radiogroup" aria-label="Account type">
             {primaryWalletTypes.map((item) => (
               <button
                 className={`account-type-option ${selectedType === item.value ? 'account-type-option-active' : ''}`}
                 key={item.value}
                 type="button"
                 role="radio"
                 aria-checked={selectedType === item.value}
                 onClick={() => selectWalletType(item.value)}
               >
                 {item.label}
               </button>
             ))}
              <button
                className={`account-type-option account-type-option-more ${showMoreAccountTypes || selectedAdditionalWalletType ? 'account-type-option-active' : ''}`}
                type="button"
                aria-expanded={showMoreAccountTypes || Boolean(selectedAdditionalWalletType)}
                onClick={() => setShowMoreAccountTypes((current) => !current)}
              >
                More <ChevronDown size={13} />
              </button>
            </div>
            {(showMoreAccountTypes || selectedAdditionalWalletType) && (
              <select
                className="capsule-more-select"
                aria-label="More account types"
                value={selectedAdditionalWalletType}
                onChange={(event) => {
                  if (event.target.value) selectWalletType(event.target.value as WalletType)
                }}
              >
                <option value="">Choose another account type</option>
                {additionalWalletTypes.map((value) => <option key={value} value={value}>{walletTypeLabels[value]}</option>)}
              </select>
            )}
           {form.formState.errors.type && <span className="field-error">{form.formState.errors.type.message}</span>}
         </div>
        <label className="field">
          <span>Opening balance</span>
          <div className="input-prefix"><span>₱</span><input inputMode="decimal" {...form.register('openingBalance')} /></div>
          {form.formState.errors.openingBalance && <span className="field-error">{form.formState.errors.openingBalance.message}</span>}
          <small className="field-hint">You can start with zero and add movements later.</small>
        </label>
        <div className="field">
           <span><span className="field-label-with-icon"><Palette size={14} /> Card style</span></span>
           <div className="card-theme-options" role="radiogroup" aria-label="Wallet card style">
             {cardThemeOptions.map((theme) => <button key={theme.value} className={`card-theme-option card-theme-${theme.value} ${selectedTheme === theme.value ? 'card-theme-option-active' : ''}`} style={{ '--card-theme-color': theme.color } as React.CSSProperties} type="button" role="radio" aria-checked={selectedTheme === theme.value} onClick={() => form.setValue('cardTheme', theme.value, { shouldDirty: true, shouldValidate: true })}><span />{theme.label}</button>)}
             <button className="card-theme-more" type="button" aria-expanded={showMoreCardThemes} onClick={() => setShowMoreCardThemes((current) => !current)}>{showMoreCardThemes ? 'Fewer' : 'More'} <ChevronDown size={13} /></button>
           </div>
        </div>
        <div className="field">
          <span><span className="field-label-with-icon"><Paintbrush size={14} /> Accent color</span></span>
          <div className="color-options" role="radiogroup" aria-label="Wallet accent color">
             {colorOptions.map((color) => <button key={color} className={`color-option ${selectedColor === color ? 'color-option-active' : ''}`} style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 45%, #ffffff))` }} type="button" role="radio" aria-checked={selectedColor === color} aria-label={`Use ${color}`} title={`Use ${color}`} onClick={() => form.setValue('color', color)} />)}
             <button className="color-option-more" type="button" aria-expanded={showMoreColors} onClick={() => setShowMoreColors((current) => !current)}>{showMoreColors ? 'Fewer' : 'More'} <ChevronDown size={13} /></button>
          </div>
        </div>
        <label className="check-field">
           <input type="checkbox" disabled={selectedType === 'credit'} {...form.register('allowOverdraft')} />
           <span><strong>{selectedType === 'credit' ? 'Credit balance enabled' : 'Allow a negative balance'}</strong><small>{selectedType === 'credit' ? 'Credit / utang accounts can record spending below zero.' : 'Useful for credit cards or accounts with a buffer.'}</small></span>
        </label>
        {submitError && <div className="form-alert">{submitError}</div>}
        <div className="modal-actions">
          <button className="button button-quiet" type="button" onClick={onClose}>Cancel</button>
          <button className="button button-primary" type="submit">{wallet ? <><Check size={17} /> Save changes</> : <><Plus size={17} /> Add wallet</>}</button>
        </div>
        </form>
      </Modal>
      <ImageCropper open={cropOpen} imageUrl={logoUrl} title="Crop wallet logo" description="Position the logo inside a clean square crop." onClose={() => setCropOpen(false)} onConfirm={(croppedUrl) => { setLogoUrl(croppedUrl); setLogoScale(1); setLogoPositionX(0); setLogoPositionY(0); setCropOpen(false) }} />
    </>
  )
}
