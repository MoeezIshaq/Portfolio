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
import { useReveal } from './hooks/useReveal'
import { startTracking } from './store'

const SEEN_KEY = 'intro-seen'

function shouldPlayIntro() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    return !sessionStorage.getItem(SEEN_KEY)
  } catch {
    return true
  }
}

export default function App() {
  const [intro, setIntro] = useState(shouldPlayIntro)
  useReveal()
  useEffect(() => startTracking(), [])
  useEffect(() => {
    if (!intro) startIntro()
  }, [intro])

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
        href="#main"
        className="fixed left-4 top-3 z-[90] -translate-y-20 bg-accent px-3 py-2 text-sm font-medium text-ink focus:translate-y-0"
      >
        Skip to content
      </a>
      {intro && <Loader onDone={finishIntro} />}
      <Background />
      <Header />
      <main id="main" tabIndex={-1} className="relative z-10 outline-none">
        <Hero />
        <Experience />
        <Projects />
        <Skills />
        <Education />
        <Contact />
      </main>
      <Hud />
      <div className="grain" aria-hidden="true" />
    </>
  )
}
