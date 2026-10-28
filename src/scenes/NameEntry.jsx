import { useEffect, useLayoutEffect, useRef, useState } from "react"
import gsap from "gsap"

export default function NameEntry({ onSubmit }) {
  const [v, setV] = useState(""), [err, setErr] = useState("")
  const root = useRef(), inp = useRef()
  useLayoutEffect(() => {
    const c = gsap.context(() => {
      gsap.from(".fade", { opacity: 0, y: 20, duration: 1.2, stagger: 0.25, ease: "power2.out", delay: 0.5 })
    }, root)
    return () => c.revert()
  }, [])
  useEffect(() => {
    const t = setTimeout(() => inp.current?.focus({ preventScroll: true }), 1400)
    return () => clearTimeout(t)
  }, [])
  const submit = (e) => {
    e.preventDefault()
    const n = v.trim().replace(/\s+/g, " ")
    if (!n) { setErr("Please tell us your name to continue."); inp.current.focus(); return }
    onSubmit(n)
  }
  return (
    <section className="scene" ref={root}>
      <form onSubmit={submit} noValidate className="nameform">
        <p className="kicker fade">NEXORA • 1 NOVEMBER 2026</p>
        <h2 className="fade">BEFORE WE REVEAL YOUR INVITATION...</h2>
        <p className="sub fade">Every great story begins with a name.</p>
        <input ref={inp} className="field fade" value={v} maxLength={24} autoComplete="given-name"
          placeholder="Enter your name" aria-label="Your name" aria-invalid={!!err}
          onChange={(e) => { setV(e.target.value); setErr("") }} />
        <p className="err" role="alert">{err}</p>
        <button type="submit" className="btn fade">UNLOCK MY INVITATION</button>
      </form>
    </section>
  )
}
