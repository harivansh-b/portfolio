import * as THREE from 'three'
import gsap from 'gsap'
import { journey, clamp, smooth, SECTION_COUNT } from './state'
import { buildAstronaut, buildFlag, buildRocket } from './models'
import { drawLogo } from '../brand/logo'
import { glowSprite } from './textures'

const EARTH_R = 40
const MOON_C = new THREE.Vector3(0, 20, -750), MOON_R = 60
const SUN_C = new THREE.Vector3(-30, 75, -980), SUN_R = 115
const HELIOS_C = new THREE.Vector3(0, 95.8, -730)
const ROCKET_HALF = 1.6
const LAST = SECTION_COUNT - 1
const AT = { launch: 0, origin: 1, brief: 2, missions: 3, crew: 4, projects: 5, skills: 6, arena: 7, milestones: 8, contact: 9 }

/* One waypoint per DOM section: launchpad -> ... -> touchdown. */
const BASE_POINTS = [
  [0, EARTH_R + ROCKET_HALF, 0],
  [3, 58, -8],
  [16, 74, -70],
  [2, 82, -150],
  [-14, 86, -230],
  [8, 84, -310],
  [-6, 88, -390],
  [6, 84, -470],
  [-4, 98, -570],
].map(p => new THREE.Vector3(...p))
const MOON_END = new THREE.Vector3(0, MOON_C.y + MOON_R + ROCKET_HALF - .02, MOON_C.z)
const SUN_END = new THREE.Vector3(HELIOS_C.x, HELIOS_C.y + .2 + ROCKET_HALF, HELIOS_C.z)

/* Camera offset from the rocket for each section. */
const CAM = [
  [12.5, 1.2, 5], [9, 1.5, 12], [-11, 3.5, 11], [11, 2, 10], [-13, 4, 15], [11, 3, 13], [-12, 5, 11], [9, 1.5, 12], [-10, 3, 11], [3, 3.4, 14],
].map(p => new THREE.Vector3(...p))

let OCTAVES = 8
const noiseGlsl = () => /* glsl */`
float hash(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ float v = 0.0, a = .5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= .5; } return v; }
float fbm8(vec3 p){ float v = 0.0, a = .5; for (int i = 0; i < ${OCTAVES}; i++) { v += a * noise(p); p *= 2.07; a *= .5; } return v; }
vec3 hash3(vec3 p){ p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return fract(sin(p) * 43758.5453); }
float craters(vec3 p){
  vec3 i = floor(p), f = fract(p); float h = 0.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(float(x), float(y), float(z)), o = hash3(i + g);
    float t = length(g + o - f) / (.18 + .22 * o.x);
    h += (t < 1.0 ? (t * t - 1.0) * .7 : 0.0) + smoothstep(1.35, 1.0, t) * smoothstep(.75, 1.0, t) * .35;
  }
  return h;
}
`
const LIT_VERT = /* glsl */`varying vec3 vObj; varying vec3 vN; varying vec3 vW;
void main(){ vObj = position; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`

function label(text: string, color = '#9ee6ff', scale = 1) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 112
  const ctx = c.getContext('2d')!
  ctx.font = '600 44px "DM Mono", monospace'
  const w = Math.min(500, ctx.measureText(text).width + 56)
  ctx.fillStyle = 'rgba(6,12,30,.78)'; ctx.strokeStyle = color; ctx.lineWidth = 3
  ctx.beginPath(); ctx.roundRect((512 - w) / 2, 16, w, 80, 40); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 256, 58)
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }))
  sprite.scale.set(4.6 * scale, scale, 1)
  return sprite
}

export type SceneOptions = { projects: { name: string; featured?: boolean }[]; skills: string[]; achievements: string[]; crew: string[]; light: boolean; reducedMotion: boolean; low: boolean }

