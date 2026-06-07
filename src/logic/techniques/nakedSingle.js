import { getCell, getCandidates } from '../BoardState.js'
import { getNotes } from '../NotesModel.js'
import { EMPTY } from '../CellModel.js'

/**
 * Naked Single: a cell has exactly one legal candidate.
 */
export function detect(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (getCell(board, row, col).value !== EMPTY) continue
      const notes = getNotes(getCandidates(board, row, col))
      if (notes.length === 1) {
        const [d] = notes
        return {
          technique: 'Naked Single',
          cellsInvolved: [{ row, col }],
          affectedDigits: [d],
          explanation: `Cell R${row + 1}C${col + 1} can only contain ${d} — every other digit already appears in its row, column, or box.`,
          recommendedAction: `Place ${d} in R${row + 1}C${col + 1}`,
        }
      }
    }
  }
  return null
}
