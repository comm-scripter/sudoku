import { getAudioCtx } from './AudioEngine.js'

// ─── Pencil-note scratch sounds ────────────────────────────────────────────
//
// Each digit is modelled as one or two short noise bursts that mimic the
// strokes a pencil makes when quickly writing that numeral:
//
//   Single stroke : 1, 6, 8
//   Two strokes   : 2, 3, 4, 5, 7, 9
//
// Straight strokes use a fixed bandpass center; curved strokes sweep the
// bandpass frequency during the burst (low→high for upward curves, high→low
// for downward curves, up-then-down for complete loops like 6, 8, 9 circle).
// That spectral shift is the "phase shift" that makes curves feel distinct
// from straight lines.
//
// Source: pink noise (1/f spectrum) shaped by a bandpass + a parallel
// highpass that adds paper-grain sibilance. All durations kept under 100 ms
// so the sounds read as quick, accurate pencil marks.

let _noiseBuffer = null

function getNoiseBuffer(ctx) {
  if (_noiseBuffer && _noiseBuffer.sampleRate === ctx.sampleRate) return _noiseBuffer
  const len = Math.ceil(ctx.sampleRate * 0.4)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  // Kellet 7-coefficient pink noise approximation (1/f spectrum)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + w * 0.0555179
    b1 = 0.99332 * b1 + w * 0.0750759
    b2 = 0.96900 * b2 + w * 0.1538520
    b3 = 0.86650 * b3 + w * 0.3104856
    b4 = 0.55000 * b4 + w * 0.5329522
    b5 = -0.7616 * b5 - w * 0.0168980
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
    b6 = w * 0.115926
  }
  _noiseBuffer = buf
  return buf
}

// curve: false=straight  'up'=filter sweeps high  'down'=sweeps low  'arc'=high then back
function playStroke(ctx, t, dur, curve) {
  const noise = ctx.createBufferSource()
  noise.buffer = getNoiseBuffer(ctx)
  noise.loop = true

  // Bandpass models the pencil-tip scratch resonance; sweep simulates changing
  // contact angle as the pencil moves around a curve
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 1.3
  if (!curve) {
    bp.frequency.value = 3400
  } else if (curve === 'up') {
    bp.frequency.setValueAtTime(2800, t)
    bp.frequency.exponentialRampToValueAtTime(5400, t + dur)
  } else if (curve === 'down') {
    bp.frequency.setValueAtTime(5400, t)
    bp.frequency.exponentialRampToValueAtTime(2800, t + dur)
  } else {
    // 'arc': loop stroke — rises to peak midway then descends (figure-8, 6, 9 circle)
    bp.frequency.setValueAtTime(2900, t)
    bp.frequency.exponentialRampToValueAtTime(6000, t + dur * 0.45)
    bp.frequency.exponentialRampToValueAtTime(2900, t + dur)
  }

  // Parallel highpass adds the high-frequency paper-grain sibilance
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 7000

  const hpGain = ctx.createGain()
  hpGain.gain.value = 0.22

  // Amplitude envelope: 3 ms attack, 8 ms release — crisp and quick
  const env = ctx.createGain()
  const ATK = 0.003, REL = 0.008
  env.gain.setValueAtTime(0, t)
  env.gain.linearRampToValueAtTime(1, t + ATK)
  env.gain.setValueAtTime(1, t + Math.max(ATK, dur - REL))
  env.gain.linearRampToValueAtTime(0, t + dur)

  const vol = ctx.createGain()
  vol.gain.value = 0.10

  noise.connect(bp)
  bp.connect(env)
  noise.connect(hp)
  hp.connect(hpGain)
  hpGain.connect(env)
  env.connect(vol)
  vol.connect(ctx.destination)

  noise.start(t)
  noise.stop(t + dur + 0.001)
}

const _GAP = 0.028 // lift-and-replace pause between strokes (s)

// [duration_s, curve_type] per stroke, ordered as written
const DIGIT_STROKES = {
  1: [[0.055, false]],
  2: [[0.048, false], [0.036, false]],
  3: [[0.044, 'up'],  [0.044, 'down']],
  4: [[0.036, false], [0.032, false], [0.050, false]],
  5: [[0.042, false], [0.054, 'down']],
  6: [[0.078, 'arc']],
  7: [[0.034, false], [0.046, false]],
  8: [[0.090, 'arc']],
  9: [[0.052, 'up'],  [0.036, false]],
}

export function playPencilNote(digit) {
  const ctx = getAudioCtx()
  if (!ctx) return
  const strokes = DIGIT_STROKES[digit]
  if (!strokes) return
  let t = ctx.currentTime
  for (const [dur, curve] of strokes) {
    playStroke(ctx, t, dur, curve)
    t += dur + _GAP
  }
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

// Wrong-guess buzz — two short descending square-wave tones, the same
// "denial" shape as the secret-lock wrong-code cue, pitched lower and
// buzzier so it reads as distinct from the cell-select tap.
export function playWrongGuess() {
  const ctx = getAudioCtx()
  if (!ctx) return

  ;[0, 0.1].forEach((delay, i) => {
    const t    = ctx.currentTime + delay
    const freq = 165 - i * 25

    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.85, t + 0.09)

    // Low-pass tames the square wave's harsh harmonics into a soft buzz
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.08, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.09)

    osc.connect(filter)
    filter.connect(env)
    env.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.1)
  })
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

// Win fanfare — four-note ascending major arpeggio (C5 E5 G5 C6), played
// once when the puzzle is fully and correctly solved.
export function playWinFanfare() {
  const ctx = getAudioCtx()
  if (!ctx) return
  const t = ctx.currentTime

  const notes      = [523.25, 659.25, 783.99, 1046.50]
  const peakGain   = 0.055  // per-note peak; notes overlap (ring longer than the 0.11s stagger), so loudness compounds
  const ampDecay   = 0.32   // s — ring length per note

  notes.forEach((freq, i) => {
    const start = t + i * 0.11

    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, start)
    env.gain.linearRampToValueAtTime(peakGain, start + 0.015)
    env.gain.exponentialRampToValueAtTime(0.001, start + ampDecay)

    osc.connect(env)
    env.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + ampDecay + 0.01)
  })
}
