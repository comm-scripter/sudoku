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

      let nextBoard = setCell(state.board, row, col, {
        ...cell,
        value: nextValue,
        notes: 0,
        isError: false,
      })

      // Mark conflict if the placed digit clashes with a peer OR contradicts the known solution
      if (action.highlightErrors && nextValue !== EMPTY) {
        const peerConflict = !isCellValid(nextBoard, row, col)
        const solutionMismatch = state.solution != null &&
          nextValue !== state.solution.cells[row * 9 + col].value
        if (peerConflict || solutionMismatch) {
          nextBoard = setCell(nextBoard, row, col, {
            ...getCell(nextBoard, row, col),
            isError: true,
          })
        }
      }

      // Always remove the placed digit from every peer's pencil marks in one pass.
      if (nextValue !== EMPTY) {
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

    case 'SHOW_PRO_TIP':
      return { ...state, proTip: action.tip }

    case 'HIDE_PRO_TIP':
      return { ...state, proTip: null }

    case 'HIGHLIGHT_TIP':
      return {
        ...state,
        highlightedCells: action.cells ?? [],
        proTip: null,
      }

    default:
      return state
  }
}
