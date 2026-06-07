import { describe, it, expect } from 'vitest'
import { getProTip } from '../../logic/ProTipsEngine.js'
import { createBoard } from '../../logic/BoardState.js'

const SAMPLE = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'

describe('getProTip', () => {
  it('does not throw on any board state', () => {
    expect(() => getProTip(createBoard('0'.repeat(81)))).not.toThrow()
    expect(() => getProTip(createBoard(SAMPLE))).not.toThrow()
  })

  it('returns null or a valid tip object', () => {
    const tip = getProTip(createBoard(SAMPLE))
    if (tip === null) return
    expect(typeof tip.technique).toBe('string')
    expect(Array.isArray(tip.cellsInvolved)).toBe(true)
    expect(typeof tip.explanation).toBe('string')
    expect(typeof tip.recommendedAction).toBe('string')
    expect(Array.isArray(tip.affectedDigits)).toBe(true)
  })

  it('cellsInvolved entries have row and col', () => {
    const tip = getProTip(createBoard(SAMPLE))
    if (!tip) return
    for (const c of tip.cellsInvolved) {
      expect(typeof c.row).toBe('number')
      expect(typeof c.col).toBe('number')
    }
  })

  it('should not detect tips for a fully solved board', () => {
    // Fully solved board has no empty cells — no technique applies.
    const solved = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
    const tip = getProTip(createBoard(solved))
    expect(tip).toBeNull()
  })
})
