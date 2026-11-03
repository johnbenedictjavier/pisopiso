import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  format: (value: number) => string
  duration?: number
  className?: string
}

export default function AnimatedNumber({ value, format, duration = 760, className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const currentValueRef = useRef(0)

  useEffect(() => {
    const from = currentValueRef.current
    if (from === value) return

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (reducedMotion) {
      currentValueRef.current = value
      setDisplayValue(value)
      return
    }

    const startedAt = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      const nextValue = from + (value - from) * easedProgress
      currentValueRef.current = nextValue
      setDisplayValue(nextValue)
      if (progress < 1) frame = window.requestAnimationFrame(tick)
      else currentValueRef.current = value
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [duration, value])

  return <span className={className}>{format(displayValue)}</span>
}
