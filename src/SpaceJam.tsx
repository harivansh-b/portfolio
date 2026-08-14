import { useEffect, useRef, useCallback } from 'react'

/* ── Types ─────────────────────────────────────── */
interface Vec2 { x: number; y: number }

interface Asteroid {
    id: number
    pos: Vec2
    vel: Vec2
    radius: number
    rot: number
    rotSpeed: number
    hp: number
    maxHp: number
    craters: { ox: number; oy: number; r: number }[]
}

interface Bullet {
    id: number
    pos: Vec2
    vel: Vec2
}

interface Particle {
    id: number
    pos: Vec2
    vel: Vec2
    life: number
    maxLife: number
    radius: number
    color: string
}

interface GameState {
    shipX: number
    shipVx: number
    bullets: Bullet[]
    asteroids: Asteroid[]
    particles: Particle[]
    score: number
    lives: number
    wave: number
    nextBulletId: number
    nextParticleId: number
    nextAsteroidId: number
    shooting: boolean
    shootCooldown: number
    keys: Set<string>
    over: boolean
    width: number
    height: number
    touchLeft: boolean
    touchRight: boolean
    touchShoot: boolean
    shootBtnPressed: boolean
}

const SHIP_SPEED = 320        // px/s
const SHIP_DECEL = 0.88
const BULLET_SPEED = 520
const ASTEROID_BASE_SPEED = 58
const SHOOT_COOLDOWN = 0.18   // seconds
const SHIP_Y_OFFSET = 64      // from bottom
const LIVES = 3

function makeAsteroid(id: number, wave: number, w: number, h: number): Asteroid {
    const radius = 22 + Math.random() * 20
    const speedMult = 1 + wave * 0.18
    const angle = (Math.PI * 0.3) + Math.random() * (Math.PI * 0.4)
    const side = Math.random() > 0.5 ? 1 : -1
    return {
        id,
        pos: { x: Math.random() * (w - radius * 2) + radius, y: -radius - Math.random() * 150 },
        vel: {
            x: Math.cos(angle) * ASTEROID_BASE_SPEED * speedMult * side * 0.4,
            y: Math.sin(angle) * ASTEROID_BASE_SPEED * speedMult
        },
        radius,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 1.4,
        hp: wave >= 3 ? 2 : 1,
        maxHp: wave >= 3 ? 2 : 1,
        craters: Array.from({ length: 4 }, () => ({
            ox: (Math.random() - 0.5) * radius * 1.1,
            oy: (Math.random() - 0.5) * radius * 1.1,
            r: 3 + Math.random() * 6
        }))
    }
}

function spawnParticles(state: GameState, x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
        const speed = 40 + Math.random() * 120
        const angle = Math.random() * Math.PI * 2
        state.particles.push({
            id: state.nextParticleId++,
            pos: { x, y },
            vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
            life: 0.5 + Math.random() * 0.5,
            maxLife: 0.6 + Math.random() * 0.4,
            radius: 2 + Math.random() * 4,
            color
        })
    }
}

function drawShip(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save()
    ctx.translate(x, y)

    // Engine glow
    const glow = ctx.createRadialGradient(0, 14, 0, 0, 14, 20)
    glow.addColorStop(0, 'rgba(100,220,255,0.35)')
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.beginPath(); ctx.ellipse(0, 18, 20, 18, 0, 0, Math.PI * 2); ctx.fill()

    // Thruster flame (animated via slight flicker)
    const flicker = 0.85 + Math.random() * 0.3
    const flame = ctx.createLinearGradient(0, 10, 0, 36 * flicker)
    flame.addColorStop(0, 'rgba(150,240,255,0.9)')
    flame.addColorStop(0.4, 'rgba(50,160,255,0.7)')
    flame.addColorStop(1, 'rgba(30,80,200,0)')
    ctx.fillStyle = flame
    ctx.beginPath()
    ctx.moveTo(-6, 12)
    ctx.lineTo(0, 36 * flicker)
    ctx.lineTo(6, 12)
    ctx.closePath()
    ctx.fill()

    // Body
    const body = ctx.createLinearGradient(0, -28, 0, 14)
    body.addColorStop(0, '#e0f8ff')
    body.addColorStop(0.5, '#5ac8f5')
    body.addColorStop(1, '#1a6fa0')
    ctx.fillStyle = body
    ctx.beginPath()
    ctx.moveTo(0, -28)
    ctx.bezierCurveTo(10, -10, 14, 2, 12, 14)
    ctx.lineTo(-12, 14)
    ctx.bezierCurveTo(-14, 2, -10, -10, 0, -28)
    ctx.closePath()
    ctx.fill()

    // Wings
    ctx.fillStyle = '#2a8cc0'
    ctx.beginPath()
    ctx.moveTo(-12, 6); ctx.lineTo(-26, 18); ctx.lineTo(-14, 14); ctx.closePath(); ctx.fill()
    ctx.beginPath()
    ctx.moveTo(12, 6); ctx.lineTo(26, 18); ctx.lineTo(14, 14); ctx.closePath(); ctx.fill()

    // Cockpit
    const cock = ctx.createRadialGradient(-3, -16, 1, 0, -14, 9)
    cock.addColorStop(0, 'rgba(255,255,255,0.85)')
    cock.addColorStop(1, 'rgba(80,200,255,0.5)')
    ctx.fillStyle = cock
    ctx.beginPath(); ctx.ellipse(0, -14, 6, 9, 0, 0, Math.PI * 2); ctx.fill()

    ctx.restore()
}

