import { useCallback, useEffect, useState } from 'react'
import { Background } from './components/Background'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Experience } from './components/Experience'
import { Projects } from './components/Projects'
import { Skills } from './components/Skills'
import { Education } from './components/Education'
import { Contact } from './components/Contact'
import { Hud } from './components/Hud'
import { Loader, startIntro } from './components/Loader'
import { WorldUI } from './components/world/WorldUI'
import { hasWebGL } from './hooks/useEnvironment'
import { useReveal } from './hooks/useReveal'
import { SECTION_IDS, startTracking } from './store'

type Mode = 'world' | 'classic'
const SEEN_KEY = 'intro-seen'
const MODE_KEY = 'mode'

function initialMode(): Mode {
  if (!hasWebGL()) return 'classic'
  // Deep links to a section go straight to the readable site.
  const hash = location.hash.slice(1)
  if (hash && (SECTION_IDS as readonly string[]).includes(hash) && hash !== 'top') return 'classic'
  try {
    const saved = sessionStorage.getItem(MODE_KEY)
    if (saved === 'world' || saved === 'classic') return saved
  } catch {
    /* storage unavailable */
  }
  return 'world'
}

function shouldPlayIntro() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    return !sessionStorage.getItem(SEEN_KEY)
  } catch {
    return true
  }
}

function ClassicSite({ onWorld }: { onWorld?: () => void }) {
  useReveal()
  useEffect(() => startTracking(), [])
  return (
    <>
      <Background />
      <Header onWorld={onWorld} />
      <main id="main" tabIndex={-1} className="relative z-10 outline-none">
        <Hero />
        <Experience />
        <Projects />
        <Skills />
        <Education />
        <Contact />
      </main>
      <Hud />
    </>
  )
}

export default function App() {
  const [mode, setModeState] = useState<Mode>(initialMode)
  const [intro, setIntro] = useState(shouldPlayIntro)

  useEffect(() => {
    if (!intro) startIntro()
  }, [intro])

  const setMode = useCallback((m: Mode) => {
    try {
      sessionStorage.setItem(MODE_KEY, m)
    } catch {
      /* storage unavailable */
    }
    window.scrollTo(0, 0)
    setModeState(m)
  }, [])

  const finishIntro = useCallback(() => {
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* storage unavailable */
    }
    setIntro(false)
  }, [])

  return (
    <>
      <a
        href={mode === 'world' ? '#' : '#main'}
        onClick={(e) => {
          if (mode === 'world') {
            e.preventDefault()
            setMode('classic')
          }
        }}
        className="fixed left-4 top-3 z-[90] -translate-y-20 bg-accent px-3 py-2 text-sm font-medium text-ink focus:translate-y-0"
      >
        {mode === 'world' ? 'Skip to classic site' : 'Skip to content'}
      </a>
      {intro && <Loader onDone={finishIntro} />}
      {mode === 'world' ? (
        <WorldUI onClassic={() => setMode('classic')} />
      ) : (
        <ClassicSite onWorld={hasWebGL() ? () => setMode('world') : undefined} />
      )}
      <div className="grain" aria-hidden="true" />
    </>
  )
}
