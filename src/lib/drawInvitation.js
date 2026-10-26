import { EVENT } from "../config/event"
const D = "Cinzel, Georgia, serif"
const S = "\"Cormorant Garamond\", Georgia, serif"

export const loadFonts = () =>
  Promise.all(["600 40px Cinzel", "400 40px Cinzel", "400 40px \"Cormorant Garamond\"", "italic 400 40px \"Cormorant Garamond\""]
    .map((f) => document.fonts.load(f))).catch(() => {})

const gold = (x, a, b, c, d) => {
  const g = x.createLinearGradient(a, b, c, d)
  g.addColorStop(0, "#f6e7ae"); g.addColorStop(0.5, "#c9a227"); g.addColorStop(1, "#7a5c10")
  return g
}
// shrink text until it fits maxW; weight is part of the font string
const fit = (x, t, max, size, weight, family) => {
  let s = size
  do { x.font = `${weight} ${s}px ${family}`; s -= 2 } while (x.measureText(t).width > max && s > 16)
}
const frame = (x) => {
  const bg = x.createLinearGradient(0, 0, 1000, 1400)
  bg.addColorStop(0, "#101018"); bg.addColorStop(1, "#050509")
  x.fillStyle = bg; x.fillRect(0, 0, 1000, 1400)
  x.strokeStyle = gold(x, 0, 0, 1000, 1400)
  x.lineWidth = 6; x.strokeRect(40, 40, 920, 1320)
  x.lineWidth = 2; x.strokeRect(62, 62, 876, 1276)
  x.textAlign = "center"
}
const diamond = (x, cx, cy, r) => {
  x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r * 0.6, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r * 0.6, cy); x.closePath()
}

export function drawFront(canvas, name, w = 1000) {
  const s = w / 1000
  canvas.width = w; canvas.height = 1400 * s
  const x = canvas.getContext("2d"); x.scale(s, s); frame(x)
  const G = gold(x, 300, 0, 700, 0)
  x.fillStyle = G; diamond(x, 500, 170, 34); x.fill()

  x.fillStyle = G; x.font = `600 34px ${D}`; x.letterSpacing = "8px"
  x.fillText(EVENT.heading, 504, 290)
  x.letterSpacing = "6px"; x.fillStyle = "#cfc7b0"; x.font = `400 24px ${D}`
  x.fillText("PREPARED FOR", 503, 365)
  x.letterSpacing = "4px"; x.fillStyle = "#fff7dc"
  fit(x, name.toUpperCase(), 760, 82, 600, D); x.fillText(name.toUpperCase(), 502, 460)

  x.strokeStyle = G; x.lineWidth = 2
  x.beginPath(); x.moveTo(300, 520); x.lineTo(700, 520); x.stroke()

  x.letterSpacing = "3px"; x.fillStyle = G
  fit(x, EVENT.name, 780, 84, 600, D); x.fillText(EVENT.name, 501, 650)
  x.letterSpacing = "0px"; x.fillStyle = "#efe8d4"
  x.font = `italic 400 42px ${S}`; x.fillText(EVENT.tagline, 500, 735)
  x.font = `400 32px ${S}`; x.fillStyle = "#cfc7b0"; x.fillText(EVENT.audience, 500, 800)

  ;[["DATE", EVENT.date], ["TIME", EVENT.time], ["VENUE", EVENT.venue]].forEach(([l, v], i) => {
    const y = 900 + i * 125
    x.letterSpacing = "8px"; x.fillStyle = G; x.font = `400 24px ${D}`; x.fillText(l, 504, y)
    x.letterSpacing = "1px"; x.fillStyle = "#fff"; fit(x, v, 780, 46, 400, S); x.fillText(v, 500, y + 52)
  })
  x.letterSpacing = "5px"; x.fillStyle = G; x.font = `400 25px ${D}`
  EVENT.closing.forEach((t, i) => x.fillText(t, 502, 1268 + i * 44))
}

export function drawBack(canvas) {
  canvas.width = 1000; canvas.height = 1400
  const x = canvas.getContext("2d"); frame(x)
  const G = gold(x, 300, 400, 700, 1000)
  x.strokeStyle = G
  ;[170, 140, 118].forEach((r, i) => { x.lineWidth = i === 0 ? 4 : 2; x.beginPath(); x.arc(500, 640, r, 0, 7); x.stroke() })
  x.fillStyle = G; diamond(x, 500, 640, 85); x.fill()
  x.letterSpacing = "12px"; x.font = `400 28px ${D}`; x.fillText("BY INVITATION ONLY", 506, 960)
}
