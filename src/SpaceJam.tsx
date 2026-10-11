import { useEffect, useRef, useState } from 'react'
import { Bomb, Pause, Play, RotateCcw, Rocket, X } from 'lucide-react'

/* ── Space Jam v2 ──────────────────────────────────
   Waves of splitting asteroids, UFOs that shoot back, a boss every fifth wave,
   power-ups, combo multiplier, bombs, screen shake and a persisted best score. */

type Kind = 'triple' | 'rapid' | 'shield' | 'life' | 'bomb'
interface Ship { x: number; y: number; vx: number; vy: number; inv: number; shield: number; triple: number; rapid: number }
interface Bullet { x: number; y: number; vx: number; vy: number }
interface Asteroid { x: number; y: number; vx: number; vy: number; r: number; rot: number; spin: number; hp: number; tier: number; shape: number[]; flash: number }
interface Ufo { x: number; y: number; t: number; dir: number; hp: number; cd: number; flash: number }
interface Boss { x: number; y: number; t: number; hp: number; max: number; cd: number; cd2: number; flash: number; enter: number }
interface PowerUp { x: number; y: number; kind: Kind; t: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string }
interface Floater { x: number; y: number; text: string; life: number; color: string }

const POWER: Record<Kind, { color: string; label: string }> = {
  triple: { color: '#8fe3ff', label: '3' },
  rapid: { color: '#ffd166', label: 'R' },
  shield: { color: '#9cf1b3', label: 'S' },
  life: { color: '#ff6b8b', label: '♥' },
  bomb: { color: '#ff9f43', label: 'B' },
}
const BEST_KEY = 'hb-spacejam-best'
const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0 } catch { return 0 } }
const rand = (a: number, b: number) => a + Math.random() * (b - a)

