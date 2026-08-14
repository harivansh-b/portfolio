import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight, CodeXml, Link, Mail, Menu, X, ExternalLink, Moon, Sun, FileText, Volume2, VolumeX, Crosshair, Rocket, Phone, Calendar, User, Trophy, Code2 } from 'lucide-react'
import { profile, projects, skills, education, achievements } from './data/profile'

const nav = [['EARTH', 'hero'], ['ORIGIN', 'origin'], ['BRIEF', 'summary'], ['MISSIONS', 'missions'], ['ORBIT', 'projects'], ['TRACKS', 'skills'], ['MOON', 'moon']]
const cp = [
  { name: 'LEETCODE', logoSrc: '/logos/leetcode.png', url: 'https://leetcode.com/u/harivansh_b', rating: '2147', rank: 'Guardian', label: 'ALGORITHM LOG', note: 'Practice, patterns, and problem-solving.' },
  { name: 'CODEFORCES', logoSrc: '/logos/codeforces.png', url: 'https://codeforces.com/profile/harivansh_b', rating: '1513', rank: 'Specialist', label: 'CONTEST ORBIT', note: 'Timed contests and competitive programming.' },
  { name: 'CODECHEF', logoSrc: '/logos/codechef.ico', url: 'https://www.codechef.com/users/harivansh_b_6', rating: '1666', rank: '3 Star', label: 'CHALLENGE SECTOR', note: 'Long-form challenges and problem sets.' },
  { name: 'ATCODER', logoSrc: '/logos/atcoder.png', url: 'https://atcoder.jp/users/harivansh_b', rating: '1226', rank: 'Rating', label: 'PRECISION FIELD', note: 'Structured contests and algorithmic craft.' },
]

function Stars() {
  const stars = useMemo(() => Array.from({ length: 120 }, (_, i) => ({ x: (i * 73) % 100, y: (i * 47) % 100, s: (i % 3) + 1, d: (i % 8) * .25 })), [])
  return <div className="stars" aria-hidden="true">{stars.map((s, i) => <i key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `-${s.d}s` }} />)}</div>
}

