import { useEffect, useLayoutEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ArrowRight } from "lucide-react"
import { EVENT } from "../config/event"

export default function NameEntry({ onSubmit }) {
  const [v, setV] = useState("")
  const [err, setErr] = useState("")
  const root = useRef()
  const inp = useRef()

  useLayoutEffect(() => {
    const c = gsap.context(() => {
      gsap.timeline({ delay: 0.2 })
        .from(".hw-form-card", { opacity: 0, y: 20, scale: 0.97, duration: 0.9, ease: "power3.out" })
        .from(".fade", { opacity: 0, y: 12, duration: 0.8, stagger: 0.12, ease: "power2.out" }, "-=0.6")
    }, root)
    return () => c.revert()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => inp.current?.focus({ preventScroll: true }), 900)
    return () => clearTimeout(t)
  }, [])

  const submit = (e) => {
    e.preventDefault()
    const n = v.trim().replace(/\s+/g, " ")
    if (!n) {
      setErr("Please reveal your name to claim your invitation.")
      inp.current?.focus()
      return
    }
    onSubmit(n)
  }

  return (
    <section className="scene" ref={root}>
      <div className="hw-form-card">
        {/* Ornate Spiderweb Corner Accents */}
        <span className="hw-card-web hw-card-web-tl" aria-hidden="true">🕸️</span>
        <span className="hw-card-web hw-card-web-tr" aria-hidden="true">🕸️</span>

        <form onSubmit={submit} noValidate className="nameform">
          <p className="kicker fade">
            <span>🎃</span>
            <span>{EVENT.name} • {EVENT.displayDate} • {EVENT.time}</span>
            <span>🌙</span>
          </p>

          <h2 className="fade">BEFORE WE REVEAL YOUR INVITATION...</h2>
          <p className="sub fade">
            Every legend begins with a name. Speak yours to enter the shadows.
          </p>

          {/* Interactive Spooky Input Field */}
          <div className="hw-input-wrap fade">
            <span className="hw-input-icon" aria-hidden="true">👻</span>
            <input
              ref={inp}
              className="field hw-input-field"
              value={v}
              maxLength={26}
              autoComplete="given-name"
              placeholder="Enter your name, mortal..."
              aria-label="Your name"
              aria-invalid={!!err}
              onChange={(e) => { setV(e.target.value); setErr("") }}
            />
          </div>

          <p className="err" role="alert">{err}</p>

          <button
            type="submit"
            className="btn cta hw-cta-button enter-shadows-btn"
            aria-label="Enter the shadows"
          >
            <span className="hw-cta-glow" aria-hidden="true" />
            <span className="hw-cta-text">ENTER THE SHADOWS</span>
            <span className="hw-cta-pumpkin" aria-hidden="true">🎃</span>
            <ArrowRight size={17} className="hw-cta-arrow" />
          </button>
        </form>
      </div>
    </section>
  )
}
