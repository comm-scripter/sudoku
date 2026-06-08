import { getCell, getAllCandidates } from '../BoardState.js'
import { hasNote } from '../NotesModel.js'
import { EMPTY } from '../CellModel.js'

export function detect(board) {
  const cands = getAllCandidates(board)
  const get = (r, c) => cands[r * 9 + c]

  for (let digit = 1; digit <= 9; digit++) {
    // Row-based: find two rows where the digit is confined to the same two columns
    const rowCols = []
    for (let r = 0; r < 9; r++) {
      const cols = []
      for (let c = 0; c < 9; c++)
        if (getCell(board, r, c).value === EMPTY && hasNote(get(r, c), digit)) cols.push(c)
      rowCols.push(cols)
    }

    for (let r1 = 0; r1 < 8; r1++) {
      if (rowCols[r1].length !== 2) continue
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        if (rowCols[r2].length !== 2) continue
        if (rowCols[r1][0] !== rowCols[r2][0] || rowCols[r1][1] !== rowCols[r2][1]) continue
        const [c1, c2] = rowCols[r1]
        const elims = []
        for (let r = 0; r < 9; r++) {
          if (r === r1 || r === r2) continue
          for (const c of [c1, c2])
            if (getCell(board, r, c).value === EMPTY && hasNote(get(r, c), digit))
              elims.push({ row: r, col: c })
        }
        if (elims.length > 0) {
          return {
            technique: 'X-Wing',
            cellsInvolved: [
              { row: r1, col: c1 }, { row: r1, col: c2 },
              { row: r2, col: c1 }, { row: r2, col: c2 },
              ...elims,
            ],
            affectedDigits: [digit],
            explanation: `${digit} appears in only two cells in rows ${r1+1} and ${r2+1}, both in columns ${c1+1} and ${c2+1}. This X-Wing locks ${digit} to those columns, so it can be removed from all other cells in those columns.`,
            recommendedAction: `Remove ${digit} from ${elims.map(c => `R${c.row+1}C${c.col+1}`).join(', ')}`,
          }
        }
      }
    }

    // Column-based: find two columns where the digit is confined to the same two rows
    const colRows = []
    for (let c = 0; c < 9; c++) {
      const rows = []
      for (let r = 0; r < 9; r++)
        if (getCell(board, r, c).value === EMPTY && hasNote(get(r, c), digit)) rows.push(r)
      colRows.push(rows)
    }

    for (let c1 = 0; c1 < 8; c1++) {
      if (colRows[c1].length !== 2) continue
      for (let c2 = c1 + 1; c2 < 9; c2++) {
        if (colRows[c2].length !== 2) continue
        if (colRows[c1][0] !== colRows[c2][0] || colRows[c1][1] !== colRows[c2][1]) continue
        const [r1, r2] = colRows[c1]
        const elims = []
        for (let c = 0; c < 9; c++) {
          if (c === c1 || c === c2) continue
          for (const r of [r1, r2])
            if (getCell(board, r, c).value === EMPTY && hasNote(get(r, c), digit))
              elims.push({ row: r, col: c })
        }
        if (elims.length > 0) {
          return {
            technique: 'X-Wing',
            cellsInvolved: [
              { row: r1, col: c1 }, { row: r1, col: c2 },
              { row: r2, col: c1 }, { row: r2, col: c2 },
              ...elims,
            ],
            affectedDigits: [digit],
            explanation: `${digit} appears in only two cells in columns ${c1+1} and ${c2+1}, both in rows ${r1+1} and ${r2+1}. This X-Wing locks ${digit} to those rows, so it can be removed from all other cells in those rows.`,
            recommendedAction: `Remove ${digit} from ${elims.map(c => `R${c.row+1}C${c.col+1}`).join(', ')}`,
          }
        }
      }
    }
  }

  return null
}
