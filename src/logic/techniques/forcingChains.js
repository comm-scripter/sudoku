import { getCell, getCandidates, getAllCandidates } from '../BoardState.js'
import { getNotes, countNotes } from '../NotesModel.js'
import { EMPTY } from '../CellModel.js'

/**
 * Propagates naked singles starting from placing `digit` in (seedRow, seedCol).
 * Returns { contradiction, placements } where placements maps cell index → digit.
 */
function propagate(board, seedRow, seedCol, digit) {
  const cells = board.cells.map(c => ({ ...c }))
  cells[seedRow * 9 + seedCol] = { ...cells[seedRow * 9 + seedCol], value: digit }
  const b = { cells }
  const placements = { [seedRow * 9 + seedCol]: digit }

  let changed = true
  while (changed) {
    changed = false
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b.cells[r * 9 + c].value !== EMPTY) continue
        const mask = getCandidates(b, r, c)
        if (mask === 0) return { contradiction: true, placements }
        if (countNotes(mask) === 1) {
          const [d] = getNotes(mask)
          b.cells[r * 9 + c] = { ...b.cells[r * 9 + c], value: d }
          placements[r * 9 + c] = d
          changed = true
        }
      }
    }
  }

  return { contradiction: false, placements }
}

/**
 * Forcing Chains: for each bivalue cell, assume each candidate in turn and
 * propagate naked singles. If one branch leads to a contradiction the other
 * must be true; if both branches agree on a value in some cell, that value
 * can be placed regardless.
 */
export function detect(board) {
  const cands = getAllCandidates(board)

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (getCell(board, r, c).value !== EMPTY) continue
      const mask = cands[r * 9 + c]
      if (countNotes(mask) !== 2) continue

      const [d1, d2] = getNotes(mask)
      const res1 = propagate(board, r, c, d1)
      const res2 = propagate(board, r, c, d2)

      if (res1.contradiction) {
        return {
          technique: 'Forcing Chain',
          cellsInvolved: [{ row: r, col: c }],
          affectedDigits: [d2],
          explanation: `Forcing Chain: placing ${d1} in R${r+1}C${c+1} leads to a contradiction, so R${r+1}C${c+1} must be ${d2}.`,
          recommendedAction: `Place ${d2} in R${r+1}C${c+1}`,
        }
      }

      if (res2.contradiction) {
        return {
          technique: 'Forcing Chain',
          cellsInvolved: [{ row: r, col: c }],
          affectedDigits: [d1],
          explanation: `Forcing Chain: placing ${d2} in R${r+1}C${c+1} leads to a contradiction, so R${r+1}C${c+1} must be ${d1}.`,
          recommendedAction: `Place ${d1} in R${r+1}C${c+1}`,
        }
      }

      // Check for common conclusions: a cell forced to the same digit in both branches
      for (const [cellKey, value] of Object.entries(res1.placements)) {
        const idx = Number(cellKey)
        if (idx === r * 9 + c) continue
        if (res2.placements[idx] === value) {
          const tr = Math.floor(idx / 9), tc = idx % 9
          return {
            technique: 'Forcing Chain',
            cellsInvolved: [{ row: r, col: c }, { row: tr, col: tc }],
            affectedDigits: [value],
            explanation: `Forcing Chain: whether R${r+1}C${c+1} is ${d1} or ${d2}, R${tr+1}C${tc+1} is always ${value}.`,
            recommendedAction: `Place ${value} in R${tr+1}C${tc+1}`,
          }
        }
      }
    }
  }

  return null
}
