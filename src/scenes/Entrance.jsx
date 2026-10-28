import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { EVENT } from "../config/event"

export default function Entrance({ onBegin }) {
  const root = useRef()
  useLayoutEffect(() => {
    const c = gsap.context(() => {
      gsap.timeline({ delay: 0.6 })
        .from(".kicker", { opacity: 0, y: 16, letterSpacing: "0.5em", duration: 1.4, ease: "power2.out" })
        .from(".l1", { opacity: 0, y: 26, scale: 0.95, duration: 1.6, ease: "power3.out" }, "-=1.0")
        .from(".date-badge", { opacity: 0, y: 14, duration: 1.2, ease: "power2.out" }, "-=1.1")
        .from(".sub", { opacity: 0, y: 14, duration: 1.2, ease: "power2.out" }, "-=0.9")
        .from(".cta", { opacity: 0, y: 14, duration: 1.0, ease: "power2.out" }, "-=0.7")
    }, root)
    return () => c.revert()
  }, [])
  return (
    <section className="scene entrance" ref={root}>
      <p className="kicker">A PRIVATE PREMIERE FOR SENIORS</p>
      <h1 className="l1">{EVENT.name}</h1>
      <div className="date-badge">
        <span className="date-dot" />
        <span className="date-text">1 November 2026</span>
      </div>
      <p className="sub">{EVENT.tagline} {EVENT.audience}</p>
      <button className="btn cta" onClick={onBegin}>DISCOVER YOUR INVITATION</button>
    </section>
  )
}

