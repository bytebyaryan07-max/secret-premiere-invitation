import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { ArrowRight } from "lucide-react"
import { EVENT } from "../config/event"

export default function Entrance({ onBegin }) {
  const root = useRef()

  useLayoutEffect(() => {
    const c = gsap.context(() => {
      gsap.timeline({ delay: 0.3 })
        .from(".hero-halo", { opacity: 0, scale: 0.7, duration: 1.8, ease: "power2.out" })
        .from(".kicker-presenter", { opacity: 0, y: 12, duration: 1.0, ease: "power2.out" }, "-=1.5")
        .from(".kicker", { opacity: 0, y: 16, letterSpacing: "0.5em", duration: 1.2, ease: "power2.out" }, "-=1.2")
        .from(".l1", { opacity: 0, y: 26, scale: 0.92, duration: 1.5, ease: "power3.out" }, "-=1.0")
        .from(".sub", { opacity: 0, y: 14, duration: 1.1, ease: "power2.out" }, "-=0.8")
        .from(".hero-actions", { opacity: 0, y: 16, duration: 1.0, ease: "power2.out" }, "-=0.7")
    }, root)
    return () => c.revert()
  }, [])

  return (
    <div className="scene entrance" ref={root}>
      {/* Hero Content Wrapper */}
      <section className="entrance-hero">
        {/* Glowing Harvest Moon / Mansion Halo Aura behind heading */}
        <div className="hero-halo" aria-hidden="true" />

        <p className="kicker-presenter" style={{ fontFamily: 'var(--heading)', fontSize: 'clamp(0.68rem, 1.5vw, 0.8rem)', letterSpacing: '0.4em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '6px', opacity: 0.9 }}>
          {EVENT.presenter} {EVENT.presentsLabel}
        </p>

        <p className="kicker">
          <span className="kicker-ghost">👻</span>
          <span>A PRIVATE PREMIERE FOR SENIORS</span>
          <span className="kicker-bat">🦇</span>
        </p>

        <h1 className="l1" data-text={EVENT.name}>{EVENT.name}</h1>

        <p className="sub">{EVENT.tagline} {EVENT.audience}</p>

        {/* Hero Actions with Premium Halloween CTA Button */}
        <div className="hero-actions">
          <button className="btn cta hw-cta-button" onClick={onBegin}>
            <span className="hw-cta-glow" aria-hidden="true" />
            <span className="hw-cta-particles" aria-hidden="true" />
            <span className="hw-cta-text">DISCOVER YOUR INVITATION</span>
            <span className="hw-cta-pumpkin" aria-hidden="true">🎃</span>
            <ArrowRight size={17} className="hw-cta-arrow" />
          </button>
        </div>
      </section>
    </div>
  )
}
