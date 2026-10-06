import { useRef } from 'react'
import { world } from '../../world/worldStore'

const R = 52

/** Touch joystick: up/down is throttle, left/right is steering. */
export function Joystick() {
  const base = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLDivElement>(null)
  const pointer = useRef<number | null>(null)

  const update = (e: React.PointerEvent) => {
    const b = base.current!.getBoundingClientRect()
    let dx = e.clientX - (b.left + b.width / 2)
    let dy = e.clientY - (b.top + b.height / 2)
    const len = Math.hypot(dx, dy)
    if (len > R) {
      dx = (dx / len) * R
      dy = (dy / len) * R
    }
    knob.current!.style.transform = `translate(${dx}px, ${dy}px)`
    world.input.joyX = dx / R
    world.input.joyY = -dy / R
  }
  const end = () => {
    pointer.current = null
    knob.current!.style.transform = ''
    world.input.joyX = 0
    world.input.joyY = 0
  }

  return (
    <div
      ref={base}
      aria-hidden="true"
      className="relative h-[136px] w-[136px] touch-none select-none rounded-full border border-line-strong bg-ink/60"
      onPointerDown={(e) => {
        pointer.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        update(e)
      }}
      onPointerMove={(e) => pointer.current === e.pointerId && update(e)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="pointer-events-none absolute inset-0 m-auto h-px w-6 bg-line-strong" />
      <div className="pointer-events-none absolute inset-0 m-auto h-6 w-px bg-line-strong" />
      <div
        ref={knob}
        className="pointer-events-none absolute inset-0 m-auto h-14 w-14 rounded-full border border-accent bg-accent/20 transition-transform duration-75"
      />
    </div>
  )
}

/** Hold-to-drift button for touch. */
export function DriftButton() {
  const set = (on: boolean) => (on ? world.input.keys.add('drift') : world.input.keys.delete('drift'))
  return (
    <button
      type="button"
      aria-label="Drift (hold)"
      className="h-16 w-16 touch-none select-none rounded-full border border-line-strong bg-ink/60 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-muted active:border-accent active:text-accent"
      onPointerDown={() => set(true)}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
      onPointerLeave={() => set(false)}
    >
      Drift
    </button>
  )
}
