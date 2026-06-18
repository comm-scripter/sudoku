/**
 * PadlockSound — Procedural Web Audio synthesis of a metallic padlock opening.
 *
 * Three synthesis modules fire in tight sequence:
 *
 *   t +  0 ms  Module 1 · Mechanical Click  — broadband noise snap (latch cam seating)
 *   t +  6 ms  Module 2 · Metallic Resonator — inharmonic FM partials (metal body ring)
 *   t + 12 ms  Module 3 · Spring Release     — bandpass-swept noise + shackle thump
 *
 * PARAMETER TABLE
 * ┌──────────────────────┬──────────┬────────────────────────────────────────────────────┐
 * │ Key                  │ Default  │ Notes                                              │
 * ├──────────────────────┼──────────┼────────────────────────────────────────────────────┤
 * │ resonatorFreq        │ 1050 Hz  │ Fundamental of the metal body; raise for tiny lock │
 * │ resonatorDecay       │ 0.055 s  │ Ring duration; heavier metal → longer              │
 * │ resonatorGain        │ 0.32     │ 0–1; ping prominence                               │
 * │ detuneRange          │ 4 cents  │ Max random detune per partial; adds organic life   │
 * │ partials             │ see code │ [ratio, relGain] pairs; inharmonic by design       │
 * │ clickDuration        │ 0.007 s  │ Noise burst length; shorter = crisper snap         │
 * │ clickHpFreq          │ 2200 Hz  │ High-pass cutoff; raise for thinner mechanism      │
 * │ clickGain            │ 0.75     │ Impact loudness                                    │
 * │ springFreqStart      │ 760 Hz   │ Bandpass centre at onset of spring release         │
 * │ springFreqEnd        │ 480 Hz   │ Sweeps down to here as spring settles              │
 * │ springQ              │ 2.2      │ Bandpass resonance; higher = more tonal "boing"    │
 * │ springDecay          │ 0.115 s  │ Spring noise tail length                           │
 * │ springGain           │ 0.26     │ Spring loudness                                    │
 * │ thumpEnabled         │ true     │ Low sine burst when shackle hits its open stop     │
 * │ useConvolution       │ true     │ Tiny metal-body IR smears resonator ring slightly  │
 * │ irDuration           │ 0.004 s  │ IR length; longer = bigger resonant cavity feel    │
 * │ masterGain           │ 0.90     │ Final output level                                 │
 * └──────────────────────┴──────────┴────────────────────────────────────────────────────┘
 *
 * Integration — game engine / React:
 *   Instantiate once per AudioContext; call trigger() on user-gesture events.
 *   The AudioContext must be live (resumed) before calling trigger().
 *   All nodes are created fresh per call so overlapping triggers are safe.
 *
 * Micro-variation per trigger (recommended for realism):
 *   snd.cfg.resonatorFreq  = 1000 + Math.random() * 120
 *   snd.cfg.resonatorDecay = 0.040 + Math.random() * 0.020
 *   snd.cfg.clickHpFreq    = 2000 + Math.random() * 400
 */