export class JourneyScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(45, 1, .1, 6000)
  private clock = new THREE.Clock()
  private raf = 0
  private mix = 0
  private disposed = false
  private w = 1; private h = 1; private mobile = false
  private reducedMotion: boolean
  private low: boolean
  private paused = false
  private maxPx = 2; private px = 1
  private frameTimes: number[] = []; private downgrades = 0

  private curve: THREE.CatmullRomCurve3
  private camPos = new THREE.Vector3()
  private camLook = new THREE.Vector3()
  private parallax = new THREE.Vector2()
  private side = 1

  private bg!: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>
  private stars!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  private earth!: THREE.Mesh; private clouds!: THREE.Mesh
  private moon!: THREE.Mesh; private sun!: THREE.Group; private sunMats: THREE.ShaderMaterial[] = []
  private helios!: THREE.Group; private wind!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  private station!: THREE.Group; private stationRing!: THREE.Object3D
  private rocket = buildRocket()
  private astronaut = buildAstronaut()
  private flag = buildFlag()
  private key = new THREE.DirectionalLight(0xffffff, 2.4)
  private rim = new THREE.DirectionalLight(0x7fb6ff, 1.1)
  private hemi = new THREE.HemisphereLight(0xbcd4ff, 0x1a1c28, .55)
  private fill = new THREE.DirectionalLight(0xffffff, .5)

  private exhaust!: { points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>; pos: Float32Array; vel: Float32Array; life: Float32Array; max: Float32Array; alpha: Float32Array; cursor: number; carry: number }
  private lastNozzle = new THREE.Vector3()
  private dust!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  private asteroids!: { mesh: THREE.InstancedMesh; data: { p: THREE.Vector3; r: THREE.Euler; spin: THREE.Vector3; s: number }[] }
  private satellites: THREE.Group[] = []
  private constellation!: THREE.Group
  private rings: { mesh: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>; u: number }[] = []
  private glowMats: THREE.Material[] = []
  private lightDir = { value: new THREE.Vector3(.55, .55, .65).normalize() }

  constructor(private canvas: HTMLCanvasElement, opts: SceneOptions) {
    this.reducedMotion = opts.reducedMotion
    this.low = opts.low
    OCTAVES = opts.low ? 5 : 8
    this.mix = opts.light ? 1 : 0
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !opts.low, powerPreference: opts.low ? 'default' : 'high-performance' })
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.curve = new THREE.CatmullRomCurve3([...BASE_POINTS.map(p => p.clone()), (opts.light ? SUN_END : MOON_END).clone()], false, 'centripetal', .5)

    this.buildBackdrop()
    this.buildEarth()
    this.buildDestinations()
    this.buildRocket()
    this.buildExhaust()
    this.buildDust()
    this.buildStation(opts.crew)
    this.buildSatellites(opts.projects)
    this.buildConstellation(opts.skills.length)
    this.buildAsteroids()
    this.buildRings(opts.achievements)

    this.scene.add(this.key, this.key.target, this.rim, this.rim.target, this.hemi, this.fill, this.fill.target)
    this.resize()
    window.addEventListener('resize', this.resize)
    this.applyThemeMaterials()
    this.loop()
  }

  /* ── construction ─────────────────────────────── */

  private buildBackdrop() {
    this.bg = new THREE.Mesh(new THREE.SphereGeometry(4000, 48, 24), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { uMix: { value: this.mix } },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: noiseGlsl() + `uniform float uMix; varying vec3 vDir;
        void main(){
          float h = vDir.y * .5 + .5;
          vec3 dark = mix(vec3(.004,.008,.03), vec3(.035,.055,.14), h);
          float n = fbm(vDir * 2.6 + 3.0), n2 = fbm(vDir * 5.0 + 11.0);
          dark += vec3(.20,.07,.34) * pow(n, 3.2) * 1.3 + vec3(.02,.16,.30) * pow(n2, 4.0) * 1.8;
          vec3 light = mix(vec3(.93,.85,.76), vec3(.985,.96,.92), h);
          light += vec3(.06,.01,-.04) * pow(n, 2.0) - vec3(.05,.02,-.02) * pow(n2, 3.0);
          gl_FragColor = vec4(mix(dark, light, uMix), 1.0);
        }`,
    }))
    this.bg.renderOrder = -10
    this.scene.add(this.bg)

    const count = this.low ? 1800 : 4200, pos = new Float32Array(count * 3), size = new Float32Array(count), seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const u = Math.random(), v = Math.random(), th = u * Math.PI * 2, ph = Math.acos(2 * v - 1), r = 1500 + Math.random() * 900
      pos.set([Math.sin(ph) * Math.cos(th) * r, Math.cos(ph) * r + 60, Math.sin(ph) * Math.sin(th) * r - 400], i * 3)
      size[i] = Math.random() < .06 ? 3.4 : .9 + Math.random() * 1.6
      seed[i] = Math.random() * 100
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    this.stars = new THREE.Points(g, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uMix: { value: this.mix }, uPx: { value: 1 } },
      vertexShader: `attribute float aSize; attribute float aSeed; uniform float uTime; uniform float uPx; varying float vTw;
        void main(){ vTw = .55 + .45 * sin(uTime * (.6 + fract(aSeed) * 1.8) + aSeed); gl_PointSize = aSize * uPx * (.7 + .3 * vTw); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uMix; varying float vTw;
        void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, .0, d);
          vec3 c = mix(vec3(.92,.95,1.0), vec3(.42,.36,.32), uMix);
          gl_FragColor = vec4(c, a * vTw * mix(1.0, .45, uMix)); }`,
    }))
    this.scene.add(this.stars)
  }

  private buildEarth() {
    const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, this.low ? 72 : 128, this.low ? 48 : 96), new THREE.ShaderMaterial({
      uniforms: { uLight: this.lightDir },
      vertexShader: LIT_VERT,
      fragmentShader: noiseGlsl() + `uniform vec3 uLight; varying vec3 vObj; varying vec3 vN; varying vec3 vW;
        void main(){
          vec3 p = normalize(vObj);
          float e = fbm8(p * 1.9 + 3.0) - .5 + .035;
          float moist = fbm(p * 4.0 + 11.0);
          vec3 deep = vec3(.02,.08,.22), shallow = vec3(.06,.30,.52), sand = vec3(.74,.68,.48), green = vec3(.22,.46,.2), forest = vec3(.1,.3,.14), rock = vec3(.45,.4,.33), snow = vec3(.94,.96,1.0);
          vec3 col = mix(deep, shallow, smoothstep(-.18, 0.0, e));
          float land = smoothstep(0.0, .006, e);
          vec3 lc = mix(sand, mix(green, forest, smoothstep(.45, .6, moist)), smoothstep(.006, .03, e));
          lc = mix(lc, rock, smoothstep(.1, .2, e)); lc = mix(lc, snow, smoothstep(.2, .26, e));
          col = mix(col, lc, land);
          float lat = abs(p.y) + (fbm(p * 6.0) - .5) * .12;
          col = mix(col, snow, smoothstep(.84, .88, lat));
          vec3 N = normalize(vN), L = normalize(uLight), V = normalize(cameraPosition - vW);
          float diff = max(dot(N, L), 0.0);
          float spec = pow(max(dot(N, normalize(L + V)), 0.0), 70.0) * (1.0 - land) * .7;
          float night = smoothstep(.15, -.1, dot(N, L)) * land * smoothstep(.72, .8, noise(p * 260.0)) * (1.0 - smoothstep(.84, .86, lat));
          gl_FragColor = vec4(col * (.07 + diff * 1.15) + spec * vec3(1.0,.95,.85) + night * vec3(1.0,.75,.4), 1.0);
        }`,
    }))
    earth.rotation.set(1.3, .6, .15)
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.012, this.low ? 64 : 96, this.low ? 40 : 64), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uLight: this.lightDir },
      vertexShader: LIT_VERT,
      fragmentShader: noiseGlsl() + `uniform vec3 uLight; varying vec3 vObj; varying vec3 vN;
        void main(){ vec3 p = normalize(vObj); float c = fbm8(p * vec3(2.6, 4.4, 2.6) + 21.0);
          float a = smoothstep(.5, .72, c) * .85 * smoothstep(.992, .97, normalize(vN).y); float diff = max(dot(normalize(vN), normalize(uLight)), 0.0);
          gl_FragColor = vec4(vec3(.06 + diff * 1.05), a); }`,
    }))
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.12, 64, 48), new THREE.ShaderMaterial({
      side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float f = pow(clamp(1.0 + dot(vN, vV) * 1.0, 0.0, 1.0), 3.0); gl_FragColor = vec4(vec3(.32,.62,1.0) * f * 1.6, f); }`,
    }))
    const pad = new THREE.Group()
    const metal = new THREE.MeshStandardMaterial({ color: 0x7a8496, metalness: .7, roughness: .4 })
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, .5, 32), metal); base.position.y = EARTH_R + .05
    const tower = new THREE.Mesh(new THREE.BoxGeometry(.28, 4.2, .28), metal); tower.position.set(-1.35, EARTH_R + 2.2, -.2)
    const arm = new THREE.Mesh(new THREE.BoxGeometry(.9, .12, .12), metal); arm.position.set(-.9, EARTH_R + 3.3, -.2)
    const light = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff5555 })); light.position.set(-1.35, EARTH_R + 4.35, -.2)
    pad.add(base, tower, arm, light)
    this.earth = earth; this.clouds = clouds
    this.scene.add(earth, clouds, atmo, pad)
  }

  private buildDestinations() {
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(MOON_R, this.low ? 72 : 128, this.low ? 48 : 96), new THREE.ShaderMaterial({
      uniforms: { uLight: this.lightDir },
      vertexShader: LIT_VERT,
      fragmentShader: noiseGlsl() + `uniform vec3 uLight; varying vec3 vObj; varying vec3 vN;
        void main(){
          vec3 p = normalize(vObj);
          float v = .62 + (fbm8(p * 3.0) - .5) * .4;
          v *= mix(1.0, .62, smoothstep(.5, .56, fbm(p * 1.4 + 5.0)));
          v += craters(p * 5.0) * .16 + craters(p * 13.0) * .1 + craters(p * 34.0) * .06 + craters(p * 90.0) * .03;
          float diff = max(dot(normalize(vN), normalize(uLight)), 0.0);
          gl_FragColor = vec4(vec3(v * 1.02, v, v * .97) * (.05 + diff * 1.1), 1.0);
        }`,
    }))
    this.moon.position.copy(MOON_C); this.moon.rotation.y = 1.4

    /* Sun: granulation, sunspots and limb darkening on the photosphere, an animated corona and prominence loops. */
    const sun = new THREE.Group()
    const photosphere = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: noiseGlsl() + `uniform float uTime; varying vec3 vP; varying vec3 vN; varying vec3 vV;
        void main(){
          vec3 p = normalize(vP);
          float gran = fbm(p * 38.0 + vec3(uTime * .05, 0.0, uTime * .04));
          float cells = smoothstep(.35, .75, fbm(p * 90.0 - uTime * .06));
          float large = fbm(p * 4.0 + vec3(0.0, uTime * .02, 0.0));
          float sn = fbm(p * 5.5 + 17.0);
          float spots = smoothstep(.70, .76, sn), penumbra = smoothstep(.66, .72, sn);
          vec3 col = mix(vec3(1.0,.45,.08), vec3(1.0,.82,.42), gran * .8 + cells * .35);
          col = mix(col, vec3(1.0,.95,.75), pow(large, 3.0) * 1.2);
          col *= 1.0 - penumbra * .45 - spots * .45;
          float mu = clamp(dot(vN, vV), 0.0, 1.0);
          col *= .38 + .62 * pow(mu, .55);
          col += vec3(1.0,.5,.12) * pow(1.0 - mu, 4.0) * .5;
          gl_FragColor = vec4(col * 1.15, 1.0);
        }`,
    })
    const corona = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
      vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: noiseGlsl() + `uniform float uTime; varying vec3 vN; varying vec3 vV; varying vec3 vP;
        void main(){
          float f = pow(clamp(1.0 + dot(vN, vV), 0.0, 1.0), 2.2);
          float rays = fbm(normalize(vP) * vec3(14.0, 3.0, 14.0) + vec3(0.0, uTime * .08, 0.0));
          gl_FragColor = vec4(vec3(1.0,.62,.25) * f * (.7 + rays * .9), f);
        }`,
    })
    this.sunMats.push(photosphere, corona)
    sun.add(new THREE.Mesh(new THREE.SphereGeometry(SUN_R, this.low ? 64 : 128, this.low ? 40 : 96), photosphere))
    sun.add(new THREE.Mesh(new THREE.SphereGeometry(SUN_R * 1.32, 96, 64), corona))
    for (const [size, color] of [[SUN_R * 3.6, 'rgba(255,190,90,0.7)'], [SUN_R * 7.5, 'rgba(255,140,60,0.3)']] as const) {
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(color), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }))
      glow.scale.setScalar(size); sun.add(glow)
    }
    /* prominence loops anchored around the limb that faces the journey */
    const promMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: noiseGlsl() + `uniform float uTime; varying vec2 vUv;
        void main(){ float n = fbm(vec3(vUv.x * 12.0 - uTime * .6, vUv.y * 3.0, uTime * .2));
          float a = pow(sin(vUv.y * 3.14159), 2.0) * (.15 + n * .55) * smoothstep(0.0, .1, vUv.x) * smoothstep(1.0, .9, vUv.x);
          gl_FragColor = vec4(mix(vec3(1.0,.22,.04), vec3(1.0,.6,.25), n) * 1.3, a); }`,
    })
    this.sunMats.push(promMat)
    const toJourney = new THREE.Vector3().subVectors(HELIOS_C, SUN_C).normalize()
    for (let k = 0; k < 6; k++) {
      const axis = new THREE.Vector3(Math.sin(k * 2.1), Math.cos(k * 1.7), Math.sin(k * 1.3 + 1)).normalize()
      const base = toJourney.clone().applyAxisAngle(axis, .55 + k * .12).multiplyScalar(SUN_R * .99)
      const across = new THREE.Vector3().crossVectors(base, axis).normalize()
      const out = base.clone().normalize()
      const span = 10 + k * 3, height = 14 + (k % 3) * 9
      const pts = Array.from({ length: 9 }, (_, j) => {
        const ang = (j / 8) * Math.PI
        return base.clone().addScaledVector(across, -Math.cos(ang) * span).addScaledVector(out, Math.sin(ang) * height)
      })
      sun.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 1.6 + (k % 2), 10, false), promMat))
    }
    sun.position.copy(SUN_C)
    this.sun = sun

    this.buildHelios()
    this.scene.add(this.moon, this.sun)
  }

  /* Helios: a heat-shielded observation platform parked in front of the Sun, the light-mode landing site. */
  private buildHelios() {
    const g = new THREE.Group()
    const hull = new THREE.MeshStandardMaterial({ color: 0xc9ced8, metalness: .7, roughness: .35 })
    const dark = new THREE.MeshStandardMaterial({ color: 0x2d3340, metalness: .6, roughness: .5 })
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, .4, 6), hull)
    const under = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 1.6, 1.6, 6), dark); under.position.y = -1
    const c = document.createElement('canvas'); c.width = c.height = 512
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#1b202b'; ctx.beginPath(); ctx.arc(256, 256, 256, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#ffb35c'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(256, 256, 230, 0, Math.PI * 2); ctx.stroke()
    ctx.setLineDash([30, 22]); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(256, 256, 196, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
    drawLogo(ctx, 96, 96, 320)
    const padTex = new THREE.CanvasTexture(c); padTex.colorSpace = THREE.SRGBColorSpace
    const pad = new THREE.Mesh(new THREE.CircleGeometry(3.3, 48), new THREE.MeshStandardMaterial({ map: padTex, roughness: .7 }))
    pad.rotation.x = -Math.PI / 2; pad.position.y = .205
    const posts = new THREE.Group()
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3 + Math.PI / 6
      const p = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .45, 6), hull); p.position.set(Math.cos(a) * 4, .42, Math.sin(a) * 4); posts.add(p)
      const r = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 4, 6), hull)
      const a2 = a + Math.PI / 3
      r.position.set((Math.cos(a) + Math.cos(a2)) * 2, .64, (Math.sin(a) + Math.sin(a2)) * 2)
      r.rotation.set(0, -(a + Math.PI / 6) + Math.PI / 2, Math.PI / 2); posts.add(r)
    }
    /* sun-facing heat shield, like the Parker Solar Probe's */
    const toSun = new THREE.Vector3().subVectors(SUN_C, HELIOS_C).normalize()
    const carbon = new THREE.MeshStandardMaterial({ color: 0x23262d, roughness: .85, metalness: .2 })
    const hot = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: .6, emissive: 0xff7a2a, emissiveIntensity: .5 })
    /* cylinder groups: side, top (faces the Sun), bottom (faces the deck) */
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, .45, 48, 1), [carbon, hot, carbon])
    shield.position.copy(toSun).multiplyScalar(8.5).add(new THREE.Vector3(0, -2.6, 0))
    shield.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), toSun)
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 8.5, 8), dark)
    strut.position.copy(shield.position).multiplyScalar(.5).add(new THREE.Vector3(0, -1.3, 0)); strut.quaternion.copy(shield.quaternion)
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1d3f8f, metalness: .6, roughness: .25, emissive: 0x2a1406, emissiveIntensity: .4 })
    for (const sgn of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(6, .06, 2), wingMat); w.position.set(sgn * 7.6, -.6, 0)
      const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, .14, .14), dark); arm.position.set(sgn * 4.5, -.6, 0)
      g.add(w, arm)
    }
    const dish = new THREE.Mesh(new THREE.SphereGeometry(.9, 24, 12, 0, Math.PI * 2, 0, Math.PI * .35), new THREE.MeshStandardMaterial({ color: 0xe9eef5, side: THREE.DoubleSide, metalness: .4, roughness: .4 }))
    dish.position.set(-2.6, -1.6, 2.2); dish.rotation.x = 2.4
    const lights = [0xff5d5d, 0x5dff9c].map((col, k) => { const b = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), new THREE.MeshBasicMaterial({ color: col })); b.position.set(k ? 4.3 : -4.3, .3, 0); return b })
    const sign = label('HELIOS STATION', '#ffb35c', 1.1); sign.position.set(0, 5.4, -2)
    g.add(deck, under, pad, posts, shield, strut, dish, ...lights, sign)
    g.position.copy(HELIOS_C)
    this.helios = g

    /* solar wind streaming past the platform */
    const N = this.low ? 300 : 700, pos = new Float32Array(N * 3), seed = new Float32Array(N)
    for (let i = 0; i < N; i++) { seed[i] = Math.random(); pos.set([(Math.random() - .5) * 70, (Math.random() - .5) * 40, (Math.random() - .5) * 70], i * 3) }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); wg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    this.wind = new THREE.Points(wg, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uDir: { value: toSun.clone().negate() } },
      vertexShader: `attribute float aSeed; uniform float uTime; uniform float uPx; uniform vec3 uDir; varying float vA;
        void main(){ float t = fract(uTime * (.05 + aSeed * .08) + aSeed); vec3 p = position + uDir * (t - .5) * 90.0; vA = sin(t * 3.14159);
          vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = uPx * clamp(70.0 / -mv.z, .8, 4.0); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(1.0,.7,.35, smoothstep(.5, .0, d) * vA * .8); }`,
    }))
    this.wind.position.copy(HELIOS_C)
    this.wind.frustumCulled = false
    this.scene.add(g, this.wind)
  }

  /* Crew waypoint: a small space station with one solar array per club. */
  private buildStation(crew: string[]) {
    const g = new THREE.Group()
    const hull = new THREE.MeshStandardMaterial({ color: 0xdfe3ea, metalness: .5, roughness: .4 })
    const gold = new THREE.MeshStandardMaterial({ color: 0xd8b25a, metalness: .9, roughness: .3 })
    const panel = new THREE.MeshStandardMaterial({ color: 0x1d3f8f, metalness: .6, roughness: .25, emissive: 0x0a1a40, emissiveIntensity: .5 })
    const core = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 7, 24), hull); core.rotation.z = Math.PI / 2
    const node = new THREE.Mesh(new THREE.SphereGeometry(1.25, 24, 16), hull)
    const lab = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, 3.2, 20), gold); lab.position.set(0, 0, 2); lab.rotation.x = Math.PI / 2
    const truss = new THREE.Mesh(new THREE.BoxGeometry(18, .3, .3), new THREE.MeshStandardMaterial({ color: 0x8d97a8, metalness: .8, roughness: .35 }))
    truss.position.y = 1.4
    g.add(core, node, lab, truss)
    const tagColors = ['#9ee6ff', '#ffd27a', '#9cf1b3', '#ff9bd2', '#ffa36c']
    crew.forEach((name, k) => {
      const x = crew.length > 1 ? -8 + k * (16 / (crew.length - 1)) : 0
      const arr = new THREE.Mesh(new THREE.BoxGeometry(2.2, .05, 6), panel); arr.position.set(x, 1.4, 0)
      const tag = label(name.toUpperCase(), tagColors[k % tagColors.length], .75); tag.position.set(x, 2.5 + (k % 2) * .9, 0)
      g.add(arr, tag)
    })
    const ring = new THREE.Group()
    ring.add(new THREE.Mesh(new THREE.TorusGeometry(4.2, .28, 12, 64), hull))
    for (let k = 0; k < 4; k++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 8.4, 6), hull); sp.rotation.z = k * Math.PI / 4; ring.add(sp) }
    const ringHolder = new THREE.Group(); ringHolder.add(ring); ringHolder.rotation.y = Math.PI / 2; ringHolder.position.x = -2
    g.add(ringHolder)
    for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshBasicMaterial({ color: k === 1 ? 0x5dff9c : 0xff5d5d })); l.position.set(-3.6 + k * 3.6, -.95, 0); g.add(l) }
    g.position.copy(this.curve.getPoint(AT.crew / LAST)).add(new THREE.Vector3(-4, 4.5, -12))
    g.rotation.set(.15, .5, .08)
    this.station = g; this.stationRing = ring
    this.scene.add(g)
  }

  private buildRocket() {
    const { root } = this.rocket
    this.astronaut.root.scale.setScalar(.9)
    this.astronaut.root.position.set(0, this.rocket.cockpitY - .28, 0)
    root.add(this.astronaut.root)
    this.flag.root.position.set(2.15, -ROCKET_HALF + .02, .35)
    this.flag.root.rotation.y = -.45
    root.add(this.flag.root)
    this.scene.add(root)
  }

  private buildExhaust() {
    const N = this.low ? 450 : 900
    const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N), max = new Float32Array(N).fill(1), alpha = new Float32Array(N), size = new Float32Array(N)
    for (let i = 0; i < N; i++) size[i] = .6 + Math.random() * .9
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uPx: { value: 1 }, uMix: { value: 0 } },
      vertexShader: `attribute float aAlpha; attribute float aSize; uniform float uPx; varying float vA;
        void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aAlpha <= 0.0 ? 0.0 : min(aSize * uPx * (220.0 / max(-mv.z, .5)) * (1.6 - aAlpha), 96.0); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uMix; varying float vA;
        void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, .0, d) * vA;
          vec3 hot = mix(vec3(1.0,.62,.25), vec3(1.0,.95,.8), vA * vA);
          vec3 smoke = vec3(.55,.5,.48);
          vec3 c = mix(hot, mix(smoke, hot, vA), uMix);
          gl_FragColor = vec4(c, a * mix(.9, .7, uMix)); }`,
    })
    const points = new THREE.Points(g, mat)
    points.frustumCulled = false
    this.exhaust = { points, pos, vel, life, max, alpha, cursor: 0, carry: 0 }
    this.scene.add(points)
  }

  private buildDust() {
    const N = this.low ? 1000 : 2600, pos = new Float32Array(N * 3), p = new THREE.Vector3()
    for (let i = 0; i < N; i++) {
      this.curve.getPoint(Math.random(), p)
      p.x += (Math.random() - .5) * 90; p.y += (Math.random() - .5) * 60; p.z += (Math.random() - .5) * 40
      pos.set([p.x, p.y, p.z], i * 3)
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.dust = new THREE.Points(g, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uPx: { value: 1 }, uMix: { value: 0 } },
      vertexShader: `uniform float uPx; varying float vD; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_PointSize = uPx * clamp(60.0 / vD, .6, 3.5); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uMix; varying float vD; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, .1, d) * smoothstep(140.0, 10.0, vD);
        gl_FragColor = vec4(mix(vec3(.8,.9,1.0), vec3(.35,.3,.28), uMix), a * .7); }`,
    }))
    this.scene.add(this.dust)
  }

  private buildSatellites(list: { name: string; featured?: boolean }[]) {
    const colors = [0x6fd3ff, 0xffb35c, 0x9cf1b3, 0xd7a2ff, 0xff8fab, 0xffe066, 0x7fffd4, 0xa0b4ff, 0xffa36c]
    const center = this.curve.getPoint(AT.projects / LAST)
    list.forEach(({ name, featured }, i) => {
      const color = colors[i % colors.length]
      const g = new THREE.Group()
      const body = new THREE.Mesh(new THREE.BoxGeometry(.9, .7, .7), new THREE.MeshStandardMaterial({ color: 0xd8b25a, metalness: .9, roughness: .3 }))
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x1d3f8f, metalness: .6, roughness: .25, emissive: color, emissiveIntensity: .12 })
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, .04, .8), panelMat); p1.position.x = 1.6
      const p2 = p1.clone(); p2.position.x = -1.6
      const dish = new THREE.Mesh(new THREE.ConeGeometry(.35, .3, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xe9eef5, side: THREE.DoubleSide }))
      dish.position.y = .5; dish.rotation.x = Math.PI
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshBasicMaterial({ color }))
      lamp.position.set(0, .2, .38)
      g.add(body, p1, p2, dish, lamp)
      if (featured) { const tag = label(name.toUpperCase(), '#' + color.toString(16).padStart(6, '0')); tag.position.y = 1.5; g.add(tag) }
      g.scale.setScalar(featured ? 1 : .7)
      g.userData = { center, radius: 7 + i * 1.05, speed: .24 - i * .009, phase: i * 2.4, tilt: ((i % 5) - 2) * .3 }
      this.satellites.push(g); this.scene.add(g)
    })
  }

  private buildConstellation(count: number) {
    const group = new THREE.Group()
    const center = this.curve.getPoint(AT.skills / LAST)
    group.position.copy(center)
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < count; i++) {
      const th = i * 2.399963, y = 1 - (i / (count - 1)) * 2, r = Math.sqrt(1 - y * y), rad = 11 + (i % 4) * 2.5
      pts.push(new THREE.Vector3(Math.cos(th) * r * rad, y * rad * .7, Math.sin(th) * r * rad))
    }
    const linePos: number[] = []
    pts.forEach((p, i) => {
      pts.map((q, j) => ({ j, d: p.distanceTo(q) })).filter(o => o.j > i).sort((a, b) => a.d - b.d).slice(0, 2)
        .forEach(({ j }) => linePos.push(p.x, p.y, p.z, pts[j].x, pts[j].y, pts[j].z))
    })
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3))
    const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: .35 }))
    const pg = new THREE.BufferGeometry().setFromPoints(pts)
    const nodes = new THREE.Points(pg, new THREE.PointsMaterial({ size: 2.4, map: glowSprite('rgba(170,235,255,1)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
    group.add(lines, nodes)
    this.glowMats.push(nodes.material, lines.material)
    this.constellation = group
    this.scene.add(group)
  }

  private buildAsteroids() {
    const geo = new THREE.IcosahedronGeometry(1, 1)
    const pa = geo.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3()
    for (let i = 0; i < pa.count; i++) {
      v.fromBufferAttribute(pa, i)
      const k = 1 + .28 * Math.sin(v.x * 4.1 + v.y * 2.3) * Math.cos(v.z * 3.7 - v.x)
      pa.setXYZ(i, v.x * k, v.y * k * .85, v.z * k)
    }
    geo.computeVertexNormals()
    const N = this.low ? 110 : 240
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0x8a8278, roughness: .95, metalness: .05, flatShading: true }), N)
    const data: { p: THREE.Vector3; r: THREE.Euler; spin: THREE.Vector3; s: number }[] = []
    const p = new THREE.Vector3(), t = new THREE.Vector3(), n = new THREE.Vector3(), b = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0)
    for (let i = 0; i < N; i++) {
      const u = (AT.arena - .65 + Math.random() * 1.3) / LAST
      this.curve.getPoint(u, p); this.curve.getTangent(u, t)
      n.crossVectors(t, up).normalize(); b.crossVectors(n, t).normalize()
      const ang = Math.random() * Math.PI * 2, rad = 6 + Math.pow(Math.random(), .7) * 46
      const pos = p.clone().addScaledVector(n, Math.cos(ang) * rad).addScaledVector(b, Math.sin(ang) * rad * .6)
      data.push({ p: pos, r: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6), spin: new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).multiplyScalar(.6), s: .35 + Math.pow(Math.random(), 2.2) * 3.4 })
    }
    this.asteroids = { mesh, data }
    this.scene.add(mesh)
  }

  private buildRings(titles: string[]) {
    const colors = [0x9ee6ff, 0xffd27a, 0x9cf1b3, 0xff9bd2, 0xffa36c]
    const p = new THREE.Vector3(), t = new THREE.Vector3()
    titles.forEach((title, i) => {
      const u = (AT.milestones - .45 + i * .2) / LAST
      this.curve.getPoint(u, p); this.curve.getTangent(u, t)
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(3.4, .09, 12, 72), new THREE.MeshBasicMaterial({ color: colors[i], transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }))
      mesh.position.copy(p); mesh.lookAt(p.clone().add(t))
      const tag = label(title.toUpperCase(), '#' + colors[i].toString(16).padStart(6, '0'), .8)
      tag.position.copy(p).add(new THREE.Vector3(0, 4.2, 0))
      this.rings.push({ mesh, u }); this.glowMats.push(mesh.material)
      this.scene.add(mesh, tag)
    })
  }

  /* ── theme ────────────────────────────────────── */

  setTheme(light: boolean) {
    gsap.to(this, { mix: light ? 1 : 0, duration: this.reducedMotion ? 0 : 1.4, ease: 'power2.inOut', onUpdate: () => this.applyThemeMaterials() })
  }

  private applyThemeMaterials() {
    const m = this.mix
    this.bg.material.uniforms.uMix.value = m
    this.stars.material.uniforms.uMix.value = m
    this.exhaust.points.material.uniforms.uMix.value = m
    this.dust.material.uniforms.uMix.value = m
    const additive = m < .5
    for (const mat of this.glowMats as (THREE.Material & { color: THREE.Color })[]) {
      const base = (mat.userData.base ??= mat.color.clone()) as THREE.Color
      mat.color.copy(base).multiplyScalar(1 - .5 * m)
    }
    for (const mat of [...this.glowMats, this.exhaust.points.material]) {
      const blending = additive ? THREE.AdditiveBlending : THREE.NormalBlending
      if (mat.blending !== blending) { mat.blending = blending; mat.needsUpdate = true }
    }
    this.renderer.toneMappingExposure = 1.05 + m * .15
    this.hemi.intensity = .55 + m * .6
    this.hemi.color.set(m > .5 ? 0xfff1df : 0xbcd4ff)
    this.key.color.set(m > .5 ? 0xffe2b8 : 0xffffff)
    this.rim.color.set(m > .5 ? 0xffb27a : 0x7fb6ff)
    this.moon.scale.setScalar(Math.max(.001, 1 - m)); this.moon.visible = m < .995
    this.sun.scale.setScalar(Math.max(.001, m)); this.sun.visible = m > .005
    this.helios.scale.setScalar(Math.max(.001, m)); this.helios.visible = this.wind.visible = m > .005
    for (const mat of [this.rocket.flame.material, this.rocket.core.material] as THREE.ShaderMaterial[]) mat.uniforms.uMix.value = m
    this.curve.points[this.curve.points.length - 1].lerpVectors(MOON_END, SUN_END, m)
  }

  /* ── frame ────────────────────────────────────── */

  private resize = () => {
    const parent = this.canvas.parentElement!
    this.w = parent.clientWidth; this.h = parent.clientHeight
    this.mobile = this.w < 820
    this.maxPx = Math.min(window.devicePixelRatio, this.low ? 1.25 : 2)
    const px = this.px = Math.min(this.maxPx, this.px > 1 || this.downgrades ? this.px : this.maxPx)
    this.renderer.setPixelRatio(px)
    this.renderer.setSize(this.w, this.h, false)
    this.camera.aspect = this.w / this.h
    for (const m of [this.stars.material, this.exhaust.points.material, this.dust.material, this.wind.material]) m.uniforms.uPx.value = px
  }

  /* Stop rendering entirely while a full-screen dialog covers the scene. */
  setPaused(paused: boolean) {
    if (paused === this.paused) return
    this.paused = paused
    if (paused) cancelAnimationFrame(this.raf)
    else { this.clock.getDelta(); this.loop() }
  }

  private loop = () => {
    if (this.disposed || this.paused) return
    this.raf = requestAnimationFrame(this.loop)
    const raw = this.clock.getDelta()
    const dt = Math.min(raw, .05), time = this.clock.elapsedTime
    this.update(dt, time)
    this.renderer.render(this.scene, this.camera)
    this.adapt(raw)
  }

  /* If frames are consistently slow, render at a lower resolution (up to three steps). */
  private adapt(frame: number) {
    if (this.downgrades >= 3 || document.hidden) return
    this.frameTimes.push(frame)
    if (this.frameTimes.length < 90) return
    const sorted = [...this.frameTimes].sort((a, b) => a - b), median = sorted[sorted.length >> 1]
    this.frameTimes = []
    if (median > 1 / 40 && this.px > .75) {
      this.px = Math.max(.75, this.px - .25); this.downgrades++
      this.renderer.setPixelRatio(this.px)
      this.renderer.setSize(this.w, this.h, false)
      for (const m of [this.stars.material, this.exhaust.points.material, this.dust.material, this.wind.material]) m.uniforms.uPx.value = this.px
    }
  }

  private tmp = { p: new THREE.Vector3(), t: new THREE.Vector3(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), v: new THREE.Vector3(), m: new THREE.Matrix4(), e: new THREE.Euler(), s: new THREE.Vector3() }

  private update(dt: number, time: number) {
    const { p, t, q, q2, v } = this.tmp
    const s = clamp(journey.s, 0, LAST), u = s / LAST
    const i = Math.min(LAST - 1, Math.floor(s)), f = smooth(0, 1, s - i)
    const speed = clamp(Math.abs(journey.velocity) / 2600)
    const landT = smooth(LAST - .55, LAST - .05, s)
    const exitT = smooth(LAST - .18, LAST, s)

    /* rocket placement + attitude */
    this.curve.getPoint(u, p); this.curve.getTangent(u, t)
    const rocket = this.rocket.root
    rocket.position.copy(p)
    if (!this.reducedMotion) rocket.position.y += Math.sin(time * 1.6) * .06 * (1 - landT) * smooth(.04, .3, s)
    q.setFromUnitVectors(v.set(0, 1, 0), t)
    q2.setFromAxisAngle(t, Math.sin(time * .7) * .12 + s * .6)
    q.premultiply(q2)
    const upright = Math.max(1 - smooth(0, .45, s), landT)
    q.slerp(q2.identity(), upright)
    rocket.quaternion.slerp(q, 1 - Math.pow(.0005, dt))

    /* astronaut: rides in the dome, hops out on arrival */
    const astro = this.astronaut
    const inside = v.set(0, this.rocket.cockpitY - .28, 0)
    const out = this.tmp.s.set(1.35, -ROCKET_HALF + .26, .95)
    astro.root.position.lerpVectors(inside, out, exitT)
    astro.root.position.y += Math.sin(exitT * Math.PI) * 1.1
    astro.root.scale.setScalar(.9 + exitT * .15)
    astro.root.rotation.set(0, -.35 * exitT + Math.sin(time * .9) * .15 * (1 - exitT), 0)
    astro.armR.rotation.z = THREE.MathUtils.lerp(.35, 2.5 + Math.sin(time * 7) * .4, exitT)
    astro.armL.rotation.z = THREE.MathUtils.lerp(-.35, -.6, exitT)
    astro.helmet.rotation.y = Math.sin(time * .6) * .3

    this.flag.root.scale.setScalar(Math.max(.001, smooth(.4, 1, exitT)))
    this.flag.root.visible = this.flag.root.scale.x > .01
    const cloth = this.flag.cloth.geometry.attributes.position as THREE.BufferAttribute
    for (let k = 0; k < cloth.count; k++) { const x = cloth.getX(k) + .32; cloth.setZ(k, Math.sin(x * 7 - time * 1.2) * .025 * x) }
    cloth.needsUpdate = true

    /* engine */
    const idle = .32 + Math.sin(time * 20) * .04
    const flight = .55 + speed * .7 + Math.sin(time * 31) * .05
    const throttle = THREE.MathUtils.lerp(idle, flight, smooth(.02, .2, s)) * (1 - landT)
    this.rocket.flame.scale.set(1 + speed * .3, Math.max(.001, throttle * 2.2), 1 + speed * .3)
    this.rocket.core.scale.set(1, Math.max(.001, throttle * 1.4), 1)
    this.rocket.flame.visible = this.rocket.core.visible = throttle > .02
    for (const mat of [this.rocket.flame.material, this.rocket.core.material] as THREE.ShaderMaterial[]) mat.uniforms.uTime.value = time
    ;(this.rocket.throat.material as THREE.MeshBasicMaterial).color.setRGB(.2 + throttle * 1.2, .1 + throttle * .6, .05 + throttle * .2)
    /* legs fold out during the final descent */
    const legT = smooth(LAST - .6, LAST - .2, s)
    for (const leg of this.rocket.legs) leg.rotation.z = THREE.MathUtils.lerp(Math.PI - .03, .63, legT)
    ;(this.rocket.beacon.material as THREE.MeshBasicMaterial).color.setHSL(0, 1, .35 + .3 * (Math.sin(time * 5) > .4 ? 1 : 0))
    this.updateExhaust(dt, throttle)

    /* lights follow the rocket */
    const moonDir = v.set(.55, .55, .65).normalize()
    const sunDir = this.tmp.t.copy(SUN_C).sub(p).normalize()
    const kd = moonDir.lerp(sunDir, this.mix * smooth(5.5, 8.5, s)).normalize()
    this.lightDir.value.copy(kd)
    this.key.position.copy(p).addScaledVector(kd, 60); this.key.target.position.copy(p)
    this.rim.position.copy(p).add(new THREE.Vector3(-30, 10, -40)); this.rim.target.position.copy(p)
    this.key.intensity = 2.4 + this.mix * .8

    /* world animation */
    if (!this.reducedMotion) {
      this.clouds.rotation.y += dt * .018
      this.moon.rotation.y += dt * .004
      this.constellation.rotation.y += dt * .05
    }
    for (const mat of this.sunMats) mat.uniforms.uTime.value = time
    this.wind.material.uniforms.uTime.value = time
    if (!this.reducedMotion) { this.stationRing.rotation.z += dt * .15; this.station.rotation.y += dt * .02 }
    this.stars.material.uniforms.uTime.value = time
    for (const sat of this.satellites) {
      const d = sat.userData, a = d.phase + time * d.speed
      sat.position.set(d.center.x + Math.cos(a) * d.radius, d.center.y + Math.sin(a) * d.radius * Math.sin(d.tilt) + Math.sin(a * 2) * 1.2, d.center.z + Math.sin(a) * d.radius)
      sat.rotation.y = -a; sat.rotation.z = Math.sin(time * .5 + d.phase) * .2
    }
    const { mesh, data } = this.asteroids, m4 = this.tmp.m, e = this.tmp.e
    for (let k = 0; k < data.length; k++) {
      const a = data[k]
      e.set(a.r.x + time * a.spin.x, a.r.y + time * a.spin.y, a.r.z + time * a.spin.z)
      m4.makeRotationFromEuler(e).scale(this.tmp.s.setScalar(a.s)).setPosition(a.p)
      mesh.setMatrixAt(k, m4)
    }
    mesh.instanceMatrix.needsUpdate = true
    for (const r of this.rings) {
      const passed = smooth(r.u * LAST - .1, r.u * LAST + .05, s)
      r.mesh.material.opacity = .35 + passed * .55 + Math.sin(time * 3 + r.u * 40) * .08
      r.mesh.scale.setScalar(1 + passed * .15)
      r.mesh.rotation.z += dt * .3
    }

    /* camera rig: blended per-section offsets, gentle parallax, speed FOV kick */
    const camOff = this.tmp.s.lerpVectors(CAM[i], CAM[i + 1], f)
    if (this.mobile) camOff.multiplyScalar(1.25)
    this.parallax.lerp(new THREE.Vector2(journey.pointer.x, journey.pointer.y), 1 - Math.pow(.02, dt))
    const target = p.clone().add(camOff).add(new THREE.Vector3(this.parallax.x * .9, -this.parallax.y * .5, 0))
    const look = p.clone().add(new THREE.Vector3(0, .35, 0))
    const k = 1 - Math.pow(.001, dt)
    if (this.camPos.lengthSq() === 0) { this.camPos.copy(target); this.camLook.copy(look) }
    this.camPos.lerp(target, k); this.camLook.lerp(look, k)
    this.camera.position.copy(this.camPos)
    if (!this.reducedMotion && speed > .05) this.camera.position.add(v.set(Math.random() - .5, Math.random() - .5, 0).multiplyScalar(speed * .06))
    this.camera.lookAt(this.camLook)
    this.camera.fov = 45 + speed * 9
    this.bg.position.copy(this.camera.position)
    this.fill.position.copy(this.camera.position); this.fill.target.position.copy(p)
    this.fill.intensity = .45 + this.mix * 1.1

    const sides = journey.sides
    const sideTarget = this.mobile ? 0 : THREE.MathUtils.lerp(sides[i] ?? 1, sides[i + 1] ?? 1, f)
    this.side += (sideTarget - this.side) * (1 - Math.pow(.01, dt))
    this.camera.setViewOffset(this.w, this.h, -this.side * this.w * .21, this.mobile ? this.h * .2 : 0, this.w, this.h)
    this.camera.updateProjectionMatrix()
  }

  private updateExhaust(dt: number, throttle: number) {
    const ex = this.exhaust, N = ex.life.length
    const nozzle = this.rocket.root.localToWorld(new THREE.Vector3(0, this.rocket.nozzleY - .1, 0))
    const dir = new THREE.Vector3(0, -1, 0).applyQuaternion(this.rocket.root.quaternion)
    if (this.lastNozzle.lengthSq() === 0) this.lastNozzle.copy(nozzle)
    ex.carry += throttle * (this.low ? 200 : 380) * dt
    const spawn = Math.floor(ex.carry); ex.carry -= spawn
    for (let n = 0; n < spawn; n++) {
      const k = ex.cursor; ex.cursor = (ex.cursor + 1) % N
      const lerpT = (n + Math.random()) / Math.max(1, spawn)
      ex.pos[k * 3] = THREE.MathUtils.lerp(this.lastNozzle.x, nozzle.x, lerpT) + (Math.random() - .5) * .2
      ex.pos[k * 3 + 1] = THREE.MathUtils.lerp(this.lastNozzle.y, nozzle.y, lerpT) + (Math.random() - .5) * .2
      ex.pos[k * 3 + 2] = THREE.MathUtils.lerp(this.lastNozzle.z, nozzle.z, lerpT) + (Math.random() - .5) * .2
      const sp = 4 + throttle * 9
      ex.vel[k * 3] = dir.x * sp + (Math.random() - .5) * 1.6
      ex.vel[k * 3 + 1] = dir.y * sp + (Math.random() - .5) * 1.6
      ex.vel[k * 3 + 2] = dir.z * sp + (Math.random() - .5) * 1.6
      ex.max[k] = .5 + Math.random() * .8; ex.life[k] = ex.max[k]
    }
    this.lastNozzle.copy(nozzle)
    for (let k = 0; k < N; k++) {
      if (ex.life[k] <= 0) { ex.alpha[k] = 0; continue }
      ex.life[k] -= dt
      const drag = 1 - dt * 1.8
      ex.vel[k * 3] *= drag; ex.vel[k * 3 + 1] *= drag; ex.vel[k * 3 + 2] *= drag
      ex.pos[k * 3] += ex.vel[k * 3] * dt; ex.pos[k * 3 + 1] += ex.vel[k * 3 + 1] * dt; ex.pos[k * 3 + 2] += ex.vel[k * 3 + 2] * dt
      ex.alpha[k] = Math.max(0, ex.life[k] / ex.max[k])
    }
    const g = ex.points.geometry
    g.attributes.position.needsUpdate = true
    g.attributes.aAlpha.needsUpdate = true
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.resize)
    gsap.killTweensOf(this)
    this.scene.traverse(o => {
      const mesh = o as THREE.Mesh
      mesh.geometry?.dispose()
      const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
      mats.forEach(m => { Object.values(m).forEach(val => { if (val instanceof THREE.Texture) val.dispose() }); m.dispose() })
    })
    this.renderer.dispose()
  }
}
