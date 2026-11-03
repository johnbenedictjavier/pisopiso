import { useRef, useState } from 'react'
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
  const { activeWallets, getWalletBalance, archiveWallet, reorderWallets } = useFinance()
  const { notify } = useShell()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Wallet | null>(null)
  const [draggingWalletId, setDraggingWalletId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [reorderStatus, setReorderStatus] = useState('')
  const dragRef = useRef<{ walletId: string; pointerId: number; startX: number; startY: number; active: boolean } | null>(null)
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

  function walletIdAtPoint(clientX: number, clientY: number): string | null {
    const element = document.elementsFromPoint(clientX, clientY).find((candidate) => candidate instanceof HTMLElement && candidate.dataset.walletId)
    return element instanceof HTMLElement ? element.dataset.walletId ?? null : null
  }

  function beginWalletDrag(walletId: string, event: React.PointerEvent<HTMLButtonElement>): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { walletId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, active: false }
    setDraggingWalletId(null)
    setDropTargetId(null)
  }

  function moveWalletDrag(event: React.PointerEvent<HTMLButtonElement>): void {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (!drag.active && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return
    if (!drag.active) {
      drag.active = true
      setDraggingWalletId(drag.walletId)
    }
    const targetId = walletIdAtPoint(event.clientX, event.clientY)
    setDropTargetId(targetId && targetId !== drag.walletId ? targetId : null)
  }

  function finishWalletDrag(event: React.PointerEvent<HTMLButtonElement>, cancelled = false): void {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const targetId = walletIdAtPoint(event.clientX, event.clientY)
    if (!cancelled && drag.active && targetId && targetId !== drag.walletId) {
      const targetIndex = activeWallets.findIndex((wallet) => wallet.id === targetId)
      const wallet = activeWallets.find((item) => item.id === drag.walletId)
      reorderWallets(drag.walletId, targetId)
      if (wallet && targetIndex >= 0) setReorderStatus(`${wallet.name} moved to position ${targetIndex + 1}.`)
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    setDraggingWalletId(null)
    setDropTargetId(null)
  }

  function moveWalletWithKeyboard(walletId: string, event: React.KeyboardEvent<HTMLButtonElement>): void {
    const direction = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0
    if (!direction) return
    event.preventDefault()
    const index = activeWallets.findIndex((wallet) => wallet.id === walletId)
    const targetIndex = index + direction
    const wallet = activeWallets[index]
    const target = activeWallets[targetIndex]
    if (!wallet || !target) return
    reorderWallets(walletId, target.id)
    setReorderStatus(`${wallet.name} moved to position ${targetIndex + 1}.`)
    window.requestAnimationFrame(() => {
      const handle = Array.from(document.querySelectorAll<HTMLButtonElement>('.wallet-card-drag-handle')).find((button) => button.dataset.walletHandle === walletId)
      handle?.focus()
    })
  }

  return (
    <div className="page-stack">
      <section className="page-intro-row"><div><h2 className="page-section-title">Wallets</h2><span className="section-subtitle">{activeWallets.length} active</span></div><button className="button button-primary" type="button" onClick={openAdd}><Plus size={17} /> Add wallet</button></section>
      <section className="wallet-summary-strip"><div><span className="section-kicker">Total balance</span><strong>{formatCurrency(total)}</strong></div><span className="wallet-summary-count"><WalletCards size={17} /> {activeWallets.length} active wallets</span></section>
      {activeWallets.length ? <section className="wallets-page-grid" aria-label="Reorderable wallets">{activeWallets.map((wallet) => <WalletCard key={wallet.id} wallet={wallet} featured onEdit={openEdit} onArchive={setArchiveTarget} reorderable dragging={draggingWalletId === wallet.id} dropTarget={dropTargetId === wallet.id} onReorderPointerDown={(event) => beginWalletDrag(wallet.id, event)} onReorderPointerMove={moveWalletDrag} onReorderPointerUp={finishWalletDrag} onReorderPointerCancel={(event) => finishWalletDrag(event, true)} onReorderKeyDown={(event) => moveWalletWithKeyboard(wallet.id, event)} />)}<button className="add-wallet-card add-wallet-card-large" type="button" onClick={openAdd}><span><Plus size={20} /></span><strong>Add another wallet</strong><small>Keep every account in one view</small></button></section> : <EmptyState title="Add your first wallet" description="Start with a bank account, cash, or any account you track." action={{ label: 'Add wallet', onClick: openAdd }} />}
      <span className="sr-only" role="status" aria-live="polite">{reorderStatus}</span>
      <WalletModal open={modalOpen} wallet={editingWallet} onClose={closeModal} onSuccess={(message) => { closeModal(); notify(message) }} />
      <ConfirmModal open={Boolean(archiveTarget)} title="Archive wallet?" message={archiveTarget ? `${archiveTarget.name} will disappear from active wallets, but its history will stay available.` : ''} confirmLabel="Archive" danger onClose={() => setArchiveTarget(null)} onConfirm={confirmArchive} />
    </div>
  )
}
