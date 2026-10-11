import * as THREE from 'three'
import { drawLogo } from '../brand/logo'

const std = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: .45, metalness: .15, ...extra })

function canvasTexture(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  paint(c.getContext('2d')!)
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4
  return tex
}

/* Astronaut built from primitives. Origin sits at the hips; +Y up, facing +Z. */
export function buildAstronaut() {
  const root = new THREE.Group()
  const suit = std(0xf3f5f8, { roughness: .75 })
  const trim = std(0x3d7bd9, { roughness: .5 })
  const dark = std(0x2a3140, { roughness: .6 })

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.17, .22, 6, 14), suit)
  torso.position.y = .27
  const pack = new THREE.Mesh(new THREE.BoxGeometry(.3, .34, .15), std(0xd9dde4, { roughness: .6 }))
  pack.position.set(0, .3, -.18)
  const panel = new THREE.Mesh(new THREE.BoxGeometry(.15, .09, .04), trim)
  panel.position.set(0, .36, .16)
  const patch = new THREE.Mesh(new THREE.CircleGeometry(.045, 20), new THREE.MeshStandardMaterial({
    map: canvasTexture(128, 128, ctx => { ctx.fillStyle = '#0b1a3a'; ctx.beginPath(); ctx.arc(64, 64, 64, 0, Math.PI * 2); ctx.fill(); drawLogo(ctx, 16, 16, 96) }),
  }))
  patch.position.set(-.15, .36, .07); patch.rotation.y = -.9

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(.17, 28, 20), suit)
  helmet.position.y = .62
  const visor = new THREE.Mesh(new THREE.SphereGeometry(.135, 28, 18, 0, Math.PI * 2, 0, Math.PI * .55),
    new THREE.MeshStandardMaterial({ color: 0xe0a64a, metalness: .95, roughness: .1, emissive: 0x3a2306 }))
  visor.rotation.x = Math.PI / 2.1
  visor.position.set(0, .63, .06)
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(.05, .035, .04), new THREE.MeshBasicMaterial({ color: 0xfff3c4 }))
  lamp.position.set(.11, .75, .1)

  const limb = (len: number) => new THREE.CapsuleGeometry(.06, len, 4, 10)
  const armL = new THREE.Group(), armR = new THREE.Group()
  const armMeshL = new THREE.Mesh(limb(.2), suit), armMeshR = new THREE.Mesh(limb(.2), suit)
  armMeshL.position.y = armMeshR.position.y = -.14
  const glove = () => { const g = new THREE.Mesh(new THREE.SphereGeometry(.065, 10, 8), trim); g.position.y = -.28; return g }
  armL.add(armMeshL, glove()); armR.add(armMeshR, glove())
  armL.position.set(-.22, .4, 0); armR.position.set(.22, .4, 0)
  armL.rotation.z = -.35; armR.rotation.z = .35

  const legL = new THREE.Mesh(limb(.2), suit), legR = new THREE.Mesh(limb(.2), suit)
  legL.position.set(-.09, -.05, 0); legR.position.set(.09, -.05, 0)
  const bootL = new THREE.Mesh(new THREE.BoxGeometry(.12, .07, .17), dark), bootR = bootL.clone()
  bootL.position.set(-.09, -.21, .02); bootR.position.set(.09, -.21, .02)

  root.add(torso, pack, panel, patch, helmet, visor, lamp, armL, armR, legL, legR, bootL, bootR)
  return { root, armL, armR, helmet }
}

const FLAME_VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const FLAME_FRAG = /* glsl */`uniform float uTime; uniform float uCore; uniform float uMix; varying vec2 vUv;
  float h(float n){ return fract(sin(n) * 43758.5453); }
  void main(){
    float v = vUv.y;                                   // 1 at the nozzle, 0 at the tip
    float flick = .75 + .25 * h(floor(uTime * 30.0) + vUv.x * 7.0);
    float diamonds = pow(max(0.0, sin(v * 26.0 - uTime * 4.0)), 10.0) * smoothstep(.2, .9, v);
    vec3 outer = mix(vec3(1.0,.35,.08), vec3(1.0,.72,.3), v);
    vec3 core = mix(vec3(.55,.75,1.0), vec3(1.0), v);
    vec3 col = mix(outer, core, uCore) + diamonds * .6;
    float a = pow(v, 1.4) * flick * (1.0 - abs(vUv.x - .5) * .0);
    gl_FragColor = vec4(col, a * mix(.95, .8, uMix));
  }`

