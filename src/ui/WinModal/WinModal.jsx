import styles from './WinModal.module.css'

const SCORE_CONFIG = {
  easy:   { base: 1000, decay: 1, min: 100 },
  medium: { base: 2500, decay: 2, min: 250 },
  hard:   { base: 5000, decay: 3, min: 500 },
}

function calcScore(difficulty, seconds) {
  const { base, decay, min } = SCORE_CONFIG[difficulty] ?? SCORE_CONFIG.medium
  return Math.max(min, base - seconds * decay)
}

function formatTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function WinModal({ onPlayAgain, elapsed = 0, difficulty = 'medium' }) {
  const score = calcScore(difficulty, elapsed)

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
        <p className={styles.desc} id="win-desc">Well done — you solved it!</p>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatTime(elapsed)}</span>
            <span className={styles.statLabel}>Time</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.stat}>
            <span className={`${styles.statValue} ${styles[`points_${difficulty}`]}`}>
              {score.toLocaleString()}
            </span>
            <span className={styles.statLabel}>Points</span>
          </div>
        </div>

        <button className={styles.btn} onClick={onPlayAgain} autoFocus>
          Play Again
        </button>
      </div>
    </>
  )
}
