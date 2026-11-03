import { useState } from 'react'
import { Plus, WalletCards } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import EmptyState from '../components/EmptyState'
import WalletCard from '../components/WalletCard'
import WalletModal from '../components/WalletModal'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../lib/money'
import { useShell } from '../layout/AppShell'
import type { Wallet } from '../types'

export default function WalletsPage() {
  const { activeWallets, getWalletBalance, archiveWallet } = useFinance()
  const { notify } = useShell()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Wallet | null>(null)
  const total = activeWallets.reduce((sum, wallet) => sum + getWalletBalance(wallet.id), 0)

  function openAdd(): void {
    setEditingWallet(null)
    setModalOpen(true)
  }

  function openEdit(wallet: Wallet): void {
    setEditingWallet(wallet)
    setModalOpen(true)
  }

  function closeModal(): void {
    setModalOpen(false)
    setEditingWallet(null)
  }

  function confirmArchive(): void {
    if (!archiveTarget) return
    archiveWallet(archiveTarget.id)
    notify(`${archiveTarget.name} was archived.`)
    setArchiveTarget(null)
  }

  return (
    <div className="page-stack">
      <section className="page-intro-row"><div><h2 className="page-section-title">Wallets</h2><span className="section-subtitle">{activeWallets.length} active</span></div><button className="button button-primary" type="button" onClick={openAdd}><Plus size={17} /> Add wallet</button></section>
      <section className="wallet-summary-strip"><div><span className="section-kicker">Total balance</span><strong>{formatCurrency(total)}</strong></div><span className="wallet-summary-count"><WalletCards size={17} /> {activeWallets.length} active wallets</span></section>
      {activeWallets.length ? <section className="wallets-page-grid">{activeWallets.map((wallet) => <WalletCard key={wallet.id} wallet={wallet} featured onEdit={openEdit} onArchive={setArchiveTarget} />)}<button className="add-wallet-card add-wallet-card-large" type="button" onClick={openAdd}><span><Plus size={20} /></span><strong>Add another wallet</strong><small>Keep every account in one view</small></button></section> : <EmptyState title="Add your first wallet" description="Start with a bank account, cash, or any account you track." action={{ label: 'Add wallet', onClick: openAdd }} />}
      <WalletModal open={modalOpen} wallet={editingWallet} onClose={closeModal} onSuccess={(message) => { closeModal(); notify(message) }} />
      <ConfirmModal open={Boolean(archiveTarget)} title="Archive wallet?" message={archiveTarget ? `${archiveTarget.name} will disappear from active wallets, but its history will stay available.` : ''} confirmLabel="Archive" danger onClose={() => setArchiveTarget(null)} onConfirm={confirmArchive} />
    </div>
  )
}
