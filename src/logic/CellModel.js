export const EMPTY = 0

export function createCell(value = EMPTY, isGiven = false) {
  return {
    value,           // 0 = empty, 1–9 = digit
    isGiven,         // given cells cannot be edited
    notes: 0,        // bitmask: bit (digit-1) set ⇒ that digit is a candidate
    isError: false,
    equation: null,  // algebraic equation string for clue cells (algebra mode)
    equationSolved: false,
  }
}

export function cloneCell(cell) {
  return { ...cell }
}
