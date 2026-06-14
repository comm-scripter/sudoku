import { useState, useRef, useCallback, useEffect } from 'react'
import { SECRET_PAYLOADS } from '../../config/secretMessage.js'
import styles from './HamburgerMenu.module.css'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')
const N = CHARS.length
const ANGLE_STEP  = 25    // degrees between adjacent items on the drum
const RADIUS      = 78    // cylinder radius in px
const CELL_HEIGHT = 44    // visual height per slot in px — must match .drumItem CSS
const FRICTION    = 0.87  // velocity multiplier per inertia frame

// ── Crypto helpers ─────────────────────────────────────────────────────────────

function fromB64(s) {
  const binary = atob(s)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function decryptMessage(code) {
  const subtle = window.crypto.subtle
  const keyMaterial = await subtle.importKey(
    'raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey']
  )
  for (const { iterations, salt, iv, ciphertext } of SECRET_PAYLOADS) {
    try {
      const key = await subtle.deriveKey(
        { name: 'PBKDF2', salt: fromB64(salt), iterations, hash: 'SHA-256' },
        keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
      )
      const plain = await subtle.decrypt(
        { name: 'AES-GCM', iv: fromB64(iv) }, key, fromB64(ciphertext)
      )
      return new TextDecoder().decode(plain)
    } catch {
      // wrong payload — try next
    }
  }
  throw new Error('no match')
}

// ── DrumWheel ──────────────────────────────────────────────────────────────────

const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator

function haptic(ms = 6) {
  if (canVibrate) navigator.vibrate(ms)
}

// Web Audio click — works on iOS where Vibration API is unavailable.
// AudioContext is created lazily on first user gesture so autoplay policy is satisfied.
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

function playClick(gain = 0.18) {
  const ctx = getAudioCtx()
  if (!ctx) return
  const t = ctx.currentTime
  // Short noise burst shaped with a cubic decay envelope — sounds like a detent click
  const length = Math.ceil(ctx.sampleRate * 0.025)
  const buf = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3)
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 1400
  filter.Q.value = 0.8
  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(gain, t)
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.025)
  src.connect(filter)
  filter.connect(gainNode)
  gainNode.connect(ctx.destination)
  src.start(t)
}

