import { EVENT } from "../config/event"

const D = "'Cinzel Decorative', Cinzel, Georgia, serif"
const C = "Cinzel, Georgia, serif"
const S = "'Cormorant Garamond', Georgia, serif"

// Exact specified color palette:
const COLOR_BG = "#08050B"           // Midnight black (fully opaque)
const COLOR_TITLE = "#F58A24"        // Pumpkin orange (main title)
const COLOR_NAME = "#E8C78A"         // Warm gold (visitor name, branding)
const COLOR_MAIN_TEXT = "#F5EBDD"    // Ivory (main text, details values, closing lines)
const COLOR_SEC_TEXT = "#C6AD83"     // Muted gold (secondary text, labels, heading, confidentiality)
const COLOR_BORDER = "#8A3515"       // Dark orange (outer border, decorations)
const COLOR_ACCENT_GLOW = "#FF9D32"  // Soft amber (accent glow)

export const loadFonts = () =>
  Promise.all([
    "700 40px 'Cinzel Decorative'",
    "900 40px 'Cinzel Decorative'",
    "700 40px Cinzel",
    "600 40px Cinzel",
    "400 40px Cinzel",
    "500 40px 'Cormorant Garamond'",
    "italic 500 40px 'Cormorant Garamond'",
    "italic 400 40px 'Cormorant Garamond'",
    "400 40px 'Cormorant Garamond'"
  ].map((f) => (document.fonts ? document.fonts.load(f) : Promise.resolve()))).catch(() => {})

// Dynamic text fit utility to ensure names or titles never touch borders or clip
const fit = (x, t, max, size, weight, family) => {
  let s = size
  do {
    x.font = `${weight} ${s}px ${family}`
    s -= 2
  } while (x.measureText(t).width > max && s > 14)
}

// Draw a stylized gothic bat silhouette
const drawBat = (x, cx, cy, scale) => {
  x.save()
  x.translate(cx, cy)
  x.scale(scale, scale)
  x.beginPath()
  x.moveTo(0, -6)
  x.lineTo(3, -12); x.lineTo(6, -6)
  x.quadraticCurveTo(24, -20, 48, -4)
  x.quadraticCurveTo(34, 12, 24, 4)
  x.quadraticCurveTo(14, 14, 7, 7)
  x.lineTo(0, 13)
  x.lineTo(-7, 7)
  x.quadraticCurveTo(-14, 14, -24, 4)
  x.quadraticCurveTo(-34, 12, -48, -4)
  x.quadraticCurveTo(-24, -20, -6, -6)
  x.lineTo(-3, -12); x.lineTo(0, -6)
  x.closePath()
  x.fill()
  x.restore()
}

