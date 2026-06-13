import { useEffect, useCallback, useState, useMemo, useRef } from 'react'
import { useGame } from './context/GameContext.jsx'
import { useSettings } from './hooks/useSettings.js'
import { useRecords } from './hooks/useRecords.js'
import { calcScore } from './logic/scoring.js'
import { Board } from './ui/Board/Board.jsx'
import { NumberPad } from './ui/NumberPad/NumberPad.jsx'
import { Toolbar } from './ui/Toolbar/Toolbar.jsx'
import { ProTipPanel } from './ui/ProTipPanel/ProTipPanel.jsx'
import { NewGameModal } from './ui/NewGameModal/NewGameModal.jsx'
import { SettingsPanel } from './ui/SettingsPanel/SettingsPanel.jsx'
import { SandboxModal } from './ui/SandboxModal/SandboxModal.jsx'
import { WinModal } from './ui/WinModal/WinModal.jsx'
import { EquationModal } from './ui/EquationModal/EquationModal.jsx'
import { HamburgerMenu } from './ui/HamburgerMenu/HamburgerMenu.jsx'
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
  const { submitResult } = useRecords()

  // ─── Game timer ────────────────────────────────────────────
  const timerRef = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const resetTimer = useCallback(() => {
    timerRef.current = Date.now()
    setElapsed(0)
  }, [])
  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  useEffect(() => {
    if (isComplete) return
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - timerRef.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [isComplete])

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
      resetTimer()
      startNewGame(value, opts())
    }
    // Algebra toggle: restart immediately if no Sudoku moves yet
    if (key === 'algebraMode' && history.length === 0) {
      resetTimer()
      startNewGame(settings.difficulty, opts({ algebraMode: value }))
    }
  }, [updateSetting, startNewGame, opts, history.length, solvedEquations, settings.difficulty, resetTimer])

  const completedDigits = useMemo(() => {
    if (!board) return new Set()
    const counts = new Array(10).fill(0)
    board.cells.forEach(c => { if (c.value > 0) counts[c.value]++ })
    return new Set([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => counts[d] === 9))
  }, [board])

  const [confirmingNewGame, setConfirmingNewGame] = useState(false)
  const [showSettings, setShowSettings]           = useState(false)
  const [showSandbox, setShowSandbox]             = useState(false)
  const [winStats, setWinStats]                   = useState(null)

  useEffect(() => {
    if (!isComplete) return
    const score = calcScore(difficulty, elapsed)
    const result = submitResult(difficulty, elapsed, score)
    setWinStats({ score, ...result })
  }, [isComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { startNewGame(settings.difficulty, opts()) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleHomePress = useCallback(() => {
    if (history.length > 0) {
      setConfirmingNewGame(true)
    } else {
      resetTimer()
      startNewGame(settings.difficulty, opts())
    }
  }, [history.length, startNewGame, opts, settings.difficulty, resetTimer])

  const handleConfirmNewGame = useCallback(() => {
    setConfirmingNewGame(false)
    resetTimer()
    startNewGame(settings.difficulty, opts())
  }, [startNewGame, opts, settings.difficulty, resetTimer])

  const handleOpenSandbox = useCallback(() => {
    setShowSettings(false)
    setShowSandbox(true)
  }, [])

  const handleLoadCustom = useCallback((puzzleStr) => {
    setShowSandbox(false)
    resetTimer()
    loadCustomPuzzle(puzzleStr, opts())
  }, [loadCustomPuzzle, opts, resetTimer])

  const handlePlayAgain = useCallback(() => {
    resetTimer()
    startNewGame(settings.difficulty)
  }, [resetTimer, startNewGame, settings.difficulty])

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
        <div className={styles.headerLeft}>
          <HamburgerMenu />
          {!allEquationsSolved && board && (
            <span className={styles.equationBadge}>
              <span className={styles.equationCount}>{solvedEquations}/{totalEquations}</span>
              <span className={styles.equationWord}>equations</span>
            </span>
          )}
        </div>
        <h1 className={styles.title}>Sudoku</h1>
        <div className={styles.headerRight}>
          {difficulty && (
            <span className={`${styles.diffBadge} ${styles[`diff_${difficulty}`]}`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          )}
          <span className={styles.timer}>{formatTime(elapsed)}</span>
        </div>
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

      {isComplete && winStats && (
        <WinModal
          onPlayAgain={handlePlayAgain}
          elapsed={elapsed}
          difficulty={difficulty}
          score={winStats.score}
          isNewBestTime={winStats.isNewBestTime}
          isNewHighScore={winStats.isNewHighScore}
          bestTime={winStats.bestTime}
          highScore={winStats.highScore}
        />
      )}
    </div>
  )
}
