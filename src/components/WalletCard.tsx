import { Archive, ArrowUpRight, GripVertical, MoreHorizontal, Pencil, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../lib/money'
import { walletTypeLabels } from '../types'
import WalletLogo from './WalletLogo'
import type { Wallet } from '../types'

interface WalletCardProps {
  wallet: Wallet
  featured?: boolean
  onEdit?: (wallet: Wallet) => void
  onArchive?: (wallet: Wallet) => void
  interactive?: boolean
  reorderable?: boolean
  dragging?: boolean
  dropTarget?: boolean
  onReorderPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void
  onReorderPointerMove?: (event: React.PointerEvent<HTMLButtonElement>) => void
  onReorderPointerUp?: (event: React.PointerEvent<HTMLButtonElement>) => void
  onReorderPointerCancel?: (event: React.PointerEvent<HTMLButtonElement>) => void
  onReorderKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void
}

export default function WalletCard({ wallet, featured = false, onEdit, onArchive, interactive = true, reorderable = false, dragging = false, dropTarget = false, onReorderPointerDown, onReorderPointerMove, onReorderPointerUp, onReorderPointerCancel, onReorderKeyDown }: WalletCardProps) {
  const { getWalletBalance } = useFinance()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const balance = getWalletBalance(wallet.id)
  const hasActions = Boolean(onEdit || onArchive)

  return (
    <article className={`wallet-card wallet-card-theme-${wallet.cardTheme} ${featured ? 'wallet-card-featured' : ''} ${interactive ? 'wallet-card-interactive' : ''} ${dragging ? 'wallet-card-dragging' : ''} ${dropTarget ? 'wallet-card-drop-target' : ''}`} data-wallet-id={wallet.id} style={{ '--wallet-accent': wallet.color } as React.CSSProperties} role={interactive ? 'link' : undefined} tabIndex={interactive ? 0 : undefined} onClick={() => interactive && navigate(`/wallets/${wallet.id}`)} onKeyDown={(event) => { if (interactive && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); navigate(`/wallets/${wallet.id}`) } }}>
      <span className="wallet-card-shine" aria-hidden="true" />
      <div className="wallet-card-top">
        <div className="wallet-card-identity">
          <WalletLogo logoUrl={wallet.logoUrl} logoScale={wallet.logoScale} logoPositionX={wallet.logoPositionX} logoPositionY={wallet.logoPositionY} name={wallet.name} color={wallet.color} size={featured ? 'large' : 'medium'} />
          <div className="wallet-card-identity-copy"><span>Wallet</span><strong>{wallet.name}</strong></div>
        </div>
        {hasActions || reorderable ? (
          <div className="wallet-card-top-actions">
            {reorderable && <button className="wallet-card-drag-handle" type="button" data-wallet-handle={wallet.id} aria-label={`Drag to reorder ${wallet.name}`} title="Drag to reorder" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => { event.stopPropagation(); onReorderPointerDown?.(event) }} onPointerMove={(event) => { event.stopPropagation(); onReorderPointerMove?.(event) }} onPointerUp={(event) => { event.stopPropagation(); onReorderPointerUp?.(event) }} onPointerCancel={(event) => { event.stopPropagation(); onReorderPointerCancel?.(event) }} onKeyDown={(event) => { event.stopPropagation(); onReorderKeyDown?.(event) }}><GripVertical size={17} /></button>}
            {hasActions && <div className="wallet-card-actions">
            <button className="row-action" type="button" aria-label={`Wallet actions for ${wallet.name}`} aria-haspopup="menu" aria-expanded={menuOpen} onClick={(event) => { event.stopPropagation(); setMenuOpen((current) => !current) }} onKeyDown={(event) => event.stopPropagation()}><MoreHorizontal size={18} /></button>
            {menuOpen && <div className="wallet-card-menu" role="menu" onClick={(event) => event.stopPropagation()}>
              {onEdit && <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onEdit(wallet) }}><Pencil size={14} /> Edit</button>}
              {onArchive && <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onArchive(wallet) }}><Archive size={14} /> Archive</button>}
            </div>}
            </div>}
          </div>
        ) : <span className="wallet-card-arrow"><ArrowUpRight size={17} /></span>}
      </div>
      <div className="wallet-card-content">
        <span>Available balance</span>
        <strong>{formatCurrency(balance)}</strong>
        <small>{walletTypeLabels[wallet.type]}</small>
      </div>
      <div className="wallet-card-footer">
        <span className="wallet-type"><WalletCards size={14} /> <span>•••• {wallet.id.slice(-4).toUpperCase()}</span></span>
        {!wallet.allowOverdraft && <span className="safe-badge">Protected</span>}
      </div>
    </article>
  )
}

export function WalletCardLink({ wallet }: { wallet: Wallet }) {
  return <Link to={`/wallets/${wallet.id}`} className="wallet-card-link" aria-label={`View ${wallet.name}`}><WalletCard wallet={wallet} interactive={false} /></Link>
}
