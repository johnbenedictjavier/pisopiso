import { useState } from 'react'
import AnimatedNumber from './AnimatedNumber'
import JarHistoryModal from './JarHistoryModal'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../lib/money'

export default function CoinJar() {
  const { jarBalanceCents, jarTransactions } = useFinance()
  const [historyOpen, setHistoryOpen] = useState(false)
  const visibleCoins = jarTransactions.filter((transaction) => transaction.kind !== 'expense').slice(0, 9)
  const fillLevel = jarBalanceCents > 0 ? Math.min(78, 19 + Math.max(1, visibleCoins.length) * 7) : 0

  return (
    <>
      <button
        className={`coin-jar-panel ${jarBalanceCents > 0 ? 'coin-jar-panel-filled' : ''}`}
        type="button"
        onClick={() => setHistoryOpen(true)}
        aria-label={`Coin jar with ${formatCurrency(jarBalanceCents)} saved. Open coin jar history.`}
      >
        <span className="coin-jar-visual" aria-hidden="true">
          <span className="coin-jar-lid" />
          <span className="coin-jar-neck" />
          <span className="coin-jar-body">
            <span className="coin-jar-liquid" style={{ height: `${fillLevel}%` }} />
            <span className="coin-jar-coins">
              {visibleCoins.map((entry, index) => (
                <span
                  className={`coin-jar-coin ${index === 0 ? 'coin-jar-coin-new' : ''}`}
                  key={entry.id}
                  style={{
                    left: `${25 + ((index * 29) % 53)}%`,
                    bottom: `${10 + ((index * 17) % 27)}%`,
                    animationDelay: `${Math.min(index * 70, 500)}ms`,
                  }}
                >
                  ₱
                </span>
              ))}
            </span>
            <span className="coin-jar-highlight" />
          </span>
        </span>
        <span className="coin-jar-copy">
          <span className="section-kicker">Coin jar</span>
          <strong><AnimatedNumber value={jarBalanceCents} format={(amount) => formatCurrency(Math.round(amount))} /></strong>
          <small>{jarTransactions.length ? 'Tap to view history' : 'Add coins back to begin'}</small>
        </span>
      </button>
      <JarHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  )
}
