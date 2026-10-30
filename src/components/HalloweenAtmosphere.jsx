import { useMemo } from 'react'

/**
 * HalloweenAtmosphere
 * Renders a lightweight, high-performance, background atmosphere positioned
 * safely BEHIND the invitation card with controlled intensity:
 * - Reduced-scale Full Moon placed high in the sky outside text areas
 * - Dark haunted mansion silhouette along the bottom horizon
 * - Bare gothic tree silhouettes framing the far left and right edges
 * - Low drifting fog at the screen base
 * - Flying bat silhouettes across the upper sky
 * - Ornate corner spiderwebs
 * - Small corner pumpkins safely at the outer floor
 */
export default function HalloweenAtmosphere({ scene }) {
  // Generate subtle drifting embers strictly in the peripheral background
  const embers = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: `${(i * 7.1 + 4) % 94}%`,
      bottom: `${(i * 6 + 4) % 40}%`,
      size: `${2.5 + (i % 3) * 1.5}px`,
      duration: `${8 + (i % 5) * 2}s`,
      delay: `${(i * 0.8) % 6}s`,
      color: i % 2 === 0 ? '#ff7518' : '#a94b19'
    }))
  }, [])

  const isInvitation = scene === 'invitation'

  return (
    <div className={`halloween-atmosphere ${isInvitation ? 'scene-invitation' : ''}`} aria-hidden="true">
      {/* 1. Full Moon with Controlled Size & Glow (Positioned High and Behind Card) */}
      <div className="hw-moon-wrap">
        <div className="hw-moon">
          <div className="hw-moon-crater hw-crater-1" />
          <div className="hw-moon-crater hw-crater-2" />
          <div className="hw-moon-crater hw-crater-3" />
        </div>
        <div className="hw-moon-glow" />
      </div>

      {/* 2. Bare Gothic Tree Silhouettes (Strictly at Left & Right Screen Edges) */}
      <svg className="hw-tree hw-tree-left" viewBox="0 0 300 600" preserveAspectRatio="none" fill="none">
        <path
          d="M-20 600 C20 480 30 380 50 280 C60 230 45 170 30 110 C25 90 10 50 0 20 C2 20 8 40 18 65 C32 100 48 150 56 195 C62 135 75 90 90 40 C75 75 70 120 68 180 C80 150 110 110 140 75 C115 105 92 145 80 190 C105 180 145 165 180 150 C145 175 110 200 86 215 C100 240 135 270 170 290 C130 285 98 265 82 245 C78 300 70 390 90 470 C100 510 120 560 140 600 Z"
          fill="#060209"
          opacity="0.9"
        />
      </svg>

      <svg className="hw-tree hw-tree-right" viewBox="0 0 300 600" preserveAspectRatio="none" fill="none">
        <path
          d="M320 600 C280 480 270 380 250 280 C240 230 255 170 270 110 C275 90 290 50 300 20 C298 20 292 40 282 65 C268 100 252 150 244 195 C238 135 225 90 210 40 C225 75 230 120 232 180 C220 150 190 110 160 75 C185 105 208 145 220 190 C195 180 155 165 120 150 C155 175 190 200 214 215 C200 240 165 270 130 290 C170 285 202 265 218 245 C222 300 230 390 210 470 C200 510 180 560 160 600 Z"
          fill="#060209"
          opacity="0.9"
        />
      </svg>

      {/* 3. Dark Haunted Mansion Silhouette along Lower Horizon */}
      <div className="hw-mansion-wrap">
        <svg
          className="hw-mansion-svg"
          viewBox="0 0 1000 420"
          preserveAspectRatio="xMidYMax meet"
          fill="none"
        >
          <path
            d="M0 420 L0 390 L120 385 L140 330 L170 330 L185 280 L205 280 L210 210 L220 140 L225 90 L227 50 L229 90 L234 140 L244 210 L250 280 L270 280 L285 330 L315 330 L330 375 L360 375 L380 310 L385 240 L415 170 L425 100 L428 60 L431 100 L440 170 L470 240 L475 310 L490 310 L500 210 L503 130 L506 210 L515 310 L530 310 L545 230 L575 160 L585 90 L588 50 L591 90 L600 160 L630 230 L645 310 L660 310 L680 365 L710 365 L730 315 L755 315 L770 260 L785 190 L792 120 L795 70 L798 120 L805 190 L820 260 L835 315 L860 315 L880 380 L1000 390 L1000 420 Z"
            fill="#06020a"
          />

          {/* Gentle flickering windows */}
          <g className="hw-windows">
            <path d="M424 135 C424 125 432 125 432 135 L432 155 L424 155 Z" className="hw-candle-window hw-window-1" />
            <path d="M410 200 C410 192 418 192 418 200 L418 220 L410 220 Z" className="hw-candle-window hw-window-2" />
            <path d="M438 200 C438 192 446 192 446 200 L446 220 L438 220 Z" className="hw-candle-window hw-window-3" />
            <path d="M222 170 C222 162 232 162 232 170 L232 195 L222 195 Z" className="hw-candle-window hw-window-4" />
            <path d="M583 170 C583 162 593 162 593 170 L593 195 L583 195 Z" className="hw-candle-window hw-window-7" />
            <path d="M788 150 C788 142 798 142 798 150 L798 175 L788 175 Z" className="hw-candle-window hw-window-8" />
          </g>
        </svg>
      </div>

      {/* 4. Flying Bat Silhouettes strictly in upper sky */}
      <div className="hw-bats-container">
        <div className="hw-bat hw-bat-1">
          <svg viewBox="0 0 100 45" className="hw-bat-svg">
            <path d="M50 26 C42 16 28 8 0 14 C12 28 26 36 38 31 C43 38 48 37 50 34 C52 37 57 38 62 31 C74 36 88 28 100 14 C72 8 58 16 50 26 Z" fill="#08040d" />
          </svg>
        </div>
        <div className="hw-bat hw-bat-2">
          <svg viewBox="0 0 100 45" className="hw-bat-svg">
            <path d="M50 26 C42 16 28 8 0 14 C12 28 26 36 38 31 C43 38 48 37 50 34 C52 37 57 38 62 31 C74 36 88 28 100 14 C72 8 58 16 50 26 Z" fill="#08040d" />
          </svg>
        </div>
      </div>

      {/* 5. Subtle Peripheral Embers */}
      <div className="hw-embers-container">
        {embers.map((e) => (
          <span
            key={e.id}
            className="hw-ember"
            style={{
              left: e.left,
              bottom: e.bottom,
              width: e.size,
              height: e.size,
              animationDuration: e.duration,
              animationDelay: e.delay,
              backgroundColor: e.color
            }}
          />
        ))}
      </div>

      {/* 6. Corner Spiderweb Filigrees */}
      <div className="hw-spiderwebs">
        <svg className="hw-web hw-web-tl" viewBox="0 0 160 160" fill="none">
          <path d="M0 0 L140 0" stroke="rgba(169, 75, 25, 0.35)" strokeWidth="1" />
          <path d="M0 0 L0 140" stroke="rgba(169, 75, 25, 0.35)" strokeWidth="1" />
          <path d="M0 0 L120 120" stroke="rgba(169, 75, 25, 0.35)" strokeWidth="1" />
          <path d="M30 0 Q24 24 0 30" stroke="rgba(169, 75, 25, 0.3)" strokeWidth="0.8" fill="none" />
          <path d="M60 0 Q48 48 0 60" stroke="rgba(169, 75, 25, 0.3)" strokeWidth="0.8" fill="none" />
          <path d="M90 0 Q72 72 0 90" stroke="rgba(169, 75, 25, 0.3)" strokeWidth="0.8" fill="none" />
        </svg>

        <svg className="hw-web hw-web-tr" viewBox="0 0 160 160" fill="none">
          <path d="M160 0 L20 0" stroke="rgba(169, 75, 25, 0.35)" strokeWidth="1" />
          <path d="M160 0 L160 140" stroke="rgba(169, 75, 25, 0.35)" strokeWidth="1" />
          <path d="M160 0 L40 120" stroke="rgba(169, 75, 25, 0.35)" strokeWidth="1" />
          <path d="M130 0 Q136 24 160 30" stroke="rgba(169, 75, 25, 0.3)" strokeWidth="0.8" fill="none" />
          <path d="M100 0 Q112 48 160 60" stroke="rgba(169, 75, 25, 0.3)" strokeWidth="0.8" fill="none" />
          <path d="M70 0 Q88 72 160 90" stroke="rgba(169, 75, 25, 0.3)" strokeWidth="0.8" fill="none" />
        </svg>
      </div>

      {/* 7. Small Corner Pumpkins in Peripheral Lower Margins */}
      <div className="hw-pumpkins-row">
        <div className="hw-pumpkin hw-pumpkin-left">
          <svg viewBox="0 0 60 52" className="hw-pumpkin-svg">
            <ellipse cx="30" cy="30" rx="26" ry="19" fill="#ff9a35" />
            <path d="M30 11 C30 6 34 3 36 2 C35 6 33 9 32 12 Z" fill="#3b7a2e" />
            <path d="M18 22 L24 25 L19 28 Z" fill="#fff0d0" className="hw-candle-flicker" />
            <path d="M42 22 L36 25 L41 28 Z" fill="#fff0d0" className="hw-candle-flicker" />
            <polygon points="30,27 27,31 33,31" fill="#fff0d0" className="hw-candle-flicker" />
            <path d="M16 35 Q30 46 44 35 Q40 42 36 39 Q33 42 30 38 Q27 42 24 39 Q20 42 16 35 Z" fill="#fff0d0" className="hw-candle-flicker" />
          </svg>
        </div>

        <div className="hw-pumpkin hw-pumpkin-right">
          <svg viewBox="0 0 60 52" className="hw-pumpkin-svg">
            <ellipse cx="30" cy="30" rx="26" ry="19" fill="#ff9a35" />
            <path d="M30 11 C30 6 26 3 24 2 C25 6 27 9 28 12 Z" fill="#3b7a2e" />
            <path d="M19 23 L25 26 L20 29 Z" fill="#fff0d0" className="hw-candle-flicker" />
            <path d="M41 23 L35 26 L40 29 Z" fill="#fff0d0" className="hw-candle-flicker" />
            <polygon points="30,27 27,31 33,31" fill="#fff0d0" className="hw-candle-flicker" />
            <path d="M17 36 Q30 47 43 36 Q39 43 35 40 Q32 43 30 39 Q28 43 25 40 Q21 43 17 36 Z" fill="#fff0d0" className="hw-candle-flicker" />
          </svg>
        </div>
      </div>

      {/* 8. Controlled Low Fog strictly at Screen Base */}
      <div className="hw-fog-wrap">
        <div className="hw-fog hw-fog-1" />
        <div className="hw-fog hw-fog-2" />
      </div>
    </div>
  )
}