function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid) {
    ctx.save()
    ctx.translate(a.pos.x, a.pos.y)
    ctx.rotate(a.rot)

    // Shadow / glow
    ctx.shadowColor = a.hp < a.maxHp ? '#ff8855' : '#7acaff'
    ctx.shadowBlur = 12

    const grad = ctx.createRadialGradient(-a.radius * 0.3, -a.radius * 0.3, 1, 0, 0, a.radius)
    grad.addColorStop(0, a.hp < a.maxHp ? '#c07060' : '#9aacbc')
    grad.addColorStop(0.55, a.hp < a.maxHp ? '#7a4535' : '#566579')
    grad.addColorStop(1, '#232d3a')

    ctx.fillStyle = grad
    ctx.beginPath()
    const pts = 10
    for (let i = 0; i < pts; i++) {
        const ang = (i / pts) * Math.PI * 2
        const r = a.radius * (0.78 + 0.22 * Math.sin(i * 2.3 + a.id))
        i === 0
            ? ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r)
            : ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r)
    }
    ctx.closePath()
    ctx.fill()
    ctx.shadowBlur = 0

    // Craters
    ctx.fillStyle = 'rgba(0,0,0,0.28)'
    a.craters.forEach(c => {
        ctx.beginPath(); ctx.arc(c.ox, c.oy, c.r, 0, Math.PI * 2); ctx.fill()
    })

    ctx.restore()
}

function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
    ctx.save()
    ctx.shadowColor = '#9eeaff'
    ctx.shadowBlur = 14
    const grad = ctx.createLinearGradient(b.pos.x, b.pos.y + 12, b.pos.x, b.pos.y - 4)
    grad.addColorStop(0, 'transparent')
    grad.addColorStop(1, '#c8f8ff')
    ctx.fillStyle = grad
    ctx.beginPath(); ctx.ellipse(b.pos.x, b.pos.y, 2.5, 10, 0, 0, Math.PI * 2); ctx.fill()
    ctx.shadowBlur = 0
    ctx.restore()
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    const alpha = p.life / p.maxLife
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.shadowColor = p.color
    ctx.shadowBlur = 6
    ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y, p.radius * alpha, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
}

/* ── Component ─────────────────────────────────── */
interface Props {
    onClose: () => void
    beep: (pitch?: number) => void
}

