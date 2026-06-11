import { PEERS, countSolutions, classifyDifficulty, logicalSolve, DIFFICULTY_TIER } from './DifficultyEngine.js'

// ─── Fallback curated puzzles ─────────────────────────────────────────────────
// Used when the procedural generator cannot produce a matching puzzle within the
// retry budget. Each string is 81 chars; 0 = empty cell.

// All fallback puzzles are verified unique (exactly 1 solution).
const FALLBACK = {
  easy: [
    '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    '200080300060070084030500209000105408000000000402706000301007040720040060004010003',
  ],
  medium: [
    '000105000698000100500400060040800000007050300010930006000010520003000000000000079',
    '300009000000860002000000370070040100050008000009000000005701040100020008090005006',
  ],
  hard: [
    '060500900000601024002000500004008000000700350009210000001000760000004000506900000',
    '050003800004086000000000037200000006006000050030900020008034002000000400000010098',
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function isLegal(cells, pos, d) {
  for (const p of PEERS[pos]) if (cells[p] === d) return false
  return true
}

// ─── Complete-grid generation ─────────────────────────────────────────────────

function generateCompleteGrid() {
  const cells = new Array(81).fill(0)

  function fill(pos) {
    if (pos === 81) return true
    const order = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
    for (const d of order) {
      if (isLegal(cells, pos, d)) {
        cells[pos] = d
        if (fill(pos + 1)) return true
        cells[pos] = 0
      }
    }
    return false
  }

  fill(0)
  return cells
}

// ─── Procedural puzzle generation ────────────────────────────────────────────

/**
 * Generates a puzzle of the target difficulty.
 *
 * Strategy:
 *  1. Fill a complete random grid (backtrack + shuffled digit order).
 *  2. Shuffle all 81 positions and try removing each clue:
 *     • Reject if the puzzle would lose uniqueness.
 *     • For easy/medium: also reject if the removal pushes the puzzle beyond
 *       the target difficulty tier (checked via the logical solver).
 *  3. Verify the finished puzzle is classified at the right difficulty.
 *  4. Retry up to MAX_ATTEMPTS times; fall back to a curated puzzle otherwise.
 */
const MAX_ATTEMPTS = 10

export function generatePuzzle(difficulty = 'easy') {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = tryGenerate(difficulty)
    if (result) return result
  }
  return getFallback(difficulty)
}

function tryGenerate(difficulty) {
  const cells = generateCompleteGrid()
  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i))
  const tierLimit = DIFFICULTY_TIER[difficulty] ?? DIFFICULTY_TIER.hard

  for (const pos of positions) {
    const backup = cells[pos]
    cells[pos] = 0

    // Must remain uniquely solvable
    if (countSolutions(cells) !== 1) {
      cells[pos] = backup
      continue
    }

    // For easy/medium: must not exceed the target difficulty tier
    if (difficulty !== 'hard') {
      const { maxTier } = logicalSolve(cells.join(''))
      if (maxTier > tierLimit) {
        cells[pos] = backup
        continue
      }
    }
  }

  const puzzleStr = cells.join('')
  const actualDiff = classifyDifficulty(puzzleStr)

  // For hard, accept 'hard' or 'expert' (expert = needs techniques beyond our engine).
  if (difficulty === 'hard') return (actualDiff === 'hard' || actualDiff === 'expert') ? puzzleStr : null
  return actualDiff === difficulty ? puzzleStr : null
}

function getFallback(difficulty) {
  const pool = FALLBACK[difficulty] ?? FALLBACK.easy
  return pool[Math.floor(Math.random() * pool.length)]
}
