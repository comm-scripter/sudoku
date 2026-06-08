import { getCell, getAllCandidates } from '../BoardState.js'
import { hasNote, getNotes } from '../NotesModel.js'
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

    // Map each digit to sorted list of cell keys (row*9+col) where it's a candidate
    const digitKeys = Array.from({ length: 10 }, () => [])
    for (const { row, col } of empty) {
      const mask = get(row, col)
      for (let d = 1; d <= 9; d++)
        if (hasNote(mask, d)) digitKeys[d].push(row * 9 + col)
    }

    // Hidden Pairs: two digits appearing in exactly the same 2 cells
    for (let d1 = 1; d1 <= 8; d1++) {
      if (digitKeys[d1].length !== 2) continue
      for (let d2 = d1 + 1; d2 <= 9; d2++) {
        if (digitKeys[d2].length !== 2) continue
        if (digitKeys[d1][0] !== digitKeys[d2][0] || digitKeys[d1][1] !== digitKeys[d2][1]) continue
        const pairCells = digitKeys[d1].map(k => ({ row: Math.floor(k / 9), col: k % 9 }))
        const digits = [d1, d2]
        const elims = []
        for (const { row, col } of pairCells)
          for (const d of getNotes(get(row, col)))
            if (!digits.includes(d)) elims.push({ row, col })
        if (elims.length > 0) {
          return {
            technique: 'Hidden Pair',
            cellsInvolved: pairCells,
            affectedDigits: digits,
            explanation: `In ${regionLabel(region)}, only R${pairCells[0].row+1}C${pairCells[0].col+1} and R${pairCells[1].row+1}C${pairCells[1].col+1} can hold ${d1} and ${d2}. All other candidates in those two cells can be removed.`,
            recommendedAction: `Remove extra candidates from R${pairCells[0].row+1}C${pairCells[0].col+1} and R${pairCells[1].row+1}C${pairCells[1].col+1}`,
          }
        }
      }
    }

    // Hidden Triplets: three digits whose union spans exactly 3 cells
    for (let d1 = 1; d1 <= 7; d1++) {
      const k1 = digitKeys[d1]
      if (k1.length < 2 || k1.length > 3) continue
      for (let d2 = d1 + 1; d2 <= 8; d2++) {
        const k2 = digitKeys[d2]
        if (k2.length < 2 || k2.length > 3) continue
        const unionAB = [...new Set([...k1, ...k2])]
        if (unionAB.length > 3) continue
        for (let d3 = d2 + 1; d3 <= 9; d3++) {
          const k3 = digitKeys[d3]
          if (k3.length < 2 || k3.length > 3) continue
          const unionABC = [...new Set([...unionAB, ...k3])]
          if (unionABC.length !== 3) continue
          const tripleCells = unionABC.map(k => ({ row: Math.floor(k / 9), col: k % 9 }))
          const digits = [d1, d2, d3]
          const elims = []
          for (const { row, col } of tripleCells)
            for (const d of getNotes(get(row, col)))
              if (!digits.includes(d)) elims.push({ row, col })
          if (elims.length > 0) {
            return {
              technique: 'Hidden Triple',
              cellsInvolved: tripleCells,
              affectedDigits: digits,
              explanation: `In ${regionLabel(region)}, ${digits.join(', ')} can only appear among ${tripleCells.map(c => `R${c.row+1}C${c.col+1}`).join(', ')}. Other candidates in those cells can be eliminated.`,
              recommendedAction: `Remove extra candidates from ${tripleCells.map(c => `R${c.row+1}C${c.col+1}`).join(', ')}`,
            }
          }
        }
      }
    }
  }

  return null
}
