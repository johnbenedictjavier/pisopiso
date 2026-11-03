interface BrandMarkProps {
  compact?: boolean
}

export default function BrandMark({ compact = false }: BrandMarkProps) {
  return <img className={`brand-mark ${compact ? 'brand-mark-compact' : ''}`} src="/pisopisologo.png" alt="PisoPiso" />
}
