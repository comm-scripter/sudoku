import styles from './Cell.module.css'
import { getNotes } from '../../logic/NotesModel.js'

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export function Cell({
  row, col, value, isGiven, notes,
  isSelected, isRelated, isSameValue, isError, isHighlighted,
  onClick,
}) {
  const noteDigits = getNotes(notes)
  const isEmpty = value === 0

  const cls = [
    styles.cell,
    isGiven      ? styles.given      : styles.input,
    isSelected   ? styles.selected   : '',
    isRelated    ? styles.related    : '',
    isSameValue  ? styles.sameValue  : '',
    isError      ? styles.error      : '',
    isHighlighted? styles.highlighted: '',
    col > 0 && col % 3 === 0 ? styles.boxBorderLeft : '',
    row > 0 && row % 3 === 0 ? styles.boxBorderTop  : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      className={cls}
      onClick={() => onClick(row, col)}
      aria-label={`Row ${row + 1}, Column ${col + 1}${value ? `, ${value}` : ', empty'}`}
      aria-pressed={isSelected}
    >
      {isEmpty ? (
        <span className={styles.notes} aria-hidden>
          {DIGITS.map(d => (
            <span
              key={d}
              className={`${styles.note} ${noteDigits.includes(d) ? styles.noteVisible : ''}`}
            >
              {d}
            </span>
          ))}
        </span>
      ) : (
        <span className={styles.value}>{value}</span>
      )}
    </button>
  )
}