// Draw small carved Jack-o'-lantern crest (contained cleanly in corners/margins)
const drawJackOLantern = (x, cx, cy, r) => {
  x.save()
  x.translate(cx, cy)

  // Stem
  x.fillStyle = "#3b551c"
  x.beginPath()
  x.moveTo(-2, -r * 0.9); x.quadraticCurveTo(0, -r * 1.35, 6, -r * 1.25)
  x.lineTo(3, -r * 0.85); x.closePath(); x.fill()

  // Outer lobes in dark orange shading (#8A3515)
  x.fillStyle = COLOR_BORDER
  x.beginPath(); x.ellipse(-r * 0.44, 0, r * 0.54, r * 0.82, -0.12, 0, Math.PI * 2); x.fill()
  x.beginPath(); x.ellipse(r * 0.44, 0, r * 0.54, r * 0.82, 0.12, 0, Math.PI * 2); x.fill()

  // Main pumpkin body in Pumpkin Orange (#F58A24)
  x.fillStyle = COLOR_TITLE
  x.beginPath(); x.ellipse(-r * 0.38, 0, r * 0.48, r * 0.78, -0.1, 0, Math.PI * 2); x.fill()
  x.beginPath(); x.ellipse(r * 0.38, 0, r * 0.48, r * 0.78, 0.1, 0, Math.PI * 2); x.fill()

  // Center lobe with radiant warm pumpkin
  const centerGrad = x.createLinearGradient(0, -r, 0, r)
  centerGrad.addColorStop(0, "#FFA347")
  centerGrad.addColorStop(1, COLOR_TITLE)
  x.fillStyle = centerGrad
  x.beginPath(); x.ellipse(0, 0, r * 0.62, r * 0.85, 0, 0, Math.PI * 2); x.fill()

  // Facial features glowing in warm ivory (#F5EBDD)
  x.fillStyle = COLOR_MAIN_TEXT
  // Left eye
  x.beginPath(); x.moveTo(-r * 0.38, -r * 0.16); x.lineTo(-r * 0.14, -r * 0.16); x.lineTo(-r * 0.26, -r * 0.42); x.closePath(); x.fill()
  // Right eye
  x.beginPath(); x.moveTo(r * 0.14, -r * 0.16); x.lineTo(r * 0.38, -r * 0.16); x.lineTo(r * 0.26, -r * 0.42); x.closePath(); x.fill()
  // Nose
  x.beginPath(); x.moveTo(0, -r * 0.16); x.lineTo(r * 0.08, 0); x.lineTo(-r * 0.08, 0); x.closePath(); x.fill()

  // Grin
  x.beginPath()
  x.moveTo(-r * 0.44, r * 0.14)
  x.lineTo(-r * 0.28, r * 0.34); x.lineTo(-r * 0.18, r * 0.2)
  x.lineTo(-r * 0.07, r * 0.36); x.lineTo(0, r * 0.22)
  x.lineTo(r * 0.07, r * 0.36); x.lineTo(r * 0.18, r * 0.2)
  x.lineTo(r * 0.28, r * 0.34); x.lineTo(r * 0.44, r * 0.14)
  x.quadraticCurveTo(0, r * 0.62, -r * 0.44, r * 0.14)
  x.closePath(); x.fill()

  x.restore()
}

// Draw subtle crescent moon motif near the outer border
const drawCrescentMoon = (x, cx, cy, r, flipX = false) => {
  x.save()
  x.translate(cx, cy)
  if (flipX) x.scale(-1, 1)
  x.fillStyle = COLOR_SEC_TEXT
  x.beginPath()
  x.arc(0, 0, r, -Math.PI * 0.5, Math.PI * 0.5, false)
  x.quadraticCurveTo(r * 0.3, 0, 0, -r)
  x.closePath()
  x.fill()
  x.restore()
}

// Subtle corner spiderweb filigree (strictly in the 4 corners, never covering text)
const drawCornerWeb = (x, x0, y0, flipX, flipY) => {
  x.save()
  x.translate(x0, y0)
  x.scale(flipX ? -1 : 1, flipY ? -1 : 1)
  x.strokeStyle = "rgba(138, 53, 21, 0.42)"
  x.lineWidth = 1.1

  // Web ribs
  x.beginPath()
  x.moveTo(0, 0); x.lineTo(48, 0)
  x.moveTo(0, 0); x.lineTo(40, 20)
  x.moveTo(0, 0); x.lineTo(26, 38)
  x.moveTo(0, 0); x.lineTo(0, 48)
  x.stroke()

  // Concentric spiderweb scallops
  x.strokeStyle = "rgba(198, 173, 131, 0.32)"
  x.lineWidth = 0.9
  ;[16, 30, 44].forEach((rad) => {
    x.beginPath()
    x.moveTo(rad, 0)
    x.quadraticCurveTo(rad * 0.8, rad * 0.35, rad * 0.72, rad * 0.45)
    x.quadraticCurveTo(rad * 0.45, rad * 0.72, rad * 0.35, rad * 0.8)
    x.quadraticCurveTo(rad * 0.2, rad * 0.9, 0, rad)
    x.stroke()
  })
  x.restore()
}

