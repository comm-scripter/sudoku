import { createContext, useContext, useReducer, useCallback } from 'react'
import { gameReducer, initialState } from './gameReducer.js'
import { createBoard } from '../logic/BoardState.js'
import { generatePuzzle } from '../logic/PuzzleGenerator.js'
import { solve } from '../logic/PuzzleSolver.js'
import { getProTip } from '../logic/ProTipsEngine.js'
import { EMPTY } from '../logic/CellModel.js'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const startNewGame = useCallback((difficulty = 'easy') => {
    const puzzleStr = generatePuzzle(difficulty)
    const board = createBoard(puzzleStr)
    const solution = solve(board)
    dispatch({ type: 'NEW_GAME', board, solution, difficulty })
  }, [])

  const loadCustomPuzzle = useCallback((puzzleStr) => {
    const board = createBoard(puzzleStr)
    const solution = solve(board)
    dispatch({ type: 'NEW_GAME', board, solution, difficulty: 'custom' })
  }, [])

  const selectCell = useCallback((row, col) => {
    dispatch({ type: 'SELECT_CELL', row, col })
  }, [])

  const inputDigit = useCallback((digit, settings = {}) => {
    if (state.notesMode) {
      dispatch({ type: 'TOGGLE_NOTE', digit })
    } else {
      dispatch({
        type: 'SET_VALUE',
        digit,
        highlightErrors: settings.highlightErrors ?? true,
      })
    }
  }, [state.notesMode])

  const eraseCell = useCallback(() => {
    dispatch({ type: 'SET_VALUE', digit: EMPTY, highlightErrors: false })
  }, [])

  const undo  = useCallback(() => dispatch({ type: 'UNDO' }),  [])
  const redo  = useCallback(() => dispatch({ type: 'REDO' }),  [])

  const toggleNotesMode = useCallback(() => dispatch({ type: 'TOGGLE_NOTES_MODE' }), [])

  const requestProTip = useCallback(() => {
    if (!state.board) return
    const tip = getProTip(state.board)
    dispatch({
      type: 'SHOW_PRO_TIP',
      tip: tip ?? {
        technique: 'No Tip Available',
        cellsInvolved: [],
        affectedDigits: [],
        explanation: 'No advanced technique was detected for the current board state.',
        recommendedAction: 'Keep going — you\'re doing great!',
      },
    })
  }, [state.board])

  const requestNextProTip = useCallback(() => {
    if (!state.board) return
    const nextIndex = state.proTip?._tipIndex != null ? state.proTip._tipIndex + 1 : 0
    const tip = getProTip(state.board, nextIndex)
    dispatch({
      type: 'SHOW_PRO_TIP',
      tip: tip ?? {
        technique: 'No More Tips',
        cellsInvolved: [],
        affectedDigits: [],
        explanation: 'No further techniques were found for the current board state.',
        recommendedAction: 'Try applying the tips you\'ve already seen, or keep solving!',
      },
    })
  }, [state.board, state.proTip])

  const hideProTip = useCallback(() => dispatch({ type: 'HIDE_PRO_TIP' }), [])

  const highlightTip = useCallback((tip) => {
    dispatch({ type: 'HIGHLIGHT_TIP', cells: tip.cellsInvolved })
  }, [])

  return (
    <GameContext.Provider value={{
      ...state,
      startNewGame,
      loadCustomPuzzle,
      selectCell,
      inputDigit,
      eraseCell,
      undo,
      redo,
      toggleNotesMode,
      requestProTip,
      requestNextProTip,
      hideProTip,
      highlightTip,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>')
  return ctx
}
