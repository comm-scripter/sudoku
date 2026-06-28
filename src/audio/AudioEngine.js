// Shared AudioContext for every sound effect in the app.
//
// iOS Safari only unlocks Web Audio playback during the synchronous call
// stack of a genuine user gesture, and re-suspends the context whenever the
// tab/app is backgrounded or the OS interrupts audio (calls, Control Center,
// silent-switch toggles, Siri, AirPlay/Bluetooth changes, ...). A context
// created and resumed lazily inside one specific feature's click handler only
// gets unlocked by that feature's own first tap — every other sound module
// ends up re-doing the same dance with its own separate context.
// Centralizing it here means:
//
//   1. One context for the whole app, so the very first tap anywhere
//      unlocks audio for every feature, not just the one touched first.
//   2. Permanent unlock listeners on pointerdown/touchend/keydown that
//      resume + kick the context whenever it is not running — not just on
//      the first tap. This is critical because:
//        a. On some iOS versions / PWA mode, pointerdown is not recognized
//           as a valid gesture; keeping touchend alive as a fallback ensures
//           the context is always unlocked by a confirmed gesture.
//        b. After any iOS audio interruption the context is re-suspended.
//           The next tap re-kicks it before the React gesture handler fires,
//           so sounds play correctly again without requiring an app restart.
//      Normal taps where the context is already running hit only a single
//      property check and return — no meaningful overhead.
//   3. Re-resuming on visibilitychange as an additional safety net when
//      returning from the background.
let _ctx = null

export function getAudioCtx() {
  if (!_ctx || _ctx.state === 'closed') {
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
    if (_ctx && _ctx.state === 'running') return
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
