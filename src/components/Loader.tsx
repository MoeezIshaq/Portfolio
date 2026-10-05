import { useEffect, useState } from 'react'
import { site } from '../content'
import { hasWebGL } from '../hooks/useEnvironment'
import { scene } from '../store'

const MIN_MS = 1300
const MAX_MS = 2800
const EXIT_MS = 950

export function startIntro() {
  scene.introAt = performance.now()
  document.documentElement.classList.add('is-loaded')
}

/** Brief counter that holds until the 3D scene is ready, then lifts like a curtain. */
export function Loader({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    root.style.overflow = 'hidden'
    const webgl = hasWebGL()
    const start = performance.now()
    let raf = 0
    let exitTimer = 0

    const tick = () => {
      const el = performance.now() - start
      const ready = !webgl || scene.sceneReady || el > MAX_MS
      const eased = 1 - Math.pow(1 - Math.min(1, el / MIN_MS), 3)
      const value = Math.round(Math.min(ready ? 100 : 92, eased * 100))
      setN(value)
      if (value >= 100) {
        setLeaving(true)
        startIntro()
        exitTimer = window.setTimeout(() => {
          root.style.overflow = ''
          onDone()
        }, EXIT_MS)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(exitTimer)
      root.style.overflow = ''
    }
  }, [onDone])

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[80] flex flex-col justify-between bg-ink px-5 py-5 transition-transform duration-[950ms] ease-[cubic-bezier(0.76,0,0.24,1)] md:px-10 md:py-7 ${
        leaving ? '-translate-y-full' : ''
      }`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium tracking-tight text-fg">{site.name}</span>
        <span className="label">Portfolio / {new Date().getFullYear()}</span>
      </div>
      <div>
        <div className="flex items-end justify-between gap-6">
          <span className="text-[clamp(6rem,24vw,22rem)] font-medium leading-[0.78] tracking-[-0.07em] text-fg tabular-nums">
            {String(n).padStart(3, '0')}
          </span>
          <span className="label mb-3 hidden text-right md:block">
            Assembling
            <br />
            point cloud
          </span>
        </div>
        <div className="mt-6 h-px w-full bg-line">
          <div className="h-px origin-left bg-accent" style={{ transform: `scaleX(${n / 100})` }} />
        </div>
      </div>
    </div>
  )
}
