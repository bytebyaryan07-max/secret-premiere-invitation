import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import gsap from "gsap"
import { drawFront, drawBack, loadFonts } from "../lib/drawInvitation"

const GOLD = "#d4af37"

function Env() { // soft studio reflections so the gold looks metallic
  const { gl, scene } = useThree()
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl)
    const tex = pm.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = tex
    return () => { scene.environment = null; tex.dispose(); pm.dispose() }
  }, [gl, scene])
  return null
}

function Rig() { // mouse / touch parallax
  useFrame(({ camera, pointer }, dt) => {
    const k = Math.min(1, dt * 2)
    camera.position.x += (pointer.x * 0.5 - camera.position.x) * k
    camera.position.y += (pointer.y * 0.35 - camera.position.y) * k
    camera.lookAt(0, 0, 0)
  })
  return null
}

function Glow() { // the distant golden light
  const tex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 128
    const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, "rgba(255,214,120,.9)"); g.addColorStop(1, "rgba(255,214,120,0)")
    x.fillStyle = g; x.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])
  return (
    <sprite position={[0, 1.2, -14]} scale={[18, 18, 1]}>
      <spriteMaterial map={tex} transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
    </sprite>
  )
}

function Particles({ mode, count }) {
  const geo = useRef(), prev = useRef("drift"), burstT = useRef(99)
  const data = useMemo(() => {
    const home = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 2.5 + Math.random() * 9, a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1)
      home[i * 3] = r * Math.sin(b) * Math.cos(a)
      home[i * 3 + 1] = r * Math.sin(b) * Math.sin(a) * 0.7
      home[i * 3 + 2] = r * Math.cos(b) - 3
    }
    return { home, cur: home.slice(), vel: new Float32Array(count * 3) }
  }, [count])

  useFrame((st, rawDt) => {
    const dt = Math.min(rawDt, 0.05), t = st.clock.elapsedTime
    const { home, cur, vel } = data
    if (prev.current !== mode) {
      if (mode === "burst") {
        for (let i = 0; i < count; i++) {
          const a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1), sp = 2 + Math.random() * 5
          vel[i * 3] = sp * Math.sin(b) * Math.cos(a); vel[i * 3 + 1] = sp * Math.sin(b) * Math.sin(a); vel[i * 3 + 2] = sp * Math.cos(b)
          cur[i * 3] = cur[i * 3 + 1] = cur[i * 3 + 2] = 0
        }
        burstT.current = 0
      }
      prev.current = mode
    }
    burstT.current += dt
    const bursting = mode === "burst" && burstT.current < 2.4
    const k = Math.min(1, dt * (mode === "converge" ? 1.6 : 0.6))
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < 3; j++) {
        const n = i * 3 + j
        if (bursting) { cur[n] += vel[n] * dt; vel[n] *= 0.985 }
        else {
          const target = mode === "converge" ? home[n] * 0.04 : home[n] + Math.sin(t * 0.20 + i * 1.7 + j) * 0.15
          cur[n] += (target - cur[n]) * k
        }
      }
    }
    geo.current.attributes.position.needsUpdate = true
  })
  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geo}><bufferAttribute attach="attributes-position" array={data.cur} count={count} itemSize={3} /></bufferGeometry>
      <pointsMaterial color="#e8c766" size={0.045} sizeAttenuation transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

function Emblem({ scene }) { // the one hero object: a floating golden armillary emblem
  const g = useRef(), inner = useRef(), r1 = useRef(), r2 = useRef(), r3 = useRef()
  const mobile = typeof window !== 'undefined' && window.matchMedia("(max-width: 768px)").matches
  const entranceY = mobile ? 1.45 : 1.35
  const entranceScale = mobile ? 0.78 : 0.92

  useFrame(({ clock }, dt) => {
    r1.current.rotation.x += dt * 0.4; r1.current.rotation.y += dt * 0.25
    r2.current.rotation.y -= dt * 0.35; r2.current.rotation.z += dt * 0.2
    r3.current.rotation.x -= dt * 0.2; r3.current.rotation.z -= dt * 0.3
    inner.current.rotation.y += dt * 0.5
    g.current.children[0].position.y = Math.sin(clock.elapsedTime * 0.8) * 0.1
  })
  useEffect(() => {
    const t = { entrance: [entranceScale, entranceY, 0], name: [0.5, 2.1, -4], reveal: [0.001, 0, -2], invitation: [0.001, 0, -6] }[scene]
    const d = scene === "entrance" ? 2.4 : 1.6, delay = scene === "entrance" ? 0.3 : 0
    gsap.to(g.current.scale, { x: t[0], y: t[0], z: t[0], duration: d, delay, ease: "power3.inOut" })
    gsap.to(g.current.position, { y: t[1], z: t[2], duration: d, delay, ease: "power3.inOut" })
  }, [scene, entranceScale, entranceY])
  const m = <meshStandardMaterial color={GOLD} metalness={1} roughness={0.22} envMapIntensity={1.5} />
  return (
    <group ref={g} scale={0.001} position={[0, entranceY, 0]}>
      <group>
        <mesh ref={r1}><torusGeometry args={[1.15, 0.035, 24, 120]} />{m}</mesh>
        <mesh ref={r2}><torusGeometry args={[0.9, 0.03, 24, 100]} />{m}</mesh>
        <mesh ref={r3}><torusGeometry args={[0.65, 0.025, 24, 90]} />{m}</mesh>
        <mesh ref={inner}><octahedronGeometry args={[0.38, 0]} />{m}</mesh>
      </group>
    </group>
  )
}

