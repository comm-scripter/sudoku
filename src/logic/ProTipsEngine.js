import { detect as nakedSingle }      from './techniques/nakedSingle.js'
import { detect as hiddenSingle }     from './techniques/hiddenSingle.js'
import { detect as lockedCandidates } from './techniques/lockedCandidates.js'
import { detect as nakedPairs }       from './techniques/nakedPairs.js'
import { detect as hiddenPairs }      from './techniques/hiddenPairs.js'
import { detect as xWing }            from './techniques/xWing.js'
import { detect as swordfish }        from './techniques/swordfish.js'
import { detect as xyWing }           from './techniques/xyWing.js'
import { detect as xyzWing }          from './techniques/xyzWing.js'
import { detect as coloring }         from './techniques/coloring.js'
import { detect as als }              from './techniques/als.js'
import { detect as aic }              from './techniques/aic.js'
import { detect as forcingChains }    from './techniques/forcingChains.js'

// Priority order: simpler / lower-difficulty techniques first.
const TECHNIQUES = [
  nakedSingle,
  hiddenSingle,
  lockedCandidates,   // Pointing Pairs, Pointing Triplets, Box-Line Reduction
  nakedPairs,         // Naked Pairs + Naked Triplets
  hiddenPairs,        // Hidden Pairs + Hidden Triplets
  xWing,
  swordfish,
  xyWing,
  xyzWing,
  coloring,           // Simple Coloring
  als,                // Almost Locked Sets (ALS-XZ)
  aic,                // Alternating Inference Chains (X-Chain)
  forcingChains,      // Forcing Chains (bifurcation)
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
