import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { scene as store } from '../store'
import { buildShapes, SHAPE_COUNT } from './shapes'
import { dustFrag, dustVert, morphFrag, morphVert } from './shaders'

const INK = '#0d0c0b'
const FG = '#ece8e1'
const ACCENT = '#ec5b2c'

/** Horizontal placement of the sculpture per section on wide screens (text sits on the left). */
const X_WIDE = [3.35, 3.5, 3.45, 3.3, 3.5, 3.45]
const INTRO_MS = 2600

type Props = { lite: boolean; reduced: boolean }

export default function Scene({ lite, reduced }: Props) {
  const maxDpr = lite ? 1.25 : 1.75
  const [dpr, setDpr] = useState(() => Math.min(maxDpr, window.devicePixelRatio))
  const count = lite ? 14000 : reduced ? 24000 : 60000
  return (
    <Canvas
      className="canvas-fade"
      flat
      dpr={dpr}
      frameloop={reduced ? 'demand' : 'always'}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
      camera={{ position: [0, 0, 9], fov: 40, near: 0.1, far: 60 }}
      onCreated={({ gl }) => gl.setClearColor(INK)}
    >
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(Math.min(maxDpr, window.devicePixelRatio))}
      />
      <InvalidateBridge />
      <Dust count={lite ? 500 : 1500} animate={!reduced} />
      <Morph count={count} interactive={!lite && !reduced} reduced={reduced} />
    </Canvas>
  )
}

