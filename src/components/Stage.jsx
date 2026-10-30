import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import gsap from "gsap"
import { drawFront, drawBack, loadFonts } from "../lib/drawInvitation"

const HALLOWEEN_ACCENT = "#f58a24" // pumpkin orange (#F58A24)
const HALLOWEEN_CRIMSON = "#650b19" // deep blood red (#650B19)
const HALLOWEEN_BORDER = "#8a3515" // dark orange border (#8A3515)

function Env() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl)
    const tex = pm.fromScene(new RoomEnvironment(), 0.02).texture
    scene.environment = tex
    return () => { scene.environment = null; tex.dispose(); pm.dispose() }
  }, [gl, scene])
  return null
}

function Rig() {
  useFrame(({ camera, pointer }, dt) => {
    const k = Math.min(1, dt * 2)
    camera.position.x += (pointer.x * 0.4 - camera.position.x) * k
    camera.position.y += (pointer.y * 0.25 - camera.position.y) * k
    camera.lookAt(0, 0, 0)
  })
  return null
}

// Distant harvest moon & atmospheric glow (hidden during invitation view to prevent any washing out)
function Glow({ scene }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas")
    c.width = c.height = 256
    const x = c.getContext("2d")
    const g = x.createRadialGradient(128, 128, 12, 128, 128, 128)
    g.addColorStop(0, "rgba(255, 230, 160, 0.8)")
    g.addColorStop(0.3, "rgba(255, 130, 20, 0.4)")
    g.addColorStop(0.7, "rgba(100, 20, 150, 0.15)")
    g.addColorStop(1, "rgba(10, 3, 20, 0)")
    x.fillStyle = g
    x.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(c)
  }, [])

  // When card is revealed, disable background sprite glow completely so card remains 100% solid and dark
  const opacity = scene === "invitation" ? 0 : 0.2

  return (
    <sprite position={[0, 1.4, -14]} scale={[16, 16, 1]}>
      <spriteMaterial
        map={tex}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </sprite>
  )
}

