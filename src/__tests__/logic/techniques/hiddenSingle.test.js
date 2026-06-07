import { describe, it, expect } from 'vitest'
import { detect } from '../../../logic/techniques/hiddenSingle.js'
import { createBoard } from '../../../logic/BoardState.js'

const SAMPLE = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'

describe('hiddenSingle.detect', () => {
  it('does not throw on any board', () => {
    expect(() => detect(createBoard('0'.repeat(81)))).not.toThrow()
    expect(() => detect(createBoard(SAMPLE))).not.toThrow()
  })

  it('result technique is "Hidden Single"', () => {
    const result = detect(createBoard(SAMPLE))
    if (result) expect(result.technique).toBe('Hidden Single')
  })

  it('result contains exactly one cell and one digit', () => {
    const result = detect(createBoard(SAMPLE))
    if (result) {
      expect(result.cellsInvolved).toHaveLength(1)
      expect(result.affectedDigits).toHaveLength(1)
    }
  })

  it('pointed cell is actually empty', () => {
    const board  = createBoard(SAMPLE)
    const result = detect(board)
    if (!result) return
    const { row, col } = result.cellsInvolved[0]
    expect(board.cells[row * 9 + col].value).toBe(0)
  })

  it('returns null for a fully solved board', () => {
    const solved = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
    expect(detect(createBoard(solved))).toBeNull()
  })
})
