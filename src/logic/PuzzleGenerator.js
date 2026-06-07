// Curated puzzles by difficulty — full generator arriving in Milestone 4.
// Each string is 81 chars; 0 = empty cell.

const PUZZLES = {
  easy: [
    '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    '200080300060070084030500209000105408000000000402706000301007040720040060004010003',
  ],
  medium: [
    '000000907000420180000705026100904000050000040000507009920108000034059000507000000',
    '010020300005003040000700005070010030000000010080060020500007000060200800003080090',
  ],
  hard: [
    // Peter Norvig's canonical hard puzzle
    '400000805030000000000700000020000060000080400000010000000063070500200000104000000',
    '000006000059000008200008000045000000003000600006003054000325006000000000031000000',
  ],
}

/** Guard: ensure no given digit appears twice in the same row, column, or box. */
function isValidPuzzle(str) {
  if (!str || str.length !== 81) return false
  const rows  = Array.from({ length: 9 }, () => new Set())
  const cols  = Array.from({ length: 9 }, () => new Set())
  const boxes = Array.from({ length: 9 }, () => new Set())
  for (let i = 0; i < 81; i++) {
    const d = parseInt(str[i], 10)
    if (!d) continue
    const r = Math.floor(i / 9)
    const c = i % 9
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3)
    if (rows[r].has(d) || cols[c].has(d) || boxes[b].has(d)) return false
    rows[r].add(d); cols[c].add(d); boxes[b].add(d)
  }
  return true
}

export function generatePuzzle(difficulty = 'easy') {
  const list = (PUZZLES[difficulty] ?? PUZZLES.easy).filter(isValidPuzzle)
  // Fallback to the first known-good easy puzzle if somehow all fail validation
  const pool = list.length ? list : PUZZLES.easy.filter(isValidPuzzle)
  return pool[Math.floor(Math.random() * pool.length)]
}