// Multi-hued peripheral Halloween embers and spectral motes
function Particles({ mode, scene, count }) {
  const geo = useRef(), prev = useRef("drift"), burstT = useRef(99)

  const data = useMemo(() => {
    const home = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    // Palette: Controlled orange, amber, crimson
    const palette = [
      [1.0, 0.46, 0.1],  // pumpkin orange
      [0.66, 0.29, 0.1],  // dark orange #A94B19
      [1.0, 0.71, 0.18], // glowing amber
      [0.4, 0.04, 0.1]   // deep blood red
    ]

    for (let i = 0; i < count; i++) {
      // Kept around periphery (radius >= 3.4) and behind z=0 so particles don't cover card text
      const r = 3.4 + Math.random() * 8.5
      const a = Math.random() * 6.283
      const b = Math.acos(2 * Math.random() - 1)
      home[i * 3] = r * Math.sin(b) * Math.cos(a)
      home[i * 3 + 1] = r * Math.sin(b) * Math.sin(a) * 0.75
      home[i * 3 + 2] = -1.2 - Math.abs(r * Math.cos(b)) // Kept safely behind card at negative Z

      const col = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = col[0]
      colors[i * 3 + 1] = col[1]
      colors[i * 3 + 2] = col[2]
    }
    return { home, cur: home.slice(), vel: new Float32Array(count * 3), colors }
  }, [count])

  useFrame((st, rawDt) => {
    const dt = Math.min(rawDt, 0.05), t = st.clock.elapsedTime
    const { home, cur, vel } = data
    if (prev.current !== mode) {
      if (mode === "burst") {
        for (let i = 0; i < count; i++) {
          const a = Math.random() * 6.283, sp = 2.0 + Math.random() * 4.5
          vel[i * 3] = sp * Math.cos(a)
          vel[i * 3 + 1] = sp * Math.sin(a) * 0.75
          vel[i * 3 + 2] = -0.5 - Math.random() * 2.5
          cur[i * 3] = Math.cos(a) * 2.4
          cur[i * 3 + 1] = Math.sin(a) * 2.8
          cur[i * 3 + 2] = -1.0
        }
        burstT.current = 0
      }
      prev.current = mode
    }
    burstT.current += dt
    const bursting = mode === "burst" && burstT.current < 2.0
    const k = Math.min(1, dt * (mode === "converge" ? 1.6 : 0.6))
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < 3; j++) {
        const n = i * 3 + j
        if (bursting) { cur[n] += vel[n] * dt; vel[n] *= 0.985 }
        else {
          const target = mode === "converge" ? home[n] * 0.04 : home[n] + Math.sin(t * 0.22 + i * 1.7 + j) * 0.14
          cur[n] += (target - cur[n]) * k
        }
      }
      // When viewing the invitation card, guarantee particles never fly in front of card
      if (scene === "invitation" && cur[i * 3 + 2] > -0.6) {
        cur[i * 3 + 2] = -0.8 - Math.abs(cur[i * 3 + 2])
      }
    }
    geo.current.attributes.position.needsUpdate = true
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geo}>
        <bufferAttribute attach="attributes-position" array={data.cur} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={data.colors} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.044}
        sizeAttenuation
        transparent
        opacity={0.65}
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Ornate Halloween talisman emblem with rotating armillary rings
function Emblem({ scene }) {
  const g = useRef(), inner = useRef(), r1 = useRef(), r2 = useRef(), r3 = useRef()
  const mobile = typeof window !== 'undefined' && window.matchMedia("(max-width: 768px)").matches
  const entranceY = mobile ? 1.45 : 1.35
  const entranceScale = mobile ? 0.78 : 0.92

  useFrame(({ clock }, dt) => {
    r1.current.rotation.x += dt * 0.38
    r1.current.rotation.y += dt * 0.22
    r2.current.rotation.y -= dt * 0.32
    r2.current.rotation.z += dt * 0.18
    r3.current.rotation.x -= dt * 0.18
    r3.current.rotation.z -= dt * 0.28
    inner.current.rotation.y += dt * 0.55
    inner.current.rotation.x += dt * 0.3
    g.current.children[0].position.y = Math.sin(clock.elapsedTime * 0.8) * 0.12
  })

  useEffect(() => {
    const t = { entrance: [entranceScale, entranceY, 0], name: [0.5, 2.1, -4], reveal: [0.001, 0, -2], invitation: [0.001, 0, -6] }[scene]
    const d = scene === "entrance" ? 2.4 : 1.6, delay = scene === "entrance" ? 0.3 : 0
    gsap.to(g.current.scale, { x: t[0], y: t[0], z: t[0], duration: d, delay, ease: "power3.inOut" })
    gsap.to(g.current.position, { y: t[1], z: t[2], duration: d, delay, ease: "power3.inOut" })
  }, [scene, entranceScale, entranceY])

  const ringMat = (
    <meshStandardMaterial
      color={HALLOWEEN_BORDER}
      metalness={0.7}
      roughness={0.3}
      envMapIntensity={1.0}
    />
  )

  const innerMat = (
    <meshStandardMaterial
      color={HALLOWEEN_CRIMSON}
      emissive="#4a080e"
      emissiveIntensity={0.5}
      metalness={0.5}
      roughness={0.3}
    />
  )

  return (
    <group ref={g} scale={0.001} position={[0, entranceY, 0]}>
      <group>
        <mesh ref={r1}><torusGeometry args={[1.18, 0.038, 24, 120]} />{ringMat}</mesh>
        <mesh ref={r2}><torusGeometry args={[0.92, 0.032, 24, 100]} />{ringMat}</mesh>
        <mesh ref={r3}><torusGeometry args={[0.66, 0.026, 24, 90]} />{ringMat}</mesh>
        <mesh ref={inner}><octahedronGeometry args={[0.38, 0]} />{innerMat}</mesh>
      </group>
    </group>
  )
}

