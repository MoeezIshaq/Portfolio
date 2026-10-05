// Point clouds for each section, in SECTION_IDS order. Every shape has the same point count
// so the shader can morph between any two by index.

export const SHAPE_COUNT = 6
export const SKILL_ARMS = 5
export const ROLE_SLABS = 3

function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type V = [number, number, number]

const rotX = ([x, y, z]: V, a: number): V => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)]
const rotY = ([x, y, z]: V, a: number): V => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]
const rotZ = ([x, y, z]: V, a: number): V => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z]

export function buildShapes(n: number) {
  const r = mulberry32(1337)
  const gauss = () => {
    let u = 0
    while (!u) u = r()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r())
  }

  const shapes = Array.from({ length: SHAPE_COUNT }, () => new Float32Array(n * 3))
  const seed = new Float32Array(n)
  const accent = new Float32Array(n)
  const role = new Float32Array(n)
  const skill = new Float32Array(n)

  const sphereCount = Math.floor(n * 0.7)
  const golden = Math.PI * (1 + Math.sqrt(5))
  const lineLengths = [0.45, 1, 0.85, 0.7, 0.5]
  const grid = [-1.65, -0.55, 0.55, 1.65]

  const put = (s: number, i: number, v: V) => {
    shapes[s][i * 3] = v[0]
    shapes[s][i * 3 + 1] = v[1]
    shapes[s][i * 3 + 2] = v[2]
  }

  for (let i = 0; i < n; i++) {
    seed[i] = r()
    accent[i] = r() < 0.06 ? 1 : 0

    // 0 — Hero: data globe with a tilted ring
    if (i < sphereCount) {
      const t = (i + 0.5) / sphereCount
      const inc = Math.acos(1 - 2 * t)
      const az = golden * i
      const R = 2.05 + gauss() * 0.025
      put(0, i, [R * Math.sin(inc) * Math.cos(az), R * Math.cos(inc), R * Math.sin(inc) * Math.sin(az)])
    } else {
      const a = r() * Math.PI * 2
      const rr = 2.75 + Math.pow(r(), 2) * 0.9
      put(0, i, rotZ(rotX([Math.cos(a) * rr, gauss() * 0.025, Math.sin(a) * rr], 1.25), -0.35))
    }

    // 1 — Experience: three stacked document slabs, one per role
    {
      const k = i % ROLE_SLABS
      role[i] = k
      const W = 1.6
      const H = 1.0
      let x: number
      let y: number
      const kind = r()
      if (kind < 0.3) {
        const e = Math.floor(r() * 4)
        const u = r() * 2 - 1
        ;[x, y] = e === 0 ? [u * W, H] : e === 1 ? [u * W, -H] : e === 2 ? [W, u * H] : [-W, u * H]
      } else if (kind < 0.55) {
        const L = Math.floor(r() * lineLengths.length)
        x = (-0.82 + r() * 1.64 * lineLengths[L]) * W
        y = (0.62 - L * 0.3) * H
      } else {
        x = (r() * 2 - 1) * W * 0.98
        y = (r() * 2 - 1) * H * 0.98
      }
      const p: V = [x + (-0.6 + k * 0.6), y + (1.0 - k * 1.0), gauss() * 0.01 + (0.8 - k * 0.8)]
      put(1, i, rotX(rotY(p, -0.55), 0.08))
    }

    // 2 — Projects: torus knot surface
    {
      const t = r() * Math.PI * 2
      const curve = (u: number): V => {
        const rr = Math.cos(3 * u) + 2
        return [rr * Math.cos(2 * u), rr * Math.sin(2 * u), -Math.sin(3 * u)]
      }
      const c = curve(t)
      const c2 = curve(t + 0.001)
      const T: V = [c2[0] - c[0], c2[1] - c[1], c2[2] - c[2]]
      const tl = Math.hypot(...T)
      T[0] /= tl
      T[1] /= tl
      T[2] /= tl
      // Frame from tangent and world Z
      let N: V = [T[1] * 1 - T[2] * 0, T[2] * 0 - T[0] * 1, 0]
      const nl = Math.hypot(...N) || 1
      N = [N[0] / nl, N[1] / nl, N[2] / nl]
      const B: V = [T[1] * N[2] - T[2] * N[1], T[2] * N[0] - T[0] * N[2], T[0] * N[1] - T[1] * N[0]]
      const a = r() * Math.PI * 2
      const tube = 0.42
      const p: V = [
        c[0] + (N[0] * Math.cos(a) + B[0] * Math.sin(a)) * tube,
        c[1] + (N[1] * Math.cos(a) + B[1] * Math.sin(a)) * tube,
        c[2] + (N[2] * Math.cos(a) + B[2] * Math.sin(a)) * tube,
      ]
      put(2, i, rotX([p[0] * 0.68, p[1] * 0.68, p[2] * 0.68], 0.35))
    }

    // 3 — Skills: five-arm spiral galaxy, one arm per skill group
    {
      let p: V
      if (r() < 0.12) {
        skill[i] = -1
        p = [gauss() * 0.28, gauss() * 0.2, gauss() * 0.28]
      } else {
        const k = i % SKILL_ARMS
        skill[i] = k
        const rr = 0.35 + Math.pow(r(), 0.75) * 2.8
        const spread = 0.22 * (1.25 - rr / 3.2)
        const ang = (k / SKILL_ARMS) * Math.PI * 2 + rr * 0.95 + gauss() * spread
        p = [Math.cos(ang) * rr, gauss() * 0.09 * (1.4 - rr / 3.2), Math.sin(ang) * rr]
      }
      put(3, i, rotZ(rotX(p, 1.0), 0.2))
    }

    // 4 — Education: architectural lattice
    {
      const axis = Math.floor(r() * 3)
      const a = grid[Math.floor(r() * 4)] + gauss() * 0.008
      const b = grid[Math.floor(r() * 4)] + gauss() * 0.008
      const c = (r() * 2 - 1) * 1.65
      const p: V = axis === 0 ? [c, a, b] : axis === 1 ? [a, c, b] : [a, b, c]
      put(4, i, rotX(rotY(p, 0.65), 0.45))
    }

    // 5 — Contact: twisting vortex
    {
      const t = r() * 2 - 1
      const line = Math.floor(r() * 56)
      const radius = 0.16 + 2.0 * t * t
      const a = (line / 56) * Math.PI * 2 + t * 2.4 + gauss() * 0.015
      put(5, i, rotZ(rotX([Math.cos(a) * radius, t * 2.4, Math.sin(a) * radius], 0.55), -0.3))
    }
  }

  return { shapes, seed, accent, role, skill }
}
