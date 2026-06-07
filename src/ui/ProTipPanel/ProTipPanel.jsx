import { useEffect } from 'react'
import styles from './ProTipPanel.module.css'

export function ProTipPanel({ tip, onClose, onHighlight }) {
  // Close on Escape key
  useEffect(() => {
    if (!tip) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [tip, onClose])

  if (!tip) return null

  const hasHighlight = tip.cellsInvolved?.length > 0

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={`Pro Tip: ${tip.technique}`}
      >
        <div className={styles.handle} aria-hidden="true" />

        <p className={styles.techniqueLabel}>Technique</p>
        <h2 className={styles.technique}>{tip.technique}</h2>

        <p className={styles.explanation}>{tip.explanation}</p>
        <p className={styles.action}>{tip.recommendedAction}</p>

        <div className={styles.actions}>
          {hasHighlight && (
            <button
              className={styles.highlightBtn}
              onClick={() => onHighlight(tip)}
            >
              Highlight Cells
            </button>
          )}
          <button className={styles.closeBtn} onClick={onClose}>
            Got It
          </button>
        </div>
      </div>
    </>
  )
}
