import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { FinanceProvider } from './context/FinanceContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FinanceProvider>
      <App />
    </FinanceProvider>
  </StrictMode>,
)
