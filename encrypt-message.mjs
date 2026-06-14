/**
 * Usage:
 *   node encrypt-message.mjs "YOURCODE" "Your secret message here"
 *
 * The code must be 5 characters, A-Z or 0-9 (case-insensitive).
 * Paste the JSON output into src/config/secretMessage.js.
 */

import { webcrypto } from 'node:crypto'
const { subtle } = webcrypto
const getRandomValues = (buf) => webcrypto.getRandomValues(buf)

const PBKDF2_ITERATIONS = 310_000  // must match the value in the app

function toB64(buf) {
  return Buffer.from(buf).toString('base64')
}

async function encrypt(code, message) {
  const salt = getRandomValues(new Uint8Array(16))
  const iv   = getRandomValues(new Uint8Array(12))

  const keyMaterial = await subtle.importKey(
    'raw',
    new TextEncoder().encode(code),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  const key = await subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )

  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(message)
  )

  return {
    iterations: PBKDF2_ITERATIONS,
    salt:       toB64(salt),
    iv:         toB64(iv),
    ciphertext: toB64(ciphertext),
  }
}

// ── main ──────────────────────────────────────────────────────────────────────

const [,, code, message] = process.argv

if (!code || !message) {
  console.error('Usage: node encrypt-message.mjs "YOURCODE" "Your secret message"')
  process.exit(1)
}

const normalized = code.toUpperCase()

if (normalized.length !== 5 || !/^[A-Z0-9]{5}$/.test(normalized)) {
  console.error('Code must be exactly 5 characters, letters A-Z or digits 0-9.')
  process.exit(1)
}

const payload = await encrypt(normalized, message)

console.log('\nPaste this object into src/config/secretMessage.js:\n')
console.log('export const SECRET_PAYLOAD =', JSON.stringify(payload, null, 2))
console.log('\nDone. Do not share the code or the plaintext message.\n')
