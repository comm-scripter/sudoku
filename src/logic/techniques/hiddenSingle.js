import { getCell, getCandidates } from '../BoardState.js'
import { hasNote } from '../NotesModel.js'
import { EMPTY } from '../CellModel.js'

// Pre-built region definitions (rows, cols, boxes).
const REGIONS = buildRegions()

function buildRegions() {
  const regions = []
  for (let r = 0; r < 9; r++) {
    regions.push({ type: 'row', index: r, cells: Array.from({ length: 9 }, (_, c) => ({ row: r, col: c })) })
  }
  for (let c = 0; c < 9; c++) {
    regions.push({ type: 'col', index: c, cells: Array.from({ length: 9 }, (_, r) => ({ row: r, col: c })) })
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const cells = []
      for (let r = br * 3; r < br * 3 + 3; r++)
        for (let c = bc * 3; c < bc * 3 + 3; c++)
          cells.push({ row: r, col: c })
      regions.push({ type: 'box', index: br * 3 + bc, cells })
    }
  }
  return regions
}

/**
 * Hidden Single: within a row/col/box, a digit can go in exactly one cell.
 */
export function detect(board) {
  for (const region of REGIONS) {
    for (let digit = 1; digit <= 9; digit++) {
      const fits = region.cells.filter(({ row, col }) => {
        if (getCell(board, row, col).value !== EMPTY) return false
        return hasNote(getCandidates(board, row, col), digit)
      })
      if (fits.length === 1) {
        const { row, col } = fits[0]
        const regionLabel =
          region.type === 'row' ? `Row ${region.index + 1}`
          : region.type === 'col' ? `Column ${region.index + 1}`
          : `Box ${region.index + 1}`
        return {
          technique: 'Hidden Single',
          cellsInvolved: [{ row, col }],
          affectedDigits: [digit],
          explanation: `${digit} can only go in R${row + 1}C${col + 1} within ${regionLabel} — no other cell in that region can hold it.`,
          recommendedAction: `Place ${digit} in R${row + 1}C${col + 1}`,
        }
      }
    }
  }
  return null
}
