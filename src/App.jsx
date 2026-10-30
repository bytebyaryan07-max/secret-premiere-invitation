import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { Download } from 'lucide-react'
import Stage from './components/Stage'
import Entrance from './scenes/Entrance'
import NameEntry from './scenes/NameEntry'
import NameReveal from './scenes/NameReveal'
import DashboardPanel from './components/DashboardPanel'
import HalloweenHeader from './components/HalloweenHeader'
import HalloweenAtmosphere from './components/HalloweenAtmosphere'
import { EVENT } from './config/event'
import { drawFront, loadFonts } from './lib/drawInvitation'
import { chime } from './lib/sound'
import { trackVisit, trackSave } from './lib/api'

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

const checkIsDashboardRoute = () => {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname.toLowerCase()
  const hash = window.location.hash.toLowerCase()
  const search = window.location.search.toLowerCase()
  return (
    path.includes('/dashboard') ||
    path.includes('/admin') ||
    hash === '#dashboard' ||
    hash === '#admin' ||
    search.includes('view=dashboard')
  )
}

export default function App() {
  const [view, setView] = useState(() => (checkIsDashboardRoute() ? 'dashboard' : 'invitation'))
  const [scene, setScene] = useState('entrance')
  const [name, setName] = useState('')
  const [visitId, setVisitId] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [runKey, setRunKey] = useState(0)
  const [skipKey, setSkipKey] = useState(0)
  const [sound, setSound] = useState(true)
  const [fallbackImg, setFallbackImg] = useState('')

  const veil = useRef(), soundRef = useRef(false)
  const webgl = useMemo(hasWebGL, [])
  soundRef.current = sound
  const ping = (f) => soundRef.current && chime(f)

  useEffect(() => {
    const onLocationChange = () => {
      setView(checkIsDashboardRoute() ? 'dashboard' : 'invitation')
    }
    window.addEventListener('popstate', onLocationChange)
    window.addEventListener('hashchange', onLocationChange)
    return () => {
      window.removeEventListener('popstate', onLocationChange)
      window.removeEventListener('hashchange', onLocationChange)
    }
  }, [])

  const navigateTo = (newView) => {
    if (newView === 'dashboard') {
      window.history.pushState({}, '', '/dashboard')
      setView('dashboard')
    } else {
      window.history.pushState({}, '', '/')
      setView('invitation')
    }
  }

  useEffect(() => {
    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.globalTimeline.timeScale(8)
    }
  }, [])

  const go = (next) => {
    gsap.timeline()
      .to(veil.current, { opacity: 1, duration: 0.7, ease: 'power2.in' })
      .add(() => { setRevealed(false); setScene(next) })
      .to(veil.current, { opacity: 0, duration: 0.9, ease: 'power2.out' })
  }

  const onRevealed = () => {
    setRevealed(true)
    ping([349.23, 440.00, 523.25, 698.46])
  }

  useEffect(() => {
    // No-WebGL fallback: render the same card as a flat image
    if (scene !== 'invitation' || webgl) return
    let live = true
    const make = () => {
      const c = document.createElement('canvas')
      drawFront(c, name || EVENT.fallbackGuestName, 1000)
      if (live) setFallbackImg(c.toDataURL('image/png'))
    }
    make()
    loadFonts().then(make)
    setRevealed(true)
    return () => { live = false }
  }, [scene, webgl, name])

  const onNameSubmit = (n) => {
    setName(n)
    ping()
    // Track senior visit in PostgreSQL
    trackVisit(n).then((id) => setVisitId(id))
    go('reveal')
  }

  const download = async () => {
    // Record download/save action in PostgreSQL
    trackSave(visitId, name || EVENT.fallbackGuestName)

    await loadFonts()
    const c = document.createElement('canvas')
    drawFront(c, name || EVENT.fallbackGuestName, 1400)
    c.toBlob((b) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(b)
      const safeName = (name || 'guest').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      a.download = `nexora-halloween-invitation-${safeName}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    })
  }

  // If viewing the Organizer Dashboard Panel
  if (view === 'dashboard') {
    return <DashboardPanel onBack={() => navigateTo('invitation')} />
  }

  const mode = scene === 'reveal' ? 'converge' : revealed ? 'burst' : 'drift'

  return (
    <>
      {/* 3D WebGL Scene or Fallback Background */}
      {webgl ? (
        <Stage
          scene={scene}
          mode={mode}
          name={name || EVENT.fallbackGuestName}
          runKey={runKey}
          skipKey={skipKey}
          onRevealed={onRevealed}
        />
      ) : (
        <div className="fallback-bg" />
      )}

      {/* Background Halloween Atmosphere positioned safely behind card */}
      <HalloweenAtmosphere scene={scene} />

      {/* Top Halloween Navigation Header */}
      <HalloweenHeader
        sound={sound}
        onToggleSound={() => setSound((s) => { if (!s) chime([440.00]); return !s })}
        onOpenDashboard={() => navigateTo('dashboard')}
        scene={scene}
      />

      {/* Scene Transitions */}
      {scene === 'entrance' && (
        <Entrance onBegin={() => { ping(); go('name') }} />
      )}

      {scene === 'name' && <NameEntry onSubmit={onNameSubmit} />}

      {scene === 'reveal' && (
        <NameReveal name={name || EVENT.fallbackGuestName} onDone={() => go('invitation')} />
      )}

      {scene === 'invitation' && !webgl && fallbackImg && (
        <img
          className="fallback-card"
          src={fallbackImg}
          alt={`Halloween Premiere Invitation for ${name || EVENT.fallbackGuestName}`}
        />
      )}

      {scene === 'invitation' && (
        <div className="sr">
          <p>{EVENT.presenter} {EVENT.presentsLabel}</p>
          <h2>{EVENT.heading}</h2>
          <p>Prepared for: {name || EVENT.fallbackGuestName}</p>
          <p>Event: {EVENT.name}</p>
          <p>{EVENT.tagline} {EVENT.audience}</p>
          <p>Date: {EVENT.displayDate} ({EVENT.date}). Time: {EVENT.time}. Venue: {EVENT.venue}.</p>
          <p>{EVENT.closing.join(' ')}</p>
        </div>
      )}

      {/* Toolbar on invitation revealed */}
      {scene === 'invitation' && revealed && (
        <div className="toolbar">
          <button
            className="btn small primary-cta hw-cta-button"
            onClick={download}
            title="Save your personalized invitation card as a high-resolution PNG"
          >
            <Download size={15} />
            <span className="hw-cta-text">SAVE INVITATION</span>
            <span aria-hidden="true">🎃</span>
          </button>
        </div>
      )}

      <div className="veil" ref={veil} />
    </>
  )
}
