import * as THREE from 'three'

export const INK = '#0d0c0b'
export const FG = '#ece8e1'
export const ACCENT = '#3d7bff'

/** Raw sRGB vector for shaders that write colour without conversion. */
export const srgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}
