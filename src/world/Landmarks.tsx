import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { site } from '../content'
import { buildShapes } from '../three/shapes'
import { ACCENT, FG, INK } from './palette'
import { world, worldUi } from './worldStore'
import { BOOSTS, HUB, MONOLITHS, MONOLITH_RADIUS, WORLD_RADIUS, ZONES, ZONE_RADIUS } from './zones'

const damp = THREE.MathUtils.damp
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Rotation that points a group's local -Z away from the hub, toward (dx, dz). */
const facingAway = (dx: number, dz: number) => Math.atan2(-dx, -dz)

function useCanvasTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const t = new THREE.CanvasTexture(canvas)
    t.anisotropy = 4
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [w, h])
  useEffect(() => {
    const ctx = (texture.image as HTMLCanvasElement).getContext('2d')!
    const paint = () => {
      ctx.clearRect(0, 0, w, h)
      draw(ctx, w, h)
      texture.needsUpdate = true
    }
    paint()
    document.fonts?.load('500 120px Geist').then(paint).catch(() => {})
    return () => texture.dispose()
  }, [texture, w, h, draw])
  return texture
}

/* ---------------- hub name on the ground ---------------- */

const drawName = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.fillStyle = FG
  ctx.globalAlpha = 0.9
  ctx.font = '500 150px Geist, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(site.name.toUpperCase(), w / 2, h / 2 + 8)
}

