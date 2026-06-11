// Standalone logical solver for difficulty classification and solution counting.
// Operates on flat arrays: cells[81] where cells[i] is a digit 0-9 (0 = empty).
// Keeps its own candidate bitmasks (bit d-1 set ↔ digit d is a candidate).

// ─── Peer / region precomputation ────────────────────────────────────────────

export const PEERS = Array.from({ length: 81 }, (_, i) => {
  const row = Math.floor(i / 9), col = i % 9
  const s = new Set()
  for (let c = 0; c < 9; c++) s.add(row * 9 + c)
  for (let r = 0; r < 9; r++) s.add(r * 9 + col)
  const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++) s.add(r * 9 + c)
  s.delete(i)
  return [...s]
})

// 27 regions: 9 rows + 9 cols + 9 boxes (each region = array of 9 cell indices)
const REGIONS = []
for (let r = 0; r < 9; r++)
  REGIONS.push(Array.from({ length: 9 }, (_, c) => r * 9 + c))
for (let c = 0; c < 9; c++)
  REGIONS.push(Array.from({ length: 9 }, (_, r) => r * 9 + c))
for (let br = 0; br < 3; br++)
  for (let bc = 0; bc < 3; bc++) {
    const box = []
    for (let r = br * 3; r < br * 3 + 3; r++)
      for (let c = bc * 3; c < bc * 3 + 3; c++) box.push(r * 9 + c)
    REGIONS.push(box)
  }

// ─── Difficulty tiers ─────────────────────────────────────────────────────────

const TIER = {
  NAKED_SINGLE:  0,
  HIDDEN_SINGLE: 1,
  LOCKED:        2,
  NAKED_PAIR:    3,
  HIDDEN_PAIR:   4,
  X_WING:        5,
  XY_WING:       6,
}

// Maximum tier allowed to stay within a given difficulty label
export const DIFFICULTY_TIER = {
  easy:   TIER.HIDDEN_SINGLE,
  medium: TIER.HIDDEN_PAIR,
  hard:   TIER.XY_WING,
}

// ─── Candidate helpers ────────────────────────────────────────────────────────

function initCandidates(cells) {
  const cands = new Array(81).fill(0)
  for (let i = 0; i < 81; i++) {
    if (cells[i]) continue
    let mask = 0x1FF // bits 0-8 represent digits 1-9
    for (const p of PEERS[i]) if (cells[p]) mask &= ~(1 << (cells[p] - 1))
    cands[i] = mask
  }
  return cands
}

function place(cells, cands, i, d) {
  cells[i] = d
  cands[i] = 0
  const bit = 1 << (d - 1)
  for (const p of PEERS[i]) cands[p] &= ~bit
}

function bits(mask) {
  const result = []
  for (let d = 1; d <= 9; d++) if (mask & (1 << (d - 1))) result.push(d)
  return result
}

function popcount(mask) {
  let n = 0, m = mask
  while (m) { n += m & 1; m >>>= 1 }
  return n
}

// ─── Technique implementations ────────────────────────────────────────────────

function applyNakedSingle(cells, cands) {
  for (let i = 0; i < 81; i++) {
    if (cells[i] || popcount(cands[i]) !== 1) continue
    place(cells, cands, i, bits(cands[i])[0])
    return true
  }
  return false
}

function applyHiddenSingle(cells, cands) {
  for (const region of REGIONS) {
    for (let d = 1; d <= 9; d++) {
      const bit = 1 << (d - 1)
      let found = -1, count = 0
      for (const i of region) {
        if (!cells[i] && (cands[i] & bit)) { found = i; if (++count > 1) break }
      }
      if (count === 1) { place(cells, cands, found, d); return true }
    }
  }
  return false
}