function Card({ scene, name, runKey, skipKey, onRevealed }) {
  const tilt = useRef(), flip = useRef(), light = useRef(), tl = useRef(), cb = useRef(onRevealed)
  cb.current = onRevealed
  const v = useThree((s) => s.viewport)
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const isSmallMobile = typeof window !== 'undefined' && window.innerWidth <= 480
  const fit = Math.min(
    1,
    v.width / (isSmallMobile ? 3.8 : isMobile ? 3.65 : 3.6),
    v.height / (isSmallMobile ? 6.8 : isMobile ? 6.2 : 5.8)
  )

  const res = useMemo(() => {
    const fc = document.createElement("canvas"), bc = document.createElement("canvas")
    const mk = (c) => {
      const t = new THREE.CanvasTexture(c)
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      return t
    }
    const ft = mk(fc), bt = mk(bc)

    // Solid dark orange border on card edge (#8A3515)
    const edge = new THREE.MeshStandardMaterial({
      color: HALLOWEEN_BORDER,
      emissive: "#200903",
      metalness: 0.5,
      roughness: 0.35
    })

    // Solid, opaque, non-reflective matte card faces (roughness: 0.95, envMapIntensity: 0.0)
    // Ensures dark background #08050B stays 100% deep, opaque, and text stays razor-sharp
    const face = (map) => new THREE.MeshStandardMaterial({
      map,
      metalness: 0.0,
      roughness: 0.95,
      envMapIntensity: 0.0
    })

    return { fc, bc, ft, bt, mats: [edge, edge, edge, edge, face(ft), face(bt)] }
  }, [])

  useEffect(() => {
    let live = true
    const paint = () => {
      if (!live) return
      drawFront(res.fc, name)
      drawBack(res.bc)
      res.ft.needsUpdate = res.bt.needsUpdate = true
    }
    paint()
    loadFonts().then(paint)
    return () => { live = false }
  }, [name, res])

  useEffect(() => {
    if (scene !== "invitation") { flip.current.visible = false; return }
    const f = flip.current, L = light.current
    f.visible = true
    f.position.set(0, 0, -9)
    f.rotation.set(0, Math.PI + 0.9, 0)
    f.scale.setScalar(0.7)
    L.intensity = 0
    L.position.set(2, 2.5, 3.5)

    const t = gsap.timeline()
    // Moderate, warm light intensity (10) to clearly illuminate the card without burning out text
    t.to(L, { intensity: 10, duration: 2, ease: "power2.out" }, 0)
      .to(f.position, { z: 0, duration: 2.8, ease: "power3.out" }, 0.3)
      .to(f.scale, { x: 1, y: 1, z: 1, duration: 2.8, ease: "power3.out" }, 0.3)
      .to(f.rotation, { y: Math.PI, duration: 2.8, ease: "power2.out" }, 0.3)
      .to(f.rotation, { y: 0, duration: 1.7, ease: "power3.inOut" }, "+=0.3")
      .to(f.position, { y: 0.22, duration: 0.85, yoyo: true, repeat: 1, ease: "sine.inOut" }, "<")
      .to(L.position, { x: -2, duration: 1.7, ease: "sine.inOut" }, "<")
      .add(() => cb.current(), "-=0.5")
    tl.current = t
    return () => t.kill()
  }, [scene, runKey])

  useEffect(() => { if (skipKey) tl.current?.progress(1, true) }, [skipKey])

  useFrame(({ pointer, clock }, dt) => {
    const k = Math.min(1, dt * 3)
    const factor = isSmallMobile ? 0.16 : isMobile ? 0.22 : 0.3
    tilt.current.rotation.y += (pointer.x * factor - tilt.current.rotation.y) * k
    tilt.current.rotation.x += (-pointer.y * (factor * 0.7) - tilt.current.rotation.x) * k
    tilt.current.position.y = Math.sin(clock.elapsedTime * 0.9) * (isMobile ? 0.02 : 0.04)
  })

  return (
    <>
      {/* Controlled, soft warm illumination specifically calibrated for solid dark card */}
      <pointLight ref={light} color="#fff4e0" intensity={0} />
      <pointLight position={[-3, -2, 3]} color="#591c0b" intensity={3} />
      <group ref={tilt} scale={fit}>
        <group ref={flip} visible={false}>
          <mesh material={res.mats}><boxGeometry args={[3.15, 4.2525, 0.06]} /></mesh>
        </group>
      </group>
    </>
  )
}

export default function Stage({ scene, mode, name, runKey, skipKey, onRevealed }) {
  const mobile = window.matchMedia("(max-width: 768px)").matches
  return (
    <Canvas
      className="stage"
      dpr={[1, mobile ? 1.5 : 2]}
      camera={{ position: [0, 0, 7], fov: 45 }}
      gl={{
        antialias: !mobile,
        powerPreference: "high-performance",
        alpha: true
      }}
    >
      <fog attach="fog" args={["#08050B", 8, 26]} />
      <Env /><Rig /><Glow scene={scene} />
      <ambientLight intensity={0.9} color="#fff6eb" />
      <pointLight position={[3, 2, 5]} intensity={4.5} color="#ff9d32" />
      <pointLight position={[-4, -2, 4]} intensity={3.5} color="#250d38" />
      <Particles mode={mode} scene={scene} count={mobile ? 500 : 1000} />
      <Emblem scene={scene} />
      <Card scene={scene} name={name} runKey={runKey} skipKey={skipKey} onRevealed={onRevealed} />
    </Canvas>
  )
}
