import { getCell, getAllCandidates } from '../BoardState.js'
import { hasNote } from '../NotesModel.js'
import { EMPTY } from '../CellModel.js'

export function detect(board) {
  const cands = getAllCandidates(board)
  const get = (r, c) => cands[r * 9 + c]

  for (let digit = 1; digit <= 9; digit++) {
    // Row-based: three rows where the digit spans exactly three columns
    const rowCols = []
    for (let r = 0; r < 9; r++) {
      const cols = []
      for (let c = 0; c < 9; c++)
        if (getCell(board, r, c).value === EMPTY && hasNote(get(r, c), digit)) cols.push(c)
      rowCols.push(cols)
    }

    for (let r1 = 0; r1 < 7; r1++) {
      if (rowCols[r1].length < 2 || rowCols[r1].length > 3) continue
      for (let r2 = r1 + 1; r2 < 8; r2++) {
        if (rowCols[r2].length < 2 || rowCols[r2].length > 3) continue
        for (let r3 = r2 + 1; r3 < 9; r3++) {
          if (rowCols[r3].length < 2 || rowCols[r3].length > 3) continue
          const colSet = [...new Set([...rowCols[r1], ...rowCols[r2], ...rowCols[r3]])].sort((a, b) => a - b)
          if (colSet.length !== 3) continue
          const [c1, c2, c3] = colSet
          const elims = []
          for (let r = 0; r < 9; r++) {
            if (r === r1 || r === r2 || r === r3) continue
            for (const c of [c1, c2, c3])
              if (getCell(board, r, c).value === EMPTY && hasNote(get(r, c), digit))
                elims.push({ row: r, col: c })
          }
          if (elims.length > 0) {
            return {
              technique: 'Swordfish',
              cellsInvolved: [
                ...rowCols[r1].map(c => ({ row: r1, col: c })),
                ...rowCols[r2].map(c => ({ row: r2, col: c })),
                ...rowCols[r3].map(c => ({ row: r3, col: c })),
                ...elims,
              ],
              affectedDigits: [digit],
              explanation: `${digit} in rows ${r1+1}, ${r2+1}, and ${r3+1} is confined to columns ${c1+1}, ${c2+1}, and ${c3+1}. This Swordfish pattern means ${digit} can be removed from those columns elsewhere.`,
              recommendedAction: `Remove ${digit} from ${elims.map(c => `R${c.row+1}C${c.col+1}`).join(', ')}`,
            }
          }
        }
      }
    }

    // Column-based: three columns where the digit spans exactly three rows
    const colRows = []
    for (let c = 0; c < 9; c++) {
      const rows = []
      for (let r = 0; r < 9; r++)
        if (getCell(board, r, c).value === EMPTY && hasNote(get(r, c), digit)) rows.push(r)
      colRows.push(rows)
    }

    for (let c1 = 0; c1 < 7; c1++) {
      if (colRows[c1].length < 2 || colRows[c1].length > 3) continue
      for (let c2 = c1 + 1; c2 < 8; c2++) {
        if (colRows[c2].length < 2 || colRows[c2].length > 3) continue
        for (let c3 = c2 + 1; c3 < 9; c3++) {
          if (colRows[c3].length < 2 || colRows[c3].length > 3) continue
          const rowSet = [...new Set([...colRows[c1], ...colRows[c2], ...colRows[c3]])].sort((a, b) => a - b)
          if (rowSet.length !== 3) continue
          const [r1, r2, r3] = rowSet
          const elims = []
          for (let c = 0; c < 9; c++) {
            if (c === c1 || c === c2 || c === c3) continue
            for (const r of [r1, r2, r3])
              if (getCell(board, r, c).value === EMPTY && hasNote(get(r, c), digit))
                elims.push({ row: r, col: c })
          }
          if (elims.length > 0) {
            return {
              technique: 'Swordfish',
              cellsInvolved: [
                ...colRows[c1].map(r => ({ row: r, col: c1 })),
                ...colRows[c2].map(r => ({ row: r, col: c2 })),
                ...colRows[c3].map(r => ({ row: r, col: c3 })),
                ...elims,
              ],
              affectedDigits: [digit],
              explanation: `${digit} in columns ${c1+1}, ${c2+1}, and ${c3+1} is confined to rows ${r1+1}, ${r2+1}, and ${r3+1}. This Swordfish pattern means ${digit} can be removed from those rows elsewhere.`,
              recommendedAction: `Remove ${digit} from ${elims.map(c => `R${c.row+1}C${c.col+1}`).join(', ')}`,
            }
          }
        }
      }
    }
  }

  return null
}