class Game {
  w = 800; h = 500
  mode: 'title' | 'playing' | 'paused' | 'over' = 'title'
  ship!: Ship
  bullets: Bullet[] = []; enemyBullets: Bullet[] = []
  asteroids: Asteroid[] = []; ufos: Ufo[] = []; boss: Boss | null = null
  powerups: PowerUp[] = []; particles: Particle[] = []; floaters: Floater[] = []
  stars = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() }))
  score = 0; best = readBest(); lives = 3; bombs = 1; wave = 0
  combo = 1; comboTimer = 0
  toSpawn = 0; spawnTimer = 0; ufoTimer = 0; banner = 0; bannerText = ''
  cooldown = 0; shake = 0; time = 0; newBest = false
  keys = new Set<string>(); firing = false
  pointer: { x: number; y: number } | null = null

  constructor(private beep: (p?: number) => void, private onChange: () => void) { this.resetShip() }

  resetShip() { this.ship = { x: this.w / 2, y: this.h - 70, vx: 0, vy: 0, inv: 2, shield: 0, triple: 0, rapid: 0 } }

  start() {
    Object.assign(this, { score: 0, lives: 3, bombs: 1, wave: 0, combo: 1, comboTimer: 0, newBest: false, bullets: [], enemyBullets: [], asteroids: [], ufos: [], boss: null, powerups: [], floaters: [] })
    this.resetShip(); this.nextWave(); this.mode = 'playing'; this.beep(660); this.onChange()
  }

  nextWave() {
    this.wave++
    const bossWave = this.wave % 5 === 0
    this.toSpawn = bossWave ? 3 : 5 + this.wave * 2
    this.spawnTimer = 1.2; this.ufoTimer = rand(6, 12)
    this.bannerText = bossWave ? `WAVE ${this.wave} · MOTHERSHIP` : `WAVE ${this.wave}`
    this.banner = 2.4
    if (bossWave) { const max = 60 + this.wave * 10; this.boss = { x: this.w / 2, y: -90, t: 0, hp: max, max, cd: 2.5, cd2: 1.5, flash: 0, enter: 0 } }
    this.beep(900)
  }

  spawnAsteroid(tier = 3, x?: number, y?: number, vx?: number, vy?: number) {
    const r = tier === 3 ? rand(30, 40) : tier === 2 ? rand(18, 24) : rand(10, 13)
    const speed = (40 + this.wave * 6) * (1 + (3 - tier) * .35)
    this.asteroids.push({
      x: x ?? rand(r, this.w - r), y: y ?? -r - rand(0, 60),
      vx: vx ?? rand(-.35, .35) * speed, vy: vy ?? rand(.75, 1) * speed,
      r, rot: rand(0, 6), spin: rand(-1.4, 1.4), tier, flash: 0,
      hp: tier === 3 ? 3 + Math.floor(this.wave / 4) : tier === 2 ? 2 : 1,
      shape: Array.from({ length: 11 }, () => rand(.74, 1.08)),
    })
  }

  burst(x: number, y: number, n: number, color: string, speed = 160, size = 3) {
    for (let i = 0; i < n && this.particles.length < 700; i++) {
      const a = rand(0, Math.PI * 2), s = rand(.2, 1) * speed, max = rand(.35, .9)
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: max, max, size: rand(1, size), color })
    }
  }

  addScore(base: number, x: number, y: number) {
    const pts = base * this.combo
    this.score += pts
    this.floaters.push({ x, y, text: `+${pts}${this.combo > 1 ? ` ×${this.combo}` : ''}`, life: 1, color: this.combo > 3 ? '#ffd166' : '#cfefff' })
    this.combo = Math.min(8, this.combo + (this.comboTimer > 0 ? 1 : 0)); this.comboTimer = 1.8
  }

  maybeDrop(x: number, y: number, chance: number) {
    if (Math.random() > chance) return
    const bag: Kind[] = ['triple', 'triple', 'triple', 'rapid', 'rapid', 'rapid', 'shield', 'shield', 'life', 'bomb']
    this.powerups.push({ x, y, kind: bag[Math.floor(Math.random() * bag.length)], t: 0 })
  }

  useBomb() {
    if (this.mode !== 'playing' || this.bombs <= 0) return
    this.bombs--; this.shake = 18; this.beep(140)
    for (const a of this.asteroids) { this.burst(a.x, a.y, 14, '#ff9f43'); this.addScore(10, a.x, a.y) }
    this.asteroids = []; this.enemyBullets = []
    for (const u of this.ufos) { u.hp -= 3 }
    if (this.boss) { this.boss.hp -= this.boss.max * .12; this.boss.flash = .3 }
    this.burst(this.ship.x, this.ship.y, 80, '#ffd166', 520, 4)
    this.onChange()
  }

  hitShip() {
    const s = this.ship
    if (s.inv > 0) return
    if (s.shield > 0) { s.shield = 0; s.inv = 1; this.burst(s.x, s.y, 30, '#9cf1b3', 260); this.beep(300); return }
    this.lives--; this.combo = 1; this.shake = 16; s.inv = 2.2
    this.burst(s.x, s.y, 50, '#ff6b8b', 300, 4); this.beep(160)
    if (this.lives <= 0) {
      this.mode = 'over'
      if (this.score > this.best) { this.best = this.score; this.newBest = true; try { localStorage.setItem(BEST_KEY, String(this.best)) } catch { /* storage unavailable */ } }
      this.beep(110)
    }
    this.onChange()
  }

  update(dt: number) {
    this.time += dt
    for (const st of this.stars) { st.y += dt * (.02 + st.z * .12) * (this.mode === 'playing' ? 1 : .4); if (st.y > 1) { st.y = 0; st.x = Math.random() } }
    this.particles = this.particles.filter(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .97; p.vy *= .97; p.life -= dt; return p.life > 0 })
    this.floaters = this.floaters.filter(f => { f.y -= 40 * dt; f.life -= dt; return f.life > 0 })
    this.shake = Math.max(0, this.shake - dt * 40)
    if (this.mode !== 'playing') return

    const s = this.ship, W = this.w, H = this.h
    /* movement: keyboard, or follow pointer while dragging */
    const k = this.keys
    const ax = (k.has('arrowright') || k.has('d') ? 1 : 0) - (k.has('arrowleft') || k.has('a') ? 1 : 0)
    const ay = (k.has('arrowdown') || k.has('s') ? 1 : 0) - (k.has('arrowup') || k.has('w') ? 1 : 0)
    if (this.pointer) {
      s.vx = (this.pointer.x - s.x) * 12; s.vy = (this.pointer.y - 40 - s.y) * 12
    } else {
      s.vx += ax * 2600 * dt; s.vy += ay * 2600 * dt
      s.vx *= Math.pow(.0009, dt); s.vy *= Math.pow(.0009, dt)
    }
    const max = 460
    s.vx = Math.max(-max, Math.min(max, s.vx)); s.vy = Math.max(-max, Math.min(max, s.vy))
    s.x = Math.max(18, Math.min(W - 18, s.x + s.vx * dt))
    s.y = Math.max(H * .35, Math.min(H - 26, s.y + s.vy * dt))
    s.inv = Math.max(0, s.inv - dt); s.shield = Math.max(0, s.shield - dt); s.triple = Math.max(0, s.triple - dt); s.rapid = Math.max(0, s.rapid - dt)

    /* fire */
    this.cooldown -= dt
    if ((this.firing || k.has(' ') || k.has('j') || this.pointer) && this.cooldown <= 0) {
      const spread = s.triple > 0 ? [-.16, 0, .16] : [0]
      for (const a of spread) this.bullets.push({ x: s.x + a * 30, y: s.y - 22, vx: Math.sin(a) * 700, vy: -Math.cos(a) * 700 })
      this.cooldown = s.rapid > 0 ? .085 : .19
      this.beep(s.rapid > 0 ? 980 : 820)
    }
    this.bullets = this.bullets.filter(b => { b.x += b.vx * dt; b.y += b.vy * dt; return b.y > -20 && b.x > -20 && b.x < W + 20 })
    this.enemyBullets = this.enemyBullets.filter(b => { b.x += b.vx * dt; b.y += b.vy * dt; return b.y < H + 20 && b.y > -40 && b.x > -20 && b.x < W + 20 })

    /* spawning */
    this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 1
    this.banner = Math.max(0, this.banner - dt)
    this.spawnTimer -= dt
    if (this.toSpawn > 0 && this.spawnTimer <= 0) { this.spawnAsteroid(); this.toSpawn--; this.spawnTimer = Math.max(.45, 1.5 - this.wave * .08) }
    if (this.wave >= 3 && !this.boss) {
      this.ufoTimer -= dt
      if (this.ufoTimer <= 0 && this.ufos.length < 1 + Math.floor(this.wave / 6)) {
        const dir = Math.random() > .5 ? 1 : -1
        this.ufos.push({ x: dir > 0 ? -40 : W + 40, y: rand(50, H * .28), t: 0, dir, hp: 4 + Math.floor(this.wave / 3), cd: 1.2, flash: 0 })
        this.ufoTimer = rand(9, 15)
      }
    }

    /* asteroids */
    for (const a of this.asteroids) {
      a.x += a.vx * dt; a.y += a.vy * dt; a.rot += a.spin * dt; a.flash = Math.max(0, a.flash - dt)
      if (a.x < a.r || a.x > W - a.r) { a.vx *= -1; a.x = Math.max(a.r, Math.min(W - a.r, a.x)) }
    }
    this.asteroids = this.asteroids.filter(a => a.y - a.r < H + 10)

    /* ufos */
    for (const u of this.ufos) {
      u.t += dt; u.flash = Math.max(0, u.flash - dt)
      u.x += u.dir * (90 + this.wave * 4) * dt; u.y += Math.sin(u.t * 2.4) * 40 * dt
      u.cd -= dt
      if (u.cd <= 0) { const a = Math.atan2(s.y - u.y, s.x - u.x); this.enemyBullets.push({ x: u.x, y: u.y + 10, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240 }); u.cd = rand(1.1, 1.8); this.beep(340) }
    }
    this.ufos = this.ufos.filter(u => u.hp > 0 && u.x > -60 && u.x < W + 60)

    /* boss */
    const b = this.boss
    if (b) {
      b.t += dt; b.flash = Math.max(0, b.flash - dt)
      b.enter = Math.min(1, b.enter + dt * .5)
      b.y = -90 + (110 + 90) * (1 - Math.pow(1 - b.enter, 3))
      b.x = W / 2 + Math.sin(b.t * .7) * (W / 2 - 110)
      if (b.enter >= 1) {
        const rage = b.hp < b.max * .5
        b.cd -= dt; b.cd2 -= dt
        if (b.cd <= 0) {
          const n = rage ? 11 : 7
          for (let i = 0; i < n; i++) { const a = Math.PI / 2 + (i - (n - 1) / 2) * .17; this.enemyBullets.push({ x: b.x, y: b.y + 30, vx: Math.cos(a) * 210, vy: Math.sin(a) * 210 }) }
          b.cd = rage ? 1.5 : 2.2; this.beep(260)
        }
        if (b.cd2 <= 0) {
          const a = Math.atan2(s.y - b.y, s.x - b.x)
          for (const o of rage ? [-.12, 0, .12] : [0]) this.enemyBullets.push({ x: b.x, y: b.y + 30, vx: Math.cos(a + o) * 300, vy: Math.sin(a + o) * 300 })
          if (Math.random() < .25) this.spawnAsteroid(1, b.x, b.y + 30, rand(-120, 120), rand(90, 140))
          b.cd2 = rage ? .7 : 1.1
        }
      }
    }

    /* collisions: bullets */
    this.bullets = this.bullets.filter(bl => {
      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const a = this.asteroids[i]
        if ((bl.x - a.x) ** 2 + (bl.y - a.y) ** 2 < a.r * a.r) {
          a.hp--; a.flash = .08; this.burst(bl.x, bl.y, 5, '#ffd9a0', 120, 2)
          if (a.hp <= 0) {
            this.asteroids.splice(i, 1); this.burst(a.x, a.y, 10 + a.tier * 8, '#ffb35c', 90 + a.tier * 50)
            this.shake = Math.max(this.shake, a.tier * 2.5)
            this.addScore(a.tier === 3 ? 20 : a.tier === 2 ? 50 : 100, a.x, a.y)
            if (a.tier > 1) for (const d of [-1, 1]) this.spawnAsteroid(a.tier - 1, a.x + d * a.r * .4, a.y, a.vx + d * rand(50, 90), a.vy * .8 + rand(-20, 20))
            this.maybeDrop(a.x, a.y, .08)
            this.beep(520 + a.tier * 60)
          }
          return false
        }
      }
      for (const u of this.ufos) {
        if (Math.abs(bl.x - u.x) < 26 && Math.abs(bl.y - u.y) < 14) {
          u.hp--; u.flash = .08
          if (u.hp <= 0) { this.burst(u.x, u.y, 40, '#d7a2ff', 260, 4); this.shake = 8; this.addScore(300, u.x, u.y); this.maybeDrop(u.x, u.y, .6); this.beep(700) }
          return false
        }
      }
      if (b && b.enter >= 1 && ((bl.x - b.x) / 92) ** 2 + ((bl.y - b.y) / 36) ** 2 < 1) {
        b.hp--; b.flash = .06; this.burst(bl.x, bl.y, 4, '#ff8fab', 140, 2)
        if (b.hp <= 0) {
          this.burst(b.x, b.y, 220, '#ffd166', 520, 5); this.shake = 26; this.addScore(2500, b.x, b.y)
          for (let i = 0; i < 3; i++) this.maybeDrop(b.x + (i - 1) * 40, b.y, 1)
          this.boss = null; this.enemyBullets = []; this.beep(1200)
        }
        return false
      }
      return true
    })

    /* collisions: ship */
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const a = this.asteroids[i]
      if ((s.x - a.x) ** 2 + (s.y - a.y) ** 2 < (a.r + 12) ** 2) {
        if (s.inv > 0 && s.shield <= 0) continue
        this.asteroids.splice(i, 1); this.burst(a.x, a.y, 20, '#ffb35c', 200); this.hitShip()
      }
    }
    this.enemyBullets = this.enemyBullets.filter(eb => { if ((eb.x - s.x) ** 2 + (eb.y - s.y) ** 2 < 15 ** 2) { this.hitShip(); return false } return true })
    this.powerups = this.powerups.filter(p => {
      p.t += dt; p.y += 70 * dt
      if ((p.x - s.x) ** 2 + (p.y - s.y) ** 2 < 30 ** 2) {
        if (p.kind === 'triple') s.triple = 10
        if (p.kind === 'rapid') s.rapid = 8
        if (p.kind === 'shield') s.shield = 9
        if (p.kind === 'life') this.lives = Math.min(5, this.lives + 1)
        if (p.kind === 'bomb') this.bombs = Math.min(3, this.bombs + 1)
        this.floaters.push({ x: p.x, y: p.y, text: { triple: 'TRIPLE SHOT', rapid: 'RAPID FIRE', shield: 'SHIELD', life: '+1 LIFE', bomb: '+1 BOMB' }[p.kind], life: 1.2, color: POWER[p.kind].color })
        this.burst(p.x, p.y, 18, POWER[p.kind].color, 160); this.beep(1040); this.onChange()
        return false
      }
      return p.y < H + 20
    })

    if (this.mode === 'playing' && this.toSpawn === 0 && !this.asteroids.length && !this.ufos.length && !this.boss) this.nextWave()
  }

  /* ── drawing ───────────────────────────────────── */
  draw(ctx: CanvasRenderingContext2D) {
    const W = this.w, H = this.h
    ctx.save()
    if (this.shake > 0) ctx.translate(rand(-1, 1) * this.shake * .5, rand(-1, 1) * this.shake * .5)
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#030719'); bg.addColorStop(1, '#0a1230')
    ctx.fillStyle = bg; ctx.fillRect(-20, -20, W + 40, H + 40)
    const neb = ctx.createRadialGradient(W * .75, H * .2, 0, W * .75, H * .2, W * .6)
    neb.addColorStop(0, 'rgba(120,60,200,.16)'); neb.addColorStop(1, 'transparent')
    ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H)
    for (const st of this.stars) {
      ctx.globalAlpha = .25 + st.z * .7; ctx.fillStyle = '#dfeaff'
      const len = this.mode === 'playing' ? 1 + st.z * 3 : 1
      ctx.fillRect(st.x * W, st.y * H, st.z > .8 ? 2 : 1, len)
    }
    ctx.globalAlpha = 1

    ctx.globalCompositeOperation = 'lighter'
    for (const p of this.particles) { ctx.globalAlpha = p.life / p.max; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.life / p.max) + .5, 0, Math.PI * 2); ctx.fill() }
    ctx.globalAlpha = 1
    ctx.fillStyle = '#bff4ff'
    for (const b of this.bullets) { ctx.fillRect(b.x - 1.5, b.y - 9, 3, 14) }
    ctx.globalCompositeOperation = 'source-over'

    for (const a of this.asteroids) this.drawAsteroid(ctx, a)
    for (const p of this.powerups) this.drawPowerUp(ctx, p)
    for (const u of this.ufos) this.drawUfo(ctx, u)
    if (this.boss) this.drawBoss(ctx, this.boss)
    for (const eb of this.enemyBullets) {
      ctx.fillStyle = '#ff7aa2'; ctx.shadowColor = '#ff4f86'; ctx.shadowBlur = 10
      ctx.beginPath(); ctx.arc(eb.x, eb.y, 4, 0, Math.PI * 2); ctx.fill()
    }
    ctx.shadowBlur = 0
    if (this.mode !== 'over' && this.mode !== 'title') this.drawShip(ctx)

    ctx.textAlign = 'center'
    for (const f of this.floaters) { ctx.globalAlpha = Math.min(1, f.life * 1.5); ctx.fillStyle = f.color; ctx.font = "500 12px 'DM Mono', monospace"; ctx.fillText(f.text, f.x, f.y) }
    ctx.globalAlpha = 1
    ctx.restore()

    this.drawHud(ctx)
  }

  drawShip(ctx: CanvasRenderingContext2D) {
    const s = this.ship
    if (s.inv > 0 && s.shield <= 0 && Math.floor(this.time * 14) % 2 === 0) return
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.vx / 2400)
    const fl = 16 + Math.random() * 10 + (s.vy < 0 ? 8 : 0)
    const flame = ctx.createLinearGradient(0, 10, 0, 10 + fl)
    flame.addColorStop(0, 'rgba(255,240,200,.95)'); flame.addColorStop(.4, 'rgba(255,150,60,.8)'); flame.addColorStop(1, 'rgba(255,80,40,0)')
    ctx.fillStyle = flame; ctx.beginPath(); ctx.moveTo(-6, 10); ctx.lineTo(0, 10 + fl); ctx.lineTo(6, 10); ctx.fill()
    ctx.fillStyle = '#e2483d'
    ctx.beginPath(); ctx.moveTo(-9, 2); ctx.lineTo(-18, 16); ctx.lineTo(-8, 12); ctx.fill()
    ctx.beginPath(); ctx.moveTo(9, 2); ctx.lineTo(18, 16); ctx.lineTo(8, 12); ctx.fill()
    const body = ctx.createLinearGradient(-10, 0, 10, 0)
    body.addColorStop(0, '#aeb8c8'); body.addColorStop(.45, '#ffffff'); body.addColorStop(1, '#c4ccd8')
    ctx.fillStyle = body
    ctx.beginPath(); ctx.moveTo(0, -24); ctx.bezierCurveTo(11, -14, 11, 4, 8, 13); ctx.lineTo(-8, 13); ctx.bezierCurveTo(-11, 4, -11, -14, 0, -24); ctx.fill()
    ctx.fillStyle = '#7fd4ff'; ctx.beginPath(); ctx.arc(0, -8, 4.5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#e0a64a'; ctx.beginPath(); ctx.arc(0, -8, 2.4, 0, Math.PI * 2); ctx.fill()
    if (s.shield > 0) {
      ctx.strokeStyle = `rgba(156,241,179,${.5 + Math.sin(this.time * 8) * .25})`; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(0, -2, 28, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.restore()
  }

  drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid) {
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot)
    const g = ctx.createRadialGradient(-a.r * .35, -a.r * .35, 1, 0, 0, a.r)
    g.addColorStop(0, a.flash > 0 ? '#ffffff' : '#a59d93'); g.addColorStop(.6, a.flash > 0 ? '#ffd9a0' : '#6a635b'); g.addColorStop(1, '#2b2722')
    ctx.fillStyle = g
    ctx.beginPath()
    a.shape.forEach((m, i) => { const ang = (i / a.shape.length) * Math.PI * 2; const x = Math.cos(ang) * a.r * m, y = Math.sin(ang) * a.r * m; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) })
    ctx.closePath(); ctx.fill()
    ctx.strokeStyle = 'rgba(255,200,140,.25)'; ctx.lineWidth = 1; ctx.stroke()
    ctx.fillStyle = 'rgba(0,0,0,.25)'
    ctx.beginPath(); ctx.arc(a.r * .25, a.r * .1, a.r * .22, 0, Math.PI * 2); ctx.arc(-a.r * .3, a.r * .35, a.r * .14, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }

  drawUfo(ctx: CanvasRenderingContext2D, u: Ufo) {
    ctx.save(); ctx.translate(u.x, u.y)
    ctx.fillStyle = u.flash > 0 ? '#fff' : '#8a7bd8'
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 9, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(190,240,255,.85)'; ctx.beginPath(); ctx.ellipse(0, -6, 11, 9, 0, Math.PI, 0); ctx.fill()
    for (let i = -2; i <= 2; i++) { ctx.fillStyle = Math.floor(u.t * 8 + i) % 2 ? '#ffd166' : '#ff7aa2'; ctx.beginPath(); ctx.arc(i * 9, 2, 2, 0, Math.PI * 2); ctx.fill() }
    ctx.restore()
  }

  drawBoss(ctx: CanvasRenderingContext2D, b: Boss) {
    ctx.save(); ctx.translate(b.x, b.y)
    const rage = b.hp < b.max * .5
    ctx.shadowColor = rage ? '#ff4f86' : '#8f7bff'; ctx.shadowBlur = 30
    const g = ctx.createLinearGradient(0, -36, 0, 36)
    g.addColorStop(0, b.flash > 0 ? '#ffffff' : '#5b4fb8'); g.addColorStop(1, b.flash > 0 ? '#ffd0dc' : '#1d1846')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.ellipse(0, 0, 92, 30, 0, 0, Math.PI * 2); ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = rage ? 'rgba(255,120,160,.9)' : 'rgba(170,230,255,.85)'
    ctx.beginPath(); ctx.ellipse(0, -14, 34, 26, 0, Math.PI, 0); ctx.fill()
    ctx.fillStyle = '#ffd166'
    for (let i = 0; i < 9; i++) { const x = -72 + i * 18; if (Math.floor(b.t * 6 + i) % 3) { ctx.beginPath(); ctx.arc(x, 8, 3, 0, Math.PI * 2); ctx.fill() } }
    ctx.fillStyle = '#ff7aa2'; ctx.fillRect(-6, 24, 12, 10)
    ctx.restore()
  }

  drawPowerUp(ctx: CanvasRenderingContext2D, p: PowerUp) {
    const c = POWER[p.kind].color, r = 13 + Math.sin(p.t * 6) * 1.5
    ctx.save(); ctx.translate(p.x, p.y)
    ctx.shadowColor = c; ctx.shadowBlur = 16; ctx.strokeStyle = c; ctx.lineWidth = 2
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + p.t; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) } ctx.closePath(); ctx.stroke()
    ctx.shadowBlur = 0; ctx.fillStyle = c; ctx.font = "600 12px 'DM Mono', monospace"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(POWER[p.kind].label, 0, 1)
    ctx.restore()
  }

  drawHud(ctx: CanvasRenderingContext2D) {
    const W = this.w, H = this.h, s = this.ship
    ctx.textBaseline = 'alphabetic'
    ctx.font = "500 12px 'DM Mono', monospace"; ctx.textAlign = 'left'
    ctx.fillStyle = '#8fe3ff'; ctx.fillText(`SCORE ${String(this.score).padStart(6, '0')}`, 16, 24)
    ctx.fillStyle = '#7f8db0'; ctx.fillText(`BEST ${String(Math.max(this.best, this.score)).padStart(6, '0')}`, 16, 42)
    if (this.combo > 1) { ctx.fillStyle = '#ffd166'; ctx.fillText(`COMBO ×${this.combo}`, 16, 60) }
    ctx.textAlign = 'center'; ctx.fillStyle = '#9cf1b3'
    if (this.wave) ctx.fillText(`WAVE ${this.wave}`, W / 2, 24)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#ff6b8b'; ctx.fillText('♥'.repeat(Math.max(0, this.lives)), W - 16, 24)
    ctx.fillStyle = '#ff9f43'; ctx.fillText(this.bombs ? `BOMB ×${this.bombs}` : '', W - 16, 42)
    const timers: [number, number, string][] = [[s.triple, 10, POWER.triple.color], [s.rapid, 8, POWER.rapid.color], [s.shield, 9, POWER.shield.color]]
    let y = 54
    for (const [t, max, color] of timers) if (t > 0) { ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(W - 96, y, 80, 4); ctx.fillStyle = color; ctx.fillRect(W - 96, y, 80 * t / max, 4); y += 9 }
    if (this.boss) {
      const bw = Math.min(360, W - 120)
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(W / 2 - bw / 2, 36, bw, 6)
      ctx.fillStyle = this.boss.hp < this.boss.max * .5 ? '#ff4f86' : '#a493ff'; ctx.fillRect(W / 2 - bw / 2, 36, bw * Math.max(0, this.boss.hp) / this.boss.max, 6)
    }
    if (this.banner > 0 && this.mode === 'playing') {
      ctx.globalAlpha = Math.min(1, this.banner); ctx.textAlign = 'center'
      ctx.fillStyle = '#ffffff'; ctx.font = "600 30px 'Space Grotesk', sans-serif"; ctx.fillText(this.bannerText, W / 2, H * .42)
      ctx.globalAlpha = 1
    }
    if (this.mode !== 'playing') {
      ctx.fillStyle = 'rgba(3,7,25,.72)'; ctx.fillRect(0, 0, W, H)
      ctx.textAlign = 'center'
      const title = this.mode === 'title' ? 'SPACE JAM' : this.mode === 'paused' ? 'PAUSED' : 'MISSION FAILED'
      ctx.fillStyle = this.mode === 'over' ? '#ff6b8b' : '#ffffff'
      ctx.font = `600 ${Math.min(52, W / 10)}px 'Space Grotesk', sans-serif`; ctx.fillText(title, W / 2, H / 2 - 30)
      ctx.font = "500 12px 'DM Mono', monospace"; ctx.fillStyle = '#8fe3ff'
      if (this.mode === 'title') {
        ctx.fillText('CLEAR THE BELT · SURVIVE THE MOTHERSHIP', W / 2, H / 2 + 4)
        ctx.fillStyle = '#7f8db0'; ctx.fillText(`BEST ${this.best}`, W / 2, H / 2 + 26)
        ctx.fillStyle = '#ffffff'; ctx.fillText(Math.floor(this.time * 2) % 2 ? 'PRESS ENTER OR TAP TO LAUNCH' : '', W / 2, H / 2 + 62)
      } else if (this.mode === 'over') {
        ctx.fillText(`SCORE ${this.score} · WAVE ${this.wave}`, W / 2, H / 2 + 4)
        ctx.fillStyle = this.newBest ? '#ffd166' : '#7f8db0'; ctx.fillText(this.newBest ? 'NEW BEST SCORE!' : `BEST ${this.best}`, W / 2, H / 2 + 26)
        ctx.fillStyle = '#ffffff'; ctx.fillText('PRESS ENTER OR TAP TO RETRY', W / 2, H / 2 + 62)
      } else ctx.fillText('PRESS P OR TAP TO RESUME', W / 2, H / 2 + 4)
    }
  }
}