function DrumWheel({ index, onChange }) {
  const offsetRef   = useRef(index)   // continuous float scroll position
  const velRef      = useRef(0)
  const rafRef      = useRef(null)
  const touchRef    = useRef(null)
  const viewportRef = useRef(null)
  const lastTickRef = useRef(Math.round(index))  // last integer boundary we pulsed at
  const [displayOffset, setDisplayOffset] = useState(index)

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  function checkTick(newOffset) {
    const rounded = Math.round(newOffset)
    if (rounded !== lastTickRef.current) {
      lastTickRef.current = rounded
      haptic(6)
      playClick(0.18)
    }
  }

  function snapTo(target) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const from = offsetRef.current
    const t0   = performance.now()
    const tick = (now) => {
      const p   = Math.min((now - t0) / 220, 1)
      const eased = 1 - (1 - p) ** 3        // ease-out cubic
      const pos = from + (target - from) * eased
      checkTick(pos)
      offsetRef.current = pos
      setDisplayOffset(pos)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        offsetRef.current = target
        setDisplayOffset(target)
        haptic(12)
        playClick(0.28)  // slightly louder on final snap
        onChange(((Math.round(target) % N) + N) % N)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  function releaseInertia() {
    const tick = () => {
      velRef.current    *= FRICTION
      offsetRef.current += velRef.current
      checkTick(offsetRef.current)
      setDisplayOffset(offsetRef.current)
      if (Math.abs(velRef.current) > 0.015) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        snapTo(Math.round(offsetRef.current))
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  function step(delta) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    snapTo(Math.round(offsetRef.current) + delta)
  }

  function handleTouchStart(e) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    velRef.current = 0
    const y = e.touches[0].clientY
    touchRef.current = { startY: y, startOff: offsetRef.current, lastY: y, lastT: performance.now() }
  }

  function handleTouchEnd() {
    touchRef.current = null
    releaseInertia()
  }

  function handleMouseDown(e) {
    if (e.button !== 0) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    velRef.current = 0
    const y = e.clientY
    touchRef.current = { startY: y, startOff: offsetRef.current, lastY: y, lastT: performance.now() }

    const onMove = (e) => {
      if (!touchRef.current) return
      const y   = e.clientY
      const now = performance.now()
      const dt  = now - touchRef.current.lastT
      const newOff = touchRef.current.startOff + (touchRef.current.startY - y) / CELL_HEIGHT
      if (dt > 0) velRef.current = (newOff - offsetRef.current) / dt * 16
      checkTick(newOff)
      offsetRef.current = newOff
      setDisplayOffset(newOff)
      touchRef.current.lastY = y
      touchRef.current.lastT = now
    }
    const onUp = () => {
      touchRef.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      releaseInertia()
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // non-passive touchmove so we can preventDefault and stop the drawer scrolling
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onMove = (e) => {
      if (!touchRef.current) return
      e.preventDefault()
      const y   = e.touches[0].clientY
      const now = performance.now()
      const dt  = now - touchRef.current.lastT
      const newOff = touchRef.current.startOff + (touchRef.current.startY - y) / CELL_HEIGHT
      if (dt > 0) velRef.current = (newOff - offsetRef.current) / dt * 16
      checkTick(newOff)
      offsetRef.current = newOff
      setDisplayOffset(newOff)
      touchRef.current.lastY = y
      touchRef.current.lastT = now
    }
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [])

  // render items on the drum surface
  const base  = Math.floor(displayOffset)
  const items = []
  for (let i = -3; i <= 4; i++) {
    const absIdx  = base + i
    const charIdx = ((absIdx % N) + N) % N
    const relPos  = absIdx - displayOffset
    const angle   = -relPos * ANGLE_STEP
    if (Math.abs(angle) >= 90) continue
    // opacity derived from cosine — naturally full at 0°, zero at 90°
    const opacity = Math.max(0, Math.cos((angle * Math.PI) / 180))
    items.push(
      <div
        key={absIdx}
        className={styles.drumItem}
        style={{ transform: `rotateX(${angle}deg) translateZ(${RADIUS}px)`, opacity }}
      >
        {CHARS[charIdx]}
      </div>
    )
  }

  return (
    <div className={styles.wheel}>
      <button className={styles.wheelArrow} onClick={() => step(1)} aria-label="Next">▲</button>
      <div
        ref={viewportRef}
        className={styles.drumViewport}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.drumScene}>{items}</div>
        <div className={styles.drumSelector} aria-hidden="true" />
      </div>
      <button className={styles.wheelArrow} onClick={() => step(-1)} aria-label="Previous">▼</button>
    </div>
  )
}

// ── SecretLock ─────────────────────────────────────────────────────────────────

export function SecretLock() {
  const [indices, setIndices] = useState(() => Array(5).fill(0))
  const [status,  setStatus]  = useState('idle')
  const [message, setMessage] = useState('')
  const [shake,   setShake]   = useState(false)

  const setIndex = useCallback((wheelIdx, newIdx) => {
    setIndices(prev => prev.map((v, i) => i === wheelIdx ? newIdx : v))
  }, [])

  const code = indices.map(i => CHARS[i]).join('')

  const handleSubmit = useCallback(async () => {
    setStatus('loading')
    try {
      const text = await decryptMessage(code)
      setMessage(text)
      setStatus('success')
    } catch {
      if (!window.crypto?.subtle) {
        console.error('[SecretLock] Web Crypto unavailable — serve over HTTPS or localhost')
      }
      setStatus('error')
      setShake(true)
      setTimeout(() => { setShake(false); setStatus('idle') }, 600)
    }
  }, [code])

  return (
    <div className={styles.secretLock}>
      <div className={styles.secretDisplay}>
        {status === 'success'
          ? <span className={styles.secretReveal}>{message}</span>
          : <span className={styles.secretPlaceholder}>Enter code for secret message</span>
        }
      </div>
      <div className={`${styles.wheels} ${shake ? styles.shake : ''}`}>
        {indices.map((idx, i) => (
          <DrumWheel key={i} index={idx} onChange={(newIdx) => setIndex(i, newIdx)} />
        ))}
      </div>
      {status === 'error' && <p className={styles.lockError}>Incorrect code</p>}
      <button className={styles.lockBtn} onClick={handleSubmit} disabled={status === 'loading'}>
        {status === 'loading' ? 'Unlocking…' : 'Unlock'}
      </button>
    </div>
  )
}
