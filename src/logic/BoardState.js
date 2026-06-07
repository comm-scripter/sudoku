import { createCell, cloneCell, EMPTY } from './CellModel.js'
import { addNote } from './NotesModel.js'

// ─── Construction ──────────────────────────────────────────────────────────

export function createBoard(puzzleString = '0'.repeat(81)) {
  const cells = Array.from({ length: 81 }, (_, i) => {
    const digit = parseInt(puzzleString[i], 10)
    return createCell(isNaN(digit) ? EMPTY : digit, digit > 0)
  })
  return { cells }
}

export function cloneBoard(board) {
  return { cells: board.cells.map(cloneCell) }
}

// ─── Cell access ───────────────────────────────────────────────────────────

export function getCell(board, row, col) {
  return board.cells[row * 9 + col]
}

/** Returns a new board with one cell replaced (does not mutate). */
export function setCell(board, row, col, cell) {
  const cells = [...board.cells]
  cells[row * 9 + col] = { ...cell }
  return { cells }
}

// ─── Peer helpers ──────────────────────────────────────────────────────────

/** Returns the 20 peer indices for (row, col) — same row, col, and 3×3 box. */
export function getPeerIndices(row, col) {
  const peers = new Set()
  for (let i = 0; i < 9; i++) {
    peers.add(row * 9 + i)
    peers.add(i * 9 + col)
  }
  const br = Math.floor(row / 3) * 3
  const bc = Math.floor(col / 3) * 3
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      peers.add(r * 9 + c)
  peers.delete(row * 9 + col)
  return [...peers]
}

/** Bitmask of digits that can legally go in (row, col). */
export function getCandidates(board, row, col) {
  if (board.cells[row * 9 + col].value !== EMPTY) return 0
  const used = new Set()
  for (const idx of getPeerIndices(row, col)) {
    const v = board.cells[idx].value
    if (v) used.add(v)
  }
  let mask = 0
  for (let d = 1; d <= 9; d++) if (!used.has(d)) mask = addNote(mask, d)
  return mask
}

/** Full 81-entry candidates array — used by technique detectors. */
export function getAllCandidates(board) {
  return Array.from({ length: 81 }, (_, i) =>
    getCandidates(board, Math.floor(i / 9), i % 9)
  )
}

// ─── Validation ────────────────────────────────────────────────────────────

export function isCellValid(board, row, col) {
  const v = board.cells[row * 9 + col].value
  if (!v) return true
  return getPeerIndices(row, col).every(idx => board.cells[idx].value !== v)
}

export function isBoardComplete(board) {
  return board.cells.every(c => c.value !== EMPTY && !c.isError)
}

// ─── Serialisation ─────────────────────────────────────────────────────────

export function toBoardString(board) {
  return board.cells.map(c => c.value).join('')
}