export function HubName() {
  const texture = useCanvasTexture(drawName, 2048, 256)
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[HUB.radius - 0.06, HUB.radius, 128]} />
        <meshBasicMaterial color={FG} transparent opacity={0.22} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, HUB.radius + 2.4]}>
        <planeGeometry args={[16, 2]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ---------------- glyphs that stand up as you approach ---------------- */

type Spot = {
  id: string
  shape: number
  x: number
  z: number
  facing: number
  flat: number
  up: number
  lift: number
  back: number
  near: number
  far: number
  label?: { index: string; text: string }
}

const SPOTS: Spot[] = [
  { id: 'hub', shape: 0, x: HUB.x, z: HUB.z, facing: 0, flat: 1.9, up: 1.35, lift: 5.4, back: 0, near: 12, far: 22 },
  ...ZONES.map((z) => {
    const len = Math.hypot(z.x, z.z)
    return {
      id: z.id,
      shape: z.shape,
      x: z.x,
      z: z.z,
      facing: facingAway(z.x / len, z.z / len),
      flat: 1.55,
      up: 1.25,
      lift: 4.6,
      back: 3.4,
      near: 8,
      far: 18,
      label: { index: z.index, text: z.label },
    }
  }),
]

/** Shared so markers (beams, bollards) can follow each glyph's rise. */
export const riseOf: Record<string, number> = {}

const glyphVert = /* glsl */ `
attribute float aSeed;
attribute float aAccent;
uniform float uTime;
uniform float uPixelRatio;
uniform float uRise;
uniform float uActive;
uniform float uFlat;
uniform float uUp;
uniform float uLift;
uniform float uBack;
varying float vA;
varying float vHot;
varying float vFlat;
void main() {
  vec3 p = position;
  // Each particle lifts on its own schedule, so the symbol assembles rather than translating.
  float st = clamp((uRise - aSeed * 0.45) / 0.55, 0.0, 1.0);
  st = st * st * (3.0 - 2.0 * st);
  vec3 flatP = vec3(p.x * uFlat, 0.05 + aSeed * 0.03, -p.y * uFlat);
  vec3 upP = p * uUp + vec3(0.0, uLift, -uBack);
  vec3 q = mix(flatP, upP, st);
  float arc = sin(3.14159 * st);
  q.y += arc * (1.0 + aSeed * 2.2);
  q.xz += vec2(sin(aSeed * 40.0), cos(aSeed * 40.0)) * arc * 0.9;
  float s = aSeed * 6.2831;
  q += vec3(sin(uTime * 0.6 + s * 3.0), cos(uTime * 0.5 + s * 5.0), sin(uTime * 0.55 + s * 7.0)) * 0.045 * st;
  vec4 mv = modelViewMatrix * vec4(q, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = mix(1.0, 2.3, fract(aSeed * 7.13)) * uPixelRatio * (26.0 / -mv.z) * (1.0 + uActive * 0.3) * mix(1.7, 1.0, st);
  vA = smoothstep(110.0, 18.0, -mv.z) * smoothstep(3.0, 9.0, -mv.z);
  vHot = max(aAccent, uActive * step(0.55, fract(aSeed * 3.7)));
  vFlat = 1.0 - st;
}
`
const glyphFrag = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uAccent;
uniform float uActive;
varying float vA;
varying float vHot;
varying float vFlat;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 1.6);
  vec3 c = mix(uColor, uAccent, max(vHot, vFlat * 0.6));
  gl_FragColor = vec4(c, a * vA * (0.6 + uActive * 0.4 + vFlat * 0.35));
}
`

const drawSign = (index: string, text: string) => (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.fillStyle = 'rgba(13,12,11,0.82)'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(236,232,225,0.35)'
  ctx.lineWidth = 3
  ctx.strokeRect(1.5, 1.5, w - 3, h - 3)
  ctx.fillStyle = ACCENT
  ctx.fillRect(0, h - 10, w, 10)
  ctx.textBaseline = 'middle'
  ctx.font = '500 64px "Geist Mono", ui-monospace, monospace'
  ctx.fillStyle = ACCENT
  ctx.fillText(index, 48, h / 2)
  ctx.font = '500 104px Geist, system-ui, sans-serif'
  ctx.fillStyle = FG
  ctx.fillText(text.toUpperCase(), 170, h / 2 + 4)
}

function Sign({ spot, group }: { spot: Spot; group: React.RefObject<THREE.Group | null> }) {
  const draw = useMemo(() => drawSign(spot.label!.index, spot.label!.text), [spot])
  const texture = useCanvasTexture(draw, 1024, 220)
  const ref = useRef<THREE.Mesh>(null)
  const q = useMemo(() => new THREE.Quaternion(), [])
  useFrame(({ camera, clock }) => {
    const m = ref.current
    const g = group.current
    if (!m || !g) return
    const rise = riseOf[spot.id] ?? 0
    // Hovers just above the flat glyph, then floats up with the standing sculpture.
    m.position.set(0, 2.6 + rise * (spot.lift + 3.4 - 2.6) + Math.sin(clock.elapsedTime * 0.9) * 0.12, -spot.back * rise)
    q.copy(g.quaternion).invert().multiply(camera.quaternion)
    m.quaternion.copy(q)
  })
  return (
    <mesh ref={ref}>
      <planeGeometry args={[6.4, 1.375]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

export function ZoneGlyphs({ count, animate }: { count: number; animate: boolean }) {
  const gl = useThree((s) => s.gl)
  const items = useMemo(() => {
    const s = buildShapes(count)
    return SPOTS.map((spot) => {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(s.shapes[spot.shape], 3))
      geometry.setAttribute('aSeed', new THREE.BufferAttribute(s.seed, 1))
      geometry.setAttribute('aAccent', new THREE.BufferAttribute(s.accent, 1))
      const material = new THREE.ShaderMaterial({
        vertexShader: glyphVert,
        fragmentShader: glyphFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uRise: { value: 0 },
          uActive: { value: 0 },
          uFlat: { value: spot.flat },
          uUp: { value: spot.up },
          uLift: { value: spot.lift },
          uBack: { value: spot.back },
          uColor: { value: new THREE.Color(FG) },
          uAccent: { value: new THREE.Color(ACCENT) },
        },
      })
      return { spot, geometry, material }
    })
  }, [count])

  useEffect(
    () => () =>
      items.forEach((i) => {
        i.geometry.dispose()
        i.material.dispose()
      }),
    [items],
  )

  const groups = useRef<(THREE.Group | null)[]>([])
  const groupRefs = useMemo(() => items.map((_, i) => ({ get current() { return groups.current[i] } })), [items])

  useFrame(({ clock }, dt) => {
    const d = Math.min(dt, 0.05)
    const active = worldUi.getActive()
    const c = world.car
    for (const it of items) {
      const u = it.material.uniforms
      const target = smoothstep(it.spot.far, it.spot.near, Math.hypot(c.x - it.spot.x, c.z - it.spot.z))
      u.uRise.value = animate ? damp(u.uRise.value, target, 1.8, d) : target
      riseOf[it.spot.id] = u.uRise.value
      u.uActive.value = damp(u.uActive.value, active === it.spot.id ? 1 : 0, 5, d)
      u.uPixelRatio.value = gl.getPixelRatio()
      if (animate) u.uTime.value = clock.elapsedTime
    }
    if (animate)
      groups.current.forEach((g, i) => {
        // Slow turn once standing; flat glyphs stay aligned with the road.
        const inner = g?.children[0]
        if (inner) inner.rotation.y = Math.sin(clock.elapsedTime * 0.25 + i) * 0.35 * items[i].material.uniforms.uRise.value
      })
  })

  return (
    <>
      {items.map((it, i) => (
        <group
          key={it.spot.id}
          position={[it.spot.x, 0, it.spot.z]}
          rotation={[0, it.spot.facing, 0]}
          ref={(el) => {
            groups.current[i] = el
          }}
        >
          <group>
            <points geometry={it.geometry} material={it.material} frustumCulled={false} />
          </group>
          {it.spot.label && <Sign spot={it.spot} group={groupRefs[i]} />}
        </group>
      ))}
    </>
  )
}

/* ---------------- zone markers: bollard ring + light beam ---------------- */

const BOLLARDS = 14

export function ZoneMarkers({ animate }: { animate: boolean }) {
  const post = useMemo(() => new THREE.BoxGeometry(0.16, 0.7, 0.16), [])
  const cap = useMemo(() => new THREE.BoxGeometry(0.22, 0.09, 0.22), [])
  const zones = useMemo(
    () =>
      SPOTS.filter((s) => s.label).map((s) => ({
        spot: s,
        capMat: new THREE.MeshBasicMaterial({ color: FG, transparent: true, opacity: 0.5 }),
        beamMat: new THREE.MeshBasicMaterial({
          color: ACCENT,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
        haloMat: new THREE.MeshBasicMaterial({
          color: ACCENT,
          transparent: true,
          opacity: 0.035,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      })),
    [],
  )
  const accent = useMemo(() => new THREE.Color(ACCENT), [])
  const fg = useMemo(() => new THREE.Color(FG), [])

  useFrame(({ clock }, dt) => {
    const d = Math.min(dt, 0.05)
    const active = worldUi.getActive()
    for (const z of zones) {
      const on = active === z.spot.id
      z.capMat.color.lerp(on ? accent : fg, 1 - Math.exp(-8 * d))
      z.capMat.opacity = damp(z.capMat.opacity, on ? 1 : 0.5, 6, d)
      const pulse = animate ? 0.5 + 0.5 * Math.sin(clock.elapsedTime * 2.2) : 1
      z.beamMat.opacity = damp(z.beamMat.opacity, on ? 0.45 : 0.14 + 0.05 * pulse, 4, d)
      z.haloMat.opacity = damp(z.haloMat.opacity, on ? 0.09 : 0.03, 4, d)
    }
  })

  return (
    <>
      {zones.map(({ spot, capMat, beamMat, haloMat }) => (
        <group key={spot.id} position={[spot.x, 0, spot.z]} rotation={[0, spot.facing, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[ZONE_RADIUS - 0.04, ZONE_RADIUS, 96]} />
            <meshBasicMaterial color={FG} transparent opacity={0.12} />
          </mesh>
          {Array.from({ length: BOLLARDS }, (_, i) => {
            const a = (i / BOLLARDS) * Math.PI * 2
            const x = Math.cos(a) * ZONE_RADIUS
            const z = Math.sin(a) * ZONE_RADIUS
            return (
              <group key={i} position={[x, 0, z]}>
                <mesh geometry={post} position={[0, 0.35, 0]}>
                  <meshStandardMaterial color="#1a1816" roughness={0.8} />
                </mesh>
                <mesh geometry={cap} material={capMat} position={[0, 0.74, 0]} />
              </group>
            )
          })}
          <group position={[0, 0, -spot.back]}>
            <mesh material={beamMat} position={[0, 20, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 40, 8, 1, true]} />
            </mesh>
            <mesh material={haloMat} position={[0, 20, 0]}>
              <cylinderGeometry args={[0.7, 0.7, 40, 16, 1, true]} />
            </mesh>
          </group>
        </group>
      ))}
    </>
  )
}

/* ---------------- data streams along the roads ---------------- */

const streamVert = /* glsl */ `
attribute vec2 aStart;
attribute vec2 aDir;
attribute float aLen;
attribute float aSeed;
uniform float uTime;
uniform float uPixelRatio;
varying float vA;
varying float vHot;
void main() {
  float t = fract(aSeed * 13.7 + uTime * (0.06 + fract(aSeed * 5.3) * 0.05) * (40.0 / aLen));
  vec2 side = vec2(-aDir.y, aDir.x) * (fract(aSeed * 91.0) - 0.5) * 1.1;
  vec2 xz = aStart + aDir * t * aLen + side;
  vec3 p = vec3(xz.x, 0.22 + sin(t * 30.0 + aSeed * 9.0) * 0.06, xz.y);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = mix(2.4, 4.4, fract(aSeed * 3.1)) * uPixelRatio * (20.0 / -mv.z);
  vA = sin(3.14159 * t) * smoothstep(90.0, 15.0, -mv.z);
  vHot = step(0.25, fract(aSeed * 17.0));
}
`
const streamFrag = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uAccent;
varying float vA;
varying float vHot;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(mix(uColor, uAccent, vHot), pow(1.0 - d * 2.0, 1.2) * vA);
}
`

