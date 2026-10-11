import { useEffect, useRef, useState } from 'react'

/* One shared tooltip for every element with a `data-tip` attribute.
   Rendered fixed at the top level so overflow-clipped cards can't cut it off. */
export default function Tooltip() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number; below: boolean } | null>(null)
  const current = useRef<Element | null>(null)

  useEffect(() => {
    const show = (el: Element) => {
      const text = el.getAttribute('data-tip')
      if (!text) return
      current.current = el
      const r = el.getBoundingClientRect()
      const below = r.top < 56
      setTip({ text, x: Math.min(Math.max(r.left + r.width / 2, 90), innerWidth - 90), y: below ? r.bottom + 10 : r.top - 10, below })
    }
    const hide = () => { current.current = null; setTip(null) }
    const over = (e: Event) => { const el = (e.target as Element).closest?.('[data-tip]'); if (el && el !== current.current) show(el) }
    const out = (e: PointerEvent | FocusEvent) => {
      const to = e.relatedTarget as Element | null
      if (current.current && !(to && current.current.contains(to))) hide()
    }
    document.addEventListener('pointerover', over)
    document.addEventListener('pointerout', out)
    document.addEventListener('focusin', over)
    document.addEventListener('focusout', out)
    window.addEventListener('scroll', hide, { passive: true })
    return () => {
      document.removeEventListener('pointerover', over)
      document.removeEventListener('pointerout', out)
      document.removeEventListener('focusin', over)
      document.removeEventListener('focusout', out)
      window.removeEventListener('scroll', hide)
    }
  }, [])

  if (!tip) return null
  return <div role="tooltip" className={'tooltip' + (tip.below ? ' below' : '')} style={{ left: tip.x, top: tip.y }}>{tip.text}</div>
}
