// Shared AudioContext for every sound effect in the app.
//
// iOS Safari only unlocks Web Audio playback during the synchronous call
// stack of a genuine user gesture, and re-suspends the context whenever the
// tab/app is backgrounded or the OS interrupts audio (calls, Control Center,
// silent-switch toggles, ...). A context created and resumed lazily inside
// one specific feature's click handler only gets unlocked by that feature's
// own first tap — every other sound module ends up re-doing the same dance
// with its own separate context. Centralizing it here means:
//
//   1. One context for the whole app, so the very first tap anywhere
//      unlocks audio for every feature, not just the one touched first.
//   2. An eager unlock listener on the first pointerdown/touchend/keydown,
//      ahead of any feature-specific sound call, plus a 1-sample silent
//      buffer "kick" — resume() alone can still leave the very next
//      scheduled sound silent on iOS.
//   3. Re-resuming on visibilitychange, since returning from the background
//      leaves the context suspended until something resumes it.
let _ctx = null

export function getAudioCtx() {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      return null
    }
  }
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function kick(ctx) {
  const src = ctx.createBufferSource()
  src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
  src.connect(ctx.destination)
  src.start(0)
}

if (typeof document !== 'undefined') {
  const unlock = () => {
    document.removeEventListener('pointerdown', unlock)
    document.removeEventListener('touchend', unlock)
    document.removeEventListener('keydown', unlock)
    const ctx = getAudioCtx()
    if (ctx) kick(ctx)
  }
  document.addEventListener('pointerdown', unlock)
  document.addEventListener('touchend', unlock)
  document.addEventListener('keydown', unlock)

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && _ctx?.state === 'suspended') _ctx.resume()
  })
}
