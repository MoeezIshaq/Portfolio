import { nav } from '../content'

export type ZoneId = (typeof nav)[number]['id']

export type Zone = { id: ZoneId; label: string; index: string; shape: number; x: number; z: number }

const LAYOUT: Record<ZoneId, { shape: number; x: number; z: number }> = {
  experience: { shape: 1, x: -18, z: -20 },
  projects: { shape: 2, x: 18, z: -20 },
  skills: { shape: 3, x: 28, z: 8 },
  education: { shape: 4, x: 0, z: 28 },
  contact: { shape: 5, x: -28, z: 8 },
}

export const ZONES: Zone[] = nav.map((n, i) => ({
  id: n.id,
  label: n.label,
  index: String(i + 1).padStart(2, '0'),
  ...LAYOUT[n.id],
}))

export const HUB = { x: 0, z: 0, radius: 7 }
export const SPAWN = { x: 0, z: 12, heading: Math.PI }
export const WORLD_RADIUS = 48
export const ZONE_RADIUS = 6
export const MONOLITH_RADIUS = 0.75

function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax
  const dz = bz - az
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz))
}

/** Obstacles placed away from pads and the hub-to-zone roads. Shared by renderer and collision. */
export const MONOLITHS: { x: number; z: number; h: number }[] = (() => {
  const r = mulberry32(42)
  const out: { x: number; z: number; h: number }[] = []
  let guard = 0
  while (out.length < 16 && guard++ < 2000) {
    const a = r() * Math.PI * 2
    const d = 11 + r() * 33
    const x = Math.cos(a) * d
    const z = Math.sin(a) * d
    if (Math.hypot(x - SPAWN.x, z - SPAWN.z) < 8) continue
    if (ZONES.some((zn) => Math.hypot(x - zn.x, z - zn.z) < ZONE_RADIUS + 4)) continue
    if (ZONES.some((zn) => distToSegment(x, z, 0, 0, zn.x, zn.z) < 4)) continue
    if (out.some((m) => Math.hypot(x - m.x, z - m.z) < 5)) continue
    out.push({ x, z, h: 1.8 + r() * 4.5 })
  }
  return out
})()

/** One boost pad per road, halfway between the hub and the zone, pointing toward the zone. */
export const BOOSTS = ZONES.map((z) => {
  const len = Math.hypot(z.x, z.z)
  const dx = z.x / len
  const dz = z.z / len
  const mid = (HUB.radius + (len - ZONE_RADIUS)) / 2
  return { x: dx * mid, z: dz * mid, dx, dz }
})
