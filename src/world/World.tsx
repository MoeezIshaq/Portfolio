import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { scene } from '../store'
import { world, worldUi } from './worldStore'
import { BOOSTS, MONOLITHS, MONOLITH_RADIUS, SPAWN, WORLD_RADIUS, ZONES, ZONE_RADIUS, type Zone } from './zones'
import { ACCENT, FG, INK, srgb } from './palette'
import { Ambient, BoostPads, DataStreams, HubName, ServerRacks, ZoneGlyphs, ZoneMarkers } from './Landmarks'

const INTRO_MS = 2600

type Props = { lite: boolean; reduced: boolean }

export default function World({ lite, reduced }: Props) {
  const maxDpr = lite ? 1.25 : 1.75
  const [dpr, setDpr] = useState(() => Math.min(maxDpr, window.devicePixelRatio))
  return (
    <Canvas
      className="canvas-fade"
      flat
      dpr={dpr}
      gl={{ antialias: !lite, powerPreference: 'high-performance', alpha: false }}
      camera={{ position: [0, 38, 52], fov: 50, near: 0.1, far: 220 }}
      onCreated={({ gl }) => gl.setClearColor(INK)}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(Math.min(maxDpr, window.devicePixelRatio))} />
      <Ready />
      <hemisphereLight args={[FG, INK, 0.9]} />
      <directionalLight position={[10, 18, 8]} intensity={1.8} />
      <Ground />
      <HubName />
      <DataStreams count={lite ? 30 : 70} animate={!reduced} />
      <BoostPads animate={!reduced} />
      <ZoneMarkers animate={!reduced} />
      <ZoneGlyphs count={lite ? 2500 : 6500} animate={!reduced} />
      <ServerRacks animate={!reduced} />
      <Ambient count={lite ? 250 : 700} animate={!reduced} />
      <Car />
      <Dust />
      <ChaseCam reduced={reduced} />
    </Canvas>
  )
}

function Ready() {
  useEffect(() => {
    scene.sceneReady = true
  }, [])
  return null
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const damp = THREE.MathUtils.damp

/* ---------------- ground ---------------- */

const groundVert = /* glsl */ `
varying vec2 vP;
varying float vDepth;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vP = wp.xz;
  vec4 mv = viewMatrix * wp;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`
const groundFrag = /* glsl */ `
uniform vec2 uCar;
uniform vec2 uDir;
uniform vec3 uInk;
uniform vec3 uFg;
uniform vec3 uAccent;
uniform float uEdge;
varying vec2 vP;
varying float vDepth;

float grid(vec2 p, float s, float w) {
  vec2 q = p / s;
  vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
  return 1.0 - min(min(g.x, g.y) / w, 1.0);
}

void main() {
  float r = length(vP);
  float near = smoothstep(30.0, 2.0, distance(vP, uCar));
  float lines = grid(vP, 2.0, 1.0) * 0.07 + grid(vP, 10.0, 1.3) * 0.16;
  float inside = smoothstep(uEdge + 4.0, uEdge - 2.0, r);
  vec3 c = uInk + uFg * lines * (0.3 + 0.7 * near) * inside;

  // Headlight pool ahead of the car.
  vec2 to = vP - uCar;
  float dl = length(to);
  float beam = smoothstep(0.82, 1.0, dot(to / max(dl, 1e-3), uDir)) * smoothstep(15.0, 2.0, dl);
  c += uFg * beam * 0.05;

  // Dashed boundary ring.
  float ring = smoothstep(0.12, 0.0, abs(r - uEdge)) * step(0.5, fract(atan(vP.y, vP.x) * 24.0 / 6.2831));
  c = mix(c, uAccent, ring * 0.7);

  float fog = smoothstep(95.0, 30.0, vDepth);
  gl_FragColor = vec4(mix(uInk, c, fog), 1.0);
}
`

function Ground() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: groundVert,
        fragmentShader: groundFrag,
        uniforms: {
          uCar: { value: new THREE.Vector2() },
          uDir: { value: new THREE.Vector2(0, -1) },
          // Raw sRGB values: the shader writes them out unconverted, so the ground matches the clear colour.
          uInk: { value: srgb(INK) },
          uFg: { value: srgb(FG) },
          uAccent: { value: srgb(ACCENT) },
          uEdge: { value: WORLD_RADIUS + 1 },
        },
      }),
    [],
  )
  useFrame(() => {
    const c = world.car
    material.uniforms.uCar.value.set(c.x, c.z)
    material.uniforms.uDir.value.set(Math.sin(c.heading), Math.cos(c.heading))
  })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <planeGeometry args={[240, 240]} />
    </mesh>
  )
}

