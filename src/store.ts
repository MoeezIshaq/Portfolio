// Mutable state read by the 3D scene every frame. Mutating it avoids React re-renders on scroll.
export const SECTION_IDS = ['top', 'experience', 'projects', 'skills', 'education', 'contact'] as const

export const scene = {
  /** Continuous section position: 0 = hero, 1 = experience, ... */
  section: 0,
  mouse: { x: 0, y: 0 },
  mouseActive: false,
  activeRole: -1,
  activeSkill: -1,
  invalidate: null as null | (() => void),
  sceneReady: false,
  /** performance.now() when the intro assembly should begin; 0 = not yet. */
  introAt: 0,
  particles: 0,
  fps: 0,
  /** 0–1 document scroll progress, for the HUD. */
  progress: 0,
}

let activeIndex = 0
const listeners = new Set<() => void>()

export const activeSection = {
  get: () => activeIndex,
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}

function computeSection() {
  const vh = window.innerHeight
  const tops = SECTION_IDS.map((id) => document.getElementById(id)?.getBoundingClientRect().top ?? Infinity)

  // Camera sits on a section's waypoint as its heading reaches the top of the viewport,
  // then drifts toward the next one, so 3D objects scroll in step with their content.
  const probe = vh * 0.2
  const starts = tops.map((t, i) => (i === 0 ? t + probe : t))
  let f = 0
  for (let i = 0; i < starts.length; i++) {
    if (probe < starts[i]) break
    const next = starts[i + 1] ?? starts[i] + vh
    f = i + Math.min(1, (probe - starts[i]) / Math.max(1, next - starts[i]))
  }
  scene.section = Math.min(f, SECTION_IDS.length - 1)
  const max = document.documentElement.scrollHeight - vh
  scene.progress = max > 0 ? Math.min(1, window.scrollY / max) : 0

  let idx = 0
  tops.forEach((t, i) => {
    if (t <= vh * 0.45) idx = i
  })
  if (idx !== activeIndex) {
    activeIndex = idx
    listeners.forEach((l) => l())
  }
  scene.invalidate?.()
}

export function startTracking() {
  let queued = false
  const onScroll = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      computeSection()
    })
  }
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    scene.mouseActive = true
    scene.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    scene.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  const onLeave = () => {
    scene.mouseActive = false
  }
  window.addEventListener('pointermove', onPointer, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  computeSection()
  return () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    window.removeEventListener('pointermove', onPointer)
    document.documentElement.removeEventListener('pointerleave', onLeave)
  }
}

export function setHighlight(key: 'activeRole' | 'activeSkill', value: number) {
  scene[key] = value
  scene.invalidate?.()
}
