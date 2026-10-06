// Point clouds for each section, in SECTION_IDS order. Every shape has the same point count
// so shaders can morph between any two by index.
//   0 Hero        neural network
//   1 Experience  briefcase
//   2 Projects    </> code brackets
//   3 Skills      gear whose 5 tooth sectors are the 5 skill groups
//   4 Education   graduation cap
//   5 Contact     paper plane with a flight trail

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
const lerp3 = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

export function buildShapes(n: number) {
  const r = mulberry32(1337)
  const gauss = () => {
    let u = 0
    while (!u) u = r()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r())
  }
  const jitter = (v: V, s: number): V => [v[0] + gauss() * s, v[1] + gauss() * s, v[2] + gauss() * s]

  /** Point on the surface of a sphere. */
  const onSphere = (c: V, rad: number): V => {
    const u = r() * 2 - 1
    const a = r() * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    return [c[0] + rad * s * Math.cos(a), c[1] + rad * u, c[2] + rad * s * Math.sin(a)]
  }

  /** Point in a uniformly random triangle. */
  const onTri = (a: V, b: V, c: V): V => {
    let u = r()
    let v = r()
    if (u + v > 1) {
      u = 1 - u
      v = 1 - v
    }
    return [
      a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v,
      a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v,
      a[2] + (b[2] - a[2]) * u + (c[2] - a[2]) * v,
    ]
  }

  const shapes = Array.from({ length: SHAPE_COUNT }, () => new Float32Array(n * 3))
  const seed = new Float32Array(n)
  const accent = new Float32Array(n)
  const role = new Float32Array(n)
  const skill = new Float32Array(n)

  const put = (s: number, i: number, v: V) => {
    shapes[s][i * 3] = v[0]
    shapes[s][i * 3 + 1] = v[1]
    shapes[s][i * 3 + 2] = v[2]
  }

  // --- neural network topology
  const layerX = [-2.4, -0.8, 0.8, 2.4]
  const layerN = [4, 6, 6, 3]
  const nodes: V[][] = layerX.map((x, l) =>
    Array.from({ length: layerN[l] }, (_, k) => [x, (k - (layerN[l] - 1) / 2) * 0.78, 0] as V),
  )
  const allNodes = nodes.flat()
  const edges: [V, V][] = []
  for (let l = 0; l < nodes.length - 1; l++) for (const a of nodes[l]) for (const b of nodes[l + 1]) edges.push([a, b])

  // --- </> strokes
  const strokes: [V, V][] = [
    [[-1.2, 0.95, 0], [-2.25, 0, 0]],
    [[-2.25, 0, 0], [-1.2, -0.95, 0]],
    [[0.5, 1.2, 0], [-0.5, -1.2, 0]],
    [[1.2, 0.95, 0], [2.25, 0, 0]],
    [[2.25, 0, 0], [1.2, -0.95, 0]],
  ]
  const strokeLen = strokes.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]))
  const strokeTotal = strokeLen.reduce((a, b) => a + b, 0)

  // --- paper plane
  const N: V = [2.3, 0.15, 0]
  const T: V = [-1.5, 0.15, 0]
  const K: V = [-1.5, -0.55, 0]
  const WL: V = [-1.6, 0.45, 1.45]
  const WR: V = [-1.6, 0.45, -1.45]
  const planeEdges: [V, V][] = [
    [N, WL],
    [WL, T],
    [N, WR],
    [WR, T],
    [N, K],
    [K, T],
  ]

  // --- graduation cap
  const BOARD_Y = 0.55
  const HALF_DIAG = 1.4 * Math.SQRT2
  const corners: V[] = [
    [HALF_DIAG, BOARD_Y, 0],
    [0, BOARD_Y, HALF_DIAG],
    [-HALF_DIAG, BOARD_Y, 0],
    [0, BOARD_Y, -HALF_DIAG],
  ]

  const CASE_W = 3.6
  const CASE_H = 2.4
  const CASE_D = 1.0
  const CASE_R = 0.28
  const CASE_Y = -0.35
  /** Point on the perimeter of a rounded rectangle centred at the origin. */
  const onRoundedRect = (w: number, h: number, rad: number): [number, number] => {
    const sw = w - 2 * rad
    const sh = h - 2 * rad
    const arc = (Math.PI / 2) * rad
    const total = 2 * sw + 2 * sh + 4 * arc
    let t = r() * total
    if (t < sw) return [-sw / 2 + t, h / 2]
    t -= sw
    if (t < sw) return [-sw / 2 + t, -h / 2]
    t -= sw
    if (t < sh) return [w / 2, -sh / 2 + t]
    t -= sh
    if (t < sh) return [-w / 2, -sh / 2 + t]
    t -= sh
    const q = Math.floor(t / arc)
    const a = (t - q * arc) / rad + (q * Math.PI) / 2
    const cx = q === 0 || q === 3 ? sw / 2 : -sw / 2
    const cy = q < 2 ? sh / 2 : -sh / 2
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]
  }

  const GEAR_TEETH = 10
  const gearProfile = (a: number) => {
    const p = (((a / (Math.PI * 2)) * GEAR_TEETH) % 1 + 1) % 1
    const tooth = smooth(0.04, 0.12, p) * (1 - smooth(0.38, 0.46, p))
    return 1.55 + 0.42 * tooth
  }

  for (let i = 0; i < n; i++) {
    seed[i] = r()
    accent[i] = r() < 0.06 ? 1 : 0
    role[i] = -1
    skill[i] = -1

    // 0 — Neural network
    {
      let p: V
      if (r() < 0.42) {
        p = onSphere(allNodes[Math.floor(r() * allNodes.length)], 0.17)
      } else {
        const [a, b] = edges[Math.floor(r() * edges.length)]
        p = jitter(lerp3(a, b, r()), 0.012)
      }
      put(0, i, rotX(rotY(p, -0.4), 0.06))
    }

    // 1 — Briefcase. Roles are spread across it so hovering a role makes the case sparkle.
    {
      role[i] = i % ROLE_SLABS
      const kind = r()
      let p: V
      if (kind < 0.3) {
        // front and back outlines
        const [x, y] = onRoundedRect(CASE_W, CASE_H, CASE_R)
        p = [x, CASE_Y + y, r() < 0.5 ? CASE_D / 2 : -CASE_D / 2]
      } else if (kind < 0.45) {
        // side walls
        const [x, y] = onRoundedRect(CASE_W, CASE_H, CASE_R)
        p = [x, CASE_Y + y, (r() - 0.5) * CASE_D]
      } else if (kind < 0.62) {
        // front face, sparse
        p = [(r() - 0.5) * (CASE_W - 0.1), CASE_Y + (r() - 0.5) * (CASE_H - 0.1), CASE_D / 2]
      } else if (kind < 0.72) {
        // lid seam wrapping the front and sides
        const seamY = CASE_Y + CASE_H / 2 - 0.7
        const t = r()
        p =
          t < 0.6
            ? [(r() - 0.5) * CASE_W, seamY, CASE_D / 2]
            : [(t < 0.8 ? 1 : -1) * (CASE_W / 2), seamY, (r() - 0.5) * CASE_D]
      } else if (kind < 0.8) {
        // two clasps on the seam
        accent[i] = 1
        const side = r() < 0.5 ? -1 : 1
        const seamY = CASE_Y + CASE_H / 2 - 0.7
        const [x, y] = onRoundedRect(0.38, 0.3, 0.06)
        p = [side * 1.05 + x, seamY + y, CASE_D / 2 + 0.03]
      } else {
        // handle: a rounded arch tube above the lid, with two mounts
        const t = r()
        const top = CASE_Y + CASE_H / 2
        if (t < 0.15) {
          const side = r() < 0.5 ? -1 : 1
          p = jitter([side * 0.62 + (r() - 0.5) * 0.22, top + 0.04, (r() - 0.5) * 0.3], 0.01)
        } else {
          const u = r()
          const ang = Math.PI * u
          const cx = -Math.cos(ang) * 0.62
          const cy = top + Math.sin(ang) * 0.55
          const tube = 0.08
          const a2 = r() * Math.PI * 2
          p = [cx - Math.cos(ang) * Math.cos(a2) * tube, cy + Math.sin(ang) * Math.cos(a2) * tube, Math.sin(a2) * tube]
        }
      }
      put(1, i, rotX(rotY(p, -0.42), 0.12))
    }

    // 2 — </> code brackets, extruded
    {
      let pick = r() * strokeTotal
      let s = 0
      while (pick > strokeLen[s] && s < strokes.length - 1) pick -= strokeLen[s++]
      const [a, b] = strokes[s]
      const t = r()
      const dx = (b[0] - a[0]) / strokeLen[s]
      const dy = (b[1] - a[1]) / strokeLen[s]
      let u = (r() * 2 - 1) * 0.15
      let z = (r() * 2 - 1) * 0.3
      if (r() < 0.65) {
        if (r() < 0.5) u = Math.sign(u || 1) * 0.15
        else z = Math.sign(z || 1) * 0.3
      }
      const p: V = [a[0] + (b[0] - a[0]) * t - dy * u, a[1] + (b[1] - a[1]) * t + dx * u, z]
      put(2, i, rotX(rotY(p, -0.35), 0.08))
    }

    // 3 — Gear, one tooth sector per skill group
    {
      const a = r() * Math.PI * 2
      skill[i] = Math.min(SKILL_ARMS - 1, Math.floor((a / (Math.PI * 2)) * SKILL_ARMS))
      const outer = gearProfile(a)
      const hole = 0.55
      const T2 = 0.3
      const kind = r()
      let rad: number
      let z: number
      if (kind < 0.35) {
        rad = outer
        z = (r() * 2 - 1) * T2
      } else if (kind < 0.55) {
        rad = outer
        z = r() < 0.5 ? T2 : -T2
      } else if (kind < 0.68) {
        rad = hole
        z = (r() * 2 - 1) * T2
      } else {
        rad = Math.sqrt(hole * hole + r() * (outer * outer - hole * hole))
        z = r() < 0.5 ? T2 : -T2
      }
      put(3, i, rotY(rotX([Math.cos(a) * rad, Math.sin(a) * rad, z], 0.45), -0.5))
    }

    // 4 — Graduation cap
    {
      const kind = r()
      let p: V
      if (kind < 0.22) {
        const c = Math.floor(r() * 4)
        p = jitter(lerp3(corners[c], corners[(c + 1) % 4], r()), 0.008)
      } else if (kind < 0.42) {
        const u = r() * 2 - 1
        const v = r() * 2 - 1
        p = rotY([u * 1.4, BOARD_Y + (r() < 0.5 ? 0.05 : -0.05), v * 1.4], Math.PI / 4)
      } else if (kind < 0.72) {
        const a = r() * Math.PI * 2
        const y = -0.45 + r() * 0.95
        const rad = 1.0 + ((y + 0.45) / 0.95) * 0.05
        p = [Math.cos(a) * rad, y, Math.sin(a) * rad * 0.92]
      } else if (kind < 0.8) {
        const a = r() * Math.PI * 2
        p = [Math.cos(a) * 1.0, -0.45, Math.sin(a) * 0.92]
      } else if (kind < 0.83) {
        p = onSphere([0, BOARD_Y + 0.08, 0], 0.1)
      } else {
        // tassel: cord to a corner, a hanging strand, then a fringe
        accent[i] = 1
        const corner = corners[0]
        const t = r()
        if (t < 0.3) p = jitter(lerp3([0, BOARD_Y + 0.08, 0], [corner[0], BOARD_Y + 0.06, 0], t / 0.3), 0.01)
        else if (t < 0.65) p = jitter([corner[0], BOARD_Y - ((t - 0.3) / 0.35) * 1.05, 0], 0.012)
        else {
          const y = BOARD_Y - 1.05 - r() * 0.45
          const spread = 0.04 + ((BOARD_Y - 1.05 - y) / 0.45) * 0.12
          p = [corner[0] + (r() - 0.5) * spread * 2, y, (r() - 0.5) * spread * 2]
        }
      }
      put(4, i, rotY(rotX(p, 0.42), -0.3))
    }

    // 5 — Paper plane with a dotted trail
    {
      const kind = r()
      let p: V
      if (kind < 0.25) p = onTri(N, T, WL)
      else if (kind < 0.5) p = onTri(N, T, WR)
      else if (kind < 0.64) p = onTri(N, T, K)
      else if (kind < 0.86) {
        const [a, b] = planeEdges[Math.floor(r() * planeEdges.length)]
        p = jitter(lerp3(a, b, r()), 0.01)
      } else {
        accent[i] = r() < 0.5 ? 1 : accent[i]
        const s = Math.floor(r() * 26) / 26
        p = jitter([-1.8 - s * 2.2, 0.1 - s * 0.5 + Math.sin(s * 7) * 0.18 * s, s * 0.35], 0.025)
      }
      put(5, i, rotX(rotZ(rotY(p, 0.55), 0.26), -0.12))
    }
  }

  return { shapes, seed, accent, role, skill }
}

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