/* ---------------- car ---------------- */

function Car() {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const frontL = useRef<THREE.Group>(null)
  const frontR = useRef<THREE.Group>(null)
  const wheels = useRef<(THREE.Mesh | null)[]>([])
  const sim = useRef({ vx: 0, vz: 0, steer: 0, spin: 0, roll: 0, pitch: 0, lastVF: 0 })

  useFrame((_, dt) => {
    const d = Math.min(dt, 1 / 30)
    const c = world.car
    const s = sim.current
    const k = world.input.keys
    const paused = worldUi.getOpen() !== null

    if (world.resetRequested) {
      world.resetRequested = false
      Object.assign(c, { x: SPAWN.x, z: SPAWN.z, heading: SPAWN.heading, speed: 0, slip: 0, boost: 0 })
      Object.assign(s, { vx: 0, vz: 0, steer: 0 })
    }

    const throttle = paused ? 0 : clamp((k.has('up') ? 1 : 0) - (k.has('down') ? 1 : 0) + world.input.joyY, -1, 1)
    const steerIn = paused ? 0 : clamp((k.has('left') ? 1 : 0) - (k.has('right') ? 1 : 0) - world.input.joyX, -1, 1)
    const drift = !paused && k.has('drift')

    // Boost pads: driving over one roughly along the road gives a short burst.
    for (const b of BOOSTS) {
      if (Math.hypot(c.x - b.x, c.z - b.z) < 2.4 && Math.sin(c.heading) * b.dx + Math.cos(c.heading) * b.dz > 0.3) {
        c.boost = 1.0
      }
    }
    c.boost = Math.max(0, c.boost - d)
    const boosting = c.boost > 0

    // Steer from current forward speed, then re-project the old velocity into the new heading.
    // Low lateral grip while drifting lets the car slide.
    let sin = Math.sin(c.heading)
    let cos = Math.cos(c.heading)
    const vF0 = s.vx * sin + s.vz * cos
    s.steer = damp(s.steer, steerIn, 10, d)
    const angle = (s.steer * 0.6) / (1 + Math.abs(vF0) * 0.07)
    c.heading += ((vF0 * Math.tan(angle)) / 2) * (drift ? 1.5 : 1) * d

    sin = Math.sin(c.heading)
    cos = Math.cos(c.heading)
    let vF = s.vx * sin + s.vz * cos
    let vR = -s.vx * cos + s.vz * sin

    if (throttle !== 0) {
      const braking = Math.sign(throttle) !== Math.sign(vF) && Math.abs(vF) > 0.5
      vF += throttle * (braking ? 30 : 13) * d
    } else {
      vF -= Math.sign(vF) * Math.min(Math.abs(vF), 6 * d)
    }
    if (drift) vF -= Math.sign(vF) * Math.min(Math.abs(vF), 3 * d)
    if (boosting) vF += 24 * d
    // Top speed 14; a boost lifts it to 23 and eases back down afterwards.
    vF = clamp(vF * (1 - 0.3 * d), -6, boosting ? 23 : Math.max(14, Math.min(vF, 23) - 9 * d))
    vR *= Math.exp(-(drift ? 1.2 : 9) * d)

    s.vx = sin * vF - cos * vR
    s.vz = cos * vF + sin * vR
    c.x += s.vx * d
    c.z += s.vz * d

    // Collisions: world edge and monoliths. Remove the velocity component into the obstacle.
    const r = Math.hypot(c.x, c.z)
    const edge = WORLD_RADIUS - 1
    if (r > edge) {
      const nx = c.x / r
      const nz = c.z / r
      c.x = nx * edge
      c.z = nz * edge
      const into = s.vx * nx + s.vz * nz
      if (into > 0) {
        s.vx -= nx * into * 1.4
        s.vz -= nz * into * 1.4
      }
    }
    const carR = 1.1
    for (const m of MONOLITHS) {
      const dx = c.x - m.x
      const dz = c.z - m.z
      const dist = Math.hypot(dx, dz)
      const min = MONOLITH_RADIUS + carR
      if (dist < min && dist > 1e-4) {
        const nx = dx / dist
        const nz = dz / dist
        c.x = m.x + nx * min
        c.z = m.z + nz * min
        const into = s.vx * nx + s.vz * nz
        if (into < 0) {
          s.vx -= nx * into * 1.5
          s.vz -= nz * into * 1.5
        }
      }
    }

    c.speed = vF
    c.slip = vR
    if (Math.abs(vF) > 0.5) world.moved = true

    let near: Zone | null = null
    for (const z of ZONES) if (Math.hypot(c.x - z.x, c.z - z.z) < ZONE_RADIUS) near = z
    worldUi.setActive(near ? near.id : null)

    // Visuals
    const g = root.current
    if (g) {
      g.position.set(c.x, 0, c.z)
      g.rotation.y = c.heading
    }
    const accel = (vF - s.lastVF) / d
    s.lastVF = vF
    s.roll = damp(s.roll, clamp(vR * 0.035 + s.steer * vF * 0.006, -0.18, 0.18), 8, d)
    s.pitch = damp(s.pitch, clamp(-accel * 0.004, -0.08, 0.08), 6, d)
    if (body.current) {
      body.current.rotation.z = s.roll
      body.current.rotation.x = s.pitch
    }
    s.spin += (vF * d) / 0.32
    wheels.current.forEach((w) => {
      if (w) w.rotation.x = s.spin
    })
    if (frontL.current) frontL.current.rotation.y = angle * 1.4
    if (frontR.current) frontR.current.rotation.y = angle * 1.4
  })

  const wheelGeo = useMemo(() => new THREE.CylinderGeometry(0.32, 0.32, 0.26, 18).rotateZ(Math.PI / 2), [])
  const shadow = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')!
    const grd = ctx.createRadialGradient(64, 64, 8, 64, 64, 64)
    grd.addColorStop(0, 'rgba(0,0,0,0.75)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])

  const wheelPos: [number, number, number][] = [
    [0.66, 0.32, 0.72],
    [-0.66, 0.32, 0.72],
    [0.66, 0.32, -0.72],
    [-0.66, 0.32, -0.72],
  ]

  return (
    <group ref={root} position={[SPAWN.x, 0, SPAWN.z]} rotation={[0, SPAWN.heading, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={[2.2, 3.4, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>

      <group ref={body}>
        {/* chassis */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.2, 0.34, 2.3]} />
          <meshStandardMaterial color={FG} roughness={0.55} flatShading />
        </mesh>
        {/* nose wedge */}
        <mesh position={[0, 0.62, 0.78]} rotation={[0.28, 0, 0]}>
          <boxGeometry args={[1.14, 0.12, 0.8]} />
          <meshStandardMaterial color={FG} roughness={0.55} flatShading />
        </mesh>
        {/* cabin glass */}
        <mesh position={[0, 0.84, -0.12]}>
          <boxGeometry args={[0.98, 0.34, 1.1]} />
          <meshStandardMaterial color="#141311" roughness={0.2} metalness={0.3} flatShading />
        </mesh>
        <mesh position={[0, 1.02, -0.18]}>
          <boxGeometry args={[0.92, 0.05, 0.86]} />
          <meshStandardMaterial color={FG} roughness={0.55} flatShading />
        </mesh>
        {/* racing stripe */}
        <mesh position={[0, 0.675, 0.45]}>
          <boxGeometry args={[0.18, 0.02, 1.5]} />
          <meshBasicMaterial color={ACCENT} />
        </mesh>
        {/* spoiler */}
        <mesh position={[0, 0.9, -1.06]}>
          <boxGeometry args={[1.18, 0.05, 0.28]} />
          <meshBasicMaterial color={ACCENT} />
        </mesh>
        {[-0.4, 0.4].map((x) => (
          <mesh key={x} position={[x, 0.77, -1.04]}>
            <boxGeometry args={[0.05, 0.22, 0.05]} />
            <meshStandardMaterial color="#141311" />
          </mesh>
        ))}
        {/* lights */}
        {[-0.4, 0.4].map((x) => (
          <mesh key={`h${x}`} position={[x, 0.52, 1.16]}>
            <boxGeometry args={[0.26, 0.08, 0.02]} />
            <meshBasicMaterial color="#fffaf0" />
          </mesh>
        ))}
        {[-0.42, 0.42].map((x) => (
          <mesh key={`t${x}`} position={[x, 0.56, -1.16]}>
            <boxGeometry args={[0.3, 0.07, 0.02]} />
            <meshBasicMaterial color={ACCENT} />
          </mesh>
        ))}
        {/* headlight beams */}
        <mesh position={[0, 0.45, 3.2]} rotation={[Math.PI / 2 + 0.06, 0, 0]}>
          <coneGeometry args={[1.6, 4, 24, 1, true]} />
          <meshBasicMaterial color={FG} transparent opacity={0.035} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {wheelPos.map((p, i) => {
        const wheel = (
          <mesh
            geometry={wheelGeo}
            ref={(m) => {
              wheels.current[i] = m
            }}
          >
            <meshStandardMaterial color="#1a1816" roughness={0.9} flatShading />
          </mesh>
        )
        if (i < 2)
          return (
            <group key={i} position={p} ref={i === 0 ? frontL : frontR}>
              {wheel}
            </group>
          )
        return (
          <group key={i} position={p}>
            {wheel}
          </group>
        )
      })}
    </group>
  )
}

/* ---------------- drift dust ---------------- */

const DUST = 260

function Dust() {
  const gl = useThree((s) => s.gl)
  const { geometry, material, life, vel } = useMemo(() => {
    const pos = new Float32Array(DUST * 3).fill(-999)
    const lifeArr = new Float32Array(DUST)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geometry.setAttribute('aLife', new THREE.BufferAttribute(lifeArr, 1))
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uPixelRatio: { value: 1 }, uColor: { value: new THREE.Color(FG) } },
      vertexShader: /* glsl */ `
        attribute float aLife;
        uniform float uPixelRatio;
        varying float vLife;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (2.0 + (1.0 - aLife) * 10.0) * uPixelRatio * (10.0 / -mv.z);
          vLife = aLife;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vLife;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vLife * 0.35);
        }`,
    })
    return { geometry, material, life: lifeArr, vel: new Float32Array(DUST * 3) }
  }, [])
  const next = useRef(0)
  const acc = useRef(0)

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05)
    material.uniforms.uPixelRatio.value = gl.getPixelRatio()
    const c = world.car
    const pos = geometry.attributes.position.array as Float32Array
    const sliding = (Math.abs(c.slip) > 2.2 && Math.abs(c.speed) > 3) || c.boost > 0
    if (sliding) {
      acc.current += d * 90
      const sin = Math.sin(c.heading)
      const cos = Math.cos(c.heading)
      while (acc.current >= 1) {
        acc.current -= 1
        const i = next.current
        next.current = (i + 1) % DUST
        const side = i % 2 ? 0.66 : -0.66
        pos[i * 3] = c.x - sin * 0.72 + cos * side + (Math.random() - 0.5) * 0.3
        pos[i * 3 + 1] = 0.15
        pos[i * 3 + 2] = c.z - cos * 0.72 - sin * side + (Math.random() - 0.5) * 0.3
        vel[i * 3] = (Math.random() - 0.5) * 1.2
        vel[i * 3 + 1] = 0.5 + Math.random() * 0.8
        vel[i * 3 + 2] = (Math.random() - 0.5) * 1.2
        life[i] = 1
      }
    }
    for (let i = 0; i < DUST; i++) {
      if (life[i] <= 0) continue
      life[i] = Math.max(0, life[i] - d * 1.1)
      pos[i * 3] += vel[i * 3] * d
      pos[i * 3 + 1] += vel[i * 3 + 1] * d
      pos[i * 3 + 2] += vel[i * 3 + 2] * d
    }
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.aLife.needsUpdate = true
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}

