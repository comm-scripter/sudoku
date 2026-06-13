import { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { useGame } from './context/GameContext.jsx'
import { useSettings } from './hooks/useSettings.js'
import { Board } from './ui/Board/Board.jsx'
import { NumberPad } from './ui/NumberPad/NumberPad.jsx'
import { Toolbar } from './ui/Toolbar/Toolbar.jsx'
import { ProTipPanel } from './ui/ProTipPanel/ProTipPanel.jsx'
import { NewGameModal } from './ui/NewGameModal/NewGameModal.jsx'
import { SettingsPanel } from './ui/SettingsPanel/SettingsPanel.jsx'
import { SandboxModal } from './ui/SandboxModal/SandboxModal.jsx'
import { WinModal } from './ui/WinModal/WinModal.jsx'
import { EquationModal } from './ui/EquationModal/EquationModal.jsx'
import styles from './App.module.css'

export default function App() {
  const {
    board, selectedRow, selectedCol, difficulty,
    notesMode, proTip, history, highlightedCells, isComplete,
    startNewGame, loadCustomPuzzle, selectCell, inputDigit, eraseCell,
    undo, toggleNotesMode, requestProTip, requestNextProTip, hideProTip, highlightTip,
    solveEquation,
  } = useGame()

  const { settings, update: updateSetting } = useSettings()

  // ─── Equation phase ────────────────────────────────────────
  const { totalEquations, solvedEquations, allEquationsSolved } = useMemo(() => {
    if (!board) return { totalEquations: 0, solvedEquations: 0, allEquationsSolved: true }
    let total = 0, solved = 0
    for (const c of board.cells) {
      if (c.equation != null) {
        total++
        if (c.equationSolved) solved++
      }
    }
    return { totalEquations: total, solvedEquations: solved, allEquationsSolved: solved === total }
  }, [board])

  const [equationCell, setEquationCell] = useState(null) // { row, col } | null

  // Flash "Puzzle Unlocked!" the moment all equations are cleared
  const [unlockedFlash, setUnlockedFlash] = useState(false)
  const prevSolvedRef = useRef(true) // start true so first mount doesn't fire

  useEffect(() => {
    if (allEquationsSolved && !prevSolvedRef.current && totalEquations > 0) {
      prevSolvedRef.current = true
      setUnlockedFlash(true)
      const t = setTimeout(() => setUnlockedFlash(false), 2400)
      return () => clearTimeout(t)
    }
    prevSolvedRef.current = allEquationsSolved
  }, [allEquationsSolved, totalEquations])

  // Intercept cell clicks: equation cells open the modal; other cells blocked in equation phase
  const handleCellClick = useCallback((row, col) => {
    if (!board) return
    const cell = board.cells[row * 9 + col]
    if (!allEquationsSolved) {
      if (cell.isGiven && cell.equation != null && !cell.equationSolved) {
        setEquationCell({ row, col })
      }
      return
    }
    selectCell(row, col)
  }, [board, allEquationsSolved, selectCell])

  const handleEquationSolve = useCallback(() => {
    if (!equationCell) return
    solveEquation(equationCell.row, equationCell.col)
    setEquationCell(null)
  }, [equationCell, solveEquation])

  // ─── Settings / game helpers ────────────────────────────────
  const opts = useCallback(
    (overrides = {}) => ({ algebraMode: settings.algebraMode, ...overrides }),
    [settings.algebraMode]
  )

  const handleSettingUpdate = useCallback((key, value) => {
    updateSetting(key, value)
    if (key === 'difficulty' && history.length === 0 && solvedEquations === 0) {
      startNewGame(value, opts())
    }
    // Algebra toggle: restart immediately if no Sudoku moves yet
    if (key === 'algebraMode' && history.length === 0) {
      startNewGame(settings.difficulty, opts({ algebraMode: value }))
    }
  }, [updateSetting, startNewGame, opts, history.length, solvedEquations, settings.difficulty])

  const completedDigits = useMemo(() => {
    if (!board) return new Set()
    const counts = new Array(10).fill(0)
    board.cells.forEach(c => { if (c.value > 0) counts[c.value]++ })
    return new Set([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => counts[d] === 9))
  }, [board])

  const [confirmingNewGame, setConfirmingNewGame] = useState(false)
  const [showSettings, setShowSettings]           = useState(false)
  const [showSandbox, setShowSandbox]             = useState(false)

  useEffect(() => { startNewGame(settings.difficulty, opts()) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleHomePress = useCallback(() => {
    if (history.length > 0) {
      setConfirmingNewGame(true)
    } else {
      startNewGame(settings.difficulty, opts())
    }
  }, [history.length, startNewGame, opts, settings.difficulty])

  const handleConfirmNewGame = useCallback(() => {
    setConfirmingNewGame(false)
    startNewGame(settings.difficulty, opts())
  }, [startNewGame, opts, settings.difficulty])

  const handleOpenSandbox = useCallback(() => {
    setShowSettings(false)
    setShowSandbox(true)
  }, [])

  const handleLoadCustom = useCallback((puzzleStr) => {
    setShowSandbox(false)
    loadCustomPuzzle(puzzleStr, opts())
  }, [loadCustomPuzzle, opts])

  const anyModalOpen = confirmingNewGame || showSettings || !!proTip || showSandbox || !!equationCell
  const handleKeyDown = useCallback((e) => {
    if (anyModalOpen) return
    if (!allEquationsSolved) return
    if (e.key >= '1' && e.key <= '9') { inputDigit(Number(e.key), settings); return }
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { eraseCell(); return }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return }
    if (e.key === 'n' || e.key === 'N') { toggleNotesMode(); return }
  }, [anyModalOpen, allEquationsSolved, inputDigit, eraseCell, undo, toggleNotesMode, settings])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const equationCellData = equationCell
    ? board?.cells[equationCell.row * 9 + equationCell.col]
    : null

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sudoku</h1>
        {!allEquationsSolved && board ? (
          <span className={styles.equationBadge}>
            {solvedEquations}/{totalEquations} equations
          </span>
        ) : difficulty ? (
          <span className={`${styles.diffBadge} ${styles[`diff_${difficulty}`]}`}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </span>
        ) : null}
      </header>

      <main className={styles.main}>
        <Board
          board={board}
          selectedRow={selectedRow}
          selectedCol={selectedCol}
          highlightedCells={highlightedCells}
          onCellSelect={handleCellClick}
        />
      </main>

      <NumberPad
        onDigit={(d) => inputDigit(d, settings)}
        onErase={eraseCell}
        notesMode={notesMode}
        completedDigits={completedDigits}
        disabled={!allEquationsSolved}
      />

      <Toolbar
        onHome={handleHomePress}
        onUndo={allEquationsSolved ? undo : undefined}
        onNotes={allEquationsSolved ? toggleNotesMode : undefined}
        onProTip={allEquationsSolved ? requestProTip : undefined}
        onSettings={() => setShowSettings(true)}
        notesMode={notesMode}
        canUndo={allEquationsSolved && history.length > 0}
      />

      <ProTipPanel
        tip={proTip}
        onClose={hideProTip}
        onHighlight={highlightTip}
        onNextTip={requestNextProTip}
      />

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdate={handleSettingUpdate}
          onClose={() => setShowSettings(false)}
          onEnterPuzzle={handleOpenSandbox}
        />
      )}

      {confirmingNewGame && (
        <NewGameModal
          onConfirm={handleConfirmNewGame}
          onCancel={() => setConfirmingNewGame(false)}
        />
      )}

      {showSandbox && (
        <SandboxModal
          onLoad={handleLoadCustom}
          onCancel={() => setShowSandbox(false)}
        />
      )}

      {equationCell && equationCellData && (
        <EquationModal
          equation={equationCellData.equation}
          solution={equationCellData.value}
          onSolve={handleEquationSolve}
          onClose={() => setEquationCell(null)}
        />
      )}

      {unlockedFlash && (
        <div className={styles.unlockedToast} role="status" aria-live="polite">
          Puzzle Unlocked! Now solve the Sudoku.
        </div>
      )}

      {isComplete && (
        <WinModal onPlayAgain={() => startNewGame(settings.difficulty)} />
      )}
    </div>
  )
}
