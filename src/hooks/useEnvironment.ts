import { useEffect, useState } from 'react'

function query(q: string) {
  return typeof window !== 'undefined' && window.matchMedia(q).matches
}

export function useMediaQuery(q: string) {
  const [match, setMatch] = useState(() => query(q))
  useEffect(() => {
    const mql = window.matchMedia(q)
    const on = () => setMatch(mql.matches)
    mql.addEventListener('change', on)
    return () => mql.removeEventListener('change', on)
  }, [q])
  return match
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
/** Touch-first or small screens get the lightweight scene. */
export const useLiteMode = () => useMediaQuery('(max-width: 767px), (pointer: coarse)')
export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)')

export function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
