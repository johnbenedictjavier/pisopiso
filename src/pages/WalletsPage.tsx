import { useState } from 'react'
import { Archive, ChevronRight, Plus, ShieldCheck, WalletCards } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../lib/money'
import WalletCard from '../components/WalletCard'
import WalletModal from '../components/WalletModal'
import EmptyState from '../components/EmptyState'
import { useShell } from '../layout/AppShell'
import type { Wallet } from '../types'

export default function WalletsPage() {
  const { activeWallets, getWalletBalance, archiveWallet } = useFinance()
  const { notify } = useShell()
  const [modalOpen, setModalOpen] = useState(false)

  const total = activeWallets.reduce((sum, wallet) => sum + getWalletBalance(wallet.id), 0)

  function archive(wallet: Wallet): void {
    if (window.confirm(`Archive ${wallet.name}? Its history will stay safe, but it will no longer accept new movements.`)) {
      archiveWallet(wallet.id)
      notify(`${wallet.name} was archived.`)
    }
  }

  return (
    <div className="page-stack">
      <section className="page-intro-row"><div><p className="lead-copy">A wallet can be a bank account, a little cash envelope, or a future you are building.</p></div><button className="button button-primary" type="button" onClick={() => setModalOpen(true)}><Plus size={17} /> Add wallet</button></section>
      <section className="wallet-summary-strip"><div><span className="section-kicker">Across {activeWallets.length} active {activeWallets.length === 1 ? 'wallet' : 'wallets'}</span><strong>{formatCurrency(total)}</strong></div><div className="wallet-summary-note"><ShieldCheck size={18} /><span>Protected by your own rules<br /><small>Overdrafts are off by default</small></span></div></section>
      {activeWallets.length ? <section className="wallets-page-grid">{activeWallets.map((wallet) => <WalletCard key={wallet.id} wallet={wallet} featured onArchive={archive} />)}<button className="add-wallet-card add-wallet-card-large" type="button" onClick={() => setModalOpen(true)}><span><Plus size={20} /></span><strong>Add another wallet</strong><small>Keep every account in the same view</small></button></section> : <EmptyState title="Start with one wallet" description="Add the account, e-wallet, or cash envelope you use most." action={{ label: 'Add wallet', onClick: () => setModalOpen(true) }} />}
      <section className="wallet-principles"><div><WalletCards size={19} /><strong>One view, no bank connections.</strong><p>PisoPiso is a manual tracker. Your passwords, PINs, and OTPs never belong here.</p></div><div><Archive size={19} /><strong>Archive without losing history.</strong><p>Old wallets stay in your story so your totals remain explainable.</p></div><ChevronRight size={18} className="principle-arrow" /></section>
      <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={(message) => { setModalOpen(false); notify(message) }} />
    </div>
  )
}
