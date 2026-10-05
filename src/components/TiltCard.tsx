import { useRef, type ReactNode } from 'react'
import { useFinePointer, useReducedMotion } from '../hooks/useEnvironment'

type Props = {
  as?: 'article' | 'div'
  className?: string
  children: ReactNode
  onActive?: (active: boolean) => void
  max?: number
}

/** Card with a restrained pointer-driven 3D tilt. Inert for touch and reduced motion. */
export function TiltCard({ as: Tag = 'article', className = '', children, onActive, max = 3.5 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const enabled = fine && !reduced

  const onMove = (e: React.PointerEvent) => {
    if (!enabled || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ref.current.style.transform = `perspective(1200px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateZ(0)`
  }
  const reset = () => {
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <Tag
      ref={ref}
      className={`tilt ${className}`}
      onPointerMove={onMove}
      onPointerEnter={() => onActive?.(true)}
      onPointerLeave={() => {
        reset()
        onActive?.(false)
      }}
      onFocus={() => onActive?.(true)}
      onBlur={(e: React.FocusEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onActive?.(false)
      }}
    >
      {children}
    </Tag>
  )
}
