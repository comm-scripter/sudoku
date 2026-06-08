import { getCell, getAllCandidates } from '../BoardState.js'
import { hasNote } from '../NotesModel.js'
import { EMPTY } from '../CellModel.js'

function sees(r1, c1, r2, c2) {
  return r1 === r2 || c1 === c2 ||
    (Math.floor(r1 / 3) === Math.floor(r2 / 3) && Math.floor(c1 / 3) === Math.floor(c2 / 3))
}

const MAX_CHAIN = 8 // cap chain length to keep detection fast

/**
 * Alternating Inference Chain (X-Chain): single-digit chains using alternating
 * strong links (conjugate pairs in a region) and weak links (two cells that see each other).
 *
 * A valid X-Chain has strong links at both ends. Any cell that sees both endpoints
 * and has the digit as a candidate can have it eliminated.
 *
 * Discontinuous nice loop: if the chain connects back to a cell that sees the start
 * (with the same digit), that cell is eliminated.
 */
export function detect(board) {
  const cands = getAllCandidates(board)
  const get = (r, c) => cands[r * 9 + c]

  for (let digit = 1; digit <= 9; digit++) {
    const cells = []
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (getCell(board, r, c).value === EMPTY && hasNote(get(r, c), digit))
          cells.push({ row: r, col: c })

    if (cells.length < 4) continue

    // Build strong-link map: conjugate pairs per region
    const key = (r, c) => r * 9 + c
    const strongLinks = new Map(cells.map(c => [key(c.row, c.col), []]))

    const addStrong = (a, b) => {
      strongLinks.get(key(a.row, a.col)).push(key(b.row, b.col))
      strongLinks.get(key(b.row, b.col)).push(key(a.row, a.col))
    }

    for (let r = 0; r < 9; r++) {
      const inRow = cells.filter(c => c.row === r)
      if (inRow.length === 2) addStrong(inRow[0], inRow[1])
    }
    for (let c = 0; c < 9; c++) {
      const inCol = cells.filter(cell => cell.col === c)
      if (inCol.length === 2) addStrong(inCol[0], inCol[1])
    }
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const inBox = cells.filter(c => Math.floor(c.row / 3) === br && Math.floor(c.col / 3) === bc)
        if (inBox.length === 2) addStrong(inBox[0], inBox[1])
      }
    }

    // DFS to find chains starting with a strong link
    // State: [current cell key, path keys[], nextLinkMustBeStrong]
    for (const startCell of cells) {
      const startKey = key(startCell.row, startCell.col)
      if (strongLinks.get(startKey).length === 0) continue

      // DFS
      const stack = [{ k: startKey, path: [startKey], needStrong: true }]

      while (stack.length > 0) {
        const { k, path, needStrong } = stack.pop()
        const r = Math.floor(k / 9), c = k % 9

        if (path.length >= 4 && path.length % 2 === 0) {
          // Chain ends with a strong link (even number of links = even length path means
          // we alternated S,W,S,W... starting and ending with strong)
          // Check eliminations: cells seeing both endpoints
          const startR = Math.floor(path[0] / 9), startC = path[0] % 9
          if (path[0] !== k) {
            const elims = cells.filter(cell => {
              const ck = key(cell.row, cell.col)
              if (path.includes(ck)) return false
              return sees(cell.row, cell.col, startR, startC) && sees(cell.row, cell.col, r, c)
            })
            if (elims.length > 0) {
              const pathCells = path.map(pk => ({ row: Math.floor(pk / 9), col: pk % 9 }))
              return {
                technique: 'Alternating Inference Chain',
                cellsInvolved: [...pathCells, ...elims],
                affectedDigits: [digit],
                explanation: `AIC for ${digit}: the chain from R${startR+1}C${startC+1} to R${r+1}C${c+1} alternates strong and weak links. Any cell seeing both ends cannot be ${digit}.`,
                recommendedAction: `Remove ${digit} from ${elims.map(c => `R${c.row+1}C${c.col+1}`).join(', ')}`,
              }
            }
          }
        }

        if (path.length >= MAX_CHAIN) continue

        if (needStrong) {
          // Follow strong links
          for (const nk of strongLinks.get(k)) {
            if (!path.includes(nk))
              stack.push({ k: nk, path: [...path, nk], needStrong: false })
          }
        } else {
          // Follow weak links: any candidate cell that sees current cell
          for (const nb of cells) {
            const nk = key(nb.row, nb.col)
            if (path.includes(nk)) continue
            if (!sees(r, c, nb.row, nb.col)) continue
            stack.push({ k: nk, path: [...path, nk], needStrong: true })
          }
        }
      }
    }
  }

  return null
}
