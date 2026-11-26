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
import ProfileAvatar from '../components/ProfileAvatar'
import Toast from '../components/Toast'
import TransactionModal from '../components/TransactionModal'

export interface ShellContext {
  openQuickAdd: (walletId?: string) => void
  notify: (message: string) => void
}

const navigation = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/wallets', label: 'Wallets', icon: WalletCards },
  { to: '/transactions', label: 'Transactions', icon: ListFilter },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
]

const pageTitles: Record<string, { title: string; eyebrow: string }> = {
  '/overview': { title: 'Overview', eyebrow: 'PisoPiso' },
  '/wallets': { title: 'Wallets', eyebrow: 'PisoPiso' },
  '/transactions': { title: 'Transactions', eyebrow: 'PisoPiso' },
  '/dashboard': { title: 'Dashboard', eyebrow: 'PisoPiso' },
  '/settings': { title: 'Settings', eyebrow: 'PisoPiso' },
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function AppShell() {
  const location = useLocation()
  const { state } = useFinance()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddWalletId, setQuickAddWalletId] = useState<string | undefined>()
  const detailWalletId = location.pathname.match(/^\/wallets\/([^/]+)/)?.[1]
  const [toast, setToast] = useState<string | null>(null)
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours())
  const page = location.pathname.startsWith('/wallets/')
    ? { title: 'Wallet details', eyebrow: 'PisoPiso' }
    : pageTitles[location.pathname] ?? pageTitles['/overview']

  useEffect(() => {
    const updateHour = () => setCurrentHour(new Date().getHours())
    const interval = window.setInterval(updateHour, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 3600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const context: ShellContext = {
    openQuickAdd: (walletId) => {
      setQuickAddWalletId(walletId)
      setQuickAddOpen(true)
    },
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
          <ProfileAvatar profile={state.profile} size="small" />
          <span className="profile-copy">
            <strong>{state.profile.displayName}</strong>
          </span>
          <ChevronDown size={15} className="muted-icon" />
        </div>
      </aside>

      <div className="main-frame">
        <header className="topbar">
          <div className="topbar-profile"><ProfileAvatar profile={state.profile} size="small" /></div>
          <div className="topbar-heading">
            <span>{page.eyebrow}</span>
            <h1>{greetingForHour(currentHour)}, {state.profile.displayName || 'there'}</h1>
          </div>
          <div className="topbar-actions">
            <Link to="/settings" className="icon-button topbar-settings" aria-label="Open settings" title="Settings">
              <Settings size={19} />
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
           <div className="mobile-nav-add-wrap"><button className="mobile-nav-add" type="button" aria-label="Add transaction" onClick={() => { setQuickAddWalletId(detailWalletId); setQuickAddOpen(true) }}><Plus size={24} /></button></div>
        </nav>
      </div>

       <TransactionModal walletId={quickAddWalletId} open={quickAddOpen} onClose={() => { setQuickAddOpen(false); setQuickAddWalletId(undefined) }} onSuccess={(message) => { setQuickAddOpen(false); setQuickAddWalletId(undefined); setToast(message) }} />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

export function useShell(): ShellContext {
  return useOutletContext<ShellContext>()
}
