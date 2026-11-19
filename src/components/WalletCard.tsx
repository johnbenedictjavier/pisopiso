import { Archive, ArrowUpRight, CreditCard, Pencil } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../lib/money'
import AnimatedNumber from './AnimatedNumber'
import WalletLogo from './WalletLogo'
import type { Wallet } from '../types'

interface WalletCardProps {
  wallet: Wallet
  featured?: boolean
  onEdit?: (wallet: Wallet) => void
  onArchive?: (wallet: Wallet) => void
  interactive?: boolean
  reorderable?: boolean
  pressing?: boolean
  dragging?: boolean
  dropTarget?: boolean
  onReorderClick?: () => boolean
  onReorderPointerDown?: (event: React.PointerEvent<HTMLElement>) => void
  onReorderPointerMove?: (event: React.PointerEvent<HTMLElement>) => void
  onReorderPointerUp?: (event: React.PointerEvent<HTMLElement>) => void
  onReorderPointerCancel?: (event: React.PointerEvent<HTMLElement>) => void
  onReorderKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void
}

export default function WalletCard({ wallet, featured = false, onEdit, onArchive, interactive = true, reorderable = false, pressing = false, dragging = false, dropTarget = false, onReorderClick, onReorderPointerDown, onReorderPointerMove, onReorderPointerUp, onReorderPointerCancel, onReorderKeyDown }: WalletCardProps) {
  const { getWalletBalance } = useFinance()
  const navigate = useNavigate()
  const balance = getWalletBalance(wallet.id)
  const hasActions = Boolean(onEdit || onArchive)

  return (
    <article className={`wallet-card wallet-card-theme-${wallet.cardTheme} ${featured ? 'wallet-card-featured' : ''} ${interactive ? 'wallet-card-interactive' : ''} ${reorderable ? 'wallet-card-reorderable' : ''} ${pressing ? 'wallet-card-pressing' : ''} ${dragging ? 'wallet-card-dragging' : ''} ${dropTarget ? 'wallet-card-drop-target' : ''}`} data-wallet-id={wallet.id} style={{ '--wallet-accent': wallet.color } as React.CSSProperties} role={interactive ? 'link' : undefined} tabIndex={interactive ? 0 : undefined} onClick={() => { if (reorderable && onReorderClick?.()) return; if (interactive) navigate(`/wallets/${wallet.id}`) }} onPointerDown={(event) => { if (reorderable) { event.stopPropagation(); onReorderPointerDown?.(event) } }} onPointerMove={(event) => { if (reorderable) { event.stopPropagation(); onReorderPointerMove?.(event) } }} onPointerUp={(event) => { if (reorderable) { event.stopPropagation(); onReorderPointerUp?.(event) } }} onPointerCancel={(event) => { if (reorderable) { event.stopPropagation(); onReorderPointerCancel?.(event) } }} onKeyDown={(event) => { if (reorderable && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) { event.preventDefault(); onReorderKeyDown?.(event); return } if (interactive && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); navigate(`/wallets/${wallet.id}`) } }}>
      <span className="wallet-card-shine" aria-hidden="true" />
      <div className="wallet-card-top">
        <div className="wallet-card-identity">
          <WalletLogo logoUrl={wallet.logoUrl} logoScale={wallet.logoScale} logoPositionX={wallet.logoPositionX} logoPositionY={wallet.logoPositionY} name={wallet.name} color={wallet.color} size={featured ? 'large' : 'medium'} />
          <div className="wallet-card-identity-copy"><span>Wallet</span><strong>{wallet.name}</strong></div>
        </div>
        {hasActions ? (
          <div className="wallet-card-actions" onPointerDown={(event) => event.stopPropagation()}>
            {onEdit && <button className="row-action wallet-card-action" type="button" aria-label={`Edit ${wallet.name}`} title={`Edit ${wallet.name}`} onClick={(event) => { event.stopPropagation(); onEdit(wallet) }} onKeyDown={(event) => event.stopPropagation()}><Pencil size={16} /></button>}
            {onArchive && <button className="row-action wallet-card-action" type="button" aria-label={`Archive ${wallet.name}`} title={`Archive ${wallet.name}`} onClick={(event) => { event.stopPropagation(); onArchive(wallet) }} onKeyDown={(event) => event.stopPropagation()}><Archive size={16} /></button>}
          </div>
        ) : <span className="wallet-card-arrow"><ArrowUpRight size={17} /></span>}
      </div>
      <div className="wallet-card-content">
        <span>Available balance</span>
        <strong><AnimatedNumber value={balance} format={(amount) => formatCurrency(Math.round(amount))} /></strong>
      </div>
      <div className="wallet-card-footer">
        <span className="wallet-type"><CreditCard size={13} /> <span>•••• {wallet.id.slice(-4).toUpperCase()}</span></span>
      </div>
    </article>
  )
}

export function WalletCardLink({ wallet }: { wallet: Wallet }) {
  return <Link to={`/wallets/${wallet.id}`} className="wallet-card-link" aria-label={`View ${wallet.name}`}><WalletCard wallet={wallet} interactive={false} /></Link>
}
