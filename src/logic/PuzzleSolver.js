import { cloneBoard } from './BoardState.js'
import { createCell, EMPTY } from './CellModel.js'

/**
 * Returns a solved clone of `board`, or null if unsolvable.
 * Uses backtracking with MRV (minimum remaining values) heuristic.
 */
export function solve(board) {
  const clone = cloneBoard(board)
  return backtrack(clone.cells) ? clone : null
}

function backtrack(cells) {
  // Find the empty cell with the fewest candidates (MRV).
  let bestIdx = -1
  let bestCands = null

  for (let i = 0; i < 81; i++) {
    if (cells[i].value !== EMPTY) continue
    const cands = candidatesFor(cells, i)
    if (cands.length === 0) return false       // dead end
    if (bestIdx === -1 || cands.length < bestCands.length) {
      bestIdx = i
      bestCands = cands
      if (cands.length === 1) break            // can't do better
    }
  }

  if (bestIdx === -1) return true              // all cells filled

  for (const d of bestCands) {
    cells[bestIdx] = createCell(d, false)
    if (backtrack(cells)) return true
    cells[bestIdx] = createCell(EMPTY, false)
  }
  return false
}

function candidatesFor(cells, idx) {
  const row = Math.floor(idx / 9)
  const col = idx % 9
  const used = new Set()

  for (let c = 0; c < 9; c++) { const v = cells[row * 9 + c].value; if (v) used.add(v) }
  for (let r = 0; r < 9; r++) { const v = cells[r * 9 + col].value; if (v) used.add(v) }

  const br = Math.floor(row / 3) * 3
  const bc = Math.floor(col / 3) * 3
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++) { const v = cells[r * 9 + c].value; if (v) used.add(v) }

  const result = []
  for (let d = 1; d <= 9; d++) if (!used.has(d)) result.push(d)
  return result
}
