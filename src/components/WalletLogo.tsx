import { imageTransform } from '../lib/images'

interface WalletLogoProps {
  name?: string
  color?: string
  logoUrl?: string | null
  logoScale?: number
  logoPositionX?: number
  logoPositionY?: number
  size?: 'small' | 'medium' | 'large'
}

export default function WalletLogo({ name, color, logoUrl, logoScale = 1, logoPositionX = 0, logoPositionY = 0, size = 'medium' }: WalletLogoProps) {
  const label = name ?? 'Wallet'
  const initials = label
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <span
      className={`wallet-logo wallet-logo-${size}`}
      style={{ backgroundColor: logoUrl ? '#ffffff' : color ?? '#5f8068' }}
      role="img"
      aria-label={`${label} logo`}
      title={label}
    >
      {logoUrl ? <img src={logoUrl} alt="" width={36} height={36} style={{ transform: imageTransform(logoScale, logoPositionX, logoPositionY) }} /> : initials || 'P'}
    </span>
  )
}
