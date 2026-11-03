import { ArrowUpRight, MoreHorizontal, WalletCards } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../lib/money'
import { walletTypeLabels } from '../types'
import WalletLogo from './WalletLogo'
import type { Wallet } from '../types'

interface WalletCardProps {
  wallet: Wallet
  featured?: boolean
  onArchive?: (wallet: Wallet) => void
  interactive?: boolean
}

export default function WalletCard({ wallet, featured = false, onArchive, interactive = true }: WalletCardProps) {
  const { getWalletBalance } = useFinance()
  const navigate = useNavigate()
  const balance = getWalletBalance(wallet.id)

  return (
    <article className={`wallet-card wallet-card-theme-${wallet.cardTheme} ${featured ? 'wallet-card-featured' : ''} ${interactive ? 'wallet-card-interactive' : ''}`} style={{ '--wallet-accent': wallet.color } as React.CSSProperties} role={interactive ? 'link' : undefined} tabIndex={interactive ? 0 : undefined} onClick={() => interactive && navigate(`/wallets/${wallet.id}`)} onKeyDown={(event) => { if (interactive && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); navigate(`/wallets/${wallet.id}`) } }}>
      <span className="wallet-card-shine" aria-hidden="true" />
      <div className="wallet-card-top">
        <WalletLogo logoUrl={wallet.logoUrl} name={wallet.name} color={wallet.color} size={featured ? 'large' : 'medium'} />
        {onArchive ? (
          <button className="row-action" type="button" aria-label={`Archive ${wallet.name}`} onClick={(event) => { event.stopPropagation(); onArchive(wallet) }}><MoreHorizontal size={18} /></button>
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
