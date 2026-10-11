/* Mutable, render-loop friendly journey state shared by the DOM layer and the WebGL scene. */
export const journey = {
  /** Section float: 0 = launchpad, 8 = touchdown. Driven by smoothed scroll. */
  s: 0,
  /** Smoothed scroll velocity in px/s. */
  velocity: 0,
  /** Normalised pointer position, -1..1. */
  pointer: { x: 0, y: 0 },
  /** Which side of the viewport the rocket should sit on for the current section (-1 left, 1 right). */
  sides: [] as number[],
}

export const SECTION_COUNT = 10

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t) }
