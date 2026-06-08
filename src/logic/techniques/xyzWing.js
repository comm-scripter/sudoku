import { getCell, getAllCandidates } from '../BoardState.js'
import { hasNote, getNotes, countNotes } from '../NotesModel.js'
import { EMPTY } from '../CellModel.js'

function sees(r1, c1, r2, c2) {
  return r1 === r2 || c1 === c2 ||
    (Math.floor(r1 / 3) === Math.floor(r2 / 3) && Math.floor(c1 / 3) === Math.floor(c2 / 3))
}

/**
 * XYZ-Wing: pivot with candidates [X,Y,Z] sees two wings [X,Z] and [Y,Z].
 * Any cell seeing the pivot AND both wings can have Z eliminated.
 * (Differs from XY-Wing in that the pivot itself also contains Z.)
 */
export function detect(board) {
  const cands = getAllCandidates(board)
  const get = (r, c) => cands[r * 9 + c]

  const bivalue = []
  const trivalue = []
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (getCell(board, r, c).value !== EMPTY) continue
      const mask = get(r, c)
      const n = countNotes(mask)
      if (n === 2) bivalue.push({ row: r, col: c, digits: getNotes(mask) })
      if (n === 3) trivalue.push({ row: r, col: c, digits: getNotes(mask) })
    }
  }

  for (const pivot of trivalue) {
    // Try each of the three pivot digits as the elimination digit z
    for (const z of pivot.digits) {
      const xy = pivot.digits.filter(d => d !== z) // the two non-z digits
      const [xD, yD] = xy

      // Find wing with [xD, z]
      const xzWings = bivalue.filter(w =>
        sees(pivot.row, pivot.col, w.row, w.col) &&
        w.digits.includes(xD) && w.digits.includes(z) && !w.digits.includes(yD)
      )

      // Find wing with [yD, z]
      const yzWings = bivalue.filter(w =>
        sees(pivot.row, pivot.col, w.row, w.col) &&
        w.digits.includes(yD) && w.digits.includes(z) && !w.digits.includes(xD)
      )

      for (const wx of xzWings) {
        for (const wy of yzWings) {
          if (wx === wy) continue

          // Eliminate z from cells that see the pivot AND both wings
          const elims = []
          for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
              if (getCell(board, r, c).value !== EMPTY) continue
              if (r === pivot.row && c === pivot.col) continue
              if (r === wx.row && c === wx.col) continue
              if (r === wy.row && c === wy.col) continue
              if (!sees(r, c, pivot.row, pivot.col)) continue
              if (!sees(r, c, wx.row, wx.col)) continue
              if (!sees(r, c, wy.row, wy.col)) continue
              if (hasNote(get(r, c), z)) elims.push({ row: r, col: c })
            }
          }

          if (elims.length > 0) {
            return {
              technique: 'XYZ-Wing',
              cellsInvolved: [
                { row: pivot.row, col: pivot.col },
                { row: wx.row, col: wx.col },
                { row: wy.row, col: wy.col },
                ...elims,
              ],
              affectedDigits: [z],
              explanation: `XYZ-Wing: pivot R${pivot.row+1}C${pivot.col+1} [${pivot.digits.join(',')}] sees wing R${wx.row+1}C${wx.col+1} [${wx.digits.join(',')}] and wing R${wy.row+1}C${wy.col+1} [${wy.digits.join(',')}]. Any cell seeing all three cannot be ${z}.`,
              recommendedAction: `Remove ${z} from ${elims.map(c => `R${c.row+1}C${c.col+1}`).join(', ')}`,
            }
          }
        }
      }
    }
  }

  return null
}
