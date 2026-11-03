interface BrandMarkProps {
  compact?: boolean
}

export default function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className={`brand-lockup ${compact ? 'brand-lockup-compact' : ''}`}>
      <img className="brand-mark" src="/pisopisologo.png" alt={compact ? 'PisoPiso' : ''} />
    </div>
  )
}
