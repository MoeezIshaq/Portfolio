import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { hasWebGL, useLiteMode, useReducedMotion } from '../hooks/useEnvironment'

const Scene = lazy(() => import('../three/Scene'))

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** Decorative 3D layer. Loads after first paint; the page is fully usable without it. */
export function Background() {
  const lite = useLiteMode()
  const reduced = useReducedMotion()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!hasWebGL()) return
    const start = () => setReady(true)
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(start, { timeout: 1200 })
      return () => window.cancelIdleCallback(id)
    }
    const t = setTimeout(start, 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-ink">
      {ready && (
        <Boundary>
          <Suspense fallback={null}>
            <Scene lite={lite} reduced={reduced} />
          </Suspense>
        </Boundary>
      )}
    </div>
  )
}