/* ---------------- camera ---------------- */

function ChaseCam({ reduced }: { reduced: boolean }) {
  const look = useMemo(() => new THREE.Vector3(0, 4, 0), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, size }, dt) => {
    const d = Math.min(dt, 0.05)
    const cam = camera as THREE.PerspectiveCamera
    const c = world.car
    const portrait = size.width < size.height
    const sin = Math.sin(c.heading)
    const cos = Math.cos(c.heading)

    const introDone = scene.introAt > 0 && (reduced || performance.now() - scene.introAt > INTRO_MS * 0.25)
    const dist = portrait ? 13 : 10
    const height = portrait ? 8.5 : 5
    if (introDone) tmp.set(c.x - sin * dist, height, c.z - cos * dist)
    else tmp.set(0, 38, 52)

    const lambda = reduced ? 30 : introDone && cam.position.y < 12 ? 4 : 1.6
    cam.position.x = damp(cam.position.x, tmp.x, lambda, d)
    cam.position.y = damp(cam.position.y, tmp.y, lambda, d)
    cam.position.z = damp(cam.position.z, tmp.z, lambda, d)

    tmp.set(c.x + sin * 4, 1.2, c.z + cos * 4)
    look.lerp(tmp, 1 - Math.exp(-(reduced ? 30 : 6) * d))
    cam.lookAt(look)

    const fov = (portrait ? 62 : 50) + (reduced ? 0 : Math.abs(c.speed) * 0.4 + c.boost * 4)
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = damp(cam.fov, fov, 3, d)
      cam.updateProjectionMatrix()
    }
  })
  return null
}
