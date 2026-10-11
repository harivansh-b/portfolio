import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { ArrowDown, ArrowUpRight, Calendar, ChevronDown, CodeXml, ExternalLink, Eye, FileText, Globe, Link, Mail, Medal, Menu, Moon, Rocket, Sun, Volume2, VolumeX, X } from 'lucide-react'
import { journey, clamp } from './journey/state'
import { profile, projects, skillGroups, education, achievements, experience, leadership, cp, PROJECT_CATEGORIES, type Project, type Club } from './data/profile'

const Journey = lazy(() => import('./journey/Journey'))
const SpaceJam = lazy(() => import('./SpaceJam'))
import { Logo } from './brand/logo'
import { track } from '@vercel/analytics'
import TechIcon from './components/TechIcon'
import Tooltip from './components/Tooltip'

gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

/* Rocket side per section (1 = right). Content sits on the opposite side. */
const SECTIONS = [
  { id: 'launch', nav: 'Launch', phase: 'LAUNCHPAD', side: 1 },
  { id: 'origin', nav: 'Origin', phase: 'LIFTOFF', side: -1 },
  { id: 'brief', nav: 'Brief', phase: 'LOW ORBIT', side: 1 },
  { id: 'missions', nav: 'Missions', phase: 'TRANSFER BURN', side: -1 },
  { id: 'crew', nav: 'Clubs', phase: 'CREW STATION', side: 1 },
  { id: 'projects', nav: 'Projects', phase: 'SATELLITE FIELD', side: -1 },
  { id: 'skills', nav: 'Skills', phase: 'CONSTELLATION', side: 1 },
  { id: 'arena', nav: 'Arena', phase: 'ASTEROID BELT', side: -1 },
  { id: 'milestones', nav: 'Milestones', phase: 'BEACON GATES', side: 1 },
  { id: 'contact', nav: 'Contact', phase: 'TOUCHDOWN', side: -1 },
] as const
journey.sides = SECTIONS.map(s => s.side)
if (import.meta.env.DEV) Object.assign(window, { __hb: { gsap, journey, ScrollTrigger } })

const DEST = {
  dark: { name: 'MOON', km: 384_400, arrival: 'TOUCHDOWN', headline: ['Touchdown on', 'the Moon.'] },
  light: { name: 'SUN', km: 149_600_000, arrival: 'HELIOS STATION', headline: ['Landed beside', 'the Sun.'] },
}

const contentSide = (i: number) => (SECTIONS[i].side === 1 ? 'left' : 'right')
const readTheme = () => { try { const t = localStorage.getItem('hb-theme'); if (t) return t === 'light' } catch { /* storage unavailable */ } return window.matchMedia('(prefers-color-scheme: light)').matches }
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
/* Native scrolling is smoother than JS smoothing on touch screens. */
const isTouch = () => window.matchMedia('(pointer: coarse)').matches

const CATEGORIES = ['All', ...PROJECT_CATEGORIES] as const
const TOP = projects.filter(p => p.featured)
const HUES = ['#6fd3ff', '#ffb35c', '#9cf1b3', '#d7a2ff', '#ff8fab', '#ffe066', '#7fffd4', '#a0b4ff', '#ffa36c', '#8fe3ff', '#f7a8ff', '#b8f18c', '#ffcf70', '#9fb8ff', '#ff9e7a', '#7ee0c3']

/* Club logo on a light disc; falls back to the lettered patch if the image is missing. */
function ClubPatch({ club }: { club: Club }) {
  const [failed, setFailed] = useState(false)
  if (!club.logo || failed) return <span className="patch">{club.badge}</span>
  return <span className={'patch logo' + (club.wide ? ' wide' : '')}><img src={club.logo} alt={`${club.org} logo`} loading="lazy" onError={() => setFailed(true)} style={club.zoom ? { scale: String(club.zoom) } : undefined} /></span>
}