// Symmetrical gothic ornamental corner bracket
const drawGothicCorner = (x, x0, y0, flipX, flipY) => {
  x.save()
  x.translate(x0, y0)
  x.scale(flipX ? -1 : 1, flipY ? -1 : 1)

  // Inward gothic stepped bracket
  x.strokeStyle = COLOR_SEC_TEXT
  x.lineWidth = 1.4
  x.beginPath()
  x.moveTo(0, 26)
  x.lineTo(8, 26)
  x.lineTo(8, 8)
  x.lineTo(26, 8)
  x.lineTo(26, 0)
  x.stroke()

  // 45-degree chamfered connector
  x.strokeStyle = COLOR_BORDER
  x.lineWidth = 1.2
  x.beginPath()
  x.moveTo(4, 18)
  x.lineTo(18, 4)
  x.stroke()

  // Tiny gold diamond pip at apex
  x.fillStyle = COLOR_NAME
  x.beginPath()
  x.moveTo(12, 12 - 3.5)
  x.lineTo(12 + 3.5, 12)
  x.lineTo(12, 12 + 3.5)
  x.lineTo(12 - 3.5, 12)
  x.closePath()
  x.fill()

  x.restore()
}

// Clean diamond pip for dividers and borders
const drawDiamond = (x, cx, cy, size, color = COLOR_NAME) => {
  x.save()
  x.fillStyle = color
  x.beginPath()
  x.moveTo(cx, cy - size)
  x.lineTo(cx + size * 0.8, cy)
  x.lineTo(cx, cy + size)
  x.lineTo(cx - size * 0.8, cy)
  x.closePath()
  x.fill()
  x.restore()
}

// Symmetrical ornamental divider with tapered lines and center motif
const drawDivider = (x, y, halfW = 160, motif = "diamond") => {
  x.save()
  const leftGrad = x.createLinearGradient(500 - halfW, y, 500 - 20, y)
  leftGrad.addColorStop(0, "rgba(138, 53, 21, 0.05)")
  leftGrad.addColorStop(0.5, "rgba(198, 173, 131, 0.6)")
  leftGrad.addColorStop(1, "rgba(138, 53, 21, 0.9)")

  const rightGrad = x.createLinearGradient(500 + 20, y, 500 + halfW, y)
  rightGrad.addColorStop(0, "rgba(138, 53, 21, 0.9)")
  rightGrad.addColorStop(0.5, "rgba(198, 173, 131, 0.6)")
  rightGrad.addColorStop(1, "rgba(138, 53, 21, 0.05)")

  x.lineWidth = 1.2
  x.strokeStyle = leftGrad
  x.beginPath(); x.moveTo(500 - halfW, y); x.lineTo(500 - 22, y); x.stroke()

  x.strokeStyle = rightGrad
  x.beginPath(); x.moveTo(500 + 22, y); x.lineTo(500 + halfW, y); x.stroke()

  if (motif === "diamond") {
    drawDiamond(x, 500, y, 3.5, COLOR_NAME)
    drawDiamond(x, 500 - 10, y, 2, COLOR_SEC_TEXT)
    drawDiamond(x, 500 + 10, y, 2, COLOR_SEC_TEXT)
  } else if (motif === "bat") {
    x.fillStyle = COLOR_BORDER
    drawBat(x, 500, y, 0.34)
    drawDiamond(x, 500 - 26, y, 2.5, COLOR_NAME)
    drawDiamond(x, 500 + 26, y, 2.5, COLOR_NAME)
  }
  x.restore()
}

