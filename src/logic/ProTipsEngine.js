import { detect as nakedSingle }      from './techniques/nakedSingle.js'
import { detect as hiddenSingle }     from './techniques/hiddenSingle.js'
import { detect as lockedCandidates } from './techniques/lockedCandidates.js'
import { detect as nakedPairs }       from './techniques/nakedPairs.js'
import { detect as hiddenPairs }      from './techniques/hiddenPairs.js'
import { detect as xWing }            from './techniques/xWing.js'
import { detect as swordfish }        from './techniques/swordfish.js'
import { detect as xyWing }           from './techniques/xyWing.js'
import { detect as coloring }         from './techniques/coloring.js'

// Priority order matches the spec — simpler techniques first.
const TECHNIQUES = [
  nakedSingle,
  hiddenSingle,
  lockedCandidates,
  nakedPairs,
  hiddenPairs,
  xWing,
  swordfish,
  xyWing,
  coloring,
]

/**
 * Returns the highest-priority applicable tip for the current board,
 * or null if no technique is detected.
 */
export function getProTip(board) {
  for (const detect of TECHNIQUES) {
    const result = detect(board)
    if (result) return result
  }
  return null
}
