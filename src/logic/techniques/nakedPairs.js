import { getCell, getAllCandidates } from '../BoardState.js'
import { hasNote, getNotes, countNotes } from '../NotesModel.js'
import { EMPTY } from '../CellModel.js'

const REGIONS = buildRegions()

function buildRegions() {
  const regions = []
  for (let r = 0; r < 9; r++)
    regions.push({ type: 'row', index: r, cells: Array.from({ length: 9 }, (_, c) => ({ row: r, col: c })) })
  for (let c = 0; c < 9; c++)
    regions.push({ type: 'col', index: c, cells: Array.from({ length: 9 }, (_, r) => ({ row: r, col: c })) })
  for (let br = 0; br < 3; br++)
    for (let bc = 0; bc < 3; bc++) {
      const cells = []
      for (let r = br * 3; r < br * 3 + 3; r++)
        for (let c = bc * 3; c < bc * 3 + 3; c++)
          cells.push({ row: r, col: c })
      regions.push({ type: 'box', index: br * 3 + bc, cells })
    }
  return regions
}

function regionLabel(region) {
  if (region.type === 'row') return `Row ${region.index + 1}`
  if (region.type === 'col') return `Column ${region.index + 1}`
  return `Box ${region.index + 1}`
}

export function detect(board) {
  const cands = getAllCandidates(board)
  const get = (r, c) => cands[r * 9 + c]

  for (const region of REGIONS) {
    const empty = region.cells.filter(({ row, col }) => getCell(board, row, col).value === EMPTY)

    // Naked Pairs: two cells with exactly the same 2 candidates
    for (let i = 0; i < empty.length - 1; i++) {
      const a = empty[i]
      const maskA = get(a.row, a.col)
      if (countNotes(maskA) !== 2) continue
      for (let j = i + 1; j < empty.length; j++) {
        const b = empty[j]
        if (get(b.row, b.col) !== maskA) continue
        const digits = getNotes(maskA)
        const elims = []
        for (const c of empty) {
          if ((c.row === a.row && c.col === a.col) || (c.row === b.row && c.col === b.col)) continue
          for (const d of digits)
            if (hasNote(get(c.row, c.col), d)) elims.push({ row: c.row, col: c.col })
        }
        const elimCells = [...new Map(elims.map(e => [`${e.row},${e.col}`, e])).values()]
        if (elimCells.length > 0) {
          return {
            technique: 'Naked Pair',
            cellsInvolved: [a, b, ...elimCells],
            affectedDigits: digits,
            explanation: `R${a.row + 1}C${a.col + 1} and R${b.row + 1}C${b.col + 1} in ${regionLabel(region)} both contain only [${digits.join(',')}]. Those digits can be removed from all other cells in that region.`,
            recommendedAction: `Remove ${digits.join(' and ')} from ${elimCells.map(c => `R${c.row + 1}C${c.col + 1}`).join(', ')}`,
          }
        }
      }
    }

    // Naked Triplets: three cells whose union contains exactly 3 candidates
    for (let i = 0; i < empty.length - 2; i++) {
      const a = empty[i]
      const maskA = get(a.row, a.col)
      if (countNotes(maskA) < 2 || countNotes(maskA) > 3) continue
      for (let j = i + 1; j < empty.length - 1; j++) {
        const b = empty[j]
        const maskAB = maskA | get(b.row, b.col)
        if (countNotes(maskAB) > 3) continue
        for (let k = j + 1; k < empty.length; k++) {
          const c = empty[k]
          const maskABC = maskAB | get(c.row, c.col)
          if (countNotes(maskABC) !== 3) continue
          const digits = getNotes(maskABC)
          const elims = []
          for (const cell of empty) {
            if ((cell.row === a.row && cell.col === a.col) ||
                (cell.row === b.row && cell.col === b.col) ||
                (cell.row === c.row && cell.col === c.col)) continue
            for (const d of digits)
              if (hasNote(get(cell.row, cell.col), d)) elims.push({ row: cell.row, col: cell.col })
          }
          const elimCells = [...new Map(elims.map(e => [`${e.row},${e.col}`, e])).values()]
          if (elimCells.length > 0) {
            return {
              technique: 'Naked Triple',
              cellsInvolved: [a, b, c, ...elimCells],
              affectedDigits: digits,
              explanation: `R${a.row+1}C${a.col+1}, R${b.row+1}C${b.col+1}, and R${c.row+1}C${c.col+1} in ${regionLabel(region)} together contain only [${digits.join(',')}]. Those digits can be removed from all other cells in that region.`,
              recommendedAction: `Remove ${digits.join(', ')} from ${elimCells.map(e => `R${e.row+1}C${e.col+1}`).join(', ')}`,
            }
          }
        }
      }
    }
  }

  return null
}
