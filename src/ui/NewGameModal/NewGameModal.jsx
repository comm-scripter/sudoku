import { useEffect } from 'react'
import styles from './NewGameModal.module.css'

export function NewGameModal({ onConfirm, onCancel }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <>
      <div className={styles.backdrop} onClick={onCancel} aria-hidden="true" />
      <div
        className={styles.modal}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ngm-title"
        aria-describedby="ngm-desc"
      >
        <p className={styles.icon} aria-hidden="true">&#9888;</p>
        <h2 className={styles.title} id="ngm-title">Start New Game?</h2>
        <p className={styles.desc} id="ngm-desc">
          Your current progress will be lost.
        </p>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} autoFocus>
            Keep Playing
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            New Game
          </button>
        </div>
      </div>
    </>
  )
}
