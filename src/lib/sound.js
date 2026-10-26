// Tiny optional WebAudio chime. Only called when the user turns sound ON.
let ctx
export function chime(freqs = [392, 523.25, 659.25]) {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)()
    const t = ctx.currentTime
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), s = t + i * 0.12
      o.type = "sine"; o.frequency.value = f
      g.gain.setValueAtTime(0, s)
      g.gain.linearRampToValueAtTime(0.06, s + 0.05)
      g.gain.exponentialRampToValueAtTime(0.0001, s + 2.2)
      o.connect(g).connect(ctx.destination); o.start(s); o.stop(s + 2.3)
    })
  } catch { /* audio unavailable */ }
}