export default function SpaceJam({ onClose, beep }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const stateRef = useRef<GameState | null>(null)
    const rafRef = useRef<number>(0)
    const lastRef = useRef<number>(0)

    // Stable beep ref so useCallback deps stay minimal
    const beepRef = useRef(beep)
    beepRef.current = beep

    const initState = useCallback((w: number, h: number): GameState => {
        const wave = 1
        const ids = [0, 1, 2, 3, 4]
        return {
            shipX: w / 2,
            shipVx: 0,
            bullets: [],
            asteroids: ids.map(id => makeAsteroid(id, wave, w, h)),
            particles: [],
            score: 0,
            lives: LIVES,
            wave,
            nextBulletId: 0,
            nextParticleId: 0,
            nextAsteroidId: ids.length,
            shooting: false,
            shootCooldown: 0,
            keys: new Set(),
            over: false,
            width: w,
            height: h,
            touchLeft: false,
            touchRight: false,
            touchShoot: false,
            shootBtnPressed: false,
        }
    }, [])

    const resetGame = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        stateRef.current = initState(canvas.width, canvas.height)
    }, [initState])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Size canvas
        const resize = () => {
            const container = canvas.parentElement!
            canvas.width = container.clientWidth
            canvas.height = container.clientHeight
            if (!stateRef.current || stateRef.current.over) {
                stateRef.current = initState(canvas.width, canvas.height)
            } else {
                stateRef.current.width = canvas.width
                stateRef.current.height = canvas.height
            }
        }
        resize()

        // ── Input ──────────────────────────────────────
        const onKey = (e: KeyboardEvent, down: boolean) => {
            const s = stateRef.current; if (!s) return
            s.keys[down ? 'add' : 'delete'](e.key)
            if (down && (e.key === ' ' || e.key === 'ArrowUp')) s.shooting = true
            if (!down && (e.key === ' ' || e.key === 'ArrowUp')) s.shooting = false
            if (['ArrowLeft', 'ArrowRight', ' ', 'ArrowUp'].includes(e.key)) e.preventDefault()
        }
        window.addEventListener('keydown', e => onKey(e, true))
        window.addEventListener('keyup', e => onKey(e, false))

        // ── Grid starfield (static, pre-generated) ─────
        const stars = Array.from({ length: 80 }, () => ({
            x: Math.random() * 800,
            y: Math.random() * 500,
            r: Math.random() * 1.2 + 0.2,
            a: Math.random() * 0.7 + 0.2
        }))

        // ── Game loop ──────────────────────────────────
        const loop = (now: number) => {
            const dt = Math.min((now - lastRef.current) / 1000, 0.05)
            lastRef.current = now

            const s = stateRef.current
            if (!s) { rafRef.current = requestAnimationFrame(loop); return }

            const W = canvas.width, H = canvas.height
            s.width = W; s.height = H

            if (!s.over) {
                // ── Keyboard/touch movement
                const left = s.keys.has('ArrowLeft') || s.keys.has('a') || s.keys.has('A') || s.touchLeft
                const right = s.keys.has('ArrowRight') || s.keys.has('d') || s.keys.has('D') || s.touchRight

                if (left) s.shipVx -= SHIP_SPEED * dt * 8
                if (right) s.shipVx += SHIP_SPEED * dt * 8
                if (!left && !right) s.shipVx *= SHIP_DECEL

                s.shipVx = Math.max(-SHIP_SPEED, Math.min(SHIP_SPEED, s.shipVx))
                s.shipX += s.shipVx * dt
                s.shipX = Math.max(20, Math.min(W - 20, s.shipX))

                // ── Shoot
                s.shootCooldown -= dt
                const wantsShoot = s.shooting || s.touchShoot
                if (wantsShoot && s.shootCooldown <= 0) {
                    const shipY = H - SHIP_Y_OFFSET
                    s.bullets.push({ id: s.nextBulletId++, pos: { x: s.shipX, y: shipY - 24 }, vel: { x: 0, y: -BULLET_SPEED } })
                    s.shootCooldown = SHOOT_COOLDOWN
                    beepRef.current(780)
                }

                // ── Bullets
                s.bullets = s.bullets.filter(b => {
                    b.pos.x += b.vel.x * dt
                    b.pos.y += b.vel.y * dt
                    return b.pos.y > -20
                })

                // ── Asteroids
                s.asteroids.forEach(a => {
                    a.pos.x += a.vel.x * dt
                    a.pos.y += a.vel.y * dt
                    a.rot += a.rotSpeed * dt
                    // Bounce off walls
                    if (a.pos.x - a.radius < 0) { a.pos.x = a.radius; a.vel.x *= -1 }
                    if (a.pos.x + a.radius > W) { a.pos.x = W - a.radius; a.vel.x *= -1 }
                })

                // Asteroids that go below screen → lose life
                const missed = s.asteroids.filter(a => a.pos.y - a.radius > H)
                if (missed.length) {
                    s.lives -= missed.length
                    s.asteroids = s.asteroids.filter(a => a.pos.y - a.radius <= H)
                    missed.forEach(a => spawnParticles(s, a.pos.x, H - 20, 8, '#ff6644'))
                    beepRef.current(180)
                    if (s.lives <= 0) { s.over = true; beepRef.current(120) }
                }

                // ── Collision: bullets vs asteroids
                s.bullets = s.bullets.filter(b => {
                    for (let i = s.asteroids.length - 1; i >= 0; i--) {
                        const a = s.asteroids[i]
                        const dx = b.pos.x - a.pos.x, dy = b.pos.y - a.pos.y
                        if (dx * dx + dy * dy < a.radius * a.radius) {
                            a.hp--
                            spawnParticles(s, a.pos.x, a.pos.y, 10, '#ffcc66')
                            beepRef.current(420)
                            if (a.hp <= 0) {
                                spawnParticles(s, a.pos.x, a.pos.y, 22, '#ff8844')
                                s.score += Math.round(a.radius * 3)
                                s.asteroids.splice(i, 1)
                                beepRef.current(620)
                            }
                            return false // bullet consumed
                        }
                    }
                    return true
                })

                // ── Replenish & wave advance
                while (s.asteroids.length < 4 + s.wave) {
                    s.asteroids.push(makeAsteroid(s.nextAsteroidId++, s.wave, W, H))
                }
                if (s.score >= s.wave * 600) {
                    s.wave++
                    beepRef.current(900)
                }

                // ── Particles
                s.particles = s.particles.filter(p => {
                    p.pos.x += p.vel.x * dt
                    p.pos.y += p.vel.y * dt
                    p.life -= dt
                    return p.life > 0
                })
            }

            // ── Draw ───────────────────────────────────────
            ctx.clearRect(0, 0, W, H)

            // Background
            ctx.fillStyle = '#020611'
            ctx.fillRect(0, 0, W, H)

            // Grid
            ctx.strokeStyle = 'rgba(139,216,255,0.06)'
            ctx.lineWidth = 1
            for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
            for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

            // Stars
            stars.forEach(st => {
                ctx.globalAlpha = st.a
                ctx.fillStyle = '#fff'
                ctx.beginPath(); ctx.arc((st.x % W), (st.y % H), st.r, 0, Math.PI * 2); ctx.fill()
            })
            ctx.globalAlpha = 1

            // Bottom glow
            const btmGlow = ctx.createLinearGradient(0, H - 50, 0, H)
            btmGlow.addColorStop(0, 'transparent')
            btmGlow.addColorStop(1, 'rgba(23,60,100,0.55)')
            ctx.fillStyle = btmGlow
            ctx.fillRect(0, H - 50, W, 50)

            // Particles
            s.particles.forEach(p => drawParticle(ctx, p))

            // Bullets
            s.bullets.forEach(b => drawBullet(ctx, b))

            // Asteroids
            s.asteroids.forEach(a => drawAsteroid(ctx, a))

            // Ship
            if (!s.over) drawShip(ctx, s.shipX, H - SHIP_Y_OFFSET)

            // HUD — score / wave / lives
            ctx.font = "bold 11px 'DM Mono'"
            ctx.letterSpacing = '0.12em'
            ctx.fillStyle = '#9ceaff'
            ctx.fillText(`SCORE  ${String(s.score).padStart(5, '0')}`, 16, 22)
            ctx.fillStyle = '#9cf1b3'
            ctx.fillText(`WAVE ${s.wave}`, W / 2 - 28, 22)
            // Lives as hearts
            for (let i = 0; i < LIVES; i++) {
                ctx.fillStyle = i < s.lives ? '#ff5577' : 'rgba(80,40,50,0.4)'
                ctx.font = '13px serif'
                ctx.fillText('♥', W - 24 - (LIVES - 1 - i) * 20, 22)
            }

            // Game over overlay
            if (s.over) {
                ctx.fillStyle = 'rgba(2,6,17,0.72)'
                ctx.fillRect(0, 0, W, H)
                ctx.fillStyle = '#ff6677'
                ctx.font = "bold 34px 'Space Grotesk'"
                ctx.textAlign = 'center'
                ctx.fillText('MISSION FAILED', W / 2, H / 2 - 30)
                ctx.fillStyle = '#9eeaff'
                ctx.font = "13px 'DM Mono'"
                ctx.fillText(`FINAL SCORE  ${String(s.score).padStart(5, '0')}`, W / 2, H / 2 + 8)
                ctx.fillStyle = '#8fa9c8'
                ctx.font = "10px 'DM Mono'"
                ctx.fillText('PRESS  R  OR  TAP  RESTART', W / 2, H / 2 + 38)
                ctx.textAlign = 'left'
            }

            rafRef.current = requestAnimationFrame(loop)
        }

        const onKeyRestart = (e: KeyboardEvent) => {
            if (e.key === 'r' || e.key === 'R') {
                const s = stateRef.current
                if (s?.over) { stateRef.current = initState(canvas.width, canvas.height) }
            }
        }
        window.addEventListener('keydown', onKeyRestart)

        lastRef.current = performance.now()
        rafRef.current = requestAnimationFrame(loop)

        return () => {
            cancelAnimationFrame(rafRef.current)
            window.removeEventListener('keydown', onKeyRestart)
            // cleanup key listeners added inline above — swap approach
        }
    }, [initState])

    // Touch controls handler refs
    const shipYBottom = SHIP_Y_OFFSET

    return (
        <div className="modal-backdrop" role="presentation" onClick={onClose}>
            <section
                className="game-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Space Jam arcade game"
                onClick={e => e.stopPropagation()}
                style={{ userSelect: 'none' }}
            >
                <button className="close" onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, zIndex: 10 }}>✕</button>

                <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ font: "10px 'DM Mono'", letterSpacing: '.12em', color: '#9eeaff' }}>🚀 SPACE JAM</span>
                    <span style={{ font: "9px 'DM Mono'", color: '#6a8aac', letterSpacing: '.1em' }}>
                        ← → / A D  MOVE · SPACE  FIRE
                    </span>
                </header>

                {/* Canvas */}
                <div style={{ position: 'relative', height: 400, background: '#020611', border: '1px solid rgba(139,216,255,0.18)' }}>
                    <canvas
                        ref={canvasRef}
                        style={{ display: 'block', width: '100%', height: '100%' }}
                        onClick={() => {
                            const s = stateRef.current
                            if (s?.over) { stateRef.current = initState(canvasRef.current!.width, canvasRef.current!.height); return }
                            if (s) { s.shooting = true; setTimeout(() => { if (stateRef.current) stateRef.current.shooting = false }, 80) }
                        }}
                    />
                </div>

                {/* Controls */}
                <footer style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {/* Left */}
                        <button
                            className="ctrl-btn"
                            onPointerDown={() => { if (stateRef.current) stateRef.current.touchLeft = true }}
                            onPointerUp={() => { if (stateRef.current) stateRef.current.touchLeft = false }}
                            onPointerLeave={() => { if (stateRef.current) stateRef.current.touchLeft = false }}
                            style={ctrlStyle}
                            aria-label="Move left"
                        >◀</button>
                        {/* Right */}
                        <button
                            className="ctrl-btn"
                            onPointerDown={() => { if (stateRef.current) stateRef.current.touchRight = true }}
                            onPointerUp={() => { if (stateRef.current) stateRef.current.touchRight = false }}
                            onPointerLeave={() => { if (stateRef.current) stateRef.current.touchRight = false }}
                            style={ctrlStyle}
                            aria-label="Move right"
                        >▶</button>
                    </div>

                    {/* Fire */}
                    <button
                        className="ctrl-btn fire-btn"
                        onPointerDown={() => { if (stateRef.current) stateRef.current.touchShoot = true }}
                        onPointerUp={() => { if (stateRef.current) stateRef.current.touchShoot = false }}
                        onPointerLeave={() => { if (stateRef.current) stateRef.current.touchShoot = false }}
                        style={{ ...ctrlStyle, background: 'rgba(30,80,160,0.5)', color: '#9eeaff', minWidth: 80, flex: 1, maxWidth: 140 }}
                        aria-label="Fire"
                    >🔥 FIRE</button>

                    {/* Restart */}
                    <button
                        style={{ ...ctrlStyle, color: '#9cf1b3' }}
                        onClick={resetGame}
                        aria-label="Restart game"
                    >↺ RESTART</button>
                </footer>
            </section>
        </div>
    )
}

const ctrlStyle: React.CSSProperties = {
    border: '1px solid rgba(94,140,174,0.6)',
    background: 'rgba(10,20,50,0.7)',
    color: '#cbeaff',
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.1em',
    padding: '9px 14px',
    cursor: 'pointer',
    touchAction: 'none',
}
