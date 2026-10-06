import { useEffect, useRef } from 'react'
import { world, worldUi } from '../../world/worldStore'
import { WORLD_RADIUS, ZONES } from '../../world/zones'

const SIZE = 132
const scale = (SIZE / 2 - 8) / WORLD_RADIUS

/** Top-down radar. Zones are buttons so the map doubles as navigation. */
export function Minimap() {
  const car = useRef<SVGGElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const c = world.car
      // Screen y grows downward; world -z is "north" (up on the map).
      const deg = 180 - (c.heading * 180) / Math.PI
      car.current?.setAttribute('transform', `translate(${c.x * scale} ${c.z * scale}) rotate(${deg})`)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`} className="absolute inset-0" aria-hidden="true">
        <circle r={SIZE / 2 - 1} fill="rgb(13 12 11 / 0.75)" stroke="rgb(236 232 225 / 0.2)" />
        <circle r={WORLD_RADIUS * scale} fill="none" stroke="rgb(236 232 225 / 0.1)" strokeDasharray="2 3" />
        {ZONES.map((z) => (
          <line key={z.id} x1={0} y1={0} x2={z.x * scale} y2={z.z * scale} stroke="rgb(236 232 225 / 0.12)" />
        ))}
        <circle r={2} fill="rgb(236 232 225 / 0.6)" />
        <g ref={car}>
          <path d="M0 -6 L4 4 L0 2 L-4 4 Z" fill="#3d7bff" />
        </g>
      </svg>
      {ZONES.map((z) => (
        <button
          key={z.id}
          type="button"
          onClick={() => worldUi.open(z.id)}
          aria-label={`Open ${z.label}`}
          title={z.label}
          className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-ink font-mono text-[0.55rem] text-muted hover:border-accent hover:text-fg"
          style={{ left: SIZE / 2 + z.x * scale, top: SIZE / 2 + z.z * scale }}
        >
          {Number(z.index)}
        </button>
      ))}
    </div>
  )
}
