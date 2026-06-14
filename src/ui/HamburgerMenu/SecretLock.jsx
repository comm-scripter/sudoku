import { useState, useRef, useCallback } from 'react'
import { SECRET_PAYLOADS } from '../../config/secretMessage.js'
import styles from './HamburgerMenu.module.css'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')

function fromB64(s) {
  const binary = atob(s)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function decryptMessage(code) {
  const subtle = window.crypto.subtle
  const keyMaterial = await subtle.importKey(
    'raw',
    new TextEncoder().encode(code),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  for (const { iterations, salt, iv, ciphertext } of SECRET_PAYLOADS) {
    try {
      const key = await subtle.deriveKey(
        { name: 'PBKDF2', salt: fromB64(salt), iterations, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      )
      const plain = await subtle.decrypt(
        { name: 'AES-GCM', iv: fromB64(iv) },
        key,
        fromB64(ciphertext)
      )
      return new TextDecoder().decode(plain)
    } catch {
      // wrong payload for this code, try the next one
    }
  }
  throw new Error('no matching payload')
}

function Wheel({ char, onPrev, onNext }) {
  const idx = CHARS.indexOf(char)
  const prevChar = CHARS[(idx - 1 + CHARS.length) % CHARS.length]
  const nextChar = CHARS[(idx + 1) % CHARS.length]
  const animKey = useRef(0)
  const prevCharRef = useRef(char)
  if (prevCharRef.current !== char) {
    animKey.current += 1
    prevCharRef.current = char
  }

  const touchStartY = useRef(null)
  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY }
  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return
    const delta = touchStartY.current - e.changedTouches[0].clientY
    if (Math.abs(delta) > 10) delta > 0 ? onNext() : onPrev()
    touchStartY.current = null
  }

  return (
    <div className={styles.wheel} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <button className={styles.wheelArrow} onClick={onPrev} aria-label="Previous">▲</button>
      <div className={styles.wheelDrum}>
        <span className={styles.wheelAdjacent}>{prevChar}</span>
        <span className={styles.wheelCurrent} key={animKey.current}>{char}</span>
        <span className={styles.wheelAdjacent}>{nextChar}</span>
      </div>
      <button className={styles.wheelArrow} onClick={onNext} aria-label="Next">▼</button>
    </div>
  )
}

export function SecretLock() {
  const [indices, setIndices] = useState(() => Array(5).fill(0))
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')
  const [shake, setShake] = useState(false)

  const shift = (wheelIdx, delta) => {
    setIndices(prev => prev.map((v, i) =>
      i === wheelIdx ? (v + delta + CHARS.length) % CHARS.length : v
    ))
  }

  const code = indices.map(i => CHARS[i]).join('')

  const handleSubmit = useCallback(async () => {
    setStatus('loading')
    try {
      const text = await decryptMessage(code)
      setMessage(text)
      setStatus('success')
    } catch (err) {
      if (!window.crypto?.subtle) {
        console.error('[SecretLock] Web Crypto API unavailable — page must be served over HTTPS or localhost')
      }
      setStatus('error')
      setShake(true)
      setTimeout(() => { setShake(false); setStatus('idle') }, 600)
    }
  }, [code])

  if (status === 'success') {
    return (
      <div className={styles.secretMessage}>
        <div className={styles.secretReveal}>{message}</div>
      </div>
    )
  }

  return (
    <div className={styles.secretLock}>
      <p className={styles.lockHint}>Enter the secret code</p>
      <div className={`${styles.wheels} ${shake ? styles.shake : ''}`}>
        {indices.map((idx, i) => (
          <Wheel
            key={i}
            char={CHARS[idx]}
            onPrev={() => shift(i, -1)}
            onNext={() => shift(i, 1)}
          />
        ))}
      </div>
      {status === 'error' && <p className={styles.lockError}>Incorrect code</p>}
      <button className={styles.lockBtn} onClick={handleSubmit} disabled={status === 'loading'}>
        {status === 'loading' ? 'Unlocking…' : 'Unlock'}
      </button>
    </div>
  )
}
