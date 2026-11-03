import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { FinanceProvider } from './context/FinanceContext'
import { AuthLockProvider } from './context/AuthLockContext'
import { registerPwa } from './lib/pwa'
import './index.css'

registerPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FinanceProvider>
      <AuthLockProvider>
        <App />
      </AuthLockProvider>
    </FinanceProvider>
  </StrictMode>,
)
