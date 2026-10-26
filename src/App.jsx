import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { Volume2, VolumeX, RotateCcw, Download, Users } from 'lucide-react'
import Stage from './components/Stage'
import Entrance from './scenes/Entrance'
import NameEntry from './scenes/NameEntry'
import NameReveal from './scenes/NameReveal'
import AdminDashboard from './components/AdminDashboard'
import { EVENT } from './config/event'
import { drawFront, loadFonts } from './lib/drawInvitation'
import { chime } from './lib/sound'
import { trackVisit, trackSave } from './lib/api'

const hasWebGL = () => {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
}

export default function App() {
  const [scene, setScene] = useState('entrance')
  const [name, setName] = useState('')
  const [visitId, setVisitId] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [runKey, setRunKey] = useState(0)
  const [skipKey, setSkipKey] = useState(0)
  const [sound, setSound] = useState(false)
  const [fallbackImg, setFallbackImg] = useState('')
  const veil = useRef(), soundRef = useRef(false)
  const webgl = useMemo(hasWebGL, [])
  soundRef.current = sound
  const ping = (f) => soundRef.current && chime(f)

  useEffect(() => { // respect reduced motion: make every GSAP animation near-instant
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.globalTimeline.timeScale(8)
  }, [])

  const go = (next) => {
    gsap.timeline()
      .to(veil.current, { opacity: 1, duration: 0.7, ease: 'power2.in' })
      .add(() => { setRevealed(false); setScene(next) })
      .to(veil.current, { opacity: 0, duration: 0.9, ease: 'power2.out' })
  }

  const onRevealed = () => { setRevealed(true); ping([523.25, 659.25, 783.99, 1046.5]) }

  useEffect(() => { // no-WebGL fallback: render the same card as a flat image
    if (scene !== 'invitation' || webgl) return
    let live = true
    const make = () => { const c = document.createElement('canvas'); drawFront(c, name, 900); if (live) setFallbackImg(c.toDataURL('image/png')) }
    make(); loadFonts().then(make); setRevealed(true)
    return () => { live = false }
  }, [scene, webgl, name])

  const onNameSubmit = (n) => {
    setName(n)
    ping()
    // Track senior visit in PostgreSQL
    trackVisit(n).then((id) => setVisitId(id))
    go('reveal')
  }

  const skip = () => {
    if (scene === 'invitation') { setSkipKey((k) => k + 1); setRevealed(true) }
    else {
      const fallback = name || EVENT.fallbackGuestName
      setName(fallback)
      trackVisit(fallback).then((id) => setVisitId(id))
      go('invitation')
    }
  }
  const replay = () => { setRevealed(false); setRunKey((k) => k + 1) }
  const download = async () => {
    // Record download/save action in PostgreSQL
    trackSave(visitId, name)

    await loadFonts()
    const c = document.createElement('canvas'); drawFront(c, name, 1200)
    c.toBlob((b) => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(b)
      a.download = 'my-invitation.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    })
  }

  const mode = scene === 'reveal' ? 'converge' : revealed ? 'burst' : 'drift'

  return (
    <>
      {webgl ? <Stage scene={scene} mode={mode} name={name || EVENT.fallbackGuestName} runKey={runKey} skipKey={skipKey} onRevealed={onRevealed} />
             : <div className="fallback-bg" />}

      {scene === 'entrance' && <Entrance onBegin={() => { ping(); go('name') }} />}
      {scene === 'name' && <NameEntry onSubmit={onNameSubmit} />}
      {scene === 'reveal' && <NameReveal name={name} onDone={() => go('invitation')} />}

      {scene === 'invitation' && !webgl && fallbackImg && <img className="fallback-card" src={fallbackImg} alt={`Invitation for ${name}`} />}
      {scene === 'invitation' && (
        <div className="sr">
          <h2>{EVENT.heading}</h2><p>{name}</p><p>{EVENT.name}</p><p>{EVENT.tagline} {EVENT.audience}</p>
          <p>Date: {EVENT.date}. Time: {EVENT.time}. Venue: {EVENT.venue}.</p><p>{EVENT.closing.join(' ')}</p>
        </div>
      )}

      {/* Admin Dashboard Trigger */}
      <button className="icon admin-btn" onClick={() => setShowAdmin(true)}
        title="Visitor Analytics & Saves (PostgreSQL)" aria-label="Open visitor analytics">
        <Users size={18} />
      </button>

      {/* Sound toggle */}
      <button className="icon top" onClick={() => { setSound((s) => { if (!s) chime([659.25]); return !s }) }}
        aria-pressed={sound} aria-label={sound ? 'Turn sound off' : 'Turn sound on'}>
        {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      <div className="toolbar">
        {scene === 'invitation' && revealed ? (
          <>
            <button className="btn small" onClick={replay}><RotateCcw size={14} /> REPLAY</button>
            <button className="btn small" onClick={download}><Download size={14} /> SAVE</button>
          </>
        ) : !(scene === 'invitation' && !webgl) && (
          <button className="link" onClick={skip}>Skip animation</button>
        )}
      </div>

      {/* Analytics Modal */}
      <AdminDashboard isOpen={showAdmin} onClose={() => setShowAdmin(false)} />

      <div className="veil" ref={veil} />
    </>
  )
}
