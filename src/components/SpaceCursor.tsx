import { useEffect, useRef } from 'react'

/* Space cursor: the pointer itself is an image from the public-domain "Space Theme" cursor set (public/cursors,
   set in CSS so it never lags); this canvas adds stardust streaming behind it plus a burst on click.
   Only on precise pointers (mouse/trackpad) and when the visitor hasn't asked for reduced motion. */
type Mote = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; hue: number; spark: boolean }

const INTERACTIVE = 'a, button, [role="tab"], label, summary, select, .card, [data-tip]'
const NATIVE = 'input, textarea, [contenteditable="true"], .game-stage'
/* The arrow's hotspot is its tip; stardust leaves from its tail, ~10px down-right. */
const ENGINE = { x: 9, y: 12 }

export default function SpaceCursor({ light }: { light: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lightRef = useRef(light)
  lightRef.current = light

  useEffect(() => {
    const fine = matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine) return
    const canvas = canvasRef.current!, ctx = canvas.getContext('2d')!
    document.documentElement.classList.add('space-cursor')

    let w = 0, h = 0
    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2); w = innerWidth; h = innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const motes: Mote[] = []
    const last = { x: -100, y: -100 }
    let raf = 0, running = false, prev = performance.now()

    const emit = (x: number, y: number, n: number, speed: number, spread: number, dir: number) => {
      for (let i = 0; i < n && motes.length < 280; i++) {
        const a = dir + (Math.random() - .5) * spread, s = speed * (.35 + Math.random() * .65), max = .4 + Math.random() * .55
        motes.push({ x: x + (Math.random() - .5) * 3, y: y + (Math.random() - .5) * 3, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: max, max, size: .8 + Math.random() * 2, hue: Math.random(), spark: Math.random() < .07 })
      }
    }
    const star = (x: number, y: number, r: number) => {
      ctx.beginPath()
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, rr = i % 2 ? r * .28 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) }
      ctx.closePath(); ctx.fill()
    }

    const frame = (now: number) => {
      const dt = Math.min((now - prev) / 1000, .05); prev = now
      ctx.clearRect(0, 0, w, h)
      const isLight = lightRef.current
      ctx.globalCompositeOperation = isLight ? 'source-over' : 'lighter'
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i]
        m.life -= dt
        if (m.life <= 0) { motes.splice(i, 1); continue }
        m.vx *= .94; m.vy *= .94
        m.x += m.vx * dt; m.y += m.vy * dt
        const t = m.life / m.max
        ctx.fillStyle = isLight
          ? (m.hue < .5 ? `rgba(194,65,12,${t * .75})` : `rgba(37,99,235,${t * .65})`)
          : (m.hue < .45 ? `rgba(255,179,92,${t})` : m.hue < .75 ? `rgba(255,243,196,${t})` : `rgba(143,227,255,${t})`)
        if (m.spark) star(m.x, m.y, m.size * 2.6 * t + 1)
        else { ctx.beginPath(); ctx.arc(m.x, m.y, m.size * t + .3, 0, Math.PI * 2); ctx.fill() }
      }
      ctx.globalCompositeOperation = 'source-over'
      if (motes.length) raf = requestAnimationFrame(frame)
      else running = false
    }
    const wake = () => { if (!running) { running = true; prev = performance.now(); raf = requestAnimationFrame(frame) } }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
      const target = e.target as Element
      const x = e.clientX, y = e.clientY
      if (!target.closest?.(NATIVE)) {
        const dist = Math.hypot(x - last.x, y - last.y)
        if (dist > 1.5 && last.x > -50) {
          const boost = !!target.closest?.(INTERACTIVE)
          /* stardust drifts away from the tip (down-right), a little faster over clickable things */
          emit(x + ENGINE.x, y + ENGINE.y, Math.min(boost ? 6 : 4, Math.ceil(dist / 8)), (boost ? 70 : 45) + dist * 1.2, .9, Math.PI / 4)
          wake()
        }
      }
      last.x = x; last.y = y
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || (e.target as Element).closest?.(NATIVE)) return
      emit(e.clientX, e.clientY, 20, 190, Math.PI * 2, 0); wake()
    }

    addEventListener('resize', resize)
    addEventListener('pointermove', onMove, { passive: true })
    addEventListener('pointerdown', onDown, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('space-cursor')
      removeEventListener('resize', resize)
      removeEventListener('pointermove', onMove)
      removeEventListener('pointerdown', onDown)
    }
  }, [])

  return <canvas ref={canvasRef} className="cursor-trail" aria-hidden="true" />
}
