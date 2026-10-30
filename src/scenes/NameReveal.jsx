import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"

export default function NameReveal({ name, onDone }) {
  const root = useRef(), done = useRef(onDone)
  done.current = onDone

  useLayoutEffect(() => {
    const c = gsap.context(() => {
      gsap.timeline({ onComplete: () => done.current() })
        .from(".reveal-halo", { opacity: 0, scale: 0.5, duration: 1.5, ease: "power2.out" })
        .from(".beam", { scaleY: 0, opacity: 0, duration: 1.2, ease: "power2.out" }, "-=1.2")
        .from(".reveal-tag", { opacity: 0, y: -12, duration: 1.0, ease: "power2.out" }, "-=0.6")
        .from(".for", { opacity: 0, letterSpacing: "0.8em", duration: 1.4, ease: "power2.out" }, "-=0.4")
        .from(".who-wrap", { opacity: 0, scale: 0.9, filter: "blur(18px)", duration: 1.4, ease: "power3.out" }, "-=0.7")
        .fromTo(".who", { backgroundPosition: "140% 0" }, { backgroundPosition: "-40% 0", duration: 1.6, ease: "power1.inOut" }, "-=0.6")
        .to(".beam", { scaleX: 250, opacity: 0, duration: 0.85, ease: "power2.in" }, "+=0.5")
        .to([".reveal-tag", ".for", ".who-wrap", ".reveal-halo"], { opacity: 0, duration: 0.65 }, "<")
    }, root)
    return () => c.revert()
  }, [])

  return (
    <section className="scene hw-reveal-scene" ref={root} aria-live="polite">
      {/* Mystical Moon & Fog Halo behind reveal */}
      <div className="reveal-halo" aria-hidden="true" />

      {/* Atmospheric Vertical Light Beam */}
      <div className="beamwrap" aria-hidden="true">
        <div className="beam" />
      </div>

      {/* Header Tag */}
      <div className="reveal-tag">
        <span className="hw-tag-flank">🦇</span>
        <span>SECRET HALLOWEEN PREMIERE</span>
        <span className="hw-tag-flank">🎃</span>
      </div>

      <p className="for">PREPARED EXCLUSIVELY FOR</p>

      {/* Senior Guest's Name with Halloween Emblems */}
      <div className="who-wrap">
        <span className="who-crest-left" aria-hidden="true">🌙</span>
        <h1 className="who">{name.toUpperCase()}</h1>
        <span className="who-crest-right" aria-hidden="true">🎃</span>
      </div>
    </section>
  )
}