export function DataStreams({ count, animate }: { count: number; animate: boolean }) {
  const gl = useThree((s) => s.gl)
  const { geometry, material, edges } = useMemo(() => {
    const total = ZONES.length * count
    const start = new Float32Array(total * 2)
    const dir = new Float32Array(total * 2)
    const len = new Float32Array(total)
    const seed = new Float32Array(total)
    const pos = new Float32Array(total * 3)
    const edgePts: number[] = []
    ZONES.forEach((z, zi) => {
      const L = Math.hypot(z.x, z.z)
      const dx = z.x / L
      const dz = z.z / L
      const a = HUB.radius + 0.6
      const b = L - ZONE_RADIUS - 0.6
      for (let k = 0; k < count; k++) {
        const i = zi * count + k
        start[i * 2] = dx * a
        start[i * 2 + 1] = dz * a
        dir[i * 2] = dx
        dir[i * 2 + 1] = dz
        len[i] = b - a
        seed[i] = Math.random()
      }
      // faint lane edges
      for (const off of [-1.3, 1.3]) {
        const ox = -dz * off
        const oz = dx * off
        edgePts.push(dx * a + ox, 0.02, dz * a + oz, dx * b + ox, 0.02, dz * b + oz)
      }
    })
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geometry.setAttribute('aStart', new THREE.BufferAttribute(start, 2))
    geometry.setAttribute('aDir', new THREE.BufferAttribute(dir, 2))
    geometry.setAttribute('aLen', new THREE.BufferAttribute(len, 1))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const material = new THREE.ShaderMaterial({
      vertexShader: streamVert,
      fragmentShader: streamFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 3 },
        uPixelRatio: { value: 1 },
        uColor: { value: new THREE.Color(FG) },
        uAccent: { value: new THREE.Color(ACCENT) },
      },
    })
    const edges = new THREE.BufferGeometry()
    edges.setAttribute('position', new THREE.Float32BufferAttribute(edgePts, 3))
    return { geometry, material, edges }
  }, [count])

  useFrame(({ clock }) => {
    material.uniforms.uPixelRatio.value = gl.getPixelRatio()
    if (animate) material.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <>
      <points geometry={geometry} material={material} frustumCulled={false} />
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={FG} transparent opacity={0.12} />
      </lineSegments>
    </>
  )
}

