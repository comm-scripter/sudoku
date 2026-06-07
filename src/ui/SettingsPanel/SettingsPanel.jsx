import { useEffect } from 'react'
import styles from './SettingsPanel.module.css'

const DIFFICULTIES = ['easy', 'medium', 'hard']

function ToggleRow({ label, hint, checked, onChange }) {
  const id = `toggle-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <label className={styles.toggleRow} htmlFor={id}>
      <span className={styles.toggleText}>
        <span className={styles.toggleLabel}>{label}</span>
        {hint && <span className={styles.toggleHint}>{hint}</span>}
      </span>
      <span className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`} aria-hidden="true" />
      <input
        id={id}
        type="checkbox"
        className={styles.toggleInput}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
    </label>
  )
}

export function SettingsPanel({ settings, onUpdate, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div className={styles.handle} aria-hidden="true" />
        <h2 className={styles.title}>Settings</h2>

        {/* Difficulty */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}>Difficulty</p>
          <p className={styles.sectionHint}>Takes effect on next new game</p>
          <div className={styles.segmented} role="group" aria-label="Difficulty">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                className={`${styles.segment} ${settings.difficulty === d ? styles.segmentActive : ''}`}
                onClick={() => onUpdate('difficulty', d)}
                aria-pressed={settings.difficulty === d}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Toggles */}
        <section className={styles.section}>
          <ToggleRow
            label="Highlight Errors"
            hint="Show conflicts in red as you fill"
            checked={settings.highlightErrors}
            onChange={v => onUpdate('highlightErrors', v)}
          />
          <ToggleRow
            label="High Contrast"
            hint="Stronger colours for easier reading"
            checked={settings.highContrast}
            onChange={v => onUpdate('highContrast', v)}
          />
        </section>

        <button className={styles.closeBtn} onClick={onClose}>Done</button>
      </div>
    </>
  )
}
