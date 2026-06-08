import { getCell, getAllCandidates } from '../BoardState.js'
import { hasNote } from '../NotesModel.js'
import { EMPTY } from '../CellModel.js'

export function detect(board) {
  const cands = getAllCandidates(board)
  const get = (r, c) => cands[r * 9 + c]

  // Pointing Pairs / Triplets: digit confined to one row or column within a box
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      for (let digit = 1; digit <= 9; digit++) {
        const boxCells = []
        for (let r = br * 3; r < br * 3 + 3; r++)
          for (let c = bc * 3; c < bc * 3 + 3; c++)
            if (getCell(board, r, c).value === EMPTY && hasNote(get(r, c), digit))
              boxCells.push({ row: r, col: c })

        if (boxCells.length < 2 || boxCells.length > 3) continue

        const uniqueRows = [...new Set(boxCells.map(c => c.row))]
        if (uniqueRows.length === 1) {
          const row = uniqueRows[0]
          const elims = []
          for (let col = 0; col < 9; col++) {
            if (Math.floor(col / 3) === bc) continue
            if (getCell(board, row, col).value === EMPTY && hasNote(get(row, col), digit))
              elims.push({ row, col })
          }
          if (elims.length > 0) {
            const box = br * 3 + bc + 1
            const name = boxCells.length === 2 ? 'Pointing Pair' : 'Pointing Triple'
            return {
              technique: name,
              cellsInvolved: [...boxCells, ...elims],
              affectedDigits: [digit],
              explanation: `In box ${box}, ${digit} only appears in row ${row + 1}. It can be removed from the rest of row ${row + 1} outside that box.`,
              recommendedAction: `Remove ${digit} from ${elims.map(c => `R${c.row + 1}C${c.col + 1}`).join(', ')}`,
            }
          }
        }

        const uniqueCols = [...new Set(boxCells.map(c => c.col))]
        if (uniqueCols.length === 1) {
          const col = uniqueCols[0]
          const elims = []
          for (let row = 0; row < 9; row++) {
            if (Math.floor(row / 3) === br) continue
            if (getCell(board, row, col).value === EMPTY && hasNote(get(row, col), digit))
              elims.push({ row, col })
          }
          if (elims.length > 0) {
            const box = br * 3 + bc + 1
            const name = boxCells.length === 2 ? 'Pointing Pair' : 'Pointing Triple'
            return {
              technique: name,
              cellsInvolved: [...boxCells, ...elims],
              affectedDigits: [digit],
              explanation: `In box ${box}, ${digit} only appears in column ${col + 1}. It can be removed from the rest of column ${col + 1} outside that box.`,
              recommendedAction: `Remove ${digit} from ${elims.map(c => `R${c.row + 1}C${c.col + 1}`).join(', ')}`,
            }
          }
        }
      }
    }
  }

  // Box-Line Reduction: digit confined to one box within a row or column
  for (let row = 0; row < 9; row++) {
    for (let digit = 1; digit <= 9; digit++) {
      const rowCells = []
      for (let col = 0; col < 9; col++)
        if (getCell(board, row, col).value === EMPTY && hasNote(get(row, col), digit))
          rowCells.push({ row, col })
      if (rowCells.length === 0) continue
      const boxCols = [...new Set(rowCells.map(c => Math.floor(c.col / 3)))]
      if (boxCols.length !== 1) continue
      const bc = boxCols[0], br = Math.floor(row / 3)
      const elims = []
      for (let r = br * 3; r < br * 3 + 3; r++) {
        if (r === row) continue
        for (let c = bc * 3; c < bc * 3 + 3; c++)
          if (getCell(board, r, c).value === EMPTY && hasNote(get(r, c), digit))
            elims.push({ row: r, col: c })
      }
      if (elims.length > 0) {
        const box = br * 3 + bc + 1
        return {
          technique: 'Box-Line Reduction',
          cellsInvolved: [...rowCells, ...elims],
          affectedDigits: [digit],
          explanation: `In row ${row + 1}, ${digit} only appears within box ${box}. It can be removed from other cells in box ${box} outside row ${row + 1}.`,
          recommendedAction: `Remove ${digit} from ${elims.map(c => `R${c.row + 1}C${c.col + 1}`).join(', ')}`,
        }
      }
    }
  }

  for (let col = 0; col < 9; col++) {
    for (let digit = 1; digit <= 9; digit++) {
      const colCells = []
      for (let row = 0; row < 9; row++)
        if (getCell(board, row, col).value === EMPTY && hasNote(get(row, col), digit))
          colCells.push({ row, col })
      if (colCells.length === 0) continue
      const boxRows = [...new Set(colCells.map(c => Math.floor(c.row / 3)))]
      if (boxRows.length !== 1) continue
      const br = boxRows[0], bc = Math.floor(col / 3)
      const elims = []
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          if (c === col) continue
          if (getCell(board, r, c).value === EMPTY && hasNote(get(r, c), digit))
            elims.push({ row: r, col: c })
        }
      }
      if (elims.length > 0) {
        const box = br * 3 + bc + 1
        return {
          technique: 'Box-Line Reduction',
          cellsInvolved: [...colCells, ...elims],
          affectedDigits: [digit],
          explanation: `In column ${col + 1}, ${digit} only appears within box ${box}. It can be removed from other cells in box ${box} outside column ${col + 1}.`,
          recommendedAction: `Remove ${digit} from ${elims.map(c => `R${c.row + 1}C${c.col + 1}`).join(', ')}`,
        }
      }
    }
  }

  return null
}
