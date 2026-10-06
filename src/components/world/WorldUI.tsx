import { Component, lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { site } from '../../content'
import { useFinePointer, useLiteMode, useReducedMotion } from '../../hooks/useEnvironment'
import { world, worldUi, type Key } from '../../world/worldStore'
import { ZONES, type ZoneId } from '../../world/zones'
import { Experience } from '../Experience'
import { Projects } from '../Projects'
import { Skills } from '../Skills'
import { Education } from '../Education'
import { Contact } from '../Contact'
import { Minimap } from './Minimap'
import { DriftButton, Joystick } from './Joystick'
import { SpeedOverlay } from './SpeedOverlay'

const WorldCanvas = lazy(() => import('../../world/World'))

const SECTIONS: Record<ZoneId, () => ReactNode> = {
  experience: Experience,
  projects: Projects,
  skills: Skills,
  education: Education,
  contact: Contact,
}

const KEYMAP: Record<string, Key> = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  Space: 'drift',
}

class Boundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onFail()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function useKeyboardDriving() {
  useEffect(() => {
    // A keyboard-focused control keeps its normal Enter/Space behaviour; otherwise keys drive.
    const focusedControl = (t: EventTarget | null) => {
      const el = (t as HTMLElement | null)?.closest?.('button, a, input, textarea, select')
      return !!el && el.matches(':focus-visible')
    }
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (worldUi.getOpen()) {
        if (e.key === 'Escape') worldUi.close()
        return
      }
      if ((e.code === 'Enter' || e.code === 'Space') && focusedControl(e.target)) return
      const k = KEYMAP[e.code]
      if (k) {
        e.preventDefault()
        world.input.keys.add(k)
        return
      }
      if (e.code === 'Enter' || e.code === 'KeyE') {
        const a = worldUi.getActive()
        if (a) {
          e.preventDefault()
          worldUi.open(a)
        }
      } else if (e.code === 'KeyR') {
        world.resetRequested = true
      }
    }
    const up = (e: KeyboardEvent) => {
      const k = KEYMAP[e.code]
      if (!k) return
      world.input.keys.delete(k)
      if (e.code === 'Space' && !focusedControl(e.target)) e.preventDefault()
    }
    const clear = () => world.input.keys.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])
}

function useMoved() {
  const [moved, setMoved] = useState(false)
  useEffect(() => {
    if (moved) return
    const id = window.setInterval(() => world.moved && setMoved(true), 300)
    return () => clearInterval(id)
  }, [moved])
  return moved
}