// Solid, opaque card foundation with refined double border and gothic ornamentation
const frame = (x, w = 1000, h = 1350) => {
  // 1. Completely solid, opaque midnight black background (#08050B)
  x.fillStyle = COLOR_BG
  x.fillRect(0, 0, w, h)

  // Subtle interior gothic depth gradient (fully opaque, deepest dark purple-black center)
  const bgGrad = x.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.72)
  bgGrad.addColorStop(0, "#100918")
  bgGrad.addColorStop(0.65, "#0A060F")
  bgGrad.addColorStop(1, COLOR_BG)
  x.fillStyle = bgGrad
  x.fillRect(0, 0, w, h)

  // 2. Outer elegant border in dark orange (#8A3515) with very subtle outer amber glow
  x.save()
  x.shadowColor = "rgba(255, 157, 50, 0.32)"
  x.shadowBlur = 10
  x.strokeStyle = COLOR_BORDER
  x.lineWidth = 3.5
  x.strokeRect(44, 44, w - 88, h - 88)
  x.restore()

  // 3. Finer gold inner border in muted gold (#C6AD83 / #E8C78A)
  x.strokeStyle = "rgba(232, 199, 138, 0.75)"
  x.lineWidth = 1.4
  x.strokeRect(58, 58, w - 116, h - 116)

  // Midpoint gold diamond studs along inner border
  drawDiamond(x, w / 2, 58, 3.5, COLOR_NAME)
  drawDiamond(x, w / 2, h - 58, 3.5, COLOR_NAME)
  drawDiamond(x, 58, h / 2, 3.5, COLOR_NAME)
  drawDiamond(x, w - 58, h / 2, 3.5, COLOR_NAME)

  // 4. Symmetrical gothic ornamental corner brackets
  drawGothicCorner(x, 58, 58, false, false)
  drawGothicCorner(x, w - 58, 58, true, false)
  drawGothicCorner(x, 58, h - 58, false, true)
  drawGothicCorner(x, w - 58, h - 58, true, true)

  // 5. Delicate corner spiderwebs strictly in the 4 corners
  drawCornerWeb(x, 58, 58, false, false)
  drawCornerWeb(x, w - 58, 58, true, false)
  drawCornerWeb(x, 58, h - 58, false, true)
  drawCornerWeb(x, w - 58, h - 58, true, true)

  // 6. Subtle crescent moon motifs near upper outside border
  drawCrescentMoon(x, 190, 84, 7, false)
  drawCrescentMoon(x, w - 190, 84, 7, true)

  // 7. Tiny bat silhouettes symmetrically flanking upper inner corners
  x.fillStyle = COLOR_BORDER
  drawBat(x, 138, 118, 0.44)
  drawBat(x, w - 138, 118, -0.44) // flipped horizontally

  x.textAlign = "center"
}

