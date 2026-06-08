import { getCell, getAllCandidates } from '../BoardState.js'
import { hasNote, getNotes, countNotes } from '../NotesModel.js'
import { EMPTY } from '../CellModel.js'

function sees(r1, c1, r2, c2) {
  return r1 === r2 || c1 === c2 ||
    (Math.floor(r1 / 3) === Math.floor(r2 / 3) && Math.floor(c1 / 3) === Math.floor(c2 / 3))
}

/** Returns true if every cell in groupA sees every cell in groupB that has the given digit. */
function isRestricted(digit, groupA, groupB, get) {
  const aHas = groupA.filter(c => hasNote(get(c.row, c.col), digit))
  const bHas = groupB.filter(c => hasNote(get(c.row, c.col), digit))
  if (aHas.length === 0 || bHas.length === 0) return false
  for (const a of aHas)
    for (const b of bHas)
      if (!sees(a.row, a.col, b.row, b.col)) return false
  return true
}

/**
 * Almost Locked Sets (ALS-XZ):
 * ALS-A (n cells, n+1 candidates) and ALS-B (m cells, m+1 candidates) share:
 *   - A restricted common digit X: every X in A sees every X in B
 *   - A shared digit Z (not restricted)
 * Any cell outside both ALS seeing all Z-cells in A and all Z-cells in B can have Z eliminated.
 */
export function detect(board) {
  const cands = getAllCandidates(board)
  const get = (r, c) => cands[r * 9 + c]

  // Collect ALS of size 1 (bivalue cells) and size 2 (2 cells in a region with 3 candidates)
  const alsSets = []

  // Size-1 ALS: any cell with exactly 2 candidates
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (getCell(board, r, c).value !== EMPTY && countNotes(get(r, c)) !== 2) continue
      if (getCell(board, r, c).value === EMPTY && countNotes(get(r, c)) === 2)
        alsSets.push({ cells: [{ row: r, col: c }], digits: getNotes(get(r, c)) })
    }
  }

  // Size-2 ALS: two cells in the same region sharing exactly 3 candidates
  const regions = buildRegions()
  for (const region of regions) {
    const empty = region.cells.filter(({ row, col }) => getCell(board, row, col).value === EMPTY)
    for (let i = 0; i < empty.length - 1; i++) {
      for (let j = i + 1; j < empty.length; j++) {
        const a = empty[i], b = empty[j]
        const combined = getNotes(get(a.row, a.col) | get(b.row, b.col))
        if (combined.length === 3)
          alsSets.push({ cells: [a, b], digits: combined })
      }
    }
  }

  // Try all pairs of ALS for ALS-XZ
  for (let i = 0; i < alsSets.length - 1; i++) {
    const alsA = alsSets[i]
    for (let j = i + 1; j < alsSets.length; j++) {
      const alsB = alsSets[j]

      // Must not share any cell
      const aKeys = new Set(alsA.cells.map(c => c.row * 9 + c.col))
      if (alsB.cells.some(c => aKeys.has(c.row * 9 + c.col))) continue

      // Find common digits
      const common = alsA.digits.filter(d => alsB.digits.includes(d))
      if (common.length < 2) continue

      // Try each common digit as X (restricted) and each other common as Z
      for (const x of common) {
        if (!isRestricted(x, alsA.cells, alsB.cells, get)) continue

        for (const z of common) {
          if (z === x) continue

          // Collect Z-cells from both ALS
          const zCellsA = alsA.cells.filter(c => hasNote(get(c.row, c.col), z))
          const zCellsB = alsB.cells.filter(c => hasNote(get(c.row, c.col), z))
          if (zCellsA.length === 0 || zCellsB.length === 0) continue

          // Find cells outside both ALS that see all Z-cells in both groups
          const allALSKeys = new Set([...alsA.cells, ...alsB.cells].map(c => c.row * 9 + c.col))
          const elims = []
          for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
              if (getCell(board, r, c).value !== EMPTY) continue
              if (allALSKeys.has(r * 9 + c)) continue
              if (!hasNote(get(r, c), z)) continue
              const seesAllA = zCellsA.every(a => sees(r, c, a.row, a.col))
              const seesAllB = zCellsB.every(b => sees(r, c, b.row, b.col))
              if (seesAllA && seesAllB) elims.push({ row: r, col: c })
            }
          }

          if (elims.length > 0) {
            const allPatternCells = [...alsA.cells, ...alsB.cells]
            return {
              technique: 'Almost Locked Set (ALS)',
              cellsInvolved: [...allPatternCells, ...elims],
              affectedDigits: [z],
              explanation: `ALS-XZ: Two Almost Locked Sets share restricted digit ${x} (every ${x} in one set sees every ${x} in the other) and common digit ${z}. Any cell seeing all ${z}s in both sets cannot be ${z}.`,
              recommendedAction: `Remove ${z} from ${elims.map(c => `R${c.row+1}C${c.col+1}`).join(', ')}`,
            }
          }
        }
      }
    }
  }

  return null
}

function buildRegions() {
  const regions = []
  for (let r = 0; r < 9; r++)
    regions.push({ cells: Array.from({ length: 9 }, (_, c) => ({ row: r, col: c })) })
  for (let c = 0; c < 9; c++)
    regions.push({ cells: Array.from({ length: 9 }, (_, r) => ({ row: r, col: c })) })
  for (let br = 0; br < 3; br++)
    for (let bc = 0; bc < 3; bc++) {
      const cells = []
      for (let r = br * 3; r < br * 3 + 3; r++)
        for (let c = bc * 3; c < bc * 3 + 3; c++)
          cells.push({ row: r, col: c })
      regions.push({ cells })
    }
  return regions
}
