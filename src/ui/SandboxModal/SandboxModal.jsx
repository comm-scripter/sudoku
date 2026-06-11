import { useEffect, useRef, useState } from 'react'
import { isValidPuzzleStr, countSolutions } from '../../logic/DifficultyEngine.js'
import styles from './SandboxModal.module.css'

const STATUS = {
  IDLE:       'idle',
  CHECKING:   'checking',
  VALID:      'valid',
  BAD_FORMAT: 'bad_format',
  CONFLICT:   'conflict',
  UNSOLVABLE: 'unsolvable',
  MULTIPLE:   'multiple',
}

const STATUS_MSG = {
  [STATUS.BAD_FORMAT]: 'Must be exactly 81 digits (0–9), with 0 for empty cells.',
  [STATUS.CONFLICT]:   'Conflicting digits — two givens share the same row, column, or box.',
  [STATUS.UNSOLVABLE]: 'This puzzle has no solution.',
  [STATUS.MULTIPLE]:   'This puzzle has multiple solutions — a valid Sudoku must have exactly one.',
  [STATUS.VALID]:      'Valid puzzle with a unique solution.',
  [STATUS.CHECKING]:   'Checking…',
}

// ─── Mini grid preview ────────────────────────────────────────────────────────

function GridPreview({ value }) {
  const digits = value.replace(/[^0-9]/g, '').padEnd(81, '0').split('')
  return (
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: 9 }, (_, r) => (
        <div key={r} className={styles.row}>
          {Array.from({ length: 9 }, (_, c) => {
            const d = digits[r * 9 + c]
            const borderRight = (c + 1) % 3 === 0 && c !== 8
            const borderBottom = (r + 1) % 3 === 0 && r !== 8
            return (
              <div
                key={c}
                className={[
                  styles.cell,
                  d !== '0' ? styles.given : '',
                  borderRight  ? styles.boxRight  : '',
                  borderBottom ? styles.boxBottom : '',
                ].filter(Boolean).join(' ')}
              >
                {d !== '0' ? d : ''}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SandboxModal({ onLoad, onCancel }) {
  const [raw, setRaw] = useState('')
  const [status, setStatus] = useState(STATUS.IDLE)
  const textareaRef = useRef(null)

  useEffect(() => {
    textareaRef.current?.focus()
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  const digits = raw.replace(/[^0-9]/g, '')

  function handleChange(e) {
    setRaw(e.target.value)
    setStatus(STATUS.IDLE)
  }

  function handleValidate() {
    if (digits.length !== 81) { setStatus(STATUS.BAD_FORMAT); return }
    if (!isValidPuzzleStr(digits)) { setStatus(STATUS.CONFLICT); return }

    setStatus(STATUS.CHECKING)
    // Defer to let the browser repaint the "Checking…" state first
    setTimeout(() => {
      const n = countSolutions(digits)
      if (n === 0)      setStatus(STATUS.UNSOLVABLE)
      else if (n > 1)   setStatus(STATUS.MULTIPLE)
      else              setStatus(STATUS.VALID)
    }, 0)
  }

  function handlePlay() {
    if (status === STATUS.VALID) onLoad(digits)
  }

  const isValid = status === STATUS.VALID
  const isError = status === STATUS.BAD_FORMAT || status === STATUS.CONFLICT ||
                  status === STATUS.UNSOLVABLE  || status === STATUS.MULTIPLE

  return (
    <>
      <div className={styles.backdrop} onClick={onCancel} aria-hidden="true" />
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sb-title"
      >
        <h2 className={styles.title} id="sb-title">Enter Custom Puzzle</h2>
        <p className={styles.hint}>
          Paste an 81-character string using digits&nbsp;1–9 and&nbsp;0 for empty cells.
        </p>

        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={raw}
          onChange={handleChange}
          placeholder="e.g. 530070000600195000098000060800060003…"
          rows={3}
          spellCheck={false}
          aria-label="Puzzle string"
        />

        <div className={styles.counter}>{digits.length} / 81 digits</div>

        <GridPreview value={digits} />

        {status !== STATUS.IDLE && (
          <p className={[styles.statusMsg, isError ? styles.error : isValid ? styles.success : ''].filter(Boolean).join(' ')}>
            {STATUS_MSG[status]}
          </p>
        )}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          {!isValid
            ? <button className={styles.validateBtn} onClick={handleValidate}
                disabled={status === STATUS.CHECKING || digits.length !== 81}>
                Validate
              </button>
            : <button className={styles.playBtn} onClick={handlePlay}>
                Play Puzzle
              </button>
          }
        </div>
      </div>
    </>
  )
}
