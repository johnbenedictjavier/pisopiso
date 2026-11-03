import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './layout/AppShell'
import { useAuthLock } from './context/AuthLockContext'

const AuthPage = lazy(() => import('./pages/AuthPage'))
const OverviewPage = lazy(() => import('./pages/OverviewPage'))
const WalletsPage = lazy(() => import('./pages/WalletsPage'))
const WalletDetailPage = lazy(() => import('./pages/WalletDetailPage'))
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="loader-dot" />
      <span>Loading your money space</span>
    </div>
  )
}

function ProtectedAppShell() {
  const { isLocked } = useAuthLock()
  return isLocked ? <Navigate to="/login" replace /> : <AppShell />
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route element={<ProtectedAppShell />}>
            <Route index element={<Navigate to="/overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="wallets" element={<WalletsPage />} />
            <Route path="wallets/:walletId" element={<WalletDetailPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="reports" element={<Navigate to="/dashboard" replace />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
