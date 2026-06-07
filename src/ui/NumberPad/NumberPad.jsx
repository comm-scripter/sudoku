import styles from './NumberPad.module.css'

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export function NumberPad({ onDigit, onErase, notesMode, completedDigits = new Set() }) {
  return (
    <div className={styles.pad} role="group" aria-label="Number input">
      {DIGITS.map(d => {
        const done = completedDigits.has(d)
        return (
          <button
            key={d}
            className={`${styles.btn} ${notesMode && !done ? styles.noteMode : ''} ${done ? styles.complete : ''}`}
            onClick={() => !done && onDigit(d)}
            aria-label={done ? `${d} complete` : notesMode ? `Toggle note ${d}` : `Enter ${d}`}
            aria-disabled={done}
          >
            {d}
          </button>
        )
      })}
      <button
        className={`${styles.btn} ${styles.erase}`}
        onClick={onErase}
        aria-label="Erase cell"
      >
        ✕
      </button>
    </div>
  )
}
