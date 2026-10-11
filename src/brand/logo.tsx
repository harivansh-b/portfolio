import { useId } from 'react'

/* HB ligature badge: H and B share a stem, a tilted orbit wraps the disc like a ring.
   One source of truth for the header, favicon (public/logo.svg), flag, rocket decal and landing pad. */
export const LOGO_PATHS = {
  letters: 'M18 17V47M34 17V47M18 32H34M34 19.5H39.5A6.25 6.25 0 0 1 39.5 32H34M34 32H40.5A6.25 6.25 0 0 1 40.5 44.5H34',
  orbitBack: 'M2 32A30 8.5 0 0 1 62 32',
  orbitFront: 'M2 32A30 8.5 0 0 0 62 32',
  star: 'M22 7L22.9 10.1L26 11L22.9 11.9L22 15L21.1 11.9L18 11L21.1 10.1Z',
}
const TILT = -22
const COLORS = { disc: ['#1d2f66', '#050a1c'], ring: ['#8fe3ff', '#ffb35c'], ink: '#ffffff', orbit: '#8fe3ff', planet: '#ffb35c' }

export function Logo({ size = 28, className = '' }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id={`d${id}`} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor={COLORS.disc[0]} /><stop offset="1" stopColor={COLORS.disc[1]} /></radialGradient>
        <linearGradient id={`r${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={COLORS.ring[0]} /><stop offset="1" stopColor={COLORS.ring[1]} /></linearGradient>
      </defs>
      <g transform={`rotate(${TILT} 32 32)`}><path d={LOGO_PATHS.orbitBack} stroke={COLORS.orbit} strokeWidth="2" opacity=".45" /></g>
      <circle cx="32" cy="32" r="25" fill={`url(#d${id})`} stroke={`url(#r${id})`} strokeWidth="2" />
      <path d={LOGO_PATHS.letters} stroke={COLORS.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d={LOGO_PATHS.star} fill={COLORS.ink} opacity=".9" />
      <g transform={`rotate(${TILT} 32 32)`}>
        <path d={LOGO_PATHS.orbitFront} stroke={COLORS.orbit} strokeWidth="2" />
        <circle cx="59.6" cy="35.3" r="3.3" fill={COLORS.planet} />
      </g>
    </svg>
  )
}

/* Draws the same badge onto a 2D canvas at (x, y) with the given square size. */
export function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save()
  ctx.translate(x, y); ctx.scale(size / 64, size / 64)
  const orbit = (front: boolean) => {
    ctx.save(); ctx.translate(32, 32); ctx.rotate(TILT * Math.PI / 180)
    ctx.beginPath(); ctx.ellipse(0, 0, 30, 8.5, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2)
    ctx.strokeStyle = COLORS.orbit; ctx.lineWidth = 2; ctx.globalAlpha = front ? 1 : .45; ctx.stroke(); ctx.globalAlpha = 1
    if (front) { ctx.beginPath(); ctx.arc(27.6, 3.3, 3.3, 0, Math.PI * 2); ctx.fillStyle = COLORS.planet; ctx.fill() }
    ctx.restore()
  }
  orbit(false)
  const disc = ctx.createRadialGradient(22, 19, 0, 32, 32, 34)
  disc.addColorStop(0, COLORS.disc[0]); disc.addColorStop(1, COLORS.disc[1])
  const ring = ctx.createLinearGradient(7, 7, 57, 57)
  ring.addColorStop(0, COLORS.ring[0]); ring.addColorStop(1, COLORS.ring[1])
  ctx.beginPath(); ctx.arc(32, 32, 25, 0, Math.PI * 2); ctx.fillStyle = disc; ctx.fill(); ctx.strokeStyle = ring; ctx.lineWidth = 2; ctx.stroke()
  ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'butt'
  ctx.stroke(new Path2D(LOGO_PATHS.letters))
  ctx.globalAlpha = .9; ctx.fillStyle = COLORS.ink; ctx.fill(new Path2D(LOGO_PATHS.star)); ctx.globalAlpha = 1
  orbit(true)
  ctx.restore()
}
