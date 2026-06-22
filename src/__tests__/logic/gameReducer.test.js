import { describe, it, expect } from 'vitest'
import { gameReducer, initialState } from '../../context/gameReducer.js'
import { createBoard, getCell } from '../../logic/BoardState.js'
import { solve } from '../../logic/PuzzleSolver.js'
import { notesFromSet } from '../../logic/NotesModel.js'

const SAMPLE = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'

function setUpAt(row, col) {
  const board = createBoard(SAMPLE)
  const solution = solve(board)
  const state = {
    ...initialState,
    board,
    solution,
    selectedRow: row,
    selectedCol: col,
  }
  const correctDigit = solution.cells[row * 9 + col].value
  const wrongDigit = correctDigit === 9 ? 1 : correctDigit + 1
  return { state, correctDigit, wrongDigit }
}

describe('gameReducer SET_VALUE — notes preservation', () => {
  it('keeps existing pencil marks after a wrong guess', () => {
    const { state, wrongDigit } = setUpAt(0, 2)
    const notes = notesFromSet([1, 4, 7])

    let next = state
    for (const d of [1, 4, 7]) {
      next = gameReducer(next, { type: 'TOGGLE_NOTE', digit: d })
    }
    expect(getCell(next.board, 0, 2).notes).toBe(notes)

    next = gameReducer(next, { type: 'SET_VALUE', digit: wrongDigit, highlightErrors: true })
    const filledCell = getCell(next.board, 0, 2)
    expect(filledCell.isError).toBe(true)
    expect(filledCell.notes).toBe(notes)
  })

  it('restores pencil marks once a wrong guess is erased', () => {
    const { state, wrongDigit } = setUpAt(0, 2)
    let next = state
    for (const d of [1, 4, 7]) {
      next = gameReducer(next, { type: 'TOGGLE_NOTE', digit: d })
    }
    next = gameReducer(next, { type: 'SET_VALUE', digit: wrongDigit, highlightErrors: true })
    next = gameReducer(next, { type: 'SET_VALUE', digit: 0, highlightErrors: false })

    const erasedCell = getCell(next.board, 0, 2)
    expect(erasedCell.value).toBe(0)
    expect(erasedCell.notes).toBe(notesFromSet([1, 4, 7]))
  })

  it('does not strip the digit from peers’ pencil marks on a wrong guess', () => {
    // (0,2) and (0,3) are both empty cells in the same row in SAMPLE
    const { state, wrongDigit } = setUpAt(0, 2)
    let next = { ...state, selectedRow: 0, selectedCol: 3 }
    next = gameReducer(next, { type: 'TOGGLE_NOTE', digit: wrongDigit })
    expect(getCell(next.board, 0, 3).notes & (1 << (wrongDigit - 1))).not.toBe(0)

    next = { ...next, selectedRow: 0, selectedCol: 2 }
    next = gameReducer(next, { type: 'SET_VALUE', digit: wrongDigit, highlightErrors: true })

    expect(getCell(next.board, 0, 2).isError).toBe(true)
    expect(getCell(next.board, 0, 3).notes & (1 << (wrongDigit - 1))).not.toBe(0)
  })

  it('still clears the placed digit from peers’ pencil marks on a correct guess', () => {
    // (0,2) and (0,3) are both empty cells in the same row in SAMPLE
    const { state, correctDigit } = setUpAt(0, 2)
    let next = { ...state, selectedRow: 0, selectedCol: 3 }
    next = gameReducer(next, { type: 'TOGGLE_NOTE', digit: correctDigit })
    expect(getCell(next.board, 0, 3).notes & (1 << (correctDigit - 1))).not.toBe(0)

    next = { ...next, selectedRow: 0, selectedCol: 2 }
    next = gameReducer(next, { type: 'SET_VALUE', digit: correctDigit, highlightErrors: true })

    expect(getCell(next.board, 0, 3).notes & (1 << (correctDigit - 1))).toBe(0)
  })
})