export default function App() {
  const [menu, setMenu] = useState(false),
    [active, setActive] = useState('hero'),
    [selected, setSelected] = useState<typeof projects[number] | null>(null),
    [resumeOpen, setResumeOpen] = useState(false),
    [light, setLight] = useState(false),
    [sound, setSound] = useState(false),
    [game, setGame] = useState(false),
    [score, setScore] = useState(0),
    [asteroids, setAsteroids] = useState([0, 1, 2, 3, 4, 5]),
    [contactName, setContactName] = useState(''),
    [contactEmail, setContactEmail] = useState(''),
    [contactPhone, setContactPhone] = useState(''),
    [contactMessage, setContactMessage] = useState(''),
    [contactState, setContactState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && setActive(e.target.id)),
      { threshold: .45 }
    )
    document.querySelectorAll('section[id]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => () => { audioRef.current?.pause() }, [])

  const jump = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenu(false) }
  const beep = (pitch = 440) => { if (!sound) return; const audio = new AudioContext(), osc = audio.createOscillator(), gain = audio.createGain(); osc.type = 'sine'; osc.frequency.value = pitch; gain.gain.setValueAtTime(.025, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .1); osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(audio.currentTime + .1) }
  const toggleSound = () => { if (sound) { audioRef.current?.pause(); setSound(false); return } const audio = audioRef.current ?? new Audio('https://opengameart.org/sites/default/files/magic%20space.mp3'); audio.loop = true; audio.volume = .18; audioRef.current = audio; audio.play().then(() => setSound(true)).catch(() => setSound(false)) }
  const shoot = (id: number) => { setAsteroids(cur => cur.filter(x => x !== id)); setScore(cur => cur + 100); beep(840); setTimeout(() => setAsteroids(cur => [...cur, id]), 500) }

  const sendContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setContactState('sending'); beep(760)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: contactName, email: contactEmail, phone: contactPhone, message: contactMessage }),
      })
      if (!res.ok) throw new Error()
      setContactState('sent'); setContactName(''); setContactEmail(''); setContactPhone(''); setContactMessage('')
    } catch { setContactState('error') }
  }

  useEffect(() => {
    const click = (event: MouseEvent) => { if ((event.target as Element).closest('button,a')) beep(420) }
    document.addEventListener('click', click); return () => document.removeEventListener('click', click)
  }, [sound])

  return (
    <main className={light ? 'light-mode' : ''}>
      <Stars />

      {/* ── Topbar ── */}
      <header className="topbar">
        <a className="brand" href="#hero" onClick={e => { e.preventDefault(); jump('hero') }}><span className="brand-dot" />HB <em>MISSION_01</em></a>
        <button className="menu-btn" aria-label="Toggle navigation" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
        <nav className={menu ? 'open' : ''}>{nav.map(([name, id]) => <button className={active === id ? 'active' : ''} key={id} onClick={() => { beep(350); jump(id) }}>{name}</button>)}</nav>
        <button className="theme-toggle" onClick={() => { beep(620); setLight(!light) }} aria-label={light ? 'Activate dark mode' : 'Activate light mode'}>{light ? <Sun size={14} /> : <Moon size={14} />}<span>{light ? 'SUN' : 'MOON'}</span></button>
        <button className="sound-toggle" onClick={toggleSound} aria-label={sound ? 'Disable sound' : 'Enable sound'}>{sound ? <Volume2 size={15} /> : <VolumeX size={15} />}<span>{sound ? 'AMBIENT' : 'SFX'}</span></button>
        <span className="system">SYS / ONLINE</span>
      </header>

      <aside className="rail" aria-label="Mission positions">{nav.map(([_, id], i) => <button onClick={() => jump(id)} className={active === id ? 'active' : ''} key={id}><b>{String(i + 1).padStart(2, '0')}</b><i /></button>)}</aside>
      <button className="space-jam-launch" onClick={() => { beep(660); setGame(true) }}><Rocket size={17} /><span>SPACE JAM</span><small>DESTROY ASTEROIDS</small></button>

      {/* ── Hero ── */}
      <section id="hero" className="hero">
        <div className="hero-copy">
          <p className="eyebrow">MISSION LOG / 001 · EARTH</p>
          <h1>HARIVANSH<br /><span>B.</span></h1>
          <div className="hero-line" />
          <p className="title">SOFTWARE DEVELOPER</p>
          <p className="intro">{profile.intro}</p>
          <div className="actions">
            <button onClick={() => { beep(480); jump('origin') }} className="primary">EXPLORE THE JOURNEY <ArrowDown size={15} /></button>
            <button className="secondary" onClick={() => { beep(680); setResumeOpen(true) }}>VIEW RESUME <FileText size={15} /></button>
          </div>
        </div>
        <div className="orbit-line" /><div className="sun-disc" aria-hidden="true" />
        <div className="earth" aria-label="A stylised Earth"><div className="earth-shade" /><span className="land land-a" /><span className="land land-b" /><span className="cloud cloud-a" /><span className="cloud cloud-b" /></div>
        <div className="hero-hud"><span>POSITION</span><b>EARTH / 00.0°</b><span>TRAJECTORY</span><b>NOMINAL</b></div>
        <p className="scroll-note">SCROLL TO INITIATE <ArrowDown size={14} /></p>
      </section>

      {/* ── Origin ── */}
      <section id="origin" className="origin section">
        <div className="section-tag">01 / ORIGIN</div>
        <div className="split">
          <div><p className="eyebrow">WHERE THE JOURNEY STARTED</p><h2>Learning to build<br /><i>for the unknown.</i></h2></div>
          <div className="origin-copy">
            <p>Computer Science undergraduate at <strong>SSN College of Engineering</strong>, developing the engineering foundations to turn curious ideas into dependable systems.</p>
            <p className="muted">The mission is defined by thoughtful software: strong fundamentals, deliberate systems, and a willingness to explore.</p>
          </div>
        </div>
        <div className="education-grid">{education.map((item, index) => <article className="education-card" key={item.institution}><span>0{index + 1} / ACADEMIC ORBIT</span><h3>{item.institution}</h3><p>{item.place}</p><strong>{item.score}</strong><div><b>{item.program}</b><em>{item.period}</em></div></article>)}</div>
      </section>

      {/* ── Professional Summary ── */}
      <section id="summary" className="summary-section section">
        <div className="section-tag">02 / BRIEF</div>
        <p className="eyebrow">PROFESSIONAL SUMMARY</p>
        <div className="summary-layout">
          <div className="summary-heading">
            <h2>The full<br /><i>picture.</i></h2>
            <div className="summary-badge"><User size={18} /><span>HB / DEV</span></div>
            {/* Book a Call CTA in sticky sidebar */}
            <a href={profile.bookingUrl} target="_blank" rel="noreferrer" className="book-call-card" onClick={() => beep(560)}>
              <span className="book-call-card-icon"><Calendar size={22} /></span>
              <div>
                <strong>BOOK A CALL</strong>
                <span>Schedule a 30-min intro</span>
              </div>
              <ArrowUpRight size={16} className="book-call-card-arrow" />
            </a>
          </div>
          <div className="summary-content">
            <p className="summary-text">{profile.summary}</p>

            {/* CP Highlight stats */}
            <div className="summary-cp-block">
              <div className="summary-cp-header"><Code2 size={14} /><span>COMPETITIVE PROGRAMMING RATINGS</span></div>
              <div className="summary-cp-grid">
                {cp.map(c => (
                  <a key={c.name} href={c.url} target="_blank" rel="noreferrer" className="summary-cp-card" onClick={() => beep(500)}>
                    <span className="summary-cp-logo"><img src={c.logoSrc} alt={c.name + ' logo'} width={18} height={18} style={{ objectFit: 'contain', display: 'block' }} /></span>
                    <span className="summary-cp-name">{c.name}</span>
                    <span className="summary-cp-rating">{c.rating}</span>
                    <span className="summary-cp-rank">{c.rank}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Achievements highlight */}
            <div className="summary-ach-block">
              <div className="summary-cp-header"><Trophy size={14} /><span>KEY ACHIEVEMENTS</span></div>
              <div className="summary-ach-list">
                {achievements.map(a => (
                  <div key={a.title} className="summary-ach-item">
                    <span className="summary-ach-year">{a.year}</span>
                    <div><strong>{a.title}</strong><p>{a.detail}</p></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="summary-tags">
              {['Full-Stack Dev', 'Distributed Systems', 'Federated ML', 'Competitive Programming', 'Barclays SDE Intern', 'ICPC Regionalist', 'Gold Medalist'].map(tag => <span key={tag} className="summary-tag">{tag}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* ── Missions ── */}
      <section id="missions" className="missions section">
        <div className="section-tag">03 / MISSION LOG</div><p className="eyebrow">EXPERIENCE / SYSTEMS</p><h2>Engineering in<br /><i>real orbit.</i></h2>
        <article className="mission-card"><div><span className="status">MISSION / ACTIVE</span><h3>SDE INTERN</h3><p className="mission-org">BARCLAYS</p></div><div className="trace"><span>CLIENT</span><i /><span>API</span><i /><span>SERVICE</span><i /><span>TRACE</span></div><p className="mission-note">Exploring distributed systems, observability, OpenTelemetry, FastAPI, SDK development and microservices.</p></article>
      </section>

      {/* ── Projects ── */}
      <section id="projects" className="projects section">
        <div className="section-tag">04 / ORBITAL ASSETS</div>
        <div className="split"><div><p className="eyebrow">SELECTED SPACECRAFT</p><h2>Ideas with<br /><i>escape velocity.</i></h2></div><p className="muted project-lede">A selected mission archive. Project details and repository activity are kept connected to the public GitHub profile.</p></div>
        <div className="project-grid">{projects.map((p, i) => <button onClick={() => setSelected(p)} className={'project project-' + i} key={p.name}><span className="satellite"><i /></span><small>{p.type}</small><h3>{p.name}</h3><p>{p.desc}</p><div>{p.tech.map(t => <b key={t}>{t}</b>)}<ArrowUpRight /></div></button>)}</div>
      </section>

      {/* ── Skills ── */}
      <section id="skills" className="skills section">
        <div className="section-tag">05 / CONSTELLATION</div><p className="eyebrow">TECHNOLOGY MAP</p><h2>Every system<br /><i>is connected.</i></h2>
        <div className="constellation"><div className="core">HB<span>CORE</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 50 L12 22 M50 50 L30 78 M50 50 L74 16 M50 50 L89 63 M12 22 L30 78 M74 16 L89 63" /></svg>{skills.map((s, i) => <button key={s} className={'node n' + i}><i />{s}</button>)}</div>
        <p className="skills-caption">Hover nodes to explore the technology constellation.</p>
      </section>

      {/* ── Competitive Programming ── */}
      <section className="asteroids section">
        <div className="section-tag">06 / ASTEROID FIELD</div><p className="eyebrow">COMPETITIVE PROGRAMMING</p><h2>Navigate the<br /><i>hard problems.</i></h2>
        <p className="cp-intro">Verified résumé snapshot. Hover for profile statistics; open a card for current public data.</p>
        <div className="asteroid-grid">{cp.map((item, i) => <a key={item.name} href={item.url} target="_blank" rel="noreferrer" onMouseEnter={() => beep(520 + i * 50)}><span className={'cp-logo cp-logo-' + i}><img src={item.logoSrc} alt={item.name + ' logo'} width={18} height={18} style={{ objectFit: 'contain', display: 'block' }} /></span><span className="radar"><i /><i /><i /><em /></span><span className={'rock r' + i} /><b>{item.name}</b><small>OPEN PROFILE <ExternalLink size={12} /></small><span className="cp-dossier"><em>{item.label}</em><strong>{item.note}</strong><div><span>RATING <b>{item.rating}</b></span><span>RANK <b>{item.rank}</b></span></div><span>VIEW PUBLIC PROFILE →</span></span></a>)}</div>
      </section>

      {/* ── Achievements ── */}
      <section className="achievements section">
        <div className="section-tag">07 / MISSION MILESTONES</div><p className="eyebrow">ACHIEVEMENTS</p><h2>Milestones found<br /><i>along the way.</i></h2>
        <div className="achievement-grid">{achievements.map((item, index) => <article key={item.title}><span>{item.year}</span><b>PATCH / 0{index + 1}</b><h3>{item.title}</h3><p>{item.detail}</p></article>)}</div>
      </section>

      {/* ── Moon / Contact ── */}
      <section id="moon" className="moon section">
        <div className="section-tag">08 / LUNAR LANDING</div>
        <div className="moon-body"><i /><i /><i /></div>
        <div className="moon-copy">
          <p className="eyebrow">MISSION COMPLETE.</p>
          <h2>Not really.</h2>
          <p>There's still more to explore. Let's connect.</p>

          {/* Social links */}
          <div className="contact">
            <a href={profile.github} target="_blank"><CodeXml /> GITHUB</a>
            <a href={profile.linkedin} target="_blank"><Link /> LINKEDIN</a>
            <a href={profile.email}><Mail /> EMAIL</a>
            <a href={profile.bookingUrl} target="_blank" rel="noreferrer" className="book-call-btn" onClick={() => beep(560)}><Calendar size={15} /> BOOK A CALL</a>
          </div>

          {/* Contact form — collects visitor info */}
          <form className="contact-form" onSubmit={sendContact}>
            <div className="contact-form-row">
              <div>
                <label htmlFor="contact-name">YOUR NAME <span className="req">*</span></label>
                <input id="contact-name" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="FULL NAME" required />
              </div>
              <div>
                <label htmlFor="contact-email">YOUR EMAIL</label>
                <input id="contact-email" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label htmlFor="contact-phone">YOUR PHONE <span className="req-opt">(OPTIONAL)</span></label>
              <input id="contact-phone" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label htmlFor="contact-message">TRANSMISSION <span className="req">*</span></label>
              <textarea id="contact-message" value={contactMessage} onChange={e => setContactMessage(e.target.value)} placeholder="HOW CAN WE BUILD SOMETHING GREAT?" required />
            </div>
            <button type="submit" disabled={contactState === 'sending'}>
              {contactState === 'sending' ? 'SENDING...' : 'SEND TRANSMISSION'} <ArrowUpRight size={15} />
            </button>
            {contactState === 'sent' && <p className="contact-status success">TRANSMISSION RECEIVED. THANK YOU.</p>}
            {contactState === 'error' && <p className="contact-status error">TRANSMISSION FAILED. PLEASE TRY AGAIN.</p>}
          </form>

          <p className="closing">LET'S BUILD SOMETHING THAT GOES FURTHER.</p>
        </div>
        <footer>HB / 2026 <span>THE JOURNEY CONTINUES</span><a href="#hero">RETURN TO EARTH ↑</a></footer>
      </section>

      {/* ── Project modal ── */}
      {selected && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <section className="mission-modal" role="dialog" aria-modal="true" aria-label={`${selected.name} mission details`} onClick={e => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)}><X /></button>
            <p className="eyebrow">MISSION DETAIL / ORBITAL ASSET</p>
            <h2>{selected.name}</h2><p>{selected.desc}</p>
            <div className="arch"><span>INTERFACE</span><i /><span>APPLICATION</span><i /><span>DATA</span></div>
            <div className="modal-bottom">{selected.tech.map(t => <b key={t}>{t}</b>)}<a href={selected.url} target="_blank">VIEW SOURCE <ArrowUpRight size={15} /></a></div>
          </section>
        </div>
      )}

      {/* ── Resume modal ── */}
      {resumeOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setResumeOpen(false)}>
          <section className="resume-modal" role="dialog" aria-modal="true" aria-label="Resume viewer" onClick={e => e.stopPropagation()}>
            <button className="close" onClick={() => setResumeOpen(false)}><X /></button>
            <div className="resume-heading">
              <span className="resume-stamp">HB</span>
              <div><p className="eyebrow">MISSION DOSSIER / RESUME</p><h2>Harivansh B.</h2><p>Software Developer · Curriculum Vitae</p></div>
            </div>
            <div className="resume-toolbar"><span><i /> SECURE DOCUMENT PREVIEW</span><span>PDF / 01</span></div>
            <iframe title="Harivansh B resume" src="/resume.pdf#view=FitH" />
            <div className="resume-actions"><span>MISSION DOCUMENT / READY</span><a href="/resume.pdf" download onClick={() => beep(760)}>DOWNLOAD RESUME <ArrowDown size={14} /></a></div>
          </section>
        </div>
      )}

      {/* ── Game modal ── */}
      {game && (
        <div className="modal-backdrop" role="presentation" onClick={() => setGame(false)}>
          <section className="game-modal" role="dialog" aria-modal="true" aria-label="Space Jam asteroid game" onClick={e => e.stopPropagation()}>
            <button className="close" onClick={() => setGame(false)}><X /></button>
            <header><span><Rocket size={17} /> SPACE JAM</span><b>SCORE / {String(score).padStart(5, '0')}</b></header>
            <p>AIM AT THE ASTEROIDS. CLICK TO FIRE.</p>
            <div className="game-field">{asteroids.map((asteroid, index) => <button key={asteroid} className={'game-asteroid ga-' + index} onClick={() => shoot(asteroid)} aria-label="Destroy asteroid"><Crosshair size={18} /><i /></button>)}<div className="ship"><Rocket size={28} /><span /></div></div>
            <footer><span>SHIELD / ONLINE</span><button onClick={() => { setScore(0); setAsteroids([0, 1, 2, 3, 4, 5]); beep(390) }}>RESET WAVE</button></footer>
          </section>
        </div>
      )}
    </main>
  )
}
