// Lazy AudioContext — created on first user gesture (satisfies autoplay policy).
let _audioCtx = null

function getAudioCtx() {
  if (!_audioCtx) {
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      return null
    }
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume()
  return _audioCtx
}

// Low-frequency tap — cell selection feedback.
// Short sine burst that pitches down slightly, mimicking a soft physical tap.
export function playCellSelect() {
  const ctx = getAudioCtx()
  if (!ctx) return
  const t = ctx.currentTime

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(145, t)
  osc.frequency.exponentialRampToValueAtTime(85, t + 0.038)

  const env = ctx.createGain()
  env.gain.setValueAtTime(0.14, t)
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.038)

  osc.connect(env)
  env.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.045)
}

// Correct-guess bell ding — FM synthesis (Chowning algorithm).
//
// A sine carrier + sine modulator at a 1:1.4 frequency ratio is the classic
// recipe for a synthesized bell. The key is the modulation index envelope:
// it starts high (bright, metallic attack) and decays to zero in ~60 ms,
// leaving only the pure carrier sine to ring out. That clang→ring transition
// is what makes the ear register it as a bell rather than a plain tone.
//
// To tune:
//   carrierFreq  — the perceived pitch of the bell; raise for a higher ding
//   peakGain     — overall loudness
//   modIndexPeak — FM index at attack (higher = brighter/clangier attack)
//   modDecay     — how fast the FM brightness fades (seconds)
//   ampDecay     — how long the bell rings (seconds)
export function playCorrectGuess() {
  const ctx = getAudioCtx()
  if (!ctx) return
  const t = ctx.currentTime

  const carrierFreq  = 1347   // Hz — clear bell pitch
  const modFreq      = carrierFreq * 1.4  // 1680 Hz — classic Chowning ratio
  const peakGain     = 0.011
  const modIndexPeak = 3      // modulation depth = index × carrierFreq
  const modDecay     = 0.06   // s — FM brightness fades in 60 ms
  const ampDecay     = 0.28   // s — bell rings for ~280 ms

  // Modulator drives the carrier's frequency, creating FM sidebands
  const modOsc = ctx.createOscillator()
  modOsc.type  = 'sine'
  modOsc.frequency.value = modFreq

  // Modulation depth envelope: high index → bright attack; falls to 0 → pure ring
  const modEnv = ctx.createGain()
  modEnv.gain.setValueAtTime(carrierFreq * modIndexPeak, t)
  modEnv.gain.exponentialRampToValueAtTime(0.001, t + modDecay)
  modOsc.connect(modEnv)

  const carrier = ctx.createOscillator()
  carrier.type  = 'sine'
  carrier.frequency.value = carrierFreq
  modEnv.connect(carrier.frequency)  // FM: modulator offsets carrier pitch

  // Amplitude envelope: 2 ms attack (no click), then exponential ring decay
  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, t)
  env.gain.linearRampToValueAtTime(peakGain, t + 0.002)
  env.gain.exponentialRampToValueAtTime(0.001, t + ampDecay)

  carrier.connect(env)
  env.connect(ctx.destination)

  const stop = t + ampDecay + 0.02
  modOsc.start(t); modOsc.stop(stop)
  carrier.start(t); carrier.stop(stop)
}