function applyLockedCandidates(cells, cands) {
  // Pointing: digit in a box confined to one row/col → remove from that row/col outside the box
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      for (let d = 1; d <= 9; d++) {
        const bit = 1 << (d - 1)
        const rows = new Set(), cols = new Set()
        for (let r = br * 3; r < br * 3 + 3; r++)
          for (let c = bc * 3; c < bc * 3 + 3; c++)
            if (!cells[r * 9 + c] && (cands[r * 9 + c] & bit)) { rows.add(r); cols.add(c) }
        if (!rows.size) continue

        if (rows.size === 1) {
          const r = [...rows][0]
          let changed = false
          for (let c = 0; c < 9; c++) {
            if (Math.floor(c / 3) === bc) continue
            if (!cells[r * 9 + c] && (cands[r * 9 + c] & bit)) { cands[r * 9 + c] &= ~bit; changed = true }
          }
          if (changed) return true
        }

        if (cols.size === 1) {
          const c = [...cols][0]
          let changed = false
          for (let r = 0; r < 9; r++) {
            if (Math.floor(r / 3) === br) continue
            if (!cells[r * 9 + c] && (cands[r * 9 + c] & bit)) { cands[r * 9 + c] &= ~bit; changed = true }
          }
          if (changed) return true
        }
      }
    }
  }

  // Claiming: digit in a row/col confined to one box → remove from rest of that box
  for (let d = 1; d <= 9; d++) {
    const bit = 1 << (d - 1)

    for (let r = 0; r < 9; r++) {
      const boxCols = new Set()
      for (let c = 0; c < 9; c++)
        if (!cells[r * 9 + c] && (cands[r * 9 + c] & bit)) boxCols.add(Math.floor(c / 3))
      if (boxCols.size !== 1) continue
      const bc = [...boxCols][0], br = Math.floor(r / 3)
      let changed = false
      for (let rb = br * 3; rb < br * 3 + 3; rb++) {
        if (rb === r) continue
        for (let cb = bc * 3; cb < bc * 3 + 3; cb++)
          if (!cells[rb * 9 + cb] && (cands[rb * 9 + cb] & bit)) { cands[rb * 9 + cb] &= ~bit; changed = true }
      }
      if (changed) return true
    }

    for (let c = 0; c < 9; c++) {
      const boxRows = new Set()
      for (let r = 0; r < 9; r++)
        if (!cells[r * 9 + c] && (cands[r * 9 + c] & bit)) boxRows.add(Math.floor(r / 3))
      if (boxRows.size !== 1) continue
      const br = [...boxRows][0], bc = Math.floor(c / 3)
      let changed = false
      for (let rb = br * 3; rb < br * 3 + 3; rb++) {
        for (let cb = bc * 3; cb < bc * 3 + 3; cb++) {
          if (cb === c) continue
          if (!cells[rb * 9 + cb] && (cands[rb * 9 + cb] & bit)) { cands[rb * 9 + cb] &= ~bit; changed = true }
        }
      }
      if (changed) return true
    }
  }

  return false
}

function applyNakedPair(cells, cands) {
  for (const region of REGIONS) {
    const empty = region.filter(i => !cells[i])
    // Naked Pair
    for (let ai = 0; ai < empty.length - 1; ai++) {
      const a = empty[ai]
      if (popcount(cands[a]) !== 2) continue
      for (let bi = ai + 1; bi < empty.length; bi++) {
        const b = empty[bi]
        if (cands[b] !== cands[a]) continue
        let changed = false
        for (const i of empty) {
          if (i === a || i === b) continue
          const before = cands[i]
          cands[i] &= ~cands[a]
          if (cands[i] !== before) changed = true
        }
        if (changed) return true
      }
    }
    // Naked Triple
    for (let ai = 0; ai < empty.length - 2; ai++) {
      const a = empty[ai]
      const mA = cands[a]
      if (popcount(mA) < 2 || popcount(mA) > 3) continue
      for (let bi = ai + 1; bi < empty.length - 1; bi++) {
        const b = empty[bi]
        const mAB = mA | cands[b]
        if (popcount(mAB) > 3) continue
        for (let ci = bi + 1; ci < empty.length; ci++) {
          const c = empty[ci]
          const mABC = mAB | cands[c]
          if (popcount(mABC) !== 3) continue
          let changed = false
          for (const i of empty) {
            if (i === a || i === b || i === c) continue
            const before = cands[i]
            cands[i] &= ~mABC
            if (cands[i] !== before) changed = true
          }
          if (changed) return true
        }
      }
    }
  }
  return false
}

