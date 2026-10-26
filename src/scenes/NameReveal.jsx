import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"

export default function NameReveal({ name, onDone }) {
  const root = useRef(), done = useRef(onDone)
  done.current = onDone
  useLayoutEffect(() => {
    const c = gsap.context(() => {
      gsap.timeline({ onComplete: () => done.current() })
        .from(".beam", { scaleY: 0, opacity: 0, duration: 1.2, ease: "power2.out" })
        .from(".for", { opacity: 0, letterSpacing: "1em", duration: 1.6, ease: "power2.out" }, "-=0.3")
        .from(".who", { opacity: 0, scale: 0.92, filter: "blur(12px)", duration: 1.4, ease: "power3.out" }, "-=0.6")
        .fromTo(".who", { backgroundPosition: "130% 0" }, { backgroundPosition: "-30% 0", duration: 1.4, ease: "power1.inOut" }, "-=0.5")
        .to(".beam", { scaleX: 200, opacity: 0, duration: 0.8, ease: "power2.in" }, "+=0.3")
        .to([".for", ".who"], { opacity: 0, duration: 0.6 }, "<")
    }, root)
    return () => c.revert()
  }, [])
  return (
    <section className="scene" ref={root} aria-live="polite">
      <div className="beamwrap"><div className="beam" /></div>
      <p className="for">PREPARED EXCLUSIVELY FOR</p>
      <p className="who">{name.toUpperCase()}</p>
    </section>
  )
}