/* Institution logo; hides itself if the file is missing. */
function EduLogo({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return <span className="edu-logo"><img src={src} alt={`${name} logo`} loading="lazy" onError={() => setFailed(true)} /></span>
}

function Tag({ i, children }: { i: number; children: React.ReactNode }) {
  return <p className="section-tag"><b>{String(i).padStart(2, '0')}</b><span />{children}</p>
}

export default function App() {
  const [menu, setMenu] = useState(false)
  const [active, setActive] = useState(0)
  const [selected, setSelected] = useState<Project | null>(null)
  const [filter, setFilter] = useState<typeof CATEGORIES[number]>('All')
  const [showAll, setShowAll] = useState(false)
  const [visits, setVisits] = useState<number | null>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [resumeOpen, setResumeOpen] = useState(false)
  const [light, setLight] = useState(readTheme)
  const [sound, setSound] = useState(false)
  const [game, setGame] = useState(false)
  const [reducedMotion] = useState(prefersReducedMotion)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [contactState, setContactState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const smootherRef = useRef<ScrollSmoother | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const hud = useRef<{ phase?: HTMLElement | null; dist?: HTMLElement | null; vel?: HTMLElement | null; bar?: HTMLElement | null }>({})
  const lightRef = useRef(light)
  lightRef.current = light
  const dest = light ? DEST.light : DEST.dark

  useEffect(() => {
    document.documentElement.dataset.theme = light ? 'light' : 'dark'
    try { localStorage.setItem('hb-theme', light ? 'light' : 'dark') } catch { /* storage unavailable */ }
  }, [light])

  /* ── scroll engine: ScrollSmoother → section float → WebGL journey + HUD ── */
  useLayoutEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const ctx = gsap.context(() => {
      const smoother = reducedMotion || isTouch() ? null : ScrollSmoother.create({
        wrapper: wrapperRef.current!, content: contentRef.current!, smooth: 1.25, effects: true, normalizeScroll: false,
      })
      smootherRef.current = smoother
      const content = contentRef.current!
      const sections = SECTIONS.map(s => document.getElementById(s.id)!)
      const scrollY = () => smoother ? -(gsap.getProperty(content, 'y') as number) || 0 : window.scrollY
      let centers: number[] = []
      const measure = () => {
        const y = scrollY(), max = ScrollTrigger.maxScroll(window)
        centers = sections.map((el, i) => {
          const r = el.getBoundingClientRect(), top = r.top + y
          return i === 0 ? 0 : i === sections.length - 1 ? max : clamp(top + r.height / 2 - innerHeight / 2, 0, max)
        })
        for (let i = 1; i < centers.length; i++) centers[i] = Math.max(centers[i], centers[i - 1] + 1)
      }
      ScrollTrigger.addEventListener('refresh', measure)
      measure()

      let lastY = scrollY(), lastPhase = '', lastDist = '', lastVel = ''
      const tick = (_t: number, deltaMs: number) => {
        const y = scrollY(), dt = Math.max(deltaMs, 1) / 1000
        journey.velocity += ((y - lastY) / dt - journey.velocity) * Math.min(1, dt * 6)
        lastY = y
        let s = centers.length - 1
        for (let i = 0; i < centers.length - 1; i++) if (y < centers[i + 1]) { s = i + clamp((y - centers[i]) / (centers[i + 1] - centers[i])); break }
        journey.s = s

        const d = lightRef.current ? DEST.light : DEST.dark, u = s > SECTIONS.length - 1.02 ? 1 : s / (SECTIONS.length - 1)
        const idx = Math.round(s)
        const phase = idx === SECTIONS.length - 1 ? d.arrival : SECTIONS[idx].phase
        const dist = Math.round(d.km * u * u * (3 - 2 * u)).toLocaleString('en-US')
        const vel = (s < .05 || s > SECTIONS.length - 1.05 ? 0 : 7.8 + Math.min(Math.abs(journey.velocity) / 160, 30)).toFixed(1)
        const h = hud.current
        if (phase !== lastPhase && h.phase) h.phase.textContent = lastPhase = phase
        if (dist !== lastDist && h.dist) h.dist.textContent = lastDist = dist
        if (vel !== lastVel && h.vel) h.vel.textContent = lastVel = vel
        if (h.bar) h.bar.style.transform = `scaleX(${u})`
      }
      gsap.ticker.add(tick)

      sections.forEach((el, i) => ScrollTrigger.create({ trigger: el, start: 'top 55%', end: 'bottom 55%', onToggle: self => self.isActive && setActive(i) }))

      if (!reducedMotion) {
        gsap.from('.hero-title .char', { yPercent: 115, rotate: 6, opacity: 0, stagger: .045, duration: 1.1, ease: 'expo.out', delay: .25 })
        gsap.from('.hero-reveal', { y: 30, opacity: 0, stagger: .1, duration: 1, ease: 'power3.out', delay: .7 })
        /* Small fade-ups only: large offsets made cards hang outside their panel while animating. */
        gsap.utils.toArray<HTMLElement>('.reveal').forEach(el => gsap.from(el, {
          y: 14, opacity: 0, duration: .8, ease: 'power2.out', clearProps: 'transform', scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        }))
        gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach(group => gsap.from(group.children, {
          y: 14, opacity: 0, duration: .6, stagger: .06, ease: 'power2.out', clearProps: 'transform', scrollTrigger: { trigger: group, start: 'top 92%', once: true },
        }))
        gsap.utils.toArray<HTMLElement>('.cp-bar i').forEach(bar => gsap.from(bar, { scaleX: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: bar, start: 'top 92%' } }))
        gsap.to('.hero-hint', { y: 8, repeat: -1, yoyo: true, duration: 1.1, ease: 'sine.inOut' })
      }
      return () => { gsap.ticker.remove(tick); ScrollTrigger.removeEventListener('refresh', measure) }
    })
    const onPointer = (e: PointerEvent) => { journey.pointer.x = (e.clientX / innerWidth) * 2 - 1; journey.pointer.y = (e.clientY / innerHeight) * 2 - 1 }
    window.addEventListener('pointermove', onPointer)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => { window.removeEventListener('pointermove', onPointer); ctx.revert(); smootherRef.current = null }
  }, [reducedMotion])

  /* Filtering changes the page height, so re-measure scroll positions. */
  useEffect(() => { const id = requestAnimationFrame(() => ScrollTrigger.refresh()); return () => cancelAnimationFrame(id) }, [filter, showAll])

  /* Start the WebGL scene after the page has painted, so text shows up first on slow phones. */
  useEffect(() => {
    const start = () => setSceneReady(true)
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    if (w.requestIdleCallback) { const id = w.requestIdleCallback(start, { timeout: 1200 }); return () => (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id) }
    const id = window.setTimeout(start, 300); return () => clearTimeout(id)
  }, [])

  /* Visitor counter: count once per browser session, otherwise just read. Hidden if the API is unavailable. */
  useEffect(() => {
    if (import.meta.env.DEV) {
      // Vercel functions only run in production / `vercel dev`; `?mockVisits=1234` previews the counter locally.
      const mock = Number(new URLSearchParams(location.search).get('mockVisits'))
      if (mock > 0) setVisits(mock)
      return
    }
    let counted = false
    try { counted = sessionStorage.getItem('hb-visited') === '1' } catch { /* storage unavailable */ }
    fetch('/api/visits', { method: counted ? 'GET' : 'POST' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: { visits: number }) => {
        if (!Number.isFinite(d.visits) || d.visits <= 0) return
        setVisits(d.visits)
        try { sessionStorage.setItem('hb-visited', '1') } catch { /* storage unavailable */ }
      })
      .catch(() => {})
  }, [])

  /* Freeze page scroll while a dialog is open. */
  const modalOpen = !!selected || resumeOpen || game
  useEffect(() => {
    smootherRef.current?.paused(modalOpen)
    document.documentElement.classList.toggle('modal-open', modalOpen)
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSelected(null); setResumeOpen(false); setGame(false) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  useEffect(() => () => { audioRef.current?.pause() }, [])

  const jump = (id: string) => {
    setMenu(false)
    const el = document.getElementById(id)
    if (!el) return
    if (smootherRef.current) smootherRef.current.scrollTo(el, true, 'top top')
    else el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
  }
  const beep = (pitch = 440) => {
    if (!sound) return
    const audio = new AudioContext(), osc = audio.createOscillator(), gain = audio.createGain()
    osc.type = 'sine'; osc.frequency.value = pitch
    gain.gain.setValueAtTime(.025, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .1)
    osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(audio.currentTime + .1)
    osc.onended = () => audio.close()
  }
  const toggleSound = () => {
    if (sound) { audioRef.current?.pause(); setSound(false); return }
    const audio = audioRef.current ?? new Audio('https://opengameart.org/sites/default/files/magic%20space.mp3')
    audio.loop = true; audio.volume = .18; audioRef.current = audio
    audio.play().then(() => setSound(true)).catch(() => setSound(false))
  }

  const sendContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setContactState('sending'); beep(760)
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error()
      setContactState('sent'); setForm({ name: '', email: '', phone: '', message: '' }); track('Contact form sent')
    } catch { setContactState('error') }
  }
  const field = (key: keyof typeof form) => ({ value: form[key], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: e.target.value })) })

  return (
    <>
      {sceneReady ? <Suspense fallback={<div className="scene-layer scene-fallback" aria-hidden="true" />}><Journey light={light} reducedMotion={reducedMotion} paused={modalOpen} /></Suspense> : <div className="scene-layer scene-fallback" aria-hidden="true" />}
      <div className="scene-vignette" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="#launch" onClick={e => { e.preventDefault(); jump('launch') }} aria-label="Harivansh B, back to launch"><Logo size={30} /><span>HARIVANSH<em>/ MISSION 02</em></span></a>
        <nav className={menu ? 'open' : ''} aria-label="Sections">
          {SECTIONS.map((s, i) => <button key={s.id} className={active === i ? 'active' : ''} onClick={() => { beep(350); jump(s.id) }}>{s.nav}</button>)}
        </nav>
        <span className="telemetry" aria-label="Mission telemetry">
          <b ref={el => { hud.current.phase = el }}>LAUNCHPAD</b>
          <span><em ref={el => { hud.current.dist = el }}>0</em> / {dest.km.toLocaleString('en-US')} KM</span>
          <span><em ref={el => { hud.current.vel = el }}>0.0</em> KM/S</span>
        </span>
        <div className="topbar-actions">
          {visits !== null && <span className="visit-pill" data-tip="Total visitors" aria-label={`${visits.toLocaleString('en-US')} total visitors`}><Eye size={14} /><b>{visits.toLocaleString('en-US')}</b></span>}
          <button className="route-toggle" onClick={() => { beep(620); track('Theme switched', { to: light ? 'Moon' : 'Sun' }); setLight(l => !l) }} aria-label={light ? 'Switch to dark mode: fly to the Moon' : 'Switch to light mode: fly to the Sun'}>
            <span className="route-earth" />
            <span className="route-line"><i /></span>
            {light ? <Sun size={14} /> : <Moon size={14} />}
            <span>{dest.name}</span>
          </button>
          <button className="icon-btn" onClick={toggleSound} aria-label={sound ? 'Disable sound' : 'Enable sound'}>{sound ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
          <button className="icon-btn menu-btn" aria-label="Toggle navigation" aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X size={16} /> : <Menu size={16} />}</button>
        </div>
              <div className="hud" aria-label="Journey progress">
          <i ref={el => { hud.current.bar = el }} />
          {SECTIONS.map((sec, i) => <button key={sec.id} style={{ left: `${(i / (SECTIONS.length - 1)) * 100}%` }} className={active >= i ? 'on' : ''} onClick={() => jump(sec.id)} aria-label={`Jump to ${sec.nav}`} data-tip={sec.nav} />)}
        </div>
      </header>


      <button className="jam-launch" onClick={() => { beep(660); track('Space Jam opened'); setGame(true) }}><Rocket size={16} /><span>SPACE JAM</span><small>v2 · PLAY</small></button>

      <div id="smooth-wrapper" ref={wrapperRef}>
        <div id="smooth-content" ref={contentRef}>
          <main>
            {/* 00 — Launchpad */}
            <section id="launch" className="stage hero" data-content="left">
              <div className="hero-copy">
                <p className="eyebrow hero-reveal"><span className="pulse" />MISSION HB-02 · EARTH → {dest.name} · T-MINUS 00:00</p>
                <h1 className="hero-title" aria-label={profile.name}>
                  <span className="line">{'HARIVANSH'.split('').map((c, i) => <span className="char" key={i}>{c}</span>)}<span className="char accent">&nbsp;B.</span></span>
                </h1>
                <p className="hero-role hero-reveal">{profile.role} <i>— backend, distributed systems &amp; AI</i></p>
                <p className="hero-intro hero-reveal">{profile.intro}</p>
                <div className="hero-actions hero-reveal">
                  <button className="btn primary" onClick={() => { beep(480); jump('origin') }}>Begin the journey <ArrowDown size={16} /></button>
                  <button className="btn ghost" onClick={() => { beep(680); track('Resume viewed'); setResumeOpen(true) }}>View résumé <FileText size={16} /></button>
                </div>
                <dl className="hero-stats hero-reveal">
                  <div><dt>CGPA</dt><dd>9.205</dd></div>
                  <div><dt>LeetCode</dt><dd>2147 <small>Guardian</small></dd></div>
                  <div><dt>ICPC</dt><dd>Regionalist</dd></div>
                  <div><dt>Codeforces</dt><dd>1513 <small>Specialist</small></dd></div>
                </dl>
              </div>
              <p className="hero-hint">SCROLL TO LAUNCH <ArrowDown size={13} /></p>
            </section>

            {/* 01 — Origin */}
            <section id="origin" className="stage" data-content={contentSide(1)}>
              <div className="panel">
                <Tag i={1}>LIFTOFF · EDUCATION</Tag>
                <h2 className="reveal">Learning to build <i>for the unknown.</i></h2>
                <p className="lede reveal">Computer Science at <strong>SSN College of Engineering</strong>, building the fundamentals that turn curious ideas into dependable systems.</p>
                <div className="stack" data-stagger>
                  {education.map((e, i) => (
                    <article className="card edu" key={e.institution}>
                      <div className="edu-head">
                        {e.logo && <EduLogo src={e.logo} name={e.institution} />}
                        <span className="card-kicker">0{i + 1} · {e.period}</span>
                      </div>
                      <h3>{e.institution}</h3>
                      <p>{e.program} · {e.place}</p>
                      <span className="edu-meta"><strong className="score">{e.score}</strong></span>
                      {e.note && <p className="edu-note"><Medal size={14} />{e.note}</p>}
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* 02 — Brief */}
            <section id="brief" className="stage" data-content={contentSide(2)}>
              <div className="panel">
                <Tag i={2}>LOW ORBIT · ABOUT</Tag>
                <h2 className="reveal">The full <i>picture.</i></h2>
                <p className="lede reveal">{profile.summary}</p>
                <dl className="facts" data-stagger>
                  {profile.facts.map(f => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
                </dl>
                <a href={profile.bookingUrl} target="_blank" rel="noreferrer" className="card call reveal" onClick={() => { beep(560); track('Book a call clicked', { from: 'About' }) }}>
                  <span className="call-icon"><Calendar size={20} /></span>
                  <span><strong>Book a call</strong><small>30-minute intro, pick any slot</small></span>
                  <ArrowUpRight size={18} />
                </a>
              </div>
            </section>

            {/* 03 — Missions */}
            <section id="missions" className="stage" data-content={contentSide(3)}>
              <div className="panel">
                <Tag i={3}>TRANSFER BURN · EXPERIENCE</Tag>
                <h2 className="reveal">Engineering in <i>real orbit.</i></h2>
                {experience.map(x => (
                  <article className="card mission reveal" key={x.org}>
                    <div className="mission-head">
                      <div><span className="status done">MISSION / {x.status}</span><h3>{x.role}</h3><p className="org">{x.org}</p></div>
                      <span className="period">{x.period}</span>
                    </div>
                    <div className="trace" aria-hidden="true">{x.trace.map((t, i) => <span key={t}>{i > 0 && <i />}<b>{t}</b></span>)}</div>
                    <ul className="points">{x.points.map(p => <li key={p}>{p}</li>)}</ul>
                    <div className="tech">{x.focus.map(f => <b key={f}><TechIcon name={f} size={13} />{f}</b>)}</div>
                  </article>
                ))}
              </div>
            </section>

            {/* 04 — Club experience */}
            <section id="crew" className="stage" data-content={contentSide(4)}>
              <div className="panel wide">
                <Tag i={4}>CREW STATION · CLUB EXPERIENCE</Tag>
                <h2 className="reveal">Club <i>experience.</i></h2>
                <p className="lede reveal">Student chapters and clubs at SSN where I lead teams, run technical events and contests, and maintain websites.</p>
                <div className="li-exp" data-stagger>
                  {leadership.map(l => (
                    <article className="li-org" key={l.org}>
                      <ClubPatch club={l} />
                      {l.roles.length > 1 ? (
                        <div className="li-body">
                          <h3>{l.name}</h3>
                          {l.tenure && <p className="li-meta">{l.tenure}</p>}
                          <ol className="li-roles">
                            {l.roles.map(r => (
                              <li key={r.title}>
                                <b>{r.title}</b>
                                <span className="li-meta">{[r.period, r.duration].filter(Boolean).join(' · ')}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ) : (
                        <div className="li-body">
                          <h3>{l.roles[0].title}</h3>
                          <p className="li-org-name">{l.name}</p>
                          {l.roles[0].period && <p className="li-meta">{[l.roles[0].period, l.roles[0].duration].filter(Boolean).join(' · ')}</p>}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* 05 — Projects */}
            <section id="projects" className="stage" data-content={contentSide(5)}>
              <div className="panel wide">
                <Tag i={5}>SATELLITE FIELD · PROJECTS</Tag>
                <h2 className="reveal">Ideas with <i>escape velocity.</i></h2>
                <p className="lede reveal">{projects.length} satellites launched, including my Smart India Hackathon builds. Open a card for its mission profile.</p>
                <div className="filters reveal" role="tablist" aria-label="Filter projects">
                  {CATEGORIES.map(c => (
                    <button key={c} role="tab" aria-selected={filter === c} className={(filter === c ? 'on' : '') + (c === 'SIH' ? ' sih' : '')} onClick={() => { beep(400); setFilter(c); setShowAll(false) }}>
                      {c}<small>{c === 'All' ? TOP.length : projects.filter(p => p.category === c).length}</small>
                    </button>
                  ))}
                </div>
                <div className="grid-2 projects-grid">
                  {projects.map((p, i) => ({ p, i })).filter(({ p }) => filter === 'All' ? (showAll || p.featured) : p.category === filter).map(({ p, i }) => (
                    <button className={'card project' + (p.featured ? ' featured' : '')} key={p.name} onClick={() => { beep(500); track('Project opened', { project: p.name }); setSelected(p) }} style={{ '--hue': HUES[i] } as React.CSSProperties}>
                      <span className="card-kicker"><i className="sat-dot" />{p.type}</span>
                      <span className={'cat-tag' + (p.category === 'SIH' ? ' sih' : '')}>{p.live && <i className="live-dot" data-tip="Live demo available" />}{p.category}</span>
                      <h3>{p.name}</h3>
                      <p>{p.desc}</p>
                      <span className="project-row"><span className="tech">{p.tech.slice(0, 2).map(t => <b key={t} data-tip={t} aria-label={t}><TechIcon name={t} size={12} /><span className="chip-label">{t}</span></b>)}{p.tech.length > 2 && <b className="more" data-tip={p.tech.slice(2).join(' · ')} aria-label={`Also: ${p.tech.slice(2).join(', ')}`}>+{p.tech.length - 2}</b>}</span><ArrowUpRight className="go" size={18} /></span>
                    </button>
                  ))}
                </div>
                {filter === 'All' && (
                  <button className="btn ghost show-all" onClick={() => { beep(450); setShowAll(v => !v) }} aria-expanded={showAll}>
                    {showAll ? 'Show fewer' : `Show all ${projects.length} projects`} <ChevronDown size={16} style={{ rotate: showAll ? '180deg' : '0deg' }} />
                  </button>
                )}
              </div>
            </section>

            {/* 06 — Skills */}
            <section id="skills" className="stage" data-content={contentSide(6)}>
              <div className="panel wide">
                <Tag i={6}>CONSTELLATION · TECH STACK</Tag>
                <h2 className="reveal">Every system <i>is connected.</i></h2>
                <div className="grid-3" data-stagger>
                  {skillGroups.map(g => (
                    <div className="card skill" key={g.name}>
                      <span className="card-kicker">{g.name}</span>
                      <ul>{g.items.map(s => <li key={s}><TechIcon name={s} size={18} />{s}</li>)}</ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 07 — Arena */}
            <section id="arena" className="stage" data-content={contentSide(7)}>
              <div className="panel wide">
                <Tag i={7}>ASTEROID BELT · COMPETITIVE PROGRAMMING</Tag>
                <h2 className="reveal">Navigate the <i>hard problems.</i></h2>
                <div className="grid-3 cp-grid" data-stagger>
                  {cp.map(c => (
                    <a key={c.name} href={c.url} target="_blank" rel="noreferrer" className={'card cp' + (c.stats || c.badges ? ' rich' : '')} onClick={() => beep(520)}>
                      <span className="cp-top">{c.logoSrc ? <img src={c.logoSrc} alt="" width={22} height={22} loading="lazy" /> : <span className="cp-icon"><TechIcon name={c.icon!} size={16} /></span>}<b>{c.name}</b><ExternalLink size={14} /></span>
                      <strong>{c.value}</strong>
                      <span className="cp-rank">{c.rank}</span>
                      {c.bar !== undefined && <span className="cp-bar"><i style={{ width: `${Math.min(100, c.bar * 100)}%` }} /></span>}
                      {c.stats && <span className="cp-stats">{c.stats.map(st => <span key={st.label}><b>{st.value}</b>{st.label}</span>)}</span>}
                      {c.badges && <span className="cp-badges">{c.badges.map(bd => <span key={bd.name}><b>{bd.name}</b><i aria-label={`${bd.stars} stars`}>{'★'.repeat(bd.stars)}<s>{'★'.repeat(5 - bd.stars)}</s></i></span>)}</span>}
                      {c.note && <small>{c.note}</small>}
                    </a>
                  ))}
                </div>
              </div>
            </section>

            {/* 08 — Achievements */}
            <section id="milestones" className="stage" data-content={contentSide(8)}>
              <div className="panel">
                <Tag i={8}>ACHIEVEMENTS</Tag>
                <h2 className="reveal">Honours and <i>awards.</i></h2>
                <ol className="honours" data-stagger>
                  {achievements.map(a => (
                    <li key={a.title}>
                      <div><h3>{a.title}</h3><p>{a.event}</p></div>
                      {a.year && <span className="honour-year">{a.year}</span>}
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* 09 — Contact */}
            <section id="contact" className="stage" data-content={contentSide(9)}>
              <div className="panel wide contact-panel">
                <Tag i={9}>{dest.arrival} · CONTACT</Tag>
                <h2 className="reveal">{dest.headline[0]} <i>{dest.headline[1]}</i></h2>
                <p className="lede reveal">Mission complete? Not really. There's always further to go, so let's build something together.</p>
                <div className="links" data-stagger>
                  <a href={profile.github} target="_blank" rel="noreferrer" onClick={() => track('Profile link clicked', { to: 'GitHub' })}><CodeXml size={16} />GitHub</a>
                  <a href={profile.linkedin} target="_blank" rel="noreferrer" onClick={() => track('Profile link clicked', { to: 'LinkedIn' })}><Link size={16} />LinkedIn</a>
                  <a href={profile.email} onClick={() => track('Profile link clicked', { to: 'Email' })}><Mail size={16} />Email</a>
                  <a href={profile.bookingUrl} target="_blank" rel="noreferrer" onClick={() => track('Book a call clicked', { from: 'Contact' })}><Calendar size={16} />Book a call</a>
                </div>
                <form className="card form reveal" onSubmit={sendContact}>
                  <div className="form-row">
                    <label>Name <span className="req">*</span><input {...field('name')} placeholder="Full name" required autoComplete="name" /></label>
                    <label>Email<input {...field('email')} type="email" placeholder="you@example.com" autoComplete="email" /></label>
                  </div>
                  <label>Phone <span className="opt">(optional)</span><input {...field('phone')} type="tel" placeholder="+91 …" autoComplete="tel" /></label>
                  <label>Transmission <span className="req">*</span><textarea {...field('message')} placeholder="How can we build something great?" required /></label>
                  <button type="submit" className="btn primary" disabled={contactState === 'sending'}>{contactState === 'sending' ? 'Transmitting…' : 'Send transmission'} <ArrowUpRight size={16} /></button>
                  <p className={'form-status ' + contactState} role="status">
                    {contactState === 'sent' && 'Transmission received. Thank you!'}
                    {contactState === 'error' && 'Transmission failed. Please try again or email me directly.'}
                  </p>
                </form>
              </div>
            </section>
          </main>
          <footer className="footer">
            <span className="footer-brand"><Logo size={22} />HARIVANSH B · {new Date().getFullYear()}</span>
            <span>{visits !== null ? <span className="footer-visits"><Eye size={12} />{visits.toLocaleString('en-US')} VISITORS</span> : 'THE JOURNEY CONTINUES'}</span>
            <button onClick={() => jump('launch')}>RETURN TO EARTH ↑</button>
          </footer>
        </div>
      </div>

      {selected && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <section className="modal project-modal" role="dialog" aria-modal="true" aria-label={`${selected.name} details`} onClick={e => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)} aria-label="Close"><X size={18} /></button>
            <p className="eyebrow">MISSION PROFILE · {selected.type.toUpperCase()} · {selected.category.toUpperCase()}</p>
            <h2>{selected.name}</h2>
            <p>{selected.desc}</p>
            <ul className="points">{selected.points.map(p => <li key={p}>{p}</li>)}</ul>
            <div className="trace" aria-hidden="true">{['INTERFACE', 'APPLICATION', 'DATA'].map((t, i) => <span key={t}>{i > 0 && <i />}<b>{t}</b></span>)}</div>
            <span className="tech">{selected.tech.map(t => <b key={t}><TechIcon name={t} size={13} />{t}</b>)}</span>
            <div className="modal-foot">
              {selected.live && <a className="btn ghost" href={selected.live} target="_blank" rel="noreferrer" onClick={() => track('Project link clicked', { project: selected.name, link: 'Live demo' })}>Live demo <Globe size={15} /></a>}
              {selected.links
                ? <span className="modal-links">{selected.links.map(l => <a key={l.url} className="btn primary" href={l.url} target="_blank" rel="noreferrer" onClick={() => track('Project link clicked', { project: selected.name, link: l.label })}>{l.label} <ArrowUpRight size={16} /></a>)}</span>
                : <a className="btn primary" href={selected.url} target="_blank" rel="noreferrer" onClick={() => track('Project link clicked', { project: selected.name, link: 'Source' })}>View source <ArrowUpRight size={16} /></a>}
            </div>
          </section>
        </div>
      )}

      {resumeOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setResumeOpen(false)}>
          <section className="modal resume-modal" role="dialog" aria-modal="true" aria-label="Résumé viewer" onClick={e => e.stopPropagation()}>
            <button className="close" onClick={() => setResumeOpen(false)} aria-label="Close"><X size={18} /></button>
            <div className="resume-head"><span className="stamp">HB</span><div><p className="eyebrow">MISSION DOSSIER</p><h2>{profile.name}</h2></div></div>
            <iframe title={`${profile.name} résumé`} src="/resume.pdf#view=FitH" />
            <div className="modal-foot">
              <a className="btn ghost" href="/resume.pdf" target="_blank" rel="noreferrer">Open in new tab <ExternalLink size={15} /></a>
              <a className="btn primary" href="/resume.pdf" download="Harivansh_B_Resume.pdf" onClick={() => { beep(760); track('Resume downloaded') }}>Download <ArrowDown size={15} /></a>
            </div>
          </section>
        </div>
      )}

      <Tooltip />
      {game && <Suspense fallback={null}><SpaceJam onClose={() => setGame(false)} beep={beep} /></Suspense>}
    </>
  )
}