export function drawFront(canvas, name, w = 1000) {
  const s = w / 1000
  const h = 1350 * s
  canvas.width = w
  canvas.height = h
  const x = canvas.getContext("2d")
  x.scale(s, s)

  // 1. Solid opaque background and refined double border
  frame(x, 1000, 1350)

  // 2. Top Decorative Crest: Small carved pumpkin flanked by subtle bats
  drawJackOLantern(x, 500, 100, 18)
  x.fillStyle = COLOR_BORDER
  drawBat(x, 424, 100, 0.38)
  drawBat(x, 576, 100, -0.38) // flipped horizontally

  // 3. TEAM MAVERICKS PRESENTS (at the very top, above "A PRIVATE PREMIERE FOR SENIORS")
  // Team Mavericks in elegant uppercase gold typography
  x.save()
  const presenterGrad = x.createLinearGradient(0, 130, 0, 155)
  presenterGrad.addColorStop(0, "#FFF4DD")
  presenterGrad.addColorStop(0.5, COLOR_NAME)
  presenterGrad.addColorStop(1, "#BE9755")
  x.fillStyle = presenterGrad
  x.letterSpacing = "6px"
  x.font = `700 23px ${C}`
  x.fillText(EVENT.presenter || "TEAM MAVERICKS", 503, 145)
  x.restore()

  // PRESENTS directly underneath in smaller lettering
  x.letterSpacing = "6px"
  x.fillStyle = COLOR_SEC_TEXT
  x.font = `italic 500 15px ${S}`
  x.fillText(EVENT.presentsLabel || "PRESENTS", 502, 175)

  // Subtle decorative divider with tiny center bat motif
  drawDivider(x, 202, 130, "bat")

  // 4. Heading: A PRIVATE PREMIERE FOR SENIORS in Muted Gold (#C6AD83)
  x.letterSpacing = "5px"
  x.fillStyle = COLOR_SEC_TEXT
  x.font = `700 18px ${C}`
  x.fillText(EVENT.heading || "A PRIVATE PREMIERE FOR SENIORS", 502, 240)

  // 5. Supporting Label: PREPARED EXCLUSIVELY FOR in Muted Gold (#C6AD83)
  x.letterSpacing = "4px"
  x.fillStyle = COLOR_SEC_TEXT
  x.font = `600 15px ${C}`
  x.fillText("PREPARED EXCLUSIVELY FOR", 502, 286)

  // 6. Visitor's Personalized Name: Elegant warm gold serif typography (#E8C78A)
  // Prominent, slightly smaller than NEXORA, with subtle gold gradient depth
  x.save()
  const nameGrad = x.createLinearGradient(0, 310, 0, 355)
  nameGrad.addColorStop(0, "#FFF4DD")
  nameGrad.addColorStop(0.5, COLOR_NAME)
  nameGrad.addColorStop(1, "#BE9755")
  x.fillStyle = nameGrad
  x.letterSpacing = "3px"
  fit(x, name.toUpperCase(), 760, 54, 700, D)
  x.fillText(name.toUpperCase(), 500, 352)
  x.restore()

  // 7. Ornamental Divider with center bat motif
  drawDivider(x, 394, 200, "bat")

  // 8. Large, Prominent Event Title: NEXORA
  // Main visual attraction with elegant cinematic serif and subtle orange gradient
  x.save()
  const titleGrad = x.createLinearGradient(0, 410, 0, 490)
  titleGrad.addColorStop(0, "#FFAE4A")
  titleGrad.addColorStop(0.5, COLOR_TITLE)
  titleGrad.addColorStop(1, "#CF5708")
  x.fillStyle = titleGrad

  // Subtle soft amber glow around NEXORA
  x.shadowColor = "rgba(255, 157, 50, 0.42)"
  x.shadowBlur = 14
  x.letterSpacing = "8px"
  fit(x, EVENT.name || "NEXORA", 800, 88, 900, D)
  x.fillText(EVENT.name || "NEXORA", 504, 480)
  x.restore()

  // 9. Event Taglines: Crisp Ivory (#F5EBDD) for high readability
  x.letterSpacing = "0.8px"
  x.fillStyle = COLOR_MAIN_TEXT
  x.font = `italic 500 28px ${S}`
  x.fillText(EVENT.tagline || "A secret Halloween premiere exclusively for seniors.", 500, 538)

  x.letterSpacing = "1.2px"
  x.fillStyle = "#EAE0D3"
  x.font = `500 22px ${S}`
  x.fillText(EVENT.audience || "Step into the shadows where legends awaken.", 500, 578)

  // 10. Ornamental Divider before Event Details
  drawDivider(x, 614, 180, "diamond")

  // 11. Refined Event Details: Clean, balanced section with consistent spacing
  // DATE: 01 NOVEMBER 2026
  x.letterSpacing = "5px"
  x.fillStyle = COLOR_SEC_TEXT
  x.font = `700 15px ${C}`
  x.fillText("DATE", 502, 650)

  x.letterSpacing = "2px"
  x.fillStyle = COLOR_MAIN_TEXT
  fit(x, EVENT.date || "01 NOVEMBER 2026", 760, 32, 700, C)
  x.fillText(EVENT.date || "01 NOVEMBER 2026", 500, 690)

  // Separator
  drawDivider(x, 724, 130, "diamond")

  // TIME: 9:00 AM
  x.letterSpacing = "5px"
  x.fillStyle = COLOR_SEC_TEXT
  x.font = `700 15px ${C}`
  x.fillText("TIME", 502, 754)

  x.letterSpacing = "2px"
  x.fillStyle = COLOR_MAIN_TEXT
  fit(x, EVENT.time || "9:00 AM", 760, 32, 700, C)
  x.fillText(EVENT.time || "9:00 AM", 500, 794)

  // Separator
  drawDivider(x, 828, 130, "diamond")

  // VENUE: HIGH ONN BREEZE
  x.letterSpacing = "5px"
  x.fillStyle = COLOR_SEC_TEXT
  x.font = `700 15px ${C}`
  x.fillText("VENUE", 502, 858)

  x.letterSpacing = "2px"
  x.fillStyle = COLOR_MAIN_TEXT
  fit(x, EVENT.venue || "HIGH ONN BREEZE", 760, 30, 700, C)
  x.fillText(EVENT.venue || "HIGH ONN BREEZE", 500, 898)

  // 12. Ornamental Divider before Closing Message
  drawDivider(x, 942, 200, "diamond")

  // 13. Closing Message: Readable, properly aligned, evenly spaced in Ivory (#F5EBDD)
  x.letterSpacing = "4px"
  x.fillStyle = COLOR_MAIN_TEXT
  x.font = `600 20px ${C}`
  const closingLines = EVENT.closing || [
    "SOME MEMORIES ARE PLANNED.",
    "OTHERS BECOME LEGENDARY IN THE SHADOWS."
  ]
  x.fillText(closingLines[0], 502, 988)
  x.fillText(closingLines[1], 502, 1028)

  // 14. Delicate Divider before Confidentiality Footer
  drawDivider(x, 1066, 150, "diamond")

  // 15. Confidentiality Footer: Smaller but crisp and legible in Muted Gold (#C6AD83)
  x.letterSpacing = "4.5px"
  x.fillStyle = COLOR_SEC_TEXT
  x.font = `600 15px ${C}`
  x.fillText("BY INVITATION ONLY · ADMIT ONE · STRICTLY CONFIDENTIAL", 502, 1110)

  // 16. Bottom Mini Pumpkin Seal & Gothic Terminal
  drawJackOLantern(x, 500, 1180, 18)

  // Flanking horizontal flourish lines
  x.strokeStyle = "rgba(198, 173, 131, 0.45)"
  x.lineWidth = 1
  x.beginPath(); x.moveTo(370, 1180); x.lineTo(462, 1180); x.stroke()
  x.beginPath(); x.moveTo(538, 1180); x.lineTo(630, 1180); x.stroke()
  drawDiamond(x, 370, 1180, 3, COLOR_NAME)
  drawDiamond(x, 630, 1180, 3, COLOR_NAME)
}