function InvalidateBridge() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    store.invalidate = invalidate
    return () => {
      store.invalidate = null
    }
  }, [invalidate])
  return null
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function Morph({ count, interactive, reduced }: { count: number; interactive: boolean; reduced: boolean }) {
  const group = useRef<THREE.Group>(null)
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const aspect = useThree((s) => s.viewport.aspect)
  const narrow = aspect < 1.15

  const { geometry, material } = useMemo(() => {
    const s = buildShapes(count)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(s.shapes[0], 3))
    s.shapes.forEach((arr, i) => geometry.setAttribute(`p${i}`, new THREE.BufferAttribute(arr, 3)))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(s.seed, 1))
    geometry.setAttribute('aAccent', new THREE.BufferAttribute(s.accent, 1))
    geometry.setAttribute('aRole', new THREE.BufferAttribute(s.role, 1))
    geometry.setAttribute('aSkill', new THREE.BufferAttribute(s.skill, 1))
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20)

    const material = new THREE.ShaderMaterial({
      vertexShader: morphVert,
      fragmentShader: morphFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uW: { value: [1, 0, 0, 0, 0, 0] },
        uTime: { value: 0 },
        uScatter: { value: 0 },
        uIntro: { value: reduced ? 1 : 0 },
        uPixelRatio: { value: 1 },
        uSize: { value: count > 30000 ? 20 : 30 },
        uMouse: { value: new THREE.Vector3(999, 999, 0) },
        uMouseStrength: { value: 0 },
        uActiveRole: { value: -1 },
        uActiveSkill: { value: -1 },
        uRoleW: { value: 0 },
        uSkillW: { value: 0 },
        uColor: { value: new THREE.Color(FG) },
        uAccent: { value: new THREE.Color(ACCENT) },
        uOpacity: { value: 0.8 },
      },
    })
    return { geometry, material }
  }, [count, reduced])

  useEffect(() => {
    store.particles = count
    store.sceneReady = true
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [count, geometry, material])

  const st = useRef({ m: 0, role: 0, skill: 0, hover: 0, frames: 0, fpsT: 0 })
  const tmp = useMemo(
    () => ({
      ndc: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      hit: new THREE.Vector3(),
      mouse: new THREE.Vector3(999, 999, 0),
    }),
    [],
  )

  useFrame(({ clock }, dt) => {
    const g = group.current
    if (!g) return
    const u = material.uniforms
    const s = st.current
    const d = Math.min(dt, 0.05)
    const damp = (a: number, b: number, l: number) => (reduced ? b : THREE.MathUtils.damp(a, b, l, d))

    // Morph is held while reading a section and plays as the next heading approaches.
    const f = store.section
    const i = Math.floor(f)
    const target = Math.min(i + smoothstep(0.55, 1, f - i), SHAPE_COUNT - 1)
    s.m = damp(s.m, target, 2.2)
    const k = Math.min(Math.floor(s.m), SHAPE_COUNT - 2)
    const t = s.m - k
    const w = u.uW.value as number[]
    w.fill(0)
    w[k] = 1 - t
    w[k + 1] = t
    u.uScatter.value = reduced ? 0 : Math.sin(Math.PI * t) * 0.85

    if (!reduced) {
      u.uTime.value = clock.elapsedTime
      if (store.introAt) {
        const e = Math.max(0, (performance.now() - store.introAt) / INTRO_MS)
        u.uIntro.value = e >= 1 ? 1 : 1 - Math.pow(2, -10 * e)
      }
    }

    // Hover links from the HTML: roles light up slabs, skill groups light up galaxy arms.
    if (store.activeRole >= 0) u.uActiveRole.value = store.activeRole
    if (store.activeSkill >= 0) u.uActiveSkill.value = store.activeSkill
    s.role = damp(s.role, store.activeRole >= 0 ? 1 : 0, 6)
    s.skill = damp(s.skill, store.activeSkill >= 0 ? 1 : 0, 6)
    u.uRoleW.value = s.role * w[1]
    u.uSkillW.value = s.skill * w[3]

    // Placement: right of the text on wide screens, high and dim behind it on narrow ones.
    const xTarget = narrow ? 0 : X_WIDE[k] * (1 - t) + X_WIDE[k + 1] * t
    g.position.x = damp(g.position.x, xTarget, 3)
    g.position.y = narrow ? 1.6 : 0
    g.scale.setScalar(narrow ? 0.62 : 0.82)
    u.uOpacity.value = narrow ? 0.34 : 0.8

    if (!reduced) {
      g.rotation.y = damp(g.rotation.y, Math.sin(clock.elapsedTime * 0.12) * 0.35 + store.mouse.x * 0.3, 2)
      g.rotation.x = damp(g.rotation.x, -store.mouse.y * 0.18, 2)
    }

    // Scroll-driven camera: a slow orbit across sections plus a push-in during each transition.
    const cx = Math.sin(s.m * 1.3) * 0.9
    const cy = Math.cos(s.m * 0.9) * 0.45 - 0.45
    const cz = 9 - Math.sin(Math.PI * t) * 1.6
    camera.position.set(damp(camera.position.x, cx, 3), damp(camera.position.y, cy, 3), damp(camera.position.z, cz, 3))
    camera.lookAt(g.position.x * 0.45, g.position.y * 0.5, 0)
    camera.updateMatrixWorld()

    if (interactive) {
      // Project the cursor onto the sculpture's depth, then into view space for the shader.
      tmp.ndc.set(store.mouse.x, store.mouse.y, 0.5).unproject(camera)
      tmp.dir.copy(tmp.ndc).sub(camera.position).normalize()
      const dist = (g.position.z - camera.position.z) / tmp.dir.z
      tmp.hit.copy(camera.position).addScaledVector(tmp.dir, dist).applyMatrix4(camera.matrixWorldInverse)
      tmp.mouse.lerp(tmp.hit, 1 - Math.exp(-12 * d))
      u.uMouse.value.copy(tmp.mouse)
      s.hover = damp(s.hover, store.mouseActive ? 1 : 0, 3)
      // Repulsion belongs to the hero globe only; it fades out as the globe morphs away.
      u.uMouseStrength.value = s.hover * u.uIntro.value * w[0]
    }

    u.uPixelRatio.value = gl.getPixelRatio()

    s.frames++
    s.fpsT += dt
    if (s.fpsT >= 0.5) {
      store.fps = Math.round(s.frames / s.fpsT)
      s.frames = 0
      s.fpsT = 0
    }
  })

  return (
    <group ref={group}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}

function Dust({ count, animate }: { count: number; animate: boolean }) {
  const ref = useRef<THREE.Points>(null)
  const gl = useThree((s) => s.gl)
  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26
      pos[i * 3 + 1] = (Math.random() - 0.5) * 22
      pos[i * 3 + 2] = -12 + Math.random() * 15
      seed[i] = Math.random()
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const material = new THREE.ShaderMaterial({
      vertexShader: dustVert,
      fragmentShader: dustFrag,
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uColor: { value: new THREE.Color(FG) } },
    })
    return { geometry, material }
  }, [count])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame(({ clock }, dt) => {
    material.uniforms.uPixelRatio.value = gl.getPixelRatio()
    if (!ref.current) return
    // Dust rises as you scroll down, which reads as descending through space.
    const y = store.section * 1.4
    ref.current.position.y = animate ? THREE.MathUtils.damp(ref.current.position.y, y, 2, Math.min(dt, 0.05)) : y
    if (animate) material.uniforms.uTime.value = clock.elapsedTime
  })

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />
}
