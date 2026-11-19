import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import WalletCard from './WalletCard'
import type { Wallet } from '../types'

interface WalletCarouselProps {
  wallets: Wallet[]
}

export default function WalletCarousel({ wallets }: WalletCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [transitionDirection, setTransitionDirection] = useState<'next' | 'previous'>('next')
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, wallets.length - 1)))
  }, [wallets.length])

  if (!wallets.length) return null

  const move = (direction: number) => {
    setTransitionDirection(direction > 0 ? 'next' : 'previous')
    setActiveIndex((current) => (current + direction + wallets.length) % wallets.length)
  }

  const safeActiveIndex = Math.min(activeIndex, wallets.length - 1)
  const activeWallet = wallets[safeActiveIndex]
  const previousWallet = wallets[(safeActiveIndex - 1 + wallets.length) % wallets.length]
  const nextWallet = wallets[(safeActiveIndex + 1) % wallets.length]

  return (
    <div className="wallet-carousel" onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null }} onTouchEnd={(event) => {
      const startX = touchStartX.current
      touchStartX.current = null
      const endX = event.changedTouches[0]?.clientX ?? startX ?? 0
      if (startX !== null && Math.abs(endX - startX) > 35) move(endX < startX ? 1 : -1)
    }} onTouchCancel={() => { touchStartX.current = null }}>
      <div className="wallet-carousel-viewport" aria-live="polite">
        {wallets.length > 1 && <>
          <div className="wallet-carousel-item wallet-carousel-item-previous" aria-hidden="true">
            <WalletCard wallet={previousWallet} interactive={false} />
          </div>
          <div className="wallet-carousel-item wallet-carousel-item-next" aria-hidden="true">
            <WalletCard wallet={nextWallet} interactive={false} />
          </div>
        </>}
        <div key={activeWallet.id} className={`wallet-carousel-item wallet-carousel-item-active wallet-carousel-transition-${transitionDirection}`}>
          <WalletCard wallet={activeWallet} featured />
        </div>
      </div>
      {wallets.length > 1 && <div className="wallet-carousel-controls">
        <button className="icon-button carousel-control-button" type="button" aria-label="Previous wallet" title="Previous wallet" onClick={() => move(-1)}><ChevronLeft size={18} /></button>
        <span>{safeActiveIndex + 1} / {wallets.length}</span>
        <button className="icon-button carousel-control-button" type="button" aria-label="Next wallet" title="Next wallet" onClick={() => move(1)}><ChevronRight size={18} /></button>
      </div>}
    </div>
  )
}
