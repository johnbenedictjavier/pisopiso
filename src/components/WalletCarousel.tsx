import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import WalletCard from './WalletCard'
import type { Wallet } from '../types'

interface WalletCarouselProps {
  wallets: Wallet[]
}

export default function WalletCarousel({ wallets }: WalletCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, wallets.length - 1)))
  }, [wallets.length])

  if (!wallets.length) return null

  const move = (direction: number) => {
    setActiveIndex((current) => (current + direction + wallets.length) % wallets.length)
  }

  function positionFor(index: number): 'previous' | 'active' | 'next' | 'hidden' {
    if (wallets.length === 1) return index === activeIndex ? 'active' : 'hidden'
    const distance = (index - activeIndex + wallets.length) % wallets.length
    if (distance === 0) return 'active'
    if (distance === 1 || distance === -(wallets.length - 1)) return 'next'
    if (distance === wallets.length - 1 || distance === -1) return 'previous'
    return 'hidden'
  }

  return (
    <div className="wallet-carousel" onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null }} onTouchEnd={(event) => {
      const startX = touchStartX.current
      touchStartX.current = null
      const endX = event.changedTouches[0]?.clientX ?? startX ?? 0
      if (startX !== null && Math.abs(endX - startX) > 35) move(endX < startX ? 1 : -1)
    }}>
      <div className="wallet-carousel-stage" aria-live="polite">
        {wallets.map((wallet, index) => {
          const position = positionFor(index)
          if (position === 'hidden') return null
          return <div key={wallet.id} className={`wallet-carousel-item wallet-carousel-item-${position}`}><WalletCard wallet={wallet} /></div>
        })}
      </div>
      {wallets.length > 1 && <div className="wallet-carousel-controls">
        <button className="icon-button" type="button" aria-label="Previous wallet" onClick={() => move(-1)}><ChevronLeft size={18} /></button>
        <span>{activeIndex + 1} / {wallets.length}</span>
        <button className="icon-button" type="button" aria-label="Next wallet" onClick={() => move(1)}><ChevronRight size={18} /></button>
      </div>}
    </div>
  )
}
