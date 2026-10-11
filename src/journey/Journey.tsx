import { useEffect, useRef, useState } from 'react'
import { JourneyScene } from './JourneyScene'
import { projects, skills, achievements, leadership } from '../data/profile'

function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
}

/* Phones, tablets and low-core / low-memory machines get the lighter scene. */
function lowPowerDevice() {
  const nav = navigator as Navigator & { deviceMemory?: number }
  return matchMedia('(pointer: coarse)').matches || innerWidth < 820 || (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4
}

export default function Journey({ light, reducedMotion, paused }: { light: boolean; reducedMotion: boolean; paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<JourneyScene | null>(null)
  const [supported] = useState(webglAvailable)

  useEffect(() => {
    if (!supported || !canvasRef.current) return
    const scene = new JourneyScene(canvasRef.current, {
      projects: projects.map(p => ({ name: p.name, featured: p.featured })), skills, achievements: achievements.map(a => a.short), crew: leadership.map(l => l.org),
      light, reducedMotion, low: lowPowerDevice(),
    })
    sceneRef.current = scene
    if (import.meta.env.DEV) Object.assign(window, { __scene: scene })
    return () => { scene.dispose(); sceneRef.current = null }
    // The scene is created once; theme changes are animated through setTheme below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, reducedMotion])

  useEffect(() => { sceneRef.current?.setTheme(light) }, [light])
  useEffect(() => { sceneRef.current?.setPaused(paused) }, [paused])

  return <div className={'scene-layer' + (supported ? '' : ' scene-fallback')} aria-hidden="true">{supported && <canvas ref={canvasRef} />}</div>
}
