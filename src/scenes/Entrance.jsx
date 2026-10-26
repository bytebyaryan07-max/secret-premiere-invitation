import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"

export default function Entrance({ onBegin }) {
  const root = useRef()
  useLayoutEffect(() => {
    const c = gsap.context(() => {
      gsap.timeline({ delay: 0.8 })
        .from(".l1", { opacity: 0, y: 30, letterSpacing: "0.45em", duration: 2, ease: "power3.out" })
        .from(".sub", { opacity: 0, y: 16, duration: 1.4, ease: "power2.out" }, "-=1.1")
        .from(".cta", { opacity: 0, y: 16, duration: 1.2, ease: "power2.out" }, "-=0.8")
    }, root)
    return () => c.revert()
  }, [])
  return (
    <section className="scene entrance" ref={root}>
      <h1 className="l1">NOT EVERY INVITATION IS ORDINARY.</h1>
      <p className="sub">Something extraordinary is waiting for you.</p>
      <button className="btn cta" onClick={onBegin}>DISCOVER YOUR INVITATION</button>
    </section>
  )
}