/* Rocket with a glass cockpit dome and fold-out landing legs. Origin at the centre, nose along +Y. */
export function buildRocket() {
  const root = new THREE.Group()
  const hull = std(0xf1f3f7, { roughness: .32, metalness: .3 })
  const accent = std(0xd93a30, { roughness: .38, metalness: .25 })
  const metal = std(0x9aa3b2, { roughness: .25, metalness: .9 })
  const darkMetal = std(0x3a404c, { roughness: .35, metalness: .85, side: THREE.DoubleSide })
  const seam = std(0x6c7482, { roughness: .5, metalness: .6 })

  const profile = [[0, -1.25], [.3, -1.25], [.44, -1.18], [.53, -1.0], [.575, -.7], [.585, -.3], [.58, .1], [.555, .38], [.5, .58], [.43, .72], [0, .72]]
    .map(([x, y]) => new THREE.Vector2(x, y))
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), hull)

  const bands = new THREE.Group()
  for (const [y, r, h, mat] of [[-.42, .588, .16, accent], [.02, .586, .05, accent], [-1.0, .54, .03, seam], [-.7, .58, .015, seam], [.3, .57, .015, seam]] as const) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 64, 1, true), mat)
    b.position.y = y; bands.add(b)
  }

  /* HB logo decal wrapped onto the hull. */
  const decalTex = canvasTexture(512, 512, ctx => {
    drawLogo(ctx, 106, 30, 300)
    ctx.fillStyle = '#16213e'; ctx.font = '600 64px "DM Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText('HB-02', 256, 450)
  })
  const decal = new THREE.Mesh(new THREE.CylinderGeometry(.589, .589, .55, 32, 1, true, -.55, 1.1),
    new THREE.MeshStandardMaterial({ map: decalTex, transparent: true, roughness: .4, metalness: .1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }))
  decal.position.y = -.12

  const dome = new THREE.Mesh(new THREE.SphereGeometry(.44, 40, 24, 0, Math.PI * 2, 0, Math.PI * .62),
    new THREE.MeshPhysicalMaterial({ color: 0xbfe6ff, roughness: .04, metalness: .1, transparent: true, opacity: .28, clearcoat: 1, depthWrite: false }))
  dome.position.y = .7
  const domeRing = new THREE.Mesh(new THREE.TorusGeometry(.43, .04, 12, 48), metal)
  domeRing.rotation.x = Math.PI / 2; domeRing.position.y = .73
  const ribs = new THREE.Group()
  for (let i = 0; i < 2; i++) {
    const geo = new THREE.TorusGeometry(.445, .012, 6, 48, Math.PI * 1.24)
    geo.rotateZ(-Math.PI * .12)
    const rib = new THREE.Mesh(geo, metal)
    rib.position.y = .7; rib.rotation.y = i * Math.PI / 2
    ribs.add(rib)
  }

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .35, 6), metal)
  antenna.position.y = 1.28
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff5d5d }))
  beacon.position.y = 1.47

  /* chrome-rimmed portholes */
  const portholes = new THREE.Group()
  for (const [y, ang] of [[.22, 0], [.22, Math.PI]] as const) {
    const g = new THREE.Group()
    const glass = new THREE.Mesh(new THREE.CircleGeometry(.085, 24), new THREE.MeshStandardMaterial({ color: 0x7fd4ff, emissive: 0x1f6fa8, emissiveIntensity: .9, roughness: .1 }))
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.09, .018, 8, 24), metal)
    glass.position.z = .578; rim.position.z = .58
    g.add(glass, rim); g.position.y = y; g.rotation.y = ang
    portholes.add(g)
  }

  /* RCS thruster quads */
  const rcs = new THREE.Group()
  for (let i = 0; i < 4; i++) {
    const q = new THREE.Mesh(new THREE.BoxGeometry(.07, .1, .07), darkMetal)
    q.position.set(Math.cos(i * Math.PI / 2 + Math.PI / 4) * .56, .45, Math.sin(i * Math.PI / 2 + Math.PI / 4) * .56)
    rcs.add(q)
  }

  /* swept fins */
  const finShape = new THREE.Shape()
  finShape.moveTo(0, .1); finShape.quadraticCurveTo(.25, -.15, .62, -.5); finShape.lineTo(.66, -.86); finShape.quadraticCurveTo(.3, -.7, 0, -.62); finShape.closePath()
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: .05, bevelEnabled: true, bevelSize: .018, bevelThickness: .018, bevelSegments: 3, curveSegments: 12 })
  finGeo.translate(0, 0, -.025)
  const fins = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const fin = new THREE.Mesh(finGeo, accent)
    fin.position.set(.5, -.5, 0)
    const holder = new THREE.Group(); holder.add(fin); holder.rotation.y = (i / 3) * Math.PI * 2 + Math.PI / 2
    fins.add(holder)
  }

  /* landing legs: pivot at the skirt, folded up along the hull until touchdown */
  const legs: THREE.Group[] = []
  const legGroup = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const holder = new THREE.Group(); holder.rotation.y = (i / 3) * Math.PI * 2 + Math.PI / 2 + Math.PI / 3
    const pivot = new THREE.Group(); pivot.position.set(.5, -.72, 0)
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(.035, .03, 1.05, 10), darkMetal); strut.position.y = -.525
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .55, 8), metal); brace.position.set(-.08, -.35, 0); brace.rotation.z = .35
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(.13, .15, .05, 18), darkMetal); foot.position.y = -1.06
    pivot.add(strut, brace, foot); holder.add(pivot); legGroup.add(holder); legs.push(pivot)
  }

  /* bell nozzle */
  const bellProfile = [[.16, 0], [.19, -.06], [.25, -.16], [.33, -.3]].map(([x, y]) => new THREE.Vector2(x, y))
  const nozzle = new THREE.Mesh(new THREE.LatheGeometry(bellProfile, 40), darkMetal)
  nozzle.position.y = -1.24
  const throat = new THREE.Mesh(new THREE.CircleGeometry(.17, 24), new THREE.MeshBasicMaterial({ color: 0xffb35c }))
  throat.rotation.x = Math.PI / 2; throat.position.y = -1.27

  const flameMat = (core: number) => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uCore: { value: core }, uMix: { value: 0 } },
    vertexShader: FLAME_VERT, fragmentShader: FLAME_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  })
  const flameGeo = (rTop: number, rBot: number) => { const g = new THREE.CylinderGeometry(rTop, rBot, 1, 24, 8, true); g.translate(0, -.5, 0); return g }
  const flame = new THREE.Mesh(flameGeo(.3, .04), flameMat(0))
  const core = new THREE.Mesh(flameGeo(.16, .02), flameMat(1))
  flame.position.y = core.position.y = -1.52

  root.add(body, bands, decal, dome, domeRing, ribs, antenna, beacon, portholes, rcs, fins, legGroup, nozzle, throat, flame, core)
  return { root, flame, core, throat, beacon, legs, nozzleY: -1.54, cockpitY: .62 }
}

