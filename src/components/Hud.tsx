import { useEffect, useState } from 'react'
import { nav } from '../content'
import { activeSection, scene } from '../store'

const FIGURES = ['Neural network', 'Briefcase', 'Source </>', 'Gear, 5 groups', 'Graduation cap', 'Paper plane']
const LABELS = ['Index', ...nav.map((n) => n.label)]

/** Instrument-panel readout pinned to the bottom of wide screens. Purely decorative. */
export function Hud() {
  const [s, setS] = useState({ i: 0, f: 0, p: 0, fps: 0, pts: 0 })
  useEffect(() => {
    const id = window.setInterval(() => {
      setS({
        i: activeSection.get(),
        f: Math.round(scene.morph),
        p: scene.progress,
        fps: scene.fps,
        pts: scene.particles,
      })
    }, 250)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 hidden items-center justify-between gap-8 px-10 pb-5 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-faint md:flex"
    >
      <span className="w-56">
        <span className="text-accent">[{String(s.i).padStart(2, '0')}]</span> <span className="text-muted">{LABELS[s.i]}</span>
      </span>
      <span className="flex flex-1 items-center gap-4">
        <span className="h-px flex-1 bg-line">
          <span className="block h-px origin-left bg-fg/60" style={{ transform: `scaleX(${s.p})` }} />
        </span>
        <span className="w-10 text-right tabular-nums">{Math.round(s.p * 100)}%</span>
      </span>
      <span className="whitespace-nowrap text-right tabular-nums">
        Fig.{String(s.f + 1).padStart(2, '0')} {FIGURES[s.f]}
        {s.pts > 0 && (
          <>
            {' · '}
            {s.pts.toLocaleString()} pts{s.fps > 1 && ` · ${s.fps} fps`}
          </>
        )}
      </span>
    </div>
  )
}
