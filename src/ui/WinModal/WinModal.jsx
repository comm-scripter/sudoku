import styles from './WinModal.module.css'

function formatTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function WinModal({
  onPlayAgain,
  elapsed = 0,
  difficulty = 'medium',
  score = 0,
  isNewBestTime = false,
  isNewHighScore = false,
  bestTime = null,
  highScore = null,
}) {
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
            {isNewBestTime && <span className={styles.newBest}>New Best!</span>}
            <span className={styles.statValue}>{formatTime(elapsed)}</span>
            <span className={styles.statLabel}>Time</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.stat}>
            {isNewHighScore && <span className={styles.newBest}>New Best!</span>}
            <span className={`${styles.statValue} ${styles[`points_${difficulty}`]}`}>
              {score.toLocaleString()}
            </span>
            <span className={styles.statLabel}>Points</span>
          </div>
        </div>

        <div className={styles.records}>
          <span className={styles.recordsLabel}>Personal Best</span>
          <div className={styles.recordsRow}>
            <span className={styles.recordItem}>
              <span className={styles.recordIcon}>⏱</span>
              {bestTime != null ? formatTime(bestTime) : '--:--'}
            </span>
            <span className={styles.recordDivider} aria-hidden="true" />
            <span className={styles.recordItem}>
              <span className={styles.recordIcon}>⭐</span>
              {highScore != null ? highScore.toLocaleString() : '---'}
            </span>
          </div>
        </div>

        <button className={styles.btn} onClick={onPlayAgain} autoFocus>
          Play Again
        </button>
      </div>
    </>
  )
}