export class PadlockSound {
  constructor(audioCtx, config = {}) {
    this.ctx = audioCtx

    // Inharmonic partial ratios derived from thin-shell modal analysis.
    // Real metal overtones are NOT integer multiples of the fundamental —
    // these non-integer ratios are what make struck metal sound like metal
    // rather than a musical tone.
    const defaultPartials = [
      [1.000, 1.00],  // fundamental
      [1.612, 0.62],  // 2nd flexural mode — inharmonic gap is characteristic
      [2.733, 0.38],  // 3rd mode
      [3.897, 0.21],  // 4th mode
      [5.440, 0.11],  // 5th mode — adds air and shimmer
      [6.718, 0.06],  // 6th mode — barely audible, rounds the transient
    ]

    this.cfg = {
      resonatorFreq:   config.resonatorFreq   ?? 1050,
      resonatorDecay:  config.resonatorDecay  ?? 0.055,
      resonatorGain:   config.resonatorGain   ?? 0.32,
      detuneRange:     config.detuneRange     ?? 4,
      partials:        config.partials        ?? defaultPartials,

      clickDuration:   config.clickDuration   ?? 0.007,
      clickHpFreq:     config.clickHpFreq     ?? 2200,
      clickGain:       config.clickGain       ?? 0.75,

      springFreqStart: config.springFreqStart ?? 760,
      springFreqEnd:   config.springFreqEnd   ?? 480,
      springQ:         config.springQ         ?? 2.2,
      springDecay:     config.springDecay     ?? 0.115,
      springGain:      config.springGain      ?? 0.26,
      thumpEnabled:    config.thumpEnabled    ?? true,

      useConvolution:  config.useConvolution  ?? true,
      irDuration:      config.irDuration      ?? 0.004,

      masterGain:      config.masterGain      ?? 0.40,
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  // White-noise AudioBuffer of the given duration, shared by all noise modules.
  _noiseBuffer(seconds) {
    const len = Math.ceil(this.ctx.sampleRate * seconds)
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const ch  = buf.getChannelData(0)
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1
    return buf
  }

  // Procedural metal-body impulse response.
  // Exponentially-decaying noise models the tiny reverberant cavity inside
  // the padlock casing. Convolved with the resonator it adds a subtle smear
  // that glues the partials into a single coherent "body".
  _metalIR() {
    const sr  = this.ctx.sampleRate
    const len = Math.ceil(sr * this.cfg.irDuration)
    const buf = this.ctx.createBuffer(1, len, sr)
    const ch  = buf.getChannelData(0)
    // k chosen so amplitude ≈ 0.0025 at the end of the IR (≈ -52 dB)
    const k = -6.0 / len
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.exp(k * i)
    return buf
  }

  // ── Module 1 · Metallic Resonator ───────────────────────────────────────────
  //
  // Per-partial FM (frequency modulation) synthesis.
  //
  // Each partial = one sine carrier + one sine modulator.
  // The modulator runs at ~√2 × the carrier frequency — a deliberately
  // inharmonic ratio (√2 ≈ 1.414) that produces sidebands spread unevenly
  // through the spectrum, the hallmark of metallic timbre.
  //
  // Modulation depth starts at index 1.5 (depth = 1.5 × carrier freq) and
  // decays to near-zero in the first half of the envelope. This mirrors how
  // struck metal behaves: bright, clangorous attack → clean sine-like tail
  // as internal damping kills the high-order sidebands first.
  //
  // Micro-randomization: detune ±detuneRange cents and FM ratio ±0.04 per
  // trigger so consecutive hits feel organic rather than identical.
  _triggerResonator(dest, t) {
    const { resonatorFreq, resonatorDecay, resonatorGain, partials, detuneRange } = this.cfg

    for (const [ratio, relGain] of partials) {
      const baseFreq     = resonatorFreq * ratio
      const detuneFactor = Math.pow(2, ((Math.random() * 2 - 1) * detuneRange) / 1200)
      const carrierFreq  = baseFreq * detuneFactor

      // FM modulator — √2 ratio is the classic "metallic" FM interval
      const modRatio = 1.414 + (Math.random() * 0.08 - 0.04)
      const modOsc   = this.ctx.createOscillator()
      modOsc.type    = 'sine'
      modOsc.frequency.value = carrierFreq * modRatio

      // Modulation depth envelope: falls to zero quickly so timbre
      // transitions from clangy to pure as the partial decays
      const modEnv = this.ctx.createGain()
      modEnv.gain.setValueAtTime(carrierFreq * 1.5, t)
      modEnv.gain.exponentialRampToValueAtTime(0.001, t + resonatorDecay * 0.45)
      modOsc.connect(modEnv)

      const carrier    = this.ctx.createOscillator()
      carrier.type     = 'sine'
      carrier.frequency.value = carrierFreq
      modEnv.connect(carrier.frequency)  // FM: modulator drives carrier pitch

      // Amplitude envelope — scatter individual partial decays slightly
      // so higher modes die before lower ones, as physics dictates
      const ampEnv = this.ctx.createGain()
      ampEnv.gain.setValueAtTime(resonatorGain * relGain, t)
      ampEnv.gain.exponentialRampToValueAtTime(
        0.001,
        t + resonatorDecay * (0.65 + Math.random() * 0.35)
      )
      carrier.connect(ampEnv)
      ampEnv.connect(dest)

      const stop = t + resonatorDecay + 0.08
      modOsc.start(t);  modOsc.stop(stop)
      carrier.start(t); carrier.stop(stop)
    }
  }

  // ── Module 2 · Mechanical Click ─────────────────────────────────────────────
  //
  // Two stacked high-pass filters on a white-noise burst create the sharp
  // "crack" of the latch cam snapping into its seat. Double HP steepens the
  // roll-off so only the percussive transient above ~2 kHz survives —
  // the distinctive high-frequency spike of metal-on-metal contact.
  //
  // A second, lower-frequency bandpass copy (~820 Hz) adds the body of the
  // mechanism impact — the thick thud of the internal spring bottoming out.
  _triggerClick(dest, t) {
    const { clickDuration, clickHpFreq, clickGain } = this.cfg

    const src1 = this.ctx.createBufferSource()
    src1.buffer = this._noiseBuffer(clickDuration)

    // Double HP for steep roll-off — more crack, less noise floor
    const hp1 = this.ctx.createBiquadFilter()
    hp1.type = 'highpass'; hp1.frequency.value = clickHpFreq;        hp1.Q.value = 0.6
    const hp2 = this.ctx.createBiquadFilter()
    hp2.type = 'highpass'; hp2.frequency.value = clickHpFreq * 0.65; hp2.Q.value = 0.8

    const env1 = this.ctx.createGain()
    env1.gain.setValueAtTime(clickGain, t)
    env1.gain.exponentialRampToValueAtTime(0.001, t + clickDuration)

    src1.connect(hp2); hp2.connect(hp1); hp1.connect(env1); env1.connect(dest)
    src1.start(t)

    // Lower layer: mechanism thud — bandpass centred at ~820 Hz
    const src2 = this.ctx.createBufferSource()
    src2.buffer = this._noiseBuffer(0.006)

    const bp = this.ctx.createBiquadFilter()
    bp.type = 'bandpass'; bp.frequency.value = 820; bp.Q.value = 1.8

    const env2 = this.ctx.createGain()
    env2.gain.setValueAtTime(clickGain * 0.38, t)
    env2.gain.exponentialRampToValueAtTime(0.001, t + 0.006)

    src2.connect(bp); bp.connect(env2); env2.connect(dest)
    src2.start(t)
  }

  // ── Module 3 · Spring / Latch Release ───────────────────────────────────────
  //
  // Bandpass-filtered noise whose centre frequency sweeps downward.
  // The falling sweep simulates a compressed spring rapidly releasing —
  // high resonant frequency at full tension, falling as it extends.
  // Q = 2.2 keeps the noise tonal enough to sound "springy" rather than
  // just whooshy air.
  //
  // Optional thump: a short sine burst at ~145 → 75 Hz with a fast linear
  // attack and exponential decay models the physical impact when the shackle
  // reaches its fully-open stop. The slight delay places it after the spring
  // noise peaks, matching the real mechanical sequence.
  _triggerSpring(dest, t) {
    const { springFreqStart, springFreqEnd, springQ, springDecay, springGain, thumpEnabled } = this.cfg

    const src = this.ctx.createBufferSource()
    src.buffer = this._noiseBuffer(springDecay + 0.015)

    const bp = this.ctx.createBiquadFilter()
    bp.type    = 'bandpass'
    bp.Q.value = springQ
    bp.frequency.setValueAtTime(springFreqStart, t)
    bp.frequency.exponentialRampToValueAtTime(springFreqEnd, t + springDecay * 0.55)

    const env = this.ctx.createGain()
    env.gain.setValueAtTime(springGain, t)
    env.gain.exponentialRampToValueAtTime(0.001, t + springDecay)

    src.connect(bp); bp.connect(env); env.connect(dest)
    src.start(t)

    if (thumpEnabled) {
      // Delay thump to where the shackle physically hits its stop
      const delay = springDecay * 0.12

      const thumpOsc = this.ctx.createOscillator()
      thumpOsc.type  = 'sine'
      thumpOsc.frequency.setValueAtTime(145, t + delay)
      thumpOsc.frequency.exponentialRampToValueAtTime(75, t + delay + 0.055)

      const thumpEnv = this.ctx.createGain()
      thumpEnv.gain.setValueAtTime(0.001, t + delay)
      // Linear attack over 4 ms — sharp but not discontinuous
      thumpEnv.gain.linearRampToValueAtTime(springGain * 0.60, t + delay + 0.004)
      thumpEnv.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.060)

      thumpOsc.connect(thumpEnv); thumpEnv.connect(dest)
      thumpOsc.start(t + delay)
      thumpOsc.stop(t + delay + 0.085)
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  trigger() {
    const { ctx, cfg } = this
    if (ctx.state === 'suspended') ctx.resume()
    const t = ctx.currentTime

    const master = ctx.createGain()
    master.gain.value = cfg.masterGain
    master.connect(ctx.destination)

    // Resonator routed through the convolution IR for metal-body smear.
    // Click and spring bypass it — they should stay percussive and dry.
    let resDest = master
    if (cfg.useConvolution) {
      const conv  = ctx.createConvolver()
      conv.buffer = this._metalIR()
      conv.connect(master)
      resDest = conv
    }

    this._triggerClick(master,   t)          // t +  0 ms: snap
    this._triggerResonator(resDest, t + 0.006)  // t +  6 ms: metallic ring
    this._triggerSpring(master,  t + 0.012)  // t + 12 ms: spring release
  }
}
