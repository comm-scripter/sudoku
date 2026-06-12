import { useState, useEffect, useRef } from 'react'
import styles from './EquationModal.module.css'

export function EquationModal({ equation, solution, onSolve, onClose }) {
  const [answer, setAnswer] = useState('')
  const [shake, setShake] = useState(false)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit() {
    const val = parseInt(answer, 10)
    if (isNaN(val) || answer === '') return

    if (val === solution) {
      setSuccess(true)
      setTimeout(() => onSolve(), 650)
    } else {
      setShake(true)
      setTimeout(() => {
        setShake(false)
        setAnswer('')
        inputRef.current?.focus()
      }, 500)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit() }
    if (e.key === 'Escape') onClose()
  }

  function handleDigitKey(d) {
    setAnswer(String(d))
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`Solve equation for x: ${equation}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={[
          styles.modal,
          shake   ? styles.shake   : '',
          success ? styles.success : '',
        ].filter(Boolean).join(' ')}
      >
        <p className={styles.subtitle}>Solve for x</p>

        <div className={styles.equationBox} aria-live="polite">
          <span className={styles.equationText}>{equation}</span>
        </div>

        <div className={styles.inputRow}>
          <span className={styles.xLabel}>x =</span>
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            pattern="[1-9]"
            className={styles.input}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            min="1"
            max="9"
            placeholder="?"
            aria-label="Enter your answer"
          />
        </div>

        <div className={styles.keypad} role="group" aria-label="Digit buttons">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
            <button
              key={d}
              className={`${styles.keypadBtn} ${answer === String(d) ? styles.keypadBtnActive : ''}`}
              onClick={() => handleDigitKey(d)}
              aria-label={`Answer ${d}`}
              tabIndex={0}
            >
              {d}
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose} aria-label="Cancel">
            Cancel
          </button>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={answer === '' || success}
            aria-label="Check answer"
          >
            {success ? '✓ Correct!' : 'Check'}
          </button>
        </div>
      </div>
    </div>
  )
}
