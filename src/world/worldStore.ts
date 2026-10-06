import type { ZoneId } from './zones'
import { SPAWN } from './zones'

type Key = 'up' | 'down' | 'left' | 'right' | 'drift'

/** Mutable per-frame state shared by the world canvas and its HTML overlay. */
export const world = {
  input: { keys: new Set<Key>(), joyX: 0, joyY: 0 },
  car: { x: SPAWN.x, z: SPAWN.z, heading: SPAWN.heading, speed: 0, slip: 0, boost: 0 },
  resetRequested: false,
  moved: false,
}

let active: ZoneId | null = null
let open: ZoneId | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const worldUi = {
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  getActive: () => active,
  getOpen: () => open,
  setActive(id: ZoneId | null) {
    if (id === active) return
    active = id
    emit()
  },
  open(id: ZoneId) {
    open = id
    world.input.keys.clear()
    world.input.joyX = 0
    world.input.joyY = 0
    emit()
  },
  close() {
    open = null
    emit()
  },
}

export type { Key }
