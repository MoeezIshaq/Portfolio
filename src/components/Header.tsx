import { useEffect, useState, useSyncExternalStore } from 'react'
import { nav, site } from '../content'
import { activeSection, SECTION_IDS } from '../store'

export function Header({ onWorld }: { onWorld?: () => void }) {
  const active = useSyncExternalStore(activeSection.subscribe, activeSection.get)
  const activeId = SECTION_IDS[active]
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-ink/90">
      <div className="mx-auto flex h-14 max-w-[88rem] items-center justify-between px-5 md:px-10">
        <a href="#top" className="flex items-baseline gap-3 text-sm font-medium tracking-tight text-fg">
          {site.name}
          <span className="label hidden sm:inline">{site.role}</span>
        </a>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {nav.map((item, i) => {
              const current = activeId === item.id
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={current ? 'location' : undefined}
                    className={`group flex items-baseline gap-1.5 font-mono text-[0.72rem] uppercase tracking-[0.08em] transition-colors ${
                      current ? 'text-fg' : 'text-muted hover:text-fg'
                    }`}
                  >
                    <span className={current ? 'text-accent' : 'text-faint'}>0{i + 1}</span>
                    {item.label}
                  </a>
                </li>
              )
            })}
            {onWorld && (
              <li>
                <button
                  type="button"
                  onClick={onWorld}
                  className="border border-line-strong px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-fg transition-colors hover:border-accent"
                >
                  3D world
                </button>
              </li>
            )}
          </ul>
        </nav>

        <button
          type="button"
          className="label px-2 py-1 text-fg! md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Primary" className="border-t border-line bg-ink md:hidden">
          <ul className="px-5 py-3">
            {nav.map((item, i) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-3 border-b border-line py-3.5 text-lg tracking-tight last:border-0"
                >
                  <span className="font-mono text-xs text-accent">0{i + 1}</span>
                  {item.label}
                </a>
              </li>
            ))}
            {onWorld && (
              <li>
                <button type="button" onClick={onWorld} className="label py-3.5 text-fg!">
                  Enter 3D world →
                </button>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  )
}