/* ---------------- boost chevrons ---------------- */

export function BoostPads({ animate }: { animate: boolean }) {
  const chevron = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-1, -0.35)
    s.lineTo(0, 0.45)
    s.lineTo(1, -0.35)
    s.lineTo(1, 0.05)
    s.lineTo(0, 0.85)
    s.lineTo(-1, 0.05)
    s.closePath()
    return new THREE.ShapeGeometry(s)
  }, [])
  const mats = useMemo(
    () =>
      BOOSTS.flatMap(() =>
        [0, 1, 2].map(
          () =>
            new THREE.MeshBasicMaterial({
              color: ACCENT,
              transparent: true,
              opacity: 0.4,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
            }),
        ),
      ),
    [],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    mats.forEach((m, i) => {
      const k = i % 3
      const boosted = world.car.boost > 0 ? 0.35 : 0
      m.opacity = animate ? 0.22 + 0.5 * Math.max(0, Math.sin(t * 4 - k * 0.9)) + boosted : 0.5
    })
  })
  return (
    <>
      {BOOSTS.map((b, bi) => (
        <group key={bi} position={[b.x, 0.03, b.z]} rotation={[0, facingAway(b.dx, b.dz), 0]}>
          {[0, 1, 2].map((k) => (
            <mesh
              key={k}
              geometry={chevron}
              material={mats[bi * 3 + k]}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0, (1 - k) * 1.05]}
              scale={0.85}
            />
          ))}
        </group>
      ))}
    </>
  )
}

