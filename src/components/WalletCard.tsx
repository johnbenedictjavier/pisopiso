import { Archive, ArrowUpRight, MoreHorizontal, Pencil, WalletCards } from 'lucide-react'
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
}

export default function WalletCard({ wallet, featured = false, onEdit, onArchive, interactive = true }: WalletCardProps) {
  const { getWalletBalance } = useFinance()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const balance = getWalletBalance(wallet.id)
  const hasActions = Boolean(onEdit || onArchive)

  return (
    <article className={`wallet-card wallet-card-theme-${wallet.cardTheme} ${featured ? 'wallet-card-featured' : ''} ${interactive ? 'wallet-card-interactive' : ''}`} style={{ '--wallet-accent': wallet.color } as React.CSSProperties} role={interactive ? 'link' : undefined} tabIndex={interactive ? 0 : undefined} onClick={() => interactive && navigate(`/wallets/${wallet.id}`)} onKeyDown={(event) => { if (interactive && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); navigate(`/wallets/${wallet.id}`) } }}>
      <span className="wallet-card-shine" aria-hidden="true" />
      <div className="wallet-card-top">
        <WalletLogo logoUrl={wallet.logoUrl} name={wallet.name} color={wallet.color} size={featured ? 'large' : 'medium'} />
        {hasActions ? (
          <div className="wallet-card-actions">
            <button className="row-action" type="button" aria-label={`Wallet actions for ${wallet.name}`} aria-haspopup="menu" aria-expanded={menuOpen} onClick={(event) => { event.stopPropagation(); setMenuOpen((current) => !current) }} onKeyDown={(event) => event.stopPropagation()}><MoreHorizontal size={18} /></button>
            {menuOpen && <div className="wallet-card-menu" role="menu" onClick={(event) => event.stopPropagation()}>
              {onEdit && <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onEdit(wallet) }}><Pencil size={14} /> Edit</button>}
              {onArchive && <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onArchive(wallet) }}><Archive size={14} /> Archive</button>}
            </div>}
          </div>
        ) : <span className="wallet-card-arrow"><ArrowUpRight size={17} /></span>}
      </div>
      <div className="wallet-card-content">
        <span>{wallet.name}</span>
        <strong>{formatCurrency(balance)}</strong>
        <small>{wallet.logoName ?? walletTypeLabels[wallet.type]}</small>
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
