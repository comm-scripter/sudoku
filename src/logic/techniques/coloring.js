import { getCell, getAllCandidates } from '../BoardState.js'
import { hasNote } from '../NotesModel.js'
import { EMPTY } from '../CellModel.js'

function sees(r1, c1, r2, c2) {
  return r1 === r2 || c1 === c2 ||
    (Math.floor(r1 / 3) === Math.floor(r2 / 3) && Math.floor(c1 / 3) === Math.floor(c2 / 3))
}

export function detect(board) {
  const cands = getAllCandidates(board)
  const get = (r, c) => cands[r * 9 + c]

  for (let digit = 1; digit <= 9; digit++) {
    const cells = []
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (getCell(board, r, c).value === EMPTY && hasNote(get(r, c), digit))
          cells.push({ row: r, col: c })

    // Build conjugate pairs: in a region where digit appears exactly twice, the two cells are conjugates
    const key = ({ row, col }) => row * 9 + col
    const conjugates = new Map(cells.map(c => [key(c), new Set()]))

    const linkPair = (a, b) => {
      conjugates.get(key(a)).add(key(b))
      conjugates.get(key(b)).add(key(a))
    }

    for (let r = 0; r < 9; r++) {
      const inRow = cells.filter(c => c.row === r)
      if (inRow.length === 2) linkPair(inRow[0], inRow[1])
    }
    for (let c = 0; c < 9; c++) {
      const inCol = cells.filter(cell => cell.col === c)
      if (inCol.length === 2) linkPair(inCol[0], inCol[1])
    }
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const inBox = cells.filter(c => Math.floor(c.row / 3) === br && Math.floor(c.col / 3) === bc)
        if (inBox.length === 2) linkPair(inBox[0], inBox[1])
      }
    }

    // BFS-color each connected component
    const globalSeen = new Set()

    for (const start of cells) {
      const startKey = key(start)
      if (globalSeen.has(startKey)) continue
      if (conjugates.get(startKey).size === 0) continue

      const colors = new Map()
      const queue = [startKey]
      colors.set(startKey, 0)
      globalSeen.add(startKey)

      while (queue.length > 0) {
        const curr = queue.shift()
        const nextColor = 1 - colors.get(curr)
        for (const nb of conjugates.get(curr)) {
          if (!colors.has(nb)) {
            colors.set(nb, nextColor)
            globalSeen.add(nb)
            queue.push(nb)
          }
        }
      }

      const color0 = [...colors.entries()].filter(([, v]) => v === 0).map(([k]) => k)
      const color1 = [...colors.entries()].filter(([, v]) => v === 1).map(([k]) => k)
      const toCell = k => ({ row: Math.floor(k / 9), col: k % 9 })

      // Rule 1: two same-color cells see each other → that color is wrong, eliminate entire color
      for (const [colorKeys, colorIdx] of [[color0, 0], [color1, 1]]) {
        let contradiction = false
        outer:
        for (let i = 0; i < colorKeys.length - 1; i++) {
          for (let j = i + 1; j < colorKeys.length; j++) {
            const a = toCell(colorKeys[i]), b = toCell(colorKeys[j])
            if (sees(a.row, a.col, b.row, b.col)) { contradiction = true; break outer }
          }
        }
        if (contradiction) {
          const badCells = colorKeys.map(toCell)
          const goodCells = (colorIdx === 0 ? color1 : color0).map(toCell)
          return {
            technique: 'Simple Coloring',
            cellsInvolved: [...badCells, ...goodCells],
            affectedDigits: [digit],
            explanation: `Simple Coloring for ${digit}: two same-colored cells see each other, so that color cannot hold ${digit}. Those cells can be eliminated.`,
            recommendedAction: `Remove ${digit} from ${badCells.map(c => `R${c.row+1}C${c.col+1}`).join(', ')}`,
          }
        }
      }

      // Rule 2: a cell outside the chain that sees both colors can be eliminated
      const elims = []
      for (const cell of cells) {
        const k = key(cell)
        if (colors.has(k)) continue
        const seesColor0 = color0.some(ck => { const a = toCell(ck); return sees(cell.row, cell.col, a.row, a.col) })
        const seesColor1 = color1.some(ck => { const a = toCell(ck); return sees(cell.row, cell.col, a.row, a.col) })
        if (seesColor0 && seesColor1) elims.push(cell)
      }
      if (elims.length > 0) {
        const chainCells = [...colors.keys()].map(toCell)
        return {
          technique: 'Simple Coloring',
          cellsInvolved: [...chainCells, ...elims],
          affectedDigits: [digit],
          explanation: `Simple Coloring for ${digit}: the highlighted chain means one color must be ${digit}. Any cell seeing both colors cannot be ${digit}.`,
          recommendedAction: `Remove ${digit} from ${elims.map(c => `R${c.row+1}C${c.col+1}`).join(', ')}`,
        }
      }
    }
  }

  return null
}
