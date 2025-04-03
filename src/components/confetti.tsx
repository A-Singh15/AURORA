"use client"
import { useEffect, useRef } from "react"
import confetti from "canvas-confetti"

interface ConfettiExplosionProps {
  duration?: number
  particleCount?: number
  spread?: number
  colors?: string[]
  trigger?: boolean
  onComplete?: () => void
}

export function ConfettiExplosion({
  duration = 3000,
  particleCount = 150,
  spread = 100,
  colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"],
  trigger = false,
  onComplete,
}: ConfettiExplosionProps) {
  const confettiRef = useRef<HTMLCanvasElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!trigger) return

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Create a confetti cannon
    const myConfetti = confetti.create(confettiRef.current!, {
      resize: true,
      useWorker: true,
    })

    // Fire multiple bursts of confetti
    const end = Date.now() + duration
    const runAnimation = () => {
      const now = Date.now()
      if (now > end) {
        // Animation complete, call onComplete if provided
        if (onComplete) {
          onComplete()
        }
        return
      }

      // Random positions
      const randomX = Math.random()
      const randomY = Math.random() * 0.5
      myConfetti({
        particleCount: Math.floor(particleCount / 5),
        spread: spread,
        origin: { x: randomX, y: randomY },
        colors: colors,
        disableForReducedMotion: true,
      })

      timeoutRef.current = setTimeout(runAnimation, 250)
    }

    // Start the animation
    runAnimation()

    // Initial big burst
    myConfetti({
      particleCount: particleCount,
      spread: spread,
      origin: { x: 0.5, y: 0.5 },
      colors: colors,
      disableForReducedMotion: true,
    })

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [trigger, duration, particleCount, spread, colors, onComplete])

  return (
    <canvas
      ref={confettiRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        width: "100vw",
        height: "100vh",
        zIndex: 9999, // Much higher z-index to ensure it's above the modal
      }}
    />
  )
}
