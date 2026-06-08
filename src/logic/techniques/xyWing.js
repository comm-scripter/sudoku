import { getCell, getAllCandidates } from '../BoardState.js'
import { hasNote, getNotes, countNotes } from '../NotesModel.js'
import { EMPTY } from '../CellModel.js'

function sees(r1, c1, r2, c2) {
  return r1 === r2 || c1 === c2 ||
    (Math.floor(r1 / 3) === Math.floor(r2 / 3) && Math.floor(c1 / 3) === Math.floor(c2 / 3))
}

export function detect(board) {
  const cands = getAllCandidates(board)
  const get = (r, c) => cands[r * 9 + c]

  // Collect all bivalue cells
  const bivalue = []
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (getCell(board, r, c).value === EMPTY && countNotes(get(r, c)) === 2)
        bivalue.push({ row: r, col: c, digits: getNotes(get(r, c)) })

  for (const pivot of bivalue) {
    const [x, y] = pivot.digits

    // Find pincers: bivalue cells that see the pivot and share exactly one digit with it
    for (const px of bivalue) {
      if (px === pivot) continue
      if (!sees(pivot.row, pivot.col, px.row, px.col)) continue
      // px must share exactly one digit with pivot and that digit is x (not y)
      if (!px.digits.includes(x) || px.digits.includes(y)) continue
      const z = px.digits.find(d => d !== x)

      for (const py of bivalue) {
        if (py === pivot || py === px) continue
        if (!sees(pivot.row, pivot.col, py.row, py.col)) continue
        // py must share exactly one digit with pivot (y, not x) and share z with px
        if (!py.digits.includes(y) || py.digits.includes(x)) continue
        if (!py.digits.includes(z)) continue

        // Found XY-Wing: pivot [x,y], px [x,z], py [y,z]
        // Eliminate z from cells seeing both px and py
        const elims = []
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (getCell(board, r, c).value !== EMPTY) continue
            if (r === px.row && c === px.col) continue
            if (r === py.row && c === py.col) continue
            if (!sees(r, c, px.row, px.col)) continue
            if (!sees(r, c, py.row, py.col)) continue
            if (hasNote(get(r, c), z)) elims.push({ row: r, col: c })
          }
        }

        if (elims.length > 0) {
          return {
            technique: 'XY-Wing',
            cellsInvolved: [
              { row: pivot.row, col: pivot.col },
              { row: px.row, col: px.col },
              { row: py.row, col: py.col },
              ...elims,
            ],
            affectedDigits: [z],
            explanation: `Pivot R${pivot.row+1}C${pivot.col+1} [${x},${y}] sees wing R${px.row+1}C${px.col+1} [${x},${z}] and wing R${py.row+1}C${py.col+1} [${y},${z}]. Any cell seeing both wings cannot be ${z}.`,
            recommendedAction: `Remove ${z} from ${elims.map(c => `R${c.row+1}C${c.col+1}`).join(', ')}`,
          }
        }
      }
    }
  }

  return null
}
