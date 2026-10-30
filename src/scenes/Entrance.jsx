import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { Calendar, Clock, MapPin, ArrowRight, Sparkles } from "lucide-react"
import { EVENT } from "../config/event"

export default function Entrance({ onBegin }) {
  const root = useRef()

  useLayoutEffect(() => {
    const c = gsap.context(() => {
      gsap.timeline({ delay: 0.3 })
        .from(".hero-halo", { opacity: 0, scale: 0.7, duration: 1.8, ease: "power2.out" })
        .from(".kicker", { opacity: 0, y: 16, letterSpacing: "0.5em", duration: 1.2, ease: "power2.out" }, "-=1.4")
        .from(".l1", { opacity: 0, y: 26, scale: 0.92, duration: 1.5, ease: "power3.out" }, "-=1.0")
        .from(".event-pills-row", { opacity: 0, y: 16, duration: 1.1, ease: "power2.out" }, "-=0.9")
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

        <p className="kicker">
          <span className="kicker-ghost">👻</span>
          <span>A PRIVATE PREMIERE FOR SENIORS</span>
          <span className="kicker-bat">🦇</span>
        </p>

        <h1 className="l1" data-text={EVENT.name}>{EVENT.name}</h1>

        {/* Event Key Badges: Date, Time, Venue */}
        <div className="event-pills-row">
          <div className="event-pill hw-pill-date" title="Event Date: 01 November 2026">
            <span className="hw-pill-emoji" aria-hidden="true">🎃</span>
            <Calendar size={13} className="pill-icon text-orange" />
            <span className="pill-text">{EVENT.displayDate}</span>
          </div>

          <div className="event-pill hw-pill-time" title="Event Time: 9:00 AM">
            <span className="hw-pill-emoji" aria-hidden="true">🌙</span>
            <Clock size={13} className="pill-icon text-amber" />
            <span className="pill-text">{EVENT.time}</span>
          </div>

          <div className="event-pill hw-pill-venue" title="Venue: Secret Premiere">
            <span className="hw-pill-emoji" aria-hidden="true">🏰</span>
            <MapPin size={13} className="pill-icon text-purple" />
            <span className="pill-text">Secret Premiere</span>
          </div>
        </div>

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
