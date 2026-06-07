export const EMPTY_NOTES = 0

export const hasNote    = (mask, digit) => ((mask >>> (digit - 1)) & 1) === 1
export const addNote    = (mask, digit) => mask | (1 << (digit - 1))
export const removeNote = (mask, digit) => mask & ~(1 << (digit - 1))
export const toggleNote = (mask, digit) => mask ^ (1 << (digit - 1))

export function getNotes(mask) {
  const digits = []
  for (let d = 1; d <= 9; d++) {
    if (hasNote(mask, d)) digits.push(d)
  }
  return digits
}

export function notesFromSet(digits) {
  return digits.reduce((m, d) => addNote(m, d), 0)
}

export function countNotes(mask) {
  let n = mask >>> 0, c = 0
  while (n) { c += n & 1; n >>>= 1 }
  return c
}
