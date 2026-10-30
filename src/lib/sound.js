// Haunting atmospheric chime for the secret Halloween premiere.
// Only played when sound is active.
let ctx
export function chime(freqs = [293.66, 349.23, 440.00, 587.33]) {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)()
    const t = ctx.currentTime
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), s = t + i * 0.14
      o.type = i % 2 === 0 ? "sine" : "triangle"
      o.frequency.value = f
      g.gain.setValueAtTime(0, s)
      g.gain.linearRampToValueAtTime(0.05, s + 0.04)
      g.gain.exponentialRampToValueAtTime(0.0001, s + 2.4)
      o.connect(g).connect(ctx.destination)
      o.start(s)
      o.stop(s + 2.5)
    })
  } catch { /* audio unavailable */ }
}