interface Props { onClose: () => void; beep: (pitch?: number) => void }

export default function SpaceJam({ onClose, beep }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const beepRef = useRef(beep); beepRef.current = beep
  const [, force] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current!, ctx = canvas.getContext('2d')!
    const game = new Game(p => beepRef.current(p), () => force(n => n + 1))
    gameRef.current = game
    const resize = () => {
      const r = canvas.parentElement!.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2)
      canvas.width = r.width * dpr; canvas.height = r.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      game.w = r.width; game.h = r.height
      if (game.mode === 'title') game.resetShip()
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement!)

    const primary = () => { if (game.mode === 'title' || game.mode === 'over') game.start(); else if (game.mode === 'paused') { game.mode = 'playing'; force(n => n + 1) } }
    const onDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault()
      if (key === 'enter') primary()
      if (key === 'p' && (game.mode === 'playing' || game.mode === 'paused')) { game.mode = game.mode === 'playing' ? 'paused' : 'playing'; force(n => n + 1) }
      if (key === 'b' || key === 'shift') game.useBomb()
      game.keys.add(key)
    }
    const onUp = (e: KeyboardEvent) => game.keys.delete(e.key.toLowerCase())
    const onBlur = () => { game.keys.clear(); game.pointer = null; if (game.mode === 'playing') { game.mode = 'paused'; force(n => n + 1) } }
    window.addEventListener('keydown', onDown); window.addEventListener('keyup', onUp); window.addEventListener('blur', onBlur)

    const local = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
    const pDown = (e: PointerEvent) => { if (game.mode !== 'playing') { primary(); return } canvas.setPointerCapture(e.pointerId); game.pointer = local(e) }
    const pMove = (e: PointerEvent) => { if (game.pointer) game.pointer = local(e) }
    const pUp = () => { game.pointer = null }
    canvas.addEventListener('pointerdown', pDown); canvas.addEventListener('pointermove', pMove)
    canvas.addEventListener('pointerup', pUp); canvas.addEventListener('pointercancel', pUp)

    let raf = 0, last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, .05); last = now
      game.update(dt); game.draw(ctx)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf); ro.disconnect()
      window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); window.removeEventListener('blur', onBlur)
    }
  }, [])

  const g = gameRef.current
  const togglePause = () => { if (!g) return; if (g.mode === 'playing') g.mode = 'paused'; else if (g.mode === 'paused') g.mode = 'playing'; force(n => n + 1) }
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="game-modal" role="dialog" aria-modal="true" aria-label="Space Jam arcade game" onClick={e => e.stopPropagation()}>
        <header>
          <span className="game-title"><Rocket size={15} /> SPACE JAM <em>v2</em></span>
          <span className="game-keys">WASD / ARROWS MOVE · SPACE FIRE · B BOMB · P PAUSE · DRAG TO FLY</span>
          <button className="close" onClick={onClose} aria-label="Close game"><X size={18} /></button>
        </header>
        <div className="game-stage"><canvas ref={canvasRef} /></div>
        <footer>
          <button onClick={togglePause} disabled={!g || (g.mode !== 'playing' && g.mode !== 'paused')}>{g?.mode === 'paused' ? <Play size={14} /> : <Pause size={14} />}{g?.mode === 'paused' ? 'RESUME' : 'PAUSE'}</button>
          <button onClick={() => g?.useBomb()} disabled={!g || g.mode !== 'playing' || g.bombs <= 0}><Bomb size={14} />BOMB {g ? `×${g.bombs}` : ''}</button>
          <button onClick={() => g?.start()}><RotateCcw size={14} />{g?.mode === 'title' ? 'START' : 'RESTART'}</button>
        </footer>
      </section>
    </div>
  )
}
