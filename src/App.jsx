import { useEffect, useCallback, useState, useMemo } from 'react'
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
import styles from './App.module.css'

export default function App() {
  const {
    board, selectedRow, selectedCol, difficulty,
    notesMode, proTip, history, highlightedCells, isComplete,
    startNewGame, loadCustomPuzzle, selectCell, inputDigit, eraseCell,
    undo, toggleNotesMode, requestProTip, requestNextProTip, hideProTip, highlightTip,
  } = useGame()

  const { settings, update: updateSetting } = useSettings()

  const completedDigits = useMemo(() => {
    if (!board) return new Set()
    const counts = new Array(10).fill(0)
    board.cells.forEach(c => { if (c.value > 0) counts[c.value]++ })
    return new Set([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => counts[d] === 9))
  }, [board])

  const [confirmingNewGame, setConfirmingNewGame] = useState(false)
  const [showSettings, setShowSettings]           = useState(false)
  const [showSandbox, setShowSandbox]             = useState(false)

  // Start a game on first mount using the saved difficulty
  useEffect(() => { startNewGame(settings.difficulty) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleHomePress = useCallback(() => {
    if (history.length > 0) {
      setConfirmingNewGame(true)
    } else {
      startNewGame(settings.difficulty)
    }
  }, [history.length, startNewGame, settings.difficulty])

  const handleConfirmNewGame = useCallback(() => {
    setConfirmingNewGame(false)
    startNewGame(settings.difficulty)
  }, [startNewGame, settings.difficulty])

  const handleOpenSandbox = useCallback(() => {
    setShowSettings(false)
    setShowSandbox(true)
  }, [])

  const handleLoadCustom = useCallback((puzzleStr) => {
    setShowSandbox(false)
    loadCustomPuzzle(puzzleStr)
  }, [loadCustomPuzzle])

  // Keyboard shortcuts — suppressed while any modal is open
  const anyModalOpen = confirmingNewGame || showSettings || !!proTip || showSandbox
  const handleKeyDown = useCallback((e) => {
    if (anyModalOpen) return
    if (e.key >= '1' && e.key <= '9') { inputDigit(Number(e.key), settings); return }
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { eraseCell(); return }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return }
    if (e.key === 'n' || e.key === 'N') { toggleNotesMode(); return }
  }, [anyModalOpen, inputDigit, eraseCell, undo, toggleNotesMode, settings])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sudoku</h1>
        {difficulty && (
          <span className={`${styles.diffBadge} ${styles[`diff_${difficulty}`]}`}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </span>
        )}
      </header>

      <main className={styles.main}>
        <Board
          board={board}
          selectedRow={selectedRow}
          selectedCol={selectedCol}
          highlightedCells={highlightedCells}
          onCellSelect={selectCell}
        />
      </main>

      <NumberPad
        onDigit={(d) => inputDigit(d, settings)}
        onErase={eraseCell}
        notesMode={notesMode}
        completedDigits={completedDigits}
      />

      <Toolbar
        onHome={handleHomePress}
        onUndo={undo}
        onNotes={toggleNotesMode}
        onProTip={requestProTip}
        onSettings={() => setShowSettings(true)}
        notesMode={notesMode}
        canUndo={history.length > 0}
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
          onUpdate={updateSetting}
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

      {isComplete && (
        <WinModal onPlayAgain={() => startNewGame(settings.difficulty)} />
      )}
    </div>
  )
}