function applyHiddenPair(cells, cands) {
  for (const region of REGIONS) {
    const empty = region.filter(i => !cells[i])
    for (let d1 = 1; d1 <= 8; d1++) {
      const bit1 = 1 << (d1 - 1)
      const c1 = empty.filter(i => cands[i] & bit1)
      if (c1.length !== 2) continue
      for (let d2 = d1 + 1; d2 <= 9; d2++) {
        const bit2 = 1 << (d2 - 1)
        const c2 = empty.filter(i => cands[i] & bit2)
        if (c2.length !== 2) continue
        if (c1[0] !== c2[0] || c1[1] !== c2[1]) continue
        const [a, b] = c1
        const keep = bit1 | bit2
        if ((cands[a] & ~keep) || (cands[b] & ~keep)) {
          cands[a] &= keep
          cands[b] &= keep
          return true
        }
      }
    }
  }
  return false
}

function applyXWing(cells, cands) {
  for (let d = 1; d <= 9; d++) {
    const bit = 1 << (d - 1)

    // Row-based X-Wing
    const rowPositions = Array.from({ length: 9 }, (_, r) => {
      const cs = []
      for (let c = 0; c < 9; c++) if (!cells[r * 9 + c] && (cands[r * 9 + c] & bit)) cs.push(c)
      return cs
    })
    for (let r1 = 0; r1 < 8; r1++) {
      if (rowPositions[r1].length !== 2) continue
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        if (rowPositions[r2].length !== 2) continue
        if (rowPositions[r1][0] !== rowPositions[r2][0] || rowPositions[r1][1] !== rowPositions[r2][1]) continue
        const [c1, c2] = rowPositions[r1]
        let changed = false
        for (let r = 0; r < 9; r++) {
          if (r === r1 || r === r2) continue
          for (const c of [c1, c2]) {
            const i = r * 9 + c
            if (!cells[i] && (cands[i] & bit)) { cands[i] &= ~bit; changed = true }
          }
        }
        if (changed) return true
      }
    }

    // Column-based X-Wing
    const colPositions = Array.from({ length: 9 }, (_, c) => {
      const rs = []
      for (let r = 0; r < 9; r++) if (!cells[r * 9 + c] && (cands[r * 9 + c] & bit)) rs.push(r)
      return rs
    })
    for (let c1 = 0; c1 < 8; c1++) {
      if (colPositions[c1].length !== 2) continue
      for (let c2 = c1 + 1; c2 < 9; c2++) {
        if (colPositions[c2].length !== 2) continue
        if (colPositions[c1][0] !== colPositions[c2][0] || colPositions[c1][1] !== colPositions[c2][1]) continue
        const [r1, r2] = colPositions[c1]
        let changed = false
        for (let c = 0; c < 9; c++) {
          if (c === c1 || c === c2) continue
          for (const r of [r1, r2]) {
            const i = r * 9 + c
            if (!cells[i] && (cands[i] & bit)) { cands[i] &= ~bit; changed = true }
          }
        }
        if (changed) return true
      }
    }
  }
  return false
}

function applyXYWing(cells, cands) {
  const bivalue = []
  for (let i = 0; i < 81; i++) if (!cells[i] && popcount(cands[i]) === 2) bivalue.push(i)

  for (const pivot of bivalue) {
    const [A, B] = bits(cands[pivot])
    const bitA = 1 << (A - 1), bitB = 1 << (B - 1)
    const visible = bivalue.filter(p => p !== pivot && PEERS[pivot].includes(p))

    for (const p1 of visible) {
      const p1bits = bits(cands[p1])
      // p1 must share exactly one digit with pivot and have a different third digit
      const shared = p1bits.filter(d => d === A || d === B)
      if (shared.length !== 1) continue
      const C = p1bits.find(d => d !== A && d !== B)
      if (C === undefined) continue
      const bitC = 1 << (C - 1)
      // p2 must have {other pivot digit, C}
      const neededBit = (shared[0] === A) ? bitB : bitA
      const needed = neededBit | bitC

      for (const p2 of visible) {
        if (p2 === p1 || cands[p2] !== needed) continue
        // Eliminate C from every cell that sees both p1 and p2
        const p1Set = new Set(PEERS[p1])
        let changed = false
        for (const t of PEERS[p2]) {
          if (t === pivot || t === p1 || !p1Set.has(t)) continue
          if (!cells[t] && (cands[t] & bitC)) { cands[t] &= ~bitC; changed = true }
        }
        if (changed) return true
      }
    }
  }
  return false
}

// ─── Logical solver ───────────────────────────────────────────────────────────