/* ---------------- server racks with blinking LEDs ---------------- */

const ledVert = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uPixelRatio;
varying float vOn;
varying float vHot;
varying float vA;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = 1.8 * uPixelRatio * (14.0 / -mv.z);
  float rate = 0.4 + fract(aSeed * 7.7) * 2.2;
  vOn = step(0.3, fract(uTime * rate + aSeed * 11.0));
  vHot = step(0.22, fract(aSeed * 3.3));
  vA = smoothstep(90.0, 12.0, -mv.z);
}
`
const ledFrag = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uAccent;
varying float vOn;
varying float vHot;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(mix(uColor, uAccent, vHot), smoothstep(0.5, 0.15, d) * vA * mix(0.12, 1.0, vOn));
}
`

export function ServerRacks({ animate }: { animate: boolean }) {
  const gl = useThree((s) => s.gl)
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const edges = useMemo(() => new THREE.EdgesGeometry(box), [box])
  const leds = useMemo(() => {
    const pts: number[] = []
    const seeds: number[] = []
    const w = MONOLITH_RADIUS * 2
    for (const m of MONOLITHS) {
      const rows = Math.floor((m.h - 0.4) / 0.32)
      for (let f = 0; f < 4; f++) {
        const nx = [1, -1, 0, 0][f]
        const nz = [0, 0, 1, -1][f]
        for (let rr = 0; rr < rows; rr++) {
          for (const col of [-0.22, 0.22]) {
            const y = 0.35 + rr * 0.32
            const along = col * w
            pts.push(m.x + nx * (w / 2 + 0.02) + (nz ? along : 0), y, m.z + nz * (w / 2 + 0.02) + (nx ? along : 0))
            seeds.push(Math.random())
          }
        }
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
    const material = new THREE.ShaderMaterial({
      vertexShader: ledVert,
      fragmentShader: ledFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uColor: { value: new THREE.Color(FG) },
        uAccent: { value: new THREE.Color(ACCENT) },
      },
    })
    return { geometry: g, material }
  }, [])

  useFrame(({ clock }) => {
    leds.material.uniforms.uPixelRatio.value = gl.getPixelRatio()
    if (animate) leds.material.uniforms.uTime.value = clock.elapsedTime
  })

  return (
    <>
      {MONOLITHS.map((m, i) => (
        <group key={i} position={[m.x, m.h / 2, m.z]} scale={[MONOLITH_RADIUS * 2, m.h, MONOLITH_RADIUS * 2]}>
          <mesh geometry={box}>
            <meshStandardMaterial color="#161513" roughness={0.6} metalness={0.2} flatShading />
          </mesh>
          <lineSegments geometry={edges}>
            <lineBasicMaterial color={FG} transparent opacity={0.18} />
          </lineSegments>
        </group>
      ))}
      <points geometry={leds.geometry} material={leds.material} frustumCulled={false} />
    </>
  )
}

/* ---------------- ambient motes ---------------- */

export function Ambient({ count, animate }: { count: number; animate: boolean }) {
  const gl = useThree((s) => s.gl)
  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const d = Math.sqrt(Math.random()) * (WORLD_RADIUS + 10)
      pos[i * 3] = Math.cos(a) * d
      pos[i * 3 + 1] = 0.5 + Math.random() * 16
      pos[i * 3 + 2] = Math.sin(a) * d
      seed[i] = Math.random()
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uColor: { value: new THREE.Color(FG) }, uInk: { value: new THREE.Color(INK) } },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vA;
        void main() {
          vec3 p = position;
          p.y = 0.5 + mod(p.y + uTime * (0.15 + aSeed * 0.25), 16.0);
          p.x += sin(uTime * 0.2 + aSeed * 30.0) * 0.6;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = mix(1.0, 2.2, aSeed) * uPixelRatio * (10.0 / -mv.z);
          vA = smoothstep(80.0, 8.0, -mv.z) * 0.4;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          gl_FragColor = vec4(uColor, smoothstep(0.5, 0.1, d) * vA);
        }`,
    })
    return { geometry, material }
  }, [count])

  useFrame(({ clock }) => {
    material.uniforms.uPixelRatio.value = gl.getPixelRatio()
    if (animate) material.uniforms.uTime.value = clock.elapsedTime
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