export function drawBack(canvas) {
  canvas.width = 1000
  canvas.height = 1350
  const x = canvas.getContext("2d")

  // Solid dark background and double border
  frame(x, 1000, 1350)

  // Concentric mystical talisman rings in dark orange (#8A3515) & muted gold (#C6AD83)
  x.strokeStyle = COLOR_BORDER
  ;[190, 160, 130].forEach((r, i) => {
    x.lineWidth = i === 0 ? 3 : 1.4
    x.strokeStyle = i === 1 ? "rgba(198, 173, 131, 0.6)" : COLOR_BORDER
    x.beginPath(); x.arc(500, 660, r, 0, Math.PI * 2); x.stroke()
  })

  // Subtle bats flanking the center
  x.fillStyle = COLOR_BORDER
  drawBat(x, 440, 600, 0.48)
  drawBat(x, 560, 640, 0.42)
  drawBat(x, 430, 690, 0.36)

  // Central Jack-o'-lantern crest
  drawJackOLantern(x, 500, 660, 36)

  // Team Mavericks presents on back
  x.letterSpacing = "6px"
  x.font = `700 18px ${C}`
  x.fillStyle = COLOR_NAME
  x.fillText(EVENT.presenter || "TEAM MAVERICKS", 503, 310)

  x.letterSpacing = "5px"
  x.font = `italic 500 13px ${S}`
  x.fillStyle = COLOR_SEC_TEXT
  x.fillText(EVENT.presentsLabel || "PRESENTS", 502, 332)

  // Event Title in pumpkin orange gradient
  const titleGrad = x.createLinearGradient(0, 350, 0, 410)
  titleGrad.addColorStop(0, "#FFAE4A")
  titleGrad.addColorStop(1, COLOR_TITLE)
  x.fillStyle = titleGrad
  x.letterSpacing = "12px"
  x.font = `900 42px ${D}`
  x.fillText(EVENT.name || "NEXORA", 506, 395)

  // Date, Time & Venue in bold Ivory (#F5EBDD)
  x.letterSpacing = "5px"
  x.font = `700 20px ${C}`
  x.fillStyle = COLOR_MAIN_TEXT
  x.fillText("01 NOVEMBER 2026 • 9:00 AM", 503, 445)

  x.letterSpacing = "4px"
  x.font = `700 18px ${C}`
  x.fillStyle = COLOR_NAME
  x.fillText(EVENT.venue || "HIGH ONN BREEZE", 502, 480)

  // Taglines in Muted Gold (#C6AD83) and Ivory (#F5EBDD)
  x.fillStyle = COLOR_SEC_TEXT
  x.letterSpacing = "7px"
  x.font = `700 22px ${C}`
  x.fillText("ENTER IF YOU DARE", 504, 900)

  x.letterSpacing = "9px"
  x.font = `600 18px ${C}`
  x.fillStyle = COLOR_MAIN_TEXT
  x.fillText("BY INVITATION ONLY · ADMIT ONE", 504, 945)
}
