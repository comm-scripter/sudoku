import styles from './Toolbar.module.css'

export function Toolbar({ onHome, onUndo, onNotes, onProTip, onSettings, notesMode, canUndo }) {
  return (
    <nav className={styles.toolbar} aria-label="Game controls">
      <button className={styles.btn} onClick={onHome} aria-label="Home">
        <span className={styles.icon} aria-hidden>&#8962;</span>
        <span className={styles.label}>Home</span>
      </button>

      <button
        className={styles.btn}
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo last move"
      >
        <span className={styles.icon} aria-hidden>&#8617;</span>
        <span className={styles.label}>Undo</span>
      </button>

      <button
        className={`${styles.btn} ${styles.proTip}`}
        onClick={onProTip}
        aria-label="Get a Pro Tip"
      >
        <span className={styles.icon} aria-hidden>&#128161;</span>
        <span className={styles.label}>Pro Tip</span>
      </button>

      <button
        className={`${styles.btn} ${notesMode ? styles.active : ''}`}
        onClick={onNotes}
        aria-label="Toggle notes mode"
        aria-pressed={notesMode}
      >
        <span className={styles.icon} aria-hidden>&#9998;</span>
        <span className={styles.label}>Notes</span>
      </button>

      <button className={styles.btn} onClick={onSettings} aria-label="Settings">
        <span className={styles.icon} aria-hidden>&#9881;</span>
        <span className={styles.label}>Settings</span>
      </button>
    </nav>
  )
}
