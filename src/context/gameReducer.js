import { getCell, setCell, isCellValid, getPeerIndices } from '../logic/BoardState.js'
import { toggleNote, removeNote } from '../logic/NotesModel.js'
import { EMPTY } from '../logic/CellModel.js'

const MAX_HISTORY = 100

export const initialState = {
  board: null,
  solution: null,
  difficulty: null,   // 'easy' | 'medium' | 'hard' | 'custom'
  selectedRow: null,
  selectedCol: null,
  notesMode: false,
  proTip: null,
  highlightedCells: [],
  history: [],    // undo stack — each entry is a previous board
  future: [],     // redo stack
  isComplete: false,
}

export function gameReducer(state, action) {
  switch (action.type) {

    case 'NEW_GAME':
      return {
        ...initialState,
        board: action.board,
        solution: action.solution,
        difficulty: action.difficulty ?? null,
      }

    case 'SELECT_CELL':
      return {
        ...state,
        selectedRow: action.row,
        selectedCol: action.col,
        highlightedCells: [],
      }

    case 'SET_VALUE': {
      const { selectedRow: row, selectedCol: col } = state
      if (row === null) return state
      const cell = getCell(state.board, row, col)
      if (cell.isGiven) return state

      const digit = action.digit
      const nextValue = (digit === EMPTY || digit === cell.value) ? EMPTY : digit

      // Keep the cell's own pencil marks intact when placing/removing a value —
      // notes are simply hidden while a value is shown (see Cell.jsx). Wiping them
      // here would permanently lose a guess's notes the moment it turns out wrong.
      let nextBoard = setCell(state.board, row, col, {
        ...cell,
        value: nextValue,
        isError: false,
      })

      // Determine wrongness up front (independent of the highlightErrors display
      // setting) — when the solution is known, that's authoritative — a digit that's
      // genuinely correct for this square must not be flagged just because some
      // *other*, already-wrong cell elsewhere in the row/col/box happens to hold the
      // same digit. Peer-conflict checking only applies as a fallback when no
      // solution is available to check against.
      let isWrong = false
      if (nextValue !== EMPTY) {
        isWrong = state.solution != null
          ? nextValue !== state.solution.cells[row * 9 + col].value
          : !isCellValid(nextBoard, row, col)
      }

      if (action.highlightErrors && isWrong) {
        nextBoard = setCell(nextBoard, row, col, {
          ...getCell(nextBoard, row, col),
          isError: true,
        })
      }

      // Remove the placed digit from every peer's pencil marks — but only when the
      // guess is actually correct. A wrong guess doesn't really eliminate that digit
      // as a candidate anywhere else, so it must not strip peers' existing notes.
      if (nextValue !== EMPTY && !isWrong) {
        const peers = new Set(getPeerIndices(row, col))
        nextBoard = {
          cells: nextBoard.cells.map((c, i) => {
            if (!peers.has(i) || c.value !== EMPTY || !c.notes) return c
            const cleaned = removeNote(c.notes, nextValue)
            return cleaned !== c.notes ? { ...c, notes: cleaned } : c
          }),
        }
      }

      const isComplete = state.solution != null &&
        nextBoard.cells.every((c, i) =>
          c.value !== EMPTY && c.value === state.solution.cells[i].value
        )

      return {
        ...state,
        board: nextBoard,
        isComplete,
        history: [...state.history.slice(-MAX_HISTORY), state.board],
        future: [],
        highlightedCells: [],
      }
    }

    case 'TOGGLE_NOTE': {
      const { selectedRow: row, selectedCol: col } = state
      if (row === null) return state
      const cell = getCell(state.board, row, col)
      if (cell.isGiven || cell.value !== EMPTY) return state

      const nextBoard = setCell(state.board, row, col, {
        ...cell,
        notes: toggleNote(cell.notes, action.digit),
      })
      return {
        ...state,
        board: nextBoard,
        history: [...state.history.slice(-MAX_HISTORY), state.board],
        future: [],
      }
    }

    case 'TOGGLE_NOTES_MODE':
      return { ...state, notesMode: !state.notesMode }

    case 'UNDO': {
      if (!state.history.length) return state
      const prev = state.history[state.history.length - 1]
      return {
        ...state,
        board: prev,
        history: state.history.slice(0, -1),
        future: [state.board, ...state.future],
        highlightedCells: [],
      }
    }

    case 'REDO': {
      if (!state.future.length) return state
      const next = state.future[0]
      return {
        ...state,
        board: next,
        history: [...state.history, state.board],
        future: state.future.slice(1),
        highlightedCells: [],
      }
    }

    case 'SOLVE_EQUATION': {
      const { row, col } = action
      const idx = row * 9 + col
      const nextCells = state.board.cells.map((cell, i) =>
        i === idx ? { ...cell, equationSolved: true } : cell
      )
      return { ...state, board: { cells: nextCells } }
    }

    case 'SHOW_PRO_TIP':
      return { ...state, proTip: action.tip }

    case 'HIDE_PRO_TIP':
      return { ...state, proTip: null }

    case 'HIGHLIGHT_TIP': {
      const cells = action.cells ?? []
      // A single-cell tip (Naked/Hidden Single) names a concrete placement target —
      // select it directly so the user can just tap a number. Multi-cell tips
      // (eliminations, pairs, wings, ...) aren't a single placeable cell, so they
      // keep the yellow highlight treatment instead.
      if (cells.length === 1) {
        return {
          ...state,
          selectedRow: cells[0].row,
          selectedCol: cells[0].col,
          highlightedCells: [],
          proTip: null,
        }
      }
      return {
        ...state,
        highlightedCells: cells,
        proTip: null,
      }
    }

    default:
      return state
  }
}
