import * as THREE from 'three'

export function glowSprite(inner: string, outer = 'rgba(0,0,0,0)') {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, inner); g.addColorStop(.25, inner.replace(/[\d.]+\)$/, '0.45)')); g.addColorStop(1, outer)
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
