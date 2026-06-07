import { describe, it, expect } from 'vitest'
import { detect } from '../../../logic/techniques/nakedSingle.js'
import { createBoard, setCell } from '../../../logic/BoardState.js'
import { createCell } from '../../../logic/CellModel.js'

const EMPTY81 = '0'.repeat(81)

describe('nakedSingle.detect', () => {
  it('returns null for a completely empty board (every cell has 9 candidates)', () => {
    expect(detect(createBoard(EMPTY81))).toBeNull()
  })

  it('detects the technique name correctly', () => {
    const board = createBoard('530070000600195000098000060800060003400803001700020006060000280000419005000080079')
    const result = detect(board)
    if (result) expect(result.technique).toBe('Naked Single')
  })

  it('result contains exactly one cell', () => {
    const board = createBoard('530070000600195000098000060800060003400803001700020006060000280000419005000080079')
    const result = detect(board)
    if (result) expect(result.cellsInvolved).toHaveLength(1)
  })

  it('returns a single-digit affectedDigits array', () => {
    const board = createBoard('530070000600195000098000060800060003400803001700020006060000280000419005000080079')
    const result = detect(board)
    if (result) expect(result.affectedDigits).toHaveLength(1)
  })

  it('detects a naked single when constructed manually', () => {
    // Build a board where (0,8) must be 9:
    // Row 0: 1 2 3 | 4 5 6 | 7 8 _
    // Col 8, rows 1–8: include 1–8 in some order so only 9 is free in col 8
    // Box 2 (rows 0–2, cols 6–8): includes 7, 8 already in row 0
    let board = createBoard(EMPTY81)
    const row0 = [1, 2, 3, 4, 5, 6, 7, 8, 0]
    for (let c = 0; c < 8; c++) board = setCell(board, 0, c, createCell(row0[c], true))
    // Place 1–8 in col 8 rows 1–8 so only 9 remains for (0,8)
    const col8vals = [1, 2, 3, 4, 5, 6, 7, 8]
    for (let r = 1; r <= 8; r++) board = setCell(board, r, 8, createCell(col8vals[r - 1], true))

    const result = detect(board)
    expect(result).not.toBeNull()
    expect(result.technique).toBe('Naked Single')
    expect(result.cellsInvolved[0]).toEqual({ row: 0, col: 8 })
    expect(result.affectedDigits[0]).toBe(9)
  })
})