export function WorldUI({ onClassic }: { onClassic: () => void }) {
  const lite = useLiteMode()
  const reduced = useReducedMotion()
  const fine = useFinePointer()
  const open = useSyncExternalStore(worldUi.subscribe, worldUi.getOpen)
  const active = useSyncExternalStore(worldUi.subscribe, worldUi.getActive)
  const moved = useMoved()
  const [menu, setMenu] = useState(false)
  const [ready, setReady] = useState(false)
  useKeyboardDriving()

  useEffect(() => {
    const start = () => setReady(true)
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(start, { timeout: 600 })
      return () => window.cancelIdleCallback(id)
    }
    const t = setTimeout(start, 100)
    return () => clearTimeout(t)
  }, [])

  const activeZone = ZONES.find((z) => z.id === active)

  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 z-0 bg-ink">
        {ready && (
          <Boundary onFail={onClassic}>
            <Suspense fallback={null}>
              <WorldCanvas lite={lite} reduced={reduced} />
            </Suspense>
          </Boundary>
        )}
      </div>

      {!reduced && <SpeedOverlay />}

      <div
        inert={open !== null}
        className={`pointer-events-none fixed inset-0 z-10 flex flex-col transition-opacity duration-300 ${open ? 'opacity-0' : ''}`}
      >
        {/* Header */}
        <header className="pointer-events-auto flex items-center justify-between px-5 py-4 md:px-10 md:py-6">
          <span className="text-sm font-medium tracking-tight text-fg">
            {site.name}
            <span className="label ml-3 hidden sm:inline">{site.role}</span>
          </span>
          <nav aria-label="Sections" className="hidden items-center gap-6 md:flex">
            {ZONES.map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => worldUi.open(z.id)}
                className={`flex items-baseline gap-1.5 font-mono text-[0.72rem] uppercase tracking-[0.08em] transition-colors ${
                  active === z.id ? 'text-fg' : 'text-muted hover:text-fg'
                }`}
              >
                <span className={active === z.id ? 'text-accent' : 'text-faint'}>{z.index}</span>
                {z.label}
              </button>
            ))}
            <button
              type="button"
              onClick={onClassic}
              className="ml-2 border border-line-strong px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-fg transition-colors hover:border-accent"
            >
              Classic site
            </button>
          </nav>
          <button
            type="button"
            className="label px-2 py-1 text-fg! md:hidden"
            aria-expanded={menu}
            aria-controls="world-menu"
            onClick={() => setMenu((m) => !m)}
          >
            {menu ? 'Close' : 'Sections'}
          </button>
        </header>
        {menu && (
          <nav id="world-menu" aria-label="Sections" className="pointer-events-auto mx-5 border border-line bg-ink/95 md:hidden">
            <ul>
              {ZONES.map((z) => (
                <li key={z.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setMenu(false)
                      worldUi.open(z.id)
                    }}
                    className="flex w-full items-baseline gap-3 border-b border-line px-4 py-3 text-left text-base"
                  >
                    <span className="font-mono text-xs text-accent">{z.index}</span>
                    {z.label}
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={onClassic} className="label w-full px-4 py-3 text-left text-fg!">
                  Classic site →
                </button>
              </li>
            </ul>
          </nav>
        )}

        {/* Hero copy: steps aside once the visitor starts driving */}
        <div
          className={`px-5 pt-4 transition-[opacity,transform] duration-1000 md:px-10 md:pt-8 ${
            moved ? 'pointer-events-none -translate-y-3 opacity-0' : ''
          }`}
        >
          <p className="intro-fade mb-4 flex items-center gap-2.5 font-mono text-xs text-muted" style={{ '--d': '700ms' } as React.CSSProperties}>
            <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
            Currently — {site.status}
          </p>
          <h1
            aria-label={site.name}
            className="text-[clamp(2.75rem,7vw,6.5rem)] font-medium leading-[0.85] tracking-[-0.06em] text-fg"
          >
            {site.name.split(' ').map((word, wi, all) => (
              <span key={word} className="-mb-[0.14em] block overflow-hidden pb-[0.14em]" aria-hidden="true">
                {Array.from(word).map((ch, i) => (
                  <span
                    key={i}
                    className="char"
                    style={{ '--i': all.slice(0, wi).join('').length + i } as React.CSSProperties}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <p
            className="intro-fade mt-5 hidden max-w-sm text-[0.95rem] leading-snug text-muted md:block"
            style={{ '--d': '1000ms' } as React.CSSProperties}
          >
            {site.tagline}
          </p>
        </div>

        <div className="flex-1" />

        {/* Zone prompt */}
        <div className="flex justify-center px-5" aria-live="polite">
          {activeZone && (
            <div className="pointer-events-auto mb-4 flex items-center gap-5 border border-line-strong bg-ink/90 py-3 pl-5 pr-3 shadow-[0_0_0_1px_rgb(236_232_225/0.04)] md:mb-8">
              <span className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-accent">{activeZone.index}</span>
                <span className="text-lg font-medium tracking-tight text-fg">{activeZone.label}</span>
              </span>
              <button
                type="button"
                onClick={() => worldUi.open(activeZone.id)}
                className="flex items-center gap-2 bg-accent px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-fg"
              >
                Open
                {fine && <kbd className="font-mono text-[0.65rem] opacity-70">↵</kbd>}
              </button>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="flex items-end justify-between gap-4 px-5 pb-5 md:px-10 md:pb-8">
          {fine ? (
            <ControlsHint dim={moved} />
          ) : (
            <div className="pointer-events-auto">
              <Joystick />
            </div>
          )}
          <div className="pointer-events-auto flex items-end gap-4">
            {!fine && <DriftButton />}
            <div className="hidden sm:block">
              <Minimap />
            </div>
          </div>
        </div>
      </div>

      {open && <Panel id={open} />}
    </>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center border border-line-strong px-1.5 font-mono text-[0.65rem] text-fg">
      {children}
    </kbd>
  )
}

function ControlsHint({ dim }: { dim: boolean }) {
  return (
    <div
      className={`intro-fade space-y-2 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-muted transition-opacity duration-700 ${
        dim ? 'opacity-40!' : ''
      }`}
      style={{ '--d': '1400ms' } as React.CSSProperties}
    >
      <p className="flex items-center gap-1.5">
        <Kbd>W</Kbd>
        <Kbd>A</Kbd>
        <Kbd>S</Kbd>
        <Kbd>D</Kbd>
        <span className="ml-2">Drive</span>
      </p>
      <p className="flex items-center gap-1.5">
        <Kbd>Space</Kbd>
        <span className="ml-1 mr-3">Drift</span>
        <Kbd>↵</Kbd>
        <span className="ml-1 mr-3">Open</span>
        <Kbd>R</Kbd>
        <span className="ml-1">Reset</span>
      </p>
      <p className="pt-1 normal-case tracking-normal text-faint">
        Follow the light streams to a section. Hit the <span className="text-accent">»</span> pads to boost.
      </p>
    </div>
  )
}

function Panel({ id }: { id: ZoneId }) {
  const Section = SECTIONS[id]
  const zone = ZONES.find((z) => z.id === id)!
  const closeBtn = useRef<HTMLButtonElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeBtn.current?.focus()
    scroller.current?.scrollTo(0, 0)
    return () => prev?.focus?.()
  }, [id])

  return (
    <div
      ref={scroller}
      role="dialog"
      aria-modal="true"
      aria-label={zone.label}
      className="panel fixed inset-0 z-50 overflow-y-auto bg-ink/[0.97]"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ink/95 px-5 py-4 md:px-10">
        <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">
          <span className="text-accent">[{zone.index}]</span> {zone.label}
        </span>
        <div className="flex items-center gap-2">
          {ZONES.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => worldUi.open(z.id)}
              aria-label={`Go to ${z.label}`}
              aria-current={z.id === id ? 'page' : undefined}
              className={`hidden h-7 w-7 items-center justify-center border font-mono text-[0.65rem] sm:flex ${
                z.id === id ? 'border-accent text-fg' : 'border-line text-muted hover:text-fg'
              }`}
            >
              {z.index}
            </button>
          ))}
          <button
            ref={closeBtn}
            type="button"
            onClick={() => worldUi.close()}
            className="ml-3 flex items-center gap-2 border border-line-strong px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-fg hover:border-accent"
          >
            Back to world <span className="text-faint">Esc</span>
          </button>
        </div>
      </div>
      <Section />
    </div>
  )
}
