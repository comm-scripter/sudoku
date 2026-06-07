import styles from './WinModal.module.css'

export function WinModal({ onPlayAgain }) {
  return (
    <>
      <div className={styles.backdrop} aria-hidden="true" />
      <div
        className={styles.modal}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="win-title"
        aria-describedby="win-desc"
      >
        <p className={styles.trophy} aria-hidden="true">&#127881;</p>
        <h2 className={styles.title} id="win-title">Puzzle Complete!</h2>
        <p className={styles.desc} id="win-desc">
          Well done — you solved it!
        </p>
        <button className={styles.btn} onClick={onPlayAgain} autoFocus>
          Play Again
        </button>
      </div>
    </>
  )
}
