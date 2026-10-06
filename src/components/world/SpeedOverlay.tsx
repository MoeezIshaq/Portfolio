import { useEffect, useRef } from 'react'
import { world } from '../../world/worldStore'

const COUNT = 110
const INNER = 0.5 // streaks live outside this fraction of the half-diagonal, so the centre stays clear

/** Screen-edge wind streaks that rush outward while the car is boosting. */
export function SpeedOverlay() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let w = 0
    let h = 0
    let dpr = 1
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio, 1.5)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const spawn = (s: { a: number; d: number; v: number; blue: boolean }, anywhere: boolean) => {
      s.a = Math.random() * Math.PI * 2
      s.d = anywhere ? Math.random() : 0
      s.v = 0.9 + Math.random() * 0.9
      s.blue = Math.random() < 0.3
    }
    const streaks = Array.from({ length: COUNT }, () => {
      const s = { a: 0, d: 0, v: 0, blue: false }
      spawn(s, true)
      return s
    })

    let k = 0
    let last = performance.now()
    let raf = 0
    let painted = false
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const target = world.car.boost > 0 ? 1 : 0
      k += (target - k) * (1 - Math.exp(-(target ? 10 : 2.8) * dt))

      if (k < 0.01) {
        if (painted) {
          ctx.clearRect(0, 0, w, h)
          painted = false
        }
        raf = requestAnimationFrame(tick)
        return
      }

      ctx.clearRect(0, 0, w, h)
      painted = true
      const cx = w / 2
      const cy = h / 2
      const R = Math.hypot(cx, cy)
      ctx.lineCap = 'round'
      for (const s of streaks) {
        s.d += dt * s.v * (1.4 + k * 1.2)
        if (s.d > 1) spawn(s, false)
        const r0 = R * (INNER + s.d * (1 - INNER))
        const len = R * (0.06 + 0.22 * k) * (0.35 + s.d)
        const cos = Math.cos(s.a)
        const sin = Math.sin(s.a)
        // Fade in as streaks leave the inner ring, strongest near the screen edge.
        const alpha = k * Math.min(1, s.d * 2.2) * 0.55
        ctx.strokeStyle = s.blue ? `rgba(61,123,255,${alpha})` : `rgba(236,232,225,${alpha * 0.85})`
        ctx.lineWidth = 0.8 + s.d * 1.6
        ctx.beginPath()
        ctx.moveTo(cx + cos * r0, cy + sin * r0)
        ctx.lineTo(cx + cos * (r0 + len), cy + sin * (r0 + len))
        ctx.stroke()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[5] h-full w-full" />
}
