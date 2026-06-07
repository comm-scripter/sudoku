import { describe, it, expect } from 'vitest'
import {
  createBoard, cloneBoard, getCell, setCell,
  getPeerIndices, getCandidates, isCellValid,
  isBoardComplete, toBoardString,
} from '../../logic/BoardState.js'
import { createCell } from '../../logic/CellModel.js'
import { hasNote } from '../../logic/NotesModel.js'

const EMPTY81 = '0'.repeat(81)
const SAMPLE  = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'

describe('createBoard', () => {
  it('creates exactly 81 cells', () => {
    expect(createBoard(EMPTY81).cells).toHaveLength(81)
  })

  it('marks non-zero cells as given', () => {
    const board = createBoard(SAMPLE)
    expect(getCell(board, 0, 0).isGiven).toBe(true)   // '5'
    expect(getCell(board, 0, 2).isGiven).toBe(false)  // '0'
  })

  it('parses digit values correctly', () => {
    const board = createBoard(SAMPLE)
    expect(getCell(board, 0, 0).value).toBe(5)
    expect(getCell(board, 0, 2).value).toBe(0)
  })
})

describe('cloneBoard', () => {
  it('produces a deep-enough copy (cells are separate objects)', () => {
    const board = createBoard(SAMPLE)
    const clone = cloneBoard(board)
    expect(clone).not.toBe(board)
    expect(clone.cells[0]).not.toBe(board.cells[0])
  })
})

describe('setCell', () => {
  it('returns a new board without mutating the original', () => {
    const board = createBoard(EMPTY81)
    const next  = setCell(board, 0, 0, createCell(9, false))
    expect(getCell(board, 0, 0).value).toBe(0)
    expect(getCell(next,  0, 0).value).toBe(9)
  })
})

describe('getPeerIndices', () => {
  it('returns exactly 20 peers', () => {
    const peers = getPeerIndices(0, 0)
    expect(peers).toHaveLength(20)
  })

  it('contains no duplicates', () => {
    const peers = getPeerIndices(4, 4)
    expect(new Set(peers).size).toBe(peers.length)
  })

  it('does not include the cell itself', () => {
    const peers = getPeerIndices(3, 3)
    expect(peers).not.toContain(3 * 9 + 3)
  })
})

describe('getCandidates', () => {
  it('returns all 9 digits on an empty board', () => {
    const board = createBoard(EMPTY81)
    const mask  = getCandidates(board, 0, 0)
    for (let d = 1; d <= 9; d++) expect(hasNote(mask, d)).toBe(true)
  })

  it('excludes digits already placed in peers', () => {
    // Place 5 at (0,0); (0,1) should not have 5 as a candidate.
    const board = createBoard('5' + '0'.repeat(80))
    const mask  = getCandidates(board, 0, 1)
    expect(hasNote(mask, 5)).toBe(false)
  })

  it('returns 0 for a cell that already has a value', () => {
    const board = createBoard(SAMPLE)
    expect(getCandidates(board, 0, 0)).toBe(0)
  })
})

describe('isCellValid', () => {
  it('returns true for an empty cell', () => {
    expect(isCellValid(createBoard(EMPTY81), 0, 0)).toBe(true)
  })

  it('returns false when a digit is duplicated in its row', () => {
    const board = createBoard('55' + '0'.repeat(79))
    expect(isCellValid(board, 0, 0)).toBe(false)
  })
})

describe('isBoardComplete', () => {
  it('returns false for an incomplete board', () => {
    expect(isBoardComplete(createBoard(SAMPLE))).toBe(false)
  })
})

describe('toBoardString', () => {
  it('round-trips through createBoard', () => {
    const board = createBoard(SAMPLE)
    expect(toBoardString(board)).toBe(SAMPLE)
  })
})