export function buildFlag() {
  const g = new THREE.Group()
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 1.35, 8), std(0xcfd6e0, { metalness: .8, roughness: .3 }))
  pole.position.y = .675
  const finial = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), std(0xe0a64a, { metalness: .9, roughness: .2 }))
  finial.position.y = 1.37
  /* a horizontal top rod keeps the flag unfurled in vacuum, like the Apollo flags */
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .64, 6), std(0xcfd6e0, { metalness: .8, roughness: .3 }))
  rod.rotation.z = Math.PI / 2; rod.position.set(.32, 1.3, 0)
  const tex = canvasTexture(512, 320, ctx => {
    const grad = ctx.createLinearGradient(0, 0, 512, 320); grad.addColorStop(0, '#0b1a3a'); grad.addColorStop(1, '#13285a')
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 320)
    ctx.strokeStyle = '#9ee6ff'; ctx.lineWidth = 8; ctx.strokeRect(10, 10, 492, 300)
    drawLogo(ctx, 40, 40, 240)
    ctx.fillStyle = '#ffffff'; ctx.font = '600 44px "Space Grotesk", Arial'; ctx.fillText('HB', 300, 150)
    ctx.fillStyle = '#9ee6ff'; ctx.font = '500 26px "DM Mono", monospace'; ctx.fillText('MISSION 02', 300, 196)
  })
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(.64, .4, 14, 5), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: .8 }))
  cloth.position.set(.32, 1.1, 0)
  g.add(pole, finial, rod, cloth)
  return { root: g, cloth }
}