const TECHNIQUES = [
  { tier: TIER.NAKED_SINGLE,  fn: applyNakedSingle },
  { tier: TIER.HIDDEN_SINGLE, fn: applyHiddenSingle },
  { tier: TIER.LOCKED,        fn: applyLockedCandidates },
  { tier: TIER.NAKED_PAIR,    fn: applyNakedPair },
  { tier: TIER.HIDDEN_PAIR,   fn: applyHiddenPair },
  { tier: TIER.X_WING,        fn: applyXWing },
  { tier: TIER.XY_WING,       fn: applyXYWing },
]

/**
 * Attempts to solve a puzzle using logic only.
 * Returns { solved: boolean, maxTier: number }.
 * `maxTier` is the highest technique tier that was required.
 */
export function logicalSolve(puzzleStr) {
  const cells = Array.from(puzzleStr).map(Number)
  const cands = initCandidates(cells)

  // Check for immediate contradiction
  for (let i = 0; i < 81; i++) if (!cells[i] && !cands[i]) return { solved: false, maxTier: 0 }

  let maxTier = 0
  outer: while (true) {
    if (cells.every(v => v !== 0)) break
    for (const { tier, fn } of TECHNIQUES) {
      if (fn(cells, cands)) {
        maxTier = Math.max(maxTier, tier)
        // Check for contradiction after applying technique
        for (let i = 0; i < 81; i++) if (!cells[i] && !cands[i]) return { solved: false, maxTier }
        continue outer
      }
    }
    break // stuck — no technique made progress
  }

  return { solved: cells.every(v => v !== 0), maxTier }
}

/**
 * Returns 'easy' | 'medium' | 'hard' | 'expert'.
 * 'expert' means the puzzle is uniquely solvable but requires techniques
 * beyond what this engine implements (AIC, forcing chains, etc.).
 */
export function classifyDifficulty(puzzleStr) {
  const { solved, maxTier } = logicalSolve(puzzleStr)
  if (!solved) return 'expert'
  if (maxTier <= DIFFICULTY_TIER.easy)   return 'easy'
  if (maxTier <= DIFFICULTY_TIER.medium) return 'medium'
  return 'hard'
}

// ─── Uniqueness counter ───────────────────────────────────────────────────────

/**
 * Counts solutions up to `limit` (default 2). Used for uniqueness validation.
 * Accepts either a flat digit array or a puzzle string.
 */
export function countSolutions(input, limit = 2) {
  const cells = typeof input === 'string'
    ? Array.from(input).map(Number)
    : [...input]
  let count = 0

  function bt() {
    // MRV: pick the empty cell with the fewest candidates
    let bestI = -1, bestCount = 10, bestMask = 0
    for (let i = 0; i < 81; i++) {
      if (cells[i]) continue
      let mask = 0x1FF
      for (const p of PEERS[i]) if (cells[p]) mask &= ~(1 << (cells[p] - 1))
      if (!mask) return // dead end
      const cnt = popcount(mask)
      if (cnt < bestCount) { bestI = i; bestCount = cnt; bestMask = mask; if (cnt === 1) break }
    }
    if (bestI === -1) { count++; return } // all filled
    if (count >= limit) return

    for (let d = 1; d <= 9; d++) {
      if (!(bestMask & (1 << (d - 1)))) continue
      cells[bestI] = d
      bt()
      cells[bestI] = 0
      if (count >= limit) return
    }
  }

  bt()
  return count
}

// ─── Puzzle format validation ─────────────────────────────────────────────────

/**
 * Returns true if the string is a valid 81-char puzzle with no conflicting givens.
 * Does NOT check uniqueness or solvability.
 */
export function isValidPuzzleStr(str) {
  if (!str || str.length !== 81 || !/^[0-9]{81}$/.test(str)) return false
  const rows = Array.from({ length: 9 }, () => new Set())
  const cols = Array.from({ length: 9 }, () => new Set())
  const boxes = Array.from({ length: 9 }, () => new Set())
  for (let i = 0; i < 81; i++) {
    const d = parseInt(str[i], 10)
    if (!d) continue
    const r = Math.floor(i / 9), c = i % 9, b = Math.floor(r / 3) * 3 + Math.floor(c / 3)
    if (rows[r].has(d) || cols[c].has(d) || boxes[b].has(d)) return false
    rows[r].add(d); cols[c].add(d); boxes[b].add(d)
  }
  return true
}
