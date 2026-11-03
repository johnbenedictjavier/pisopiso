import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useOutletContext } from 'react-router-dom'
import {
  BarChart3,
  ChevronDown,
  LayoutDashboard,
  ListFilter,
  Plus,
  Settings,
  WalletCards,
} from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import BrandMark from '../components/BrandMark'
import Toast from '../components/Toast'
import TransactionModal from '../components/TransactionModal'

export interface ShellContext {
  openQuickAdd: () => void
  notify: (message: string) => void
}

const navigation = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/wallets', label: 'Wallets', icon: WalletCards },
  { to: '/transactions', label: 'Transactions', icon: ListFilter },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

const pageTitles: Record<string, { title: string; eyebrow: string }> = {
  '/overview': { title: 'Your money, in one view.', eyebrow: 'Good morning' },
  '/wallets': { title: 'Where your money lives.', eyebrow: 'Your wallets' },
  '/transactions': { title: 'The story of every peso.', eyebrow: 'Your activity' },
  '/reports': { title: 'A clearer view of your habits.', eyebrow: 'Your reports' },
  '/settings': { title: 'Make PisoPiso feel like yours.', eyebrow: 'Your space' },
}

export default function AppShell() {
  const location = useLocation()
  const { state } = useFinance()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const page = location.pathname.startsWith('/wallets/')
    ? { title: 'Inside one of your wallets.', eyebrow: 'Wallet details' }
    : pageTitles[location.pathname] ?? pageTitles['/overview']

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 3600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const context: ShellContext = {
    openQuickAdd: () => setQuickAddOpen(true),
    notify: setToast,
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link to="/overview" className="sidebar-brand" aria-label="PisoPiso overview">
          <BrandMark />
        </Link>
        <div className="sidebar-section-label">Your money</div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
          <Settings size={19} strokeWidth={1.8} />
          <span>Settings</span>
        </NavLink>
        <div className="sidebar-profile">
          <span className="avatar">{state.profile.displayName.slice(0, 1)}</span>
          <span className="profile-copy">
            <strong>{state.profile.displayName}</strong>
            <small>Local demo space</small>
          </span>
          <ChevronDown size={15} className="muted-icon" />
        </div>
      </aside>

      <div className="main-frame">
        <header className="topbar">
          <div className="mobile-brand"><BrandMark compact /></div>
          <div className="topbar-heading">
            <span>{page.eyebrow}</span>
            <h1>{page.title}</h1>
          </div>
          <div className="topbar-actions">
            <span className="sync-badge"><i /> Local mode</span>
            <button className="button button-primary topbar-add" type="button" aria-label="Add transaction" onClick={() => setQuickAddOpen(true)}>
              <Plus size={17} />
              <span>Add transaction</span>
            </button>
            <Link to="/settings" className="avatar avatar-link" aria-label="Open settings">
              {state.profile.displayName.slice(0, 1)}
            </Link>
          </div>
        </header>

        <main className="main-content">
          <Outlet context={context} />
        </main>

        <nav className="mobile-nav" aria-label="Mobile navigation">
          <div className="mobile-nav-main">
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}>
                <Icon size={19} strokeWidth={1.8} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
          <div className="mobile-nav-add-wrap"><button className="mobile-nav-add" type="button" aria-label="Add transaction" onClick={() => setQuickAddOpen(true)}><Plus size={22} /></button><span>Add</span></div>
        </nav>
      </div>

      <TransactionModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} onSuccess={(message) => { setQuickAddOpen(false); setToast(message) }} />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

export function useShell(): ShellContext {
  return useOutletContext<ShellContext>()
}