function Card({ scene, name, runKey, skipKey, onRevealed }) {
  const tilt = useRef(), flip = useRef(), light = useRef(), tl = useRef(), cb = useRef(onRevealed)
  cb.current = onRevealed
  const v = useThree((s) => s.viewport)
  const fit = Math.min(1, v.width / 3.6, v.height / 6.2)

  const res = useMemo(() => {
    const fc = document.createElement("canvas"), bc = document.createElement("canvas")
    const mk = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t }
    const ft = mk(fc), bt = mk(bc)
    const edge = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.25 })
    const face = (map) => new THREE.MeshStandardMaterial({ map, metalness: 0.3, roughness: 0.4, envMapIntensity: 0.6 })
    return { fc, bc, ft, bt, mats: [edge, edge, edge, edge, face(ft), face(bt)] }
  }, [])

  useEffect(() => {
    let live = true
    const paint = () => { if (!live) return; drawFront(res.fc, name); drawBack(res.bc); res.ft.needsUpdate = res.bt.needsUpdate = true }
    paint(); loadFonts().then(paint)
    return () => { live = false }
  }, [name, res])

  useEffect(() => {
    if (scene !== "invitation") { flip.current.visible = false; return }
    const f = flip.current, L = light.current
    f.visible = true; f.position.set(0, 0, -9); f.rotation.set(0, Math.PI + 0.9, 0); f.scale.setScalar(0.7)
    L.intensity = 0; L.position.set(3, 3, 4)
    const t = gsap.timeline()
    t.to(L, { intensity: 40, duration: 2, ease: "power2.out" }, 0)
      .to(f.position, { z: 0, duration: 2.8, ease: "power3.out" }, 0.3)
      .to(f.scale, { x: 1, y: 1, z: 1, duration: 2.8, ease: "power3.out" }, 0.3)
      .to(f.rotation, { y: Math.PI, duration: 2.8, ease: "power2.out" }, 0.3)
      .to(f.rotation, { y: 0, duration: 1.7, ease: "power3.inOut" }, "+=0.3")
      .to(f.position, { y: 0.25, duration: 0.85, yoyo: true, repeat: 1, ease: "sine.inOut" }, "<")
      .to(L.position, { x: -3, duration: 1.7, ease: "sine.inOut" }, "<")
      .add(() => cb.current(), "-=0.5")
    tl.current = t
    return () => t.kill()
  }, [scene, runKey])

  useEffect(() => { if (skipKey) tl.current?.progress(1, true) }, [skipKey])

  useFrame(({ pointer, clock }, dt) => {
    const k = Math.min(1, dt * 3)
    tilt.current.rotation.y += (pointer.x * 0.35 - tilt.current.rotation.y) * k
    tilt.current.rotation.x += (-pointer.y * 0.25 - tilt.current.rotation.x) * k
    tilt.current.position.y = Math.sin(clock.elapsedTime * 0.9) * 0.05
  })

  return (
    <>
      <pointLight ref={light} color="#ffd98a" intensity={0} />
      <pointLight position={[-3, -2, 3]} color="#ffffff" intensity={12} />
      <group ref={tilt} scale={fit}>
        <group ref={flip} visible={false}>
          <mesh material={res.mats}><boxGeometry args={[3, 4.2, 0.07]} /></mesh>
        </group>
      </group>
    </>
  )
}

export default function Stage({ scene, mode, name, runKey, skipKey, onRevealed }) {
  const mobile = window.matchMedia("(max-width: 768px)").matches
  return (
    <Canvas className="stage" dpr={[1, mobile ? 1.5 : 2]} camera={{ position: [0, 0, 7], fov: 45 }}
      gl={{ antialias: !mobile, powerPreference: "high-performance" }}>
      <color attach="background" args={["#030307"]} />
      <fog attach="fog" args={["#030307", 8, 22]} />
      <Env /><Rig /><Glow />
      <ambientLight intensity={0.15} />
      <pointLight position={[3, 2, 5]} intensity={20} color="#ffd98a" />
      <Particles mode={mode} count={mobile ? 600 : 1400} />
      <Emblem scene={scene} />
      <Card scene={scene} name={name} runKey={runKey} skipKey={skipKey} onRevealed={onRevealed} />
    </Canvas>
  )
}
